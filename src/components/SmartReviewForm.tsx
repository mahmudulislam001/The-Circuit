'use client';

import React from 'react';

import { useState, useEffect, useMemo } from 'react';
import {
    Search,
    Star,
    Shield,
    CheckCircle2,
    AlertCircle,
    CalendarDays,
    Loader2,
    LogIn,
    ArrowLeft,
} from 'lucide-react';
import { createClient } from '../lib/supabase/client';
import type { Club } from '@/types';

// ─── Types ─────────────────────────────────────────────────────────────────

interface Metrics {
    case: number;
    communication: number;
    fairness: number;
    logistics: number;
}

interface FormData {
    clubId: string;
    clubName: string;
    universityName: string;
    isNewClub: boolean;
    competitionName: string;
    eventDate: string;
    reviewText: string;
    metrics: Metrics;
    isAnonymous: boolean;
}

const DRAFT_KEY = 'smartReviewDraft';

const EMPTY_FORM: FormData = {
    clubId: '',
    clubName: '',
    universityName: '',
    isNewClub: false,
    competitionName: '',
    eventDate: '',
    reviewText: '',
    metrics: { case: 0, communication: 0, fairness: 0, logistics: 0 },
    isAnonymous: true,
};

// ─── Progress Stepper ─────────────────────────────────────────────────────

