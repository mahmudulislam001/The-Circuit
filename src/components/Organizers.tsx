'use client';

import { useState, useEffect } from 'react';
import { Star, MessageSquare, ChevronLeft, Search } from 'lucide-react';
import { createClient } from '../lib/supabase/client';
import type { ClubRating, Review } from '../types';

// ─── Helpers ───────────────────────────────────────────────────────────────

function averageRating(ratings: Review['ratings']): number {
    const vals = Object.values(ratings).filter((v) => v > 0);
    if (!vals.length) return 0;
    return vals.reduce((a, b) => a + b, 0) / vals.length;
}

function formatDate(dateStr: string | null): string {
    if (!dateStr) return 'Date unknown';
    return new Date(dateStr).toLocaleDateString('en-GB', {
        day: 'numeric', month: 'short', year: 'numeric',
    });
}

// ─── Sub-components ────────────────────────────────────────────────────────

function StarDisplay({ value }: { value: number }) {
    // Round to 1 decimal place safely
    const displayValue = typeof value === 'number' ? value.toFixed(1) : '0.0';
    return (
        <div className="flex items-center space-x-0.5">
            {[1, 2, 3, 4, 5].map((star) => (
                <Star
                    key={star}
                    size={14}
                    className={value >= star ? 'text-yellow-400' : 'text-gray-200'}
                    fill={value >= star ? 'currentColor' : 'none'}
                />
            ))}
            <span className="ml-1 text-xs font-bold text-slate-600">{displayValue}</span>
        </div>
    );
}

function ReviewItem({ review }: { review: Review }) {
    const avg = averageRating(review.ratings);
    return (
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col space-y-3 hover:border-gray-200 transition-colors">
            <div className="flex justify-between items-start">
                <div>
                    <h4 className="font-bold text-slate-900">{review.competition_name}</h4>
                    <p className="text-[10px] text-gray-400 mt-0.5">{formatDate(review.event_date)}</p>
                </div>
                <StarDisplay value={avg} />
            </div>
            {review.comment && <p className="text-sm text-gray-600 leading-relaxed max-w-2xl">{review.comment}</p>}
            {/* Footer with Metadata and Voting */}
            <div className="pt-2 mt-2 border-t border-gray-50 flex justify-between items-center">
                <div>
                    <p className="text-[10px] font-bold tracking-wide text-gray-400 uppercase">
                        {review.is_anonymous ? 'Anonymous Review' : 'Verified Reviewer'}
                    </p>
                    <p className="text-[10px] text-gray-300 mt-0.5">
                        Posted on {formatDate(review.created_at)}
                    </p>
                </div>
            </div>
        </div>
    );
}

// ─── Main Component ────────────────────────────────────────────────────────

