'use client';

import { useState } from 'react';
import { Shield, Loader2, ArrowRight } from 'lucide-react';
import { createClient } from '../lib/supabase/client';

export default function SignIn({ setActiveTab }: { setActiveTab: (tab: string) => void }) {
    const [isSignUp, setIsSignUp] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [optIn, setOptIn] = useState(true);

    const pendingReview = typeof window !== 'undefined' ? localStorage.getItem('pendingReviewSubmission') === 'true' : false;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        const supabase = createClient();

        if (isSignUp) {
            const { error: signUpError } = await supabase.auth.signUp({
                email,
                password,
                options: {
                    data: {
                        wants_updates: optIn
                    }
                }
            });

            if (signUpError) {
                setError(signUpError.message);
                setLoading(false);
                return;
            }
        } else {
            const { error: signInError } = await supabase.auth.signInWithPassword({
                email,
                password
            });

            if (signInError) {
                setError(signInError.message);
                setLoading(false);
                return;
            }
        }

        // Successfully Authenticated past this point

        if (pendingReview) {
            const savedDraft = localStorage.getItem('smartReviewDraft');
            if (savedDraft) {
                try {
                    const formData = JSON.parse(savedDraft);
                    let clubId = formData.clubId;

                    if (formData.isNewClub && !clubId) {
                        const { data: existing } = await supabase
                            .from('clubs')
                            .select('id')
                            .ilike('name', formData.clubName)
                            .single();

                        if (existing) {
                            clubId = existing.id;
                        } else {
                            const { data: newClub } = await supabase
                                .from('clubs')
                                .insert({ name: formData.clubName, university: formData.universityName })
                                .select('id')
                                .single();
                            if (newClub) clubId = newClub.id;
                        }
                    }

                    await supabase.from('reviews').insert({
                        club_id: clubId || null,
                        competition_name: formData.competitionName,
                        event_date: formData.eventDate || null,
                        ratings: formData.metrics,
                        comment: formData.reviewText,
                        is_anonymous: formData.isAnonymous,
                    });

                    localStorage.removeItem('smartReviewDraft');
                    localStorage.removeItem('pendingReviewSubmission');

                    // We successfully published, go to reviews to see it!
                    setActiveTab('reviews');
                    window.location.reload();
                    return;

                } catch (e) {
                    console.error("Failed to auto-publish review", e);
                }
            }
        }

        // Standard redirect if no pending review or it failed
        setActiveTab('home');
        window.location.reload();
    };

    return (
        <div className="max-w-md mx-auto px-4 py-20">
            <div className="bg-white rounded-3xl border border-gray-200 shadow-xl overflow-hidden p-8">
                <div className="flex items-center space-x-3 mb-6">
                    <div className="bg-blue-100 p-3 rounded-full text-blue-600">
                        <Shield size={24} />
                    </div>
                    <div>
                        <h4 className="font-bold text-slate-900 text-xl">{isSignUp ? 'Create an Account' : 'Welcome Back'}</h4>
                        <p className="text-sm text-gray-500">{isSignUp ? 'Join The Circuit today.' : 'Sign in to continue.'}</p>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-1">Email</label>
                        <input
                            type="email"
                            required
                            placeholder="student@university.edu"
                            autoComplete="email"
                            className={`w-full bg-gray-50 border ${error ? 'border-red-300 focus:ring-red-500' : 'border-gray-200 focus:ring-blue-500'} rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:bg-white transition-colors`}
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-1">Password</label>
                        <input
                            type="password"
                            required
                            placeholder="••••••••"
                            autoComplete={isSignUp ? "new-password" : "current-password"}
                            className={`w-full bg-gray-50 border ${error ? 'border-red-300 focus:ring-red-500' : 'border-gray-200 focus:ring-blue-500'} rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:bg-white transition-colors`}
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                        />
                    </div>

                    {error && (
                        <p className="text-red-500 text-[11px] font-bold mt-1.5 ml-1">{error}</p>
                    )}

                    {isSignUp && (
                        <div className="mt-4 flex items-start space-x-3 text-left">
                            <input
                                type="checkbox"
                                id="marketing_opt_in"
                                checked={optIn}
                                onChange={(e) => setOptIn(e.target.checked)}
                                className="mt-0.5 h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 flex-shrink-0"
                            />
                            <label htmlFor="marketing_opt_in" className="text-xs text-gray-500 leading-snug">
                                Notify me when case resources are available.
                            </label>
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-blue-600 text-white py-3.5 rounded-xl font-bold flex items-center justify-center space-x-2 hover:bg-blue-500 transition-all shadow-lg shadow-blue-500/20 disabled:opacity-60 mt-6"
                    >
                        {loading ? <Loader2 size={18} className="animate-spin" /> : <ArrowRight size={18} />}
                        <span>{loading ? 'Processing...' : (isSignUp ? 'Sign Up' : 'Sign In')}</span>
                    </button>
                </form>

                <div className="mt-6 text-center">
                    <button
                        type="button"
                        onClick={() => setIsSignUp(!isSignUp)}
                        className="text-sm text-blue-600 font-bold hover:underline"
                    >
                        {isSignUp ? 'Already have an account? Sign In' : "Don't have an account? Sign Up"}
                    </button>
                </div>
            </div>
        </div>
    );
}