function Stepper({ step }: { step: number }) {
    const steps = [
        { label: 'Write Review', n: 1 },
        { label: 'Verify & Publish', n: 2 },
    ];

    return (
        <div className="flex items-center justify-center gap-0 mb-10">
            {steps.map((s, i) => (
                <React.Fragment key={s.n}>
                    {/* Node */}
                    <div className="flex flex-col items-center">
                        <div
                            className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-black border-2 transition-all ${step === s.n
                                ? 'bg-slate-900 border-slate-900 text-white'
                                : step > s.n
                                    ? 'bg-emerald-500 border-emerald-500 text-white'
                                    : 'bg-white border-slate-200 text-slate-400'
                                }`}
                        >
                            {step > s.n ? <span>✓</span> : s.n}
                        </div>
                        <span
                            className={`mt-2 text-[10px] font-bold uppercase tracking-widest ${step >= s.n ? 'text-slate-900' : 'text-slate-400'
                                }`}
                        >
                            {s.label}
                        </span>
                    </div>

                    {/* Connector (not after last node) */}
                    {i < steps.length - 1 && (
                        <div
                            className={`w-24 border-t-2 border-dashed mb-6 mx-3 transition-colors ${step > 1 ? 'border-emerald-400' : 'border-slate-200'
                                }`}
                        />
                    )}
                </React.Fragment>
            ))}
        </div>
    );
}

// ─── Star Rating ───────────────────────────────────────────────────────────

function StarRating({
    metric,
    value,
    onRate,
}: {
    metric: string;
    value: number;
    onRate: (metric: string, val: number) => void;
}) {
    return (
        <div className="flex space-x-2">
            {[1, 2, 3, 4, 5].map((star) => (
                <button
                    key={star}
                    onClick={() => onRate(metric, star)}
                    className={`transition-all ${value >= star ? 'text-yellow-400' : 'text-gray-200'
                        } hover:scale-110`}
                >
                    <Star size={24} fill={value >= star ? 'currentColor' : 'none'} />
                </button>
            ))}
        </div>
    );
}

// ─── Auth Gate (Step 2) ─────────────────────────────────────────────────────

function AuthGate({
    formData,
    setFormData,
    onBack,
    onSuccess,
}: {
    formData: FormData;
    setFormData: (data: FormData) => void;
    onBack: () => void;
    onSuccess: () => void;
}) {
    const [isSignUp, setIsSignUp] = useState(true);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [optIn, setOptIn] = useState(true);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleAuth = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        const supabase = createClient();

        if (isSignUp) {
            const { error: signUpError } = await supabase.auth.signUp({
                email,
                password,
                options: { data: { wants_updates: optIn } },
            });
            if (signUpError) {
                setError(signUpError.message);
                setLoading(false);
                return;
            }
        } else {
            const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
            if (signInError) {
                setError(signInError.message);
                setLoading(false);
                return;
            }
        }

        // Auth successful — trigger the auto-publish callback
        onSuccess();
    };

    return (
        <div className="max-w-xl mx-auto px-4 py-20 text-center">
            <div className="bg-blue-600 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-8 text-white shadow-xl shadow-blue-500/20">
                <CheckCircle2 size={40} />
            </div>
            <h2 className="text-3xl font-bold mb-4 text-slate-900">One more step to complete your submission!</h2>
            <p className="text-gray-600 mb-10 leading-relaxed">
                To finalise your review, please{' '}
                <span className="text-slate-900 font-bold underline decoration-blue-500">Sign Up / Log In</span>.<br />
                <span className="font-semibold text-slate-900">Why?</span> To maintain the integrity of our rankings and
                prevent spam, we require all reviewers to be verified users. Your review is saved and will go live
                instantly.
            </p>

            <form onSubmit={handleAuth} className="space-y-4 text-left">
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
                        autoComplete={isSignUp ? 'new-password' : 'current-password'}
                        className={`w-full bg-gray-50 border ${error ? 'border-red-300 focus:ring-red-500' : 'border-gray-200 focus:ring-blue-500'} rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:bg-white transition-colors`}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                    />
                </div>

                {error && <p className="text-red-500 text-[11px] font-bold ml-1">{error}</p>}

                {isSignUp && (
                    <div className="flex items-start space-x-3 text-left pt-1">
                        <input
                            type="checkbox"
                            id="wants_updates"
                            checked={optIn}
                            onChange={(e) => setOptIn(e.target.checked)}
                            className="mt-0.5 h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 flex-shrink-0"
                        />
                        <label htmlFor="wants_updates" className="text-xs text-gray-500 leading-snug">
                            Notify me when case resources are available.
                        </label>
                    </div>
                )}

                <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-slate-900 text-white py-4 rounded-xl font-bold flex items-center justify-center space-x-2 hover:bg-slate-800 transition-all shadow-lg disabled:opacity-60 mt-2"
                >
                    {loading ? <Loader2 size={20} className="animate-spin" /> : <LogIn size={20} />}
                    <span>{loading ? 'Processing…' : (isSignUp ? 'Sign Up to Publish' : 'Sign In to Publish')}</span>
                </button>
            </form>

            <div className="flex flex-col items-center space-y-6 pt-6">
                {/* Toggle sign-up / sign-in */}
                <button
                    type="button"
                    onClick={() => { setIsSignUp(!isSignUp); setError(''); }}
                    className="text-sm text-blue-600 font-bold hover:underline"
                >
                    {isSignUp ? 'Already have an account? Sign In' : "Don't have an account? Sign Up"}
                </button>

                {/* Anonymity toggle */}
                <div className="flex items-center space-x-2">
                    <input
                        type="checkbox"
                        id="anon"
                        checked={formData.isAnonymous}
                        onChange={(e) => setFormData({ ...formData, isAnonymous: e.target.checked })}
                        className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <label htmlFor="anon" className="text-sm font-medium text-gray-600">Post as Anonymous</label>
                </div>

                {/* Back to edit */}
                <button
                    onClick={onBack}
                    className="group flex items-center space-x-2 text-slate-400 hover:text-slate-900 transition-colors text-sm font-bold"
                >
                    <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
                    <span>Back to Edit Review</span>
                </button>
            </div>
        </div>
    );
}

// ─── Main Component ────────────────────────────────────────────────────────

export default function SmartReviewForm({ setActiveTab }: { setActiveTab: (tab: string) => void }) {
    const [step, setStep] = useState(1);
    const [clubSearch, setClubSearch] = useState('');
    const [clubs, setClubs] = useState<Club[]>([]);
    const [submitting, setSubmitting] = useState(false);
    const [submitError, setSubmitError] = useState('');
    const [formData, setFormData] = useState<FormData>(EMPTY_FORM);

    // ── Load draft from localStorage on first mount ─────────────────────────
    useEffect(() => {
        const saved = localStorage.getItem(DRAFT_KEY);
        if (saved) {
            try {
                const parsed = JSON.parse(saved) as FormData;
                setFormData(parsed);
                if (parsed.clubName && parsed.universityName && !parsed.clubId) {
                    setClubSearch(`${parsed.clubName} (${parsed.universityName})`);
                } else if (parsed.clubId && parsed.clubName) {
                    setClubSearch(`${parsed.clubName} (${parsed.universityName})`);
                }
            } catch { /* ignore corrupt draft */ }
        }
    }, []);

    // ── Persist draft to localStorage whenever formData changes ─────────────
    useEffect(() => {
        localStorage.setItem(DRAFT_KEY, JSON.stringify(formData));
    }, [formData]);

    // ── Fetch clubs ─────────────────────────────────────────────────────────
    useEffect(() => {
        const supabase = createClient();
        supabase.from('clubs').select('id, name, university').order('name').then(({ data }) => {
            if (data) setClubs(data);
        });
    }, []);

    const filteredClubs = useMemo(
        () =>
            clubs.filter(
                (c) =>
                    c.name.toLowerCase().includes(clubSearch.toLowerCase()) ||
                    c.university.toLowerCase().includes(clubSearch.toLowerCase())
            ),
        [clubs, clubSearch]
    );

    const wordCount =
        formData.reviewText.trim() === '' ? 0 : formData.reviewText.trim().split(/\s+/).length;
    const allRatingsSelected = Object.values(formData.metrics).every((v) => v > 0);
    const isClubSelected = formData.clubId || (formData.clubName && formData.universityName);
    const isStep1Valid =
        wordCount >= 20 && isClubSelected && formData.competitionName && formData.eventDate && allRatingsSelected;

    const handleRating = (metric: string, val: number) => {
        setFormData((prev) => ({ ...prev, metrics: { ...prev.metrics, [metric]: val } }));
    };

    const selectExistingClub = (club: Club) => {
        setFormData((prev) => ({
            ...prev,
            clubId: club.id,
            clubName: club.name,
            universityName: club.university,
            isNewClub: false,
        }));
        setClubSearch(`${club.name} (${club.university})`);
    };

    // ── Publish button handler ───────────────────────────────────────────────
    // If already signed in → skip Step 2 and publish immediately.
    // If guest → advance to Step 2 (auth gate).
    const handleNext = async () => {
        const supabase = createClient();
        const { data: { session } } = await supabase.auth.getSession();

        if (session) {
            // Logged in — publish right away, step 2 is the submitting spinner
            setStep(2);
            await publishReview();
        } else {
            // Guest — show auth gate
            setStep(2);
        }
    };

    const handleBack = () => setStep(1);

    // ── Auto-publish after auth ─────────────────────────────────────────────
    const publishReview = async () => {
        setSubmitting(true);
        setSubmitError('');

        const supabase = createClient();
        const draft = JSON.parse(localStorage.getItem(DRAFT_KEY) ?? '{}') as FormData;
        let clubId = draft.clubId;

        if (draft.isNewClub && !clubId) {
            const { data: existing } = await supabase
                .from('clubs')
                .select('id')
                .ilike('name', draft.clubName)
                .single();

            if (existing) {
                clubId = existing.id;
            } else {
                const { data: newClub } = await supabase
                    .from('clubs')
                    .insert({ name: draft.clubName, university: draft.universityName })
                    .select('id')
                    .single();
                if (newClub) clubId = newClub.id;
            }
        }

        const { error: reviewError } = await supabase.from('reviews').insert({
            club_id: clubId || null,
            competition_name: draft.competitionName,
            event_date: draft.eventDate || null,
            ratings: draft.metrics,
            comment: draft.reviewText,
            is_anonymous: draft.isAnonymous,
        });

        setSubmitting(false);

        if (reviewError) {
            setSubmitError('Something went wrong while publishing. Please try again.');
            return;
        }

        // Clear the local draft and go to thank-you / reviews tab
        localStorage.removeItem(DRAFT_KEY);
        setStep(3);
    };

    // ── Step 3: Thank-you screen ────────────────────────────────────────────
    if (step === 3) {
        return (
            <div className="max-w-xl mx-auto px-4 py-20 text-center">
                <div className="bg-emerald-500 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-8 text-white shadow-xl shadow-emerald-500/20">
                    <CheckCircle2 size={40} />
                </div>
                <h2 className="text-3xl font-bold mb-4 text-slate-900">Review Published!</h2>
                <p className="text-gray-600 mb-10 leading-relaxed">
                    Thank you for contributing to a more transparent circuit. Your review is now live and visible to
                    everyone on the platform.
                </p>
                <button
                    onClick={() => {
                        setFormData(EMPTY_FORM);
                        setClubSearch('');
                        setStep(1);
                        setActiveTab('reviews');
                    }}
                    className="bg-slate-900 text-white px-8 py-3 rounded-xl font-bold hover:bg-slate-800 transition-all"
                >
                    See All Reviews
                </button>
            </div>
        );
    }

    // ── Step 2: Auth Gate ───────────────────────────────────────────────────
    if (step === 2) {
        if (submitting) {
            return (
                <div className="max-w-xl mx-auto px-4 py-20 text-center">
                    <Stepper step={step} />
                    <Loader2 size={48} className="animate-spin text-blue-600 mx-auto mb-6" />
                    <p className="text-lg font-bold text-slate-900">Publishing your review…</p>
                    <p className="text-gray-500 mt-2 text-sm">Please wait, this will only take a moment.</p>
                </div>
            );
        }

        return (
            <div className="max-w-xl mx-auto px-4 py-12">
                <Stepper step={step} />
                <AuthGate
                    formData={formData}
                    setFormData={setFormData}
                    onBack={handleBack}
                    onSuccess={publishReview}
                />
            </div>
        );
    }

    // ── Step 1: Main form ──────────────────────────────────────────────────
    return (
        <div className="max-w-4xl mx-auto w-full px-4 py-8 md:py-12">
            <Stepper step={step} />
            <div className="bg-white w-full rounded-3xl border border-gray-200 shadow-xl overflow-hidden">
                <div className="p-6 md:p-10">
                    <div className="mb-10">
                        <h3 className="text-3xl font-bold text-slate-900 mb-2">Smart Review Submission</h3>
                        <p className="text-gray-500">Your feedback builds the transparency the circuit needs.</p>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                        {/* ── Left Column ── */}
                        <div className="space-y-6">
                            {/* Club Search */}
                            <div>
                                <label className="block text-xs font-bold text-slate-700 uppercase mb-2">
                                    Organizer (Club Name)
                                </label>
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                                    <input
                                        type="text"
                                        value={clubSearch}
                                        onChange={(e) => {
                                            setClubSearch(e.target.value);
                                            if (formData.clubId) {
                                                setFormData({ ...formData, clubId: '', clubName: '', universityName: '', isNewClub: false });
                                            }
                                        }}
                                        placeholder="Search for club or university…"
                                        className="w-full pl-10 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>

                                {/* Dropdown */}
                                {clubSearch && !formData.clubId && filteredClubs.length > 0 && (
                                    <div className="mt-2 border border-gray-100 rounded-xl overflow-hidden shadow-lg max-h-48 overflow-y-auto bg-white z-20 relative">
                                        {filteredClubs.map((c) => (
                                            <button
                                                key={c.id}
                                                onClick={() => selectExistingClub(c)}
                                                className="w-full text-left p-4 hover:bg-blue-50 border-b last:border-0 border-gray-50 transition-colors"
                                            >
                                                <p className="font-bold text-sm text-slate-900">{c.name}</p>
                                                <p className="text-[10px] text-gray-500 uppercase tracking-tight">{c.university}</p>
                                            </button>
                                        ))}
                                    </div>
                                )}

                                {/* New club form */}
                                {clubSearch && !formData.clubId && filteredClubs.length === 0 && (
                                    <div className="mt-3 p-5 bg-amber-50 border border-amber-100 rounded-2xl">
                                        <div className="flex items-start space-x-2 mb-4">
                                            <AlertCircle className="text-amber-600 shrink-0 mt-0.5" size={16} />
                                            <p className="text-[12px] text-amber-900 leading-snug">
                                                Club not found.{' '}
                                                <span className="font-bold">Fill in the details to add it to our platform.</span>
                                            </p>
                                        </div>
                                        <div className="space-y-3">
                                            <div className="space-y-1">
                                                <label className="text-[10px] font-black text-amber-800 uppercase ml-1">Club Name</label>
                                                <input
                                                    type="text"
                                                    placeholder="e.g. IBA Business Club"
                                                    value={formData.clubName}
                                                    onChange={(e) => setFormData({ ...formData, clubName: e.target.value, isNewClub: true })}
                                                    className="w-full p-2.5 bg-white border border-amber-200 rounded-lg text-sm focus:ring-2 focus:ring-amber-300 outline-none"
                                                />
                                            </div>
                                            <div className="space-y-1">
                                                <label className="text-[10px] font-black text-amber-800 uppercase ml-1">University Name</label>
                                                <input
                                                    type="text"
                                                    placeholder="e.g. University of Dhaka"
                                                    value={formData.universityName}
                                                    onChange={(e) => setFormData({ ...formData, universityName: e.target.value, isNewClub: true })}
                                                    className="w-full p-2.5 bg-white border border-amber-200 rounded-lg text-sm focus:ring-2 focus:ring-amber-300 outline-none"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Competition + Date */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 uppercase mb-2">Competition Name</label>
                                    <input
                                        type="text"
                                        value={formData.competitionName}
                                        onChange={(e) => setFormData({ ...formData, competitionName: e.target.value })}
                                        placeholder="e.g. BizMaestros 2024"
                                        className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 uppercase mb-2">Event Date</label>
                                    <div className="relative">
                                        <CalendarDays
                                            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
                                            size={16}
                                        />
                                        <input
                                            type="date"
                                            value={formData.eventDate}
                                            onChange={(e) => setFormData({ ...formData, eventDate: e.target.value })}
                                            className="w-full pl-10 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 appearance-none"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Review Text */}
                            <div>
                                <div className="flex justify-between items-end mb-2">
                                    <label className="block text-xs font-bold text-slate-700 uppercase">Your Experience</label>
                                    <span className={`text-[10px] font-bold ${wordCount >= 20 ? 'text-emerald-500' : 'text-red-400'}`}>
                                        {wordCount}/20 words min.
                                    </span>
                                </div>
                                <textarea
                                    rows={5}
                                    value={formData.reviewText}
                                    onChange={(e) => setFormData({ ...formData, reviewText: e.target.value })}
                                    placeholder="What was the highlight? How was the judging? Be specific."
                                    className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 text-sm resize-none"
                                />
                            </div>
                        </div>

                        {/* ── Right Column: Ratings ── */}
                        <div className="space-y-6">
                            <div className="bg-slate-50 p-8 rounded-3xl border border-slate-100 space-y-6">
                                <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest">
                                    Performance Metrics
                                </h4>
                                {[
                                    { id: 'case', label: 'Case Quality', desc: 'Originality & Depth' },
                                    { id: 'communication', label: 'Communication', desc: 'Clarity & Response' },
                                    { id: 'fairness', label: 'Fairness', desc: 'Judging & Feedback' },
                                    { id: 'logistics', label: 'Logistics', desc: 'Schedule & Operations' },
                                ].map((metric) => (
                                    <div key={metric.id} className="space-y-2">
                                        <div className="flex justify-between items-center">
                                            <label className="text-sm font-bold text-slate-800">{metric.label}</label>
                                            <span className="text-[10px] text-gray-400">{metric.desc}</span>
                                        </div>
                                        <StarRating
                                            metric={metric.id}
                                            value={formData.metrics[metric.id as keyof Metrics]}
                                            onRate={handleRating}
                                        />
                                    </div>
                                ))}
                            </div>

                            <div className="bg-slate-900 p-6 rounded-3xl text-white relative overflow-hidden">
                                <div className="relative z-10">
                                    <h4 className="font-bold text-sm flex items-center mb-2">
                                        <Shield size={16} className="text-blue-400 mr-2" />
                                        Trusted Verification
                                    </h4>
                                    <p className="text-[11px] text-slate-400 leading-relaxed">
                                        By submitting, you agree to provide authentic information. New clubs are queued for
                                        verification before becoming public data.
                                    </p>
                                </div>
                                <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/10 rounded-full blur-2xl -mr-8 -mt-8" />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Form footer */}
                <div className="bg-slate-50 p-8 flex flex-col md:flex-row items-center justify-between gap-6 border-t border-gray-100">
                    <div className="text-slate-600 text-center md:text-left">
                        <h5 className="font-bold text-slate-900">Final Step</h5>
                        <p className="text-xs">Verify & Publish your review</p>
                    </div>

                    {submitError && (
                        <div className="px-4 py-2 bg-red-50 border border-red-100 rounded-xl text-xs text-red-700 font-medium w-full md:w-auto text-center">
                            {submitError}
                        </div>
                    )}

                    <button
                        disabled={!isStep1Valid}
                        onClick={handleNext}
                        className={`flex items-center space-x-2 px-12 py-4 rounded-2xl font-bold transition-all w-full md:w-auto justify-center ${!isStep1Valid
                            ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                            : 'bg-blue-600 text-white hover:bg-blue-500 shadow-xl shadow-blue-500/20'
                            }`}
                    >
                        <span>Publish Review</span>
                    </button>
                </div>
            </div>
        </div>
    );
}