export default function Organizers() {
    const [clubs, setClubs] = useState<any[]>([]); // Need to use `any` or update types since the View exposes `club_id` instead of `id`
    const [loading, setLoading] = useState(true);
    const [selectedClub, setSelectedClub] = useState<any | null>(null);
    const [searchQuery, setSearchQuery] = useState('');

    // Detail state
    const [reviews, setReviews] = useState<Review[]>([]);
    const [reviewsLoading, setReviewsLoading] = useState(false);
    const [filter, setFilter] = useState<'recent' | 'past' | 'positive' | 'negative'>('recent');

    useEffect(() => {
        const fetchClubs = async () => {
            const supabase = createClient();

            // Fetch directly from the user's SQL View
            const { data } = await supabase
                .from('club_ratings')
                .select('*')
                .order('name');
            if (data) setClubs(data);
            setLoading(false);
        };
        fetchClubs();
    }, []);

    useEffect(() => {
        if (!selectedClub) return;
        const fetchReviews = async () => {
            setReviewsLoading(true);
            const supabase = createClient();
            const { data } = await supabase
                .from('reviews')
                .select('*')
                .eq('club_id', selectedClub.club_id);
            if (data) {
                setReviews(data as Review[]);
            }
            setReviewsLoading(false);
        };
        fetchReviews();
    }, [selectedClub]);

    // Apply filtering and sorting to reviews
    const filteredReviews = [...reviews].sort((a, b) => {
        // Default time sorts
        if (filter === 'recent') return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        if (filter === 'past') return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
        // If sorting by rating, secondary sort by time descending
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    }).filter((r) => {
        const avg = averageRating(r.ratings);
        if (filter === 'positive') return avg >= 4;
        if (filter === 'negative') return avg <= 2.9; // Adjusted to match user's standard
        return true;
    });

    if (selectedClub) {
        return (
            <div className="max-w-4xl mx-auto px-4 py-12 animate-in fade-in duration-300">
                <button
                    onClick={() => setSelectedClub(null)}
                    className="flex items-center space-x-2 text-sm font-bold text-gray-500 hover:text-slate-900 mb-8 transition-colors group"
                >
                    <ChevronLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
                    <span>Back to Organizers</span>
                </button>

                <div className="bg-slate-900 p-8 rounded-3xl shadow-lg mb-8 flex flex-col md:flex-row justify-between md:items-center gap-4">
                    <div>
                        <h2 className="text-3xl font-bold text-white">{selectedClub.name}</h2>
                        <p className="text-blue-200 mt-1">{selectedClub.university}</p>
                    </div>
                    <div className="bg-slate-800 p-4 rounded-2xl flex flex-col items-end shrink-0">
                        <StarDisplay value={Number(selectedClub.average_rating) || 0} />
                        <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mt-2">
                            {selectedClub.total_reviews} {selectedClub.total_reviews === 1 ? 'Review' : 'Reviews'}
                        </p>
                    </div>
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
                    <h3 className="text-xl font-bold text-slate-800">Community Reviews</h3>
                    <div className="flex bg-slate-100 p-1 rounded-xl shrink-0 self-start sm:self-auto overflow-x-auto">
                        {(['recent', 'past', 'positive', 'negative'] as const).map(f => (
                            <button
                                key={f}
                                onClick={() => setFilter(f)}
                                className={`px-4 py-2 text-xs font-bold rounded-lg capitalize transition-all shrink-0 ${filter === f ? 'bg-white text-slate-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                                    }`}
                            >
                                {f}
                            </button>
                        ))}
                    </div>
                </div>

                {reviewsLoading ? (
                    <div className="space-y-4">
                        {[1, 2, 3].map(i => <div key={i} className="h-40 bg-gray-100 rounded-2xl animate-pulse" />)}
                    </div>
                ) : filteredReviews.length === 0 ? (
                    <div className="bg-white p-12 rounded-3xl text-center border border-gray-100 shadow-sm">
                        <MessageSquare className="mx-auto text-gray-200 mb-4" size={48} />
                        <h3 className="text-lg font-bold text-slate-900">No reviews found</h3>
                        <p className="text-gray-500 font-medium">Try selecting a different filter.</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {filteredReviews.map(r => <ReviewItem key={r.id} review={r} />)}
                    </div>
                )}
            </div>
        );
    }

    const filteredClubs = clubs.filter((club) => {
        const query = searchQuery.toLowerCase();
        return (
            club.name?.toLowerCase().includes(query) ||
            club.university?.toLowerCase().includes(query)
        );
    });

    return (
        <div className="max-w-5xl mx-auto px-4 py-12 animate-in fade-in duration-300">
            <div className="mb-10">
                <h2 className="text-3xl font-bold text-slate-900">Organizers</h2>
                <p className="text-gray-500 mt-1 pb-6 mb-6 border-b border-gray-100">
                    Browse and evaluate competition organizers based on community feedback.
                </p>

                <div className="relative max-w-md">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input
                        type="text"
                        placeholder="Search by club name or university..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 bg-white border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-shadow shadow-sm"
                    />
                </div>
            </div>

            {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[1, 2, 3, 4, 5, 6].map(i => <div key={i} className="h-40 bg-white border border-gray-100 rounded-3xl animate-pulse" />)}
                </div>
            ) : filteredClubs.length === 0 ? (
                <div className="bg-white p-12 rounded-3xl text-center border border-gray-100 shadow-sm">
                    <MessageSquare className="mx-auto text-gray-200 mb-4" size={48} />
                    {searchQuery ? (
                        <>
                            <h3 className="text-lg font-bold text-slate-900">No organizers found matching that name</h3>
                            <p className="text-gray-500 font-medium pb-2 mt-1">Try adjusting your search query.</p>
                        </>
                    ) : (
                        <>
                            <h3 className="text-lg font-bold text-slate-900">No organizers yet</h3>
                            <p className="text-gray-500 font-medium pb-2 mt-1">Clubs added during review submissions will appear here.</p>
                        </>
                    )}
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredClubs.map((club) => (
                        <button
                            key={club.club_id}
                            onClick={() => setSelectedClub(club)}
                            className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm hover:shadow-md hover:border-gray-300 hover:-translate-y-1 transition-all text-left group flex flex-col justify-between"
                        >
                            <div>
                                <h3 className="font-bold text-slate-900 text-lg mb-1 group-hover:text-blue-600 transition-colors">
                                    {club.name}
                                </h3>
                                <p className="text-xs text-gray-500 mb-6 font-medium">{club.university}</p>
                            </div>

                            <div className="flex items-center justify-between pt-4 border-t border-gray-50 w-full">
                                <StarDisplay value={Number(club.average_rating) || 0} />
                                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest bg-gray-50 px-2 py-1 rounded">
                                    {club.total_reviews} {club.total_reviews === 1 ? 'Review' : 'Reviews'}
                                </span>
                            </div>
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}
