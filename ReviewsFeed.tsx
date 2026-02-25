'use client';

import { useState, useEffect, useCallback } from 'react';
import { Search, MessageSquare, Star, ChevronDown, ChevronUp, ThumbsUp, ThumbsDown } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import type { Review } from '@/types';

// ─── Helpers ───────────────────────────────────────────────────────────────

function formatDate(dateStr: string | null): string {
    if (!dateStr) return 'Date unknown';
    return new Date(dateStr).toLocaleDateString('en-GB', {
        day: 'numeric', month: 'short', year: 'numeric',
    });
}

function averageRating(ratings: Review['ratings']): number {
    const vals = Object.values(ratings).filter((v) => v > 0);
    if (!vals.length) return 0;
    return vals.reduce((a, b) => a + b, 0) / vals.length;
}

// ─── Sub-components ────────────────────────────────────────────────────────

function StarDisplay({ value }: { value: number }) {
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
            <span className="ml-1 text-xs font-bold text-slate-600">{value.toFixed(1)}</span>
        </div>
    );
}

// ─── ReviewCard ─────────────────────────────────────────────────────────────

function ReviewCard({ review, user, onSignInRequired }: {
    review: Review;
    user: any;
    onSignInRequired: () => void;
}) {
    const [expanded, setExpanded] = useState(false);

    // Counts loaded from review_votes (source of truth)
    const [likes, setLikes] = useState(0);
    const [dislikes, setDislikes] = useState(0);
    // Current user's existing vote for this review, null = no vote
    const [myVote, setMyVote] = useState<1 | -1 | null>(null);
    const [isUpdating, setIsUpdating] = useState(false);

    const avg = averageRating(review.ratings);
    const clubName = review.clubs?.name ?? 'Unknown Organizer';
    const university = review.clubs?.university ?? '';
    const wordLimit = 30;
    const words = (review.comment ?? '').split(' ');
    const isLong = words.length > wordLimit;
    const displayText = expanded || !isLong ? review.comment : words.slice(0, wordLimit).join(' ') + '…';

    const metricLabels: Record<string, string> = {
        case: 'Case Quality',
        communication: 'Communication',
        fairness: 'Fairness',
        logistics: 'Logistics',
    };

    // ── Load counts + current user's vote on mount ──────────────────────────
    const loadVotes = useCallback(async () => {
        const supabase = createClient();

        const { data: votes, error } = await supabase
            .from('review_votes')
            .select('vote_type, user_id')
            .eq('review_id', review.id);

        if (error) {
            console.error('[review_votes] SELECT failed:', error.message, '| code:', error.code);
            return;
        }

        if (votes) {
            const likeCount = votes.filter((v) => v.vote_type === 1).length;
            const dislikeCount = votes.filter((v) => v.vote_type === -1).length;
            console.log(`[review_votes] ${review.id} → likes: ${likeCount}, dislikes: ${dislikeCount}`);
            setLikes(likeCount);
            setDislikes(dislikeCount);

            if (user) {
                const mine = votes.find((v) => v.user_id === user.id);
                setMyVote(mine ? (mine.vote_type as 1 | -1) : null);
            }
        }
    }, [review.id, user]);

    useEffect(() => {
        loadVotes();
    }, [loadVotes]);

    // ── Vote handler ────────────────────────────────────────────────────────
    const handleVote = async (type: 1 | -1) => {
        if (!user) {
            onSignInRequired();
            return;
        }
        if (isUpdating) return;
        setIsUpdating(true);

        const supabase = createClient();

        try {
            if (myVote === type) {
                // Same button clicked → remove vote (toggle off)
                const { error } = await supabase
                    .from('review_votes')
                    .delete()
                    .eq('review_id', review.id)
                    .eq('user_id', user.id);

                if (!error) {
                    setMyVote(null);
                    if (type === 1) setLikes((n) => Math.max(0, n - 1));
                    else setDislikes((n) => Math.max(0, n - 1));
                }
            } else if (myVote !== null) {
                // Different button → update existing vote
                const { error } = await supabase
                    .from('review_votes')
                    .update({ vote_type: type })
                    .eq('review_id', review.id)
                    .eq('user_id', user.id);

                if (!error) {
                    const prev = myVote;
                    setMyVote(type);
                    if (type === 1) {
                        setLikes((n) => n + 1);
                        if (prev === -1) setDislikes((n) => Math.max(0, n - 1));
                    } else {
                        setDislikes((n) => n + 1);
                        if (prev === 1) setLikes((n) => Math.max(0, n - 1));
                    }
                }
            } else {
                // No existing vote → fresh insert
                const { error } = await supabase
                    .from('review_votes')
                    .insert({ review_id: review.id, user_id: user.id, vote_type: type });

                if (!error) {
                    setMyVote(type);
                    if (type === 1) setLikes((n) => n + 1);
                    else setDislikes((n) => n + 1);
                } else {
                    console.error('[review_votes] INSERT failed:', error.message, '| code:', error.code);
                }
            }
        } catch (err) {
            console.error('Vote error:', err);
        } finally {
            setIsUpdating(false);
        }
    };

    return (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 hover:shadow-md transition-shadow">
            {/* Header */}
            <div className="flex items-start justify-between mb-4">
                <div>
                    <h3 className="font-bold text-slate-900 text-base">{review.competition_name}</h3>
                    <p className="text-xs text-gray-500 mt-0.5">
                        {clubName}{university ? ` · ${university}` : ''}
                    </p>
                </div>
                <div className="text-right shrink-0 ml-4">
                    <StarDisplay value={avg} />
                    <p className="text-[10px] text-gray-400 mt-1">{formatDate(review.event_date)}</p>
                </div>
            </div>

            {/* Comment */}
            {review.comment && (
                <p className="text-sm text-gray-600 leading-relaxed mb-4">{displayText}</p>
            )}
            {isLong && (
                <button
                    onClick={() => setExpanded(!expanded)}
                    className="flex items-center space-x-1 text-xs font-bold text-blue-600 hover:text-blue-500 mb-4"
                >
                    {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                    <span>{expanded ? 'Show less' : 'Read more'}</span>
                </button>
            )}

            {/* Metric Breakdown */}
            <div className="grid grid-cols-2 gap-2 pt-4 border-t border-gray-50">
                {Object.entries(review.ratings).map(([key, val]) => (
                    <div key={key} className="flex items-center justify-between">
                        <span className="text-[10px] text-gray-400 uppercase tracking-wide">
                            {metricLabels[key] ?? key}
                        </span>
                        <StarDisplay value={val} />
                    </div>
                ))}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between mt-4">
                <p className="text-[10px] text-gray-300">
                    {review.is_anonymous ? 'Anonymous' : 'Verified Reviewer'} · {formatDate(review.created_at)}
                </p>

                <div className="flex items-center space-x-3">
                    {/* Like */}
                    <button
                        onClick={() => handleVote(1)}
                        disabled={isUpdating}
                        title={!user ? 'Sign in to vote' : undefined}
                        className={`flex items-center space-x-1.5 text-xs font-semibold px-2.5 py-1.5 rounded-lg transition-all disabled:opacity-50 ${myVote === 1
                            ? 'bg-[#0B1426] text-white'
                            : 'text-gray-400 hover:text-[#0B1426] hover:bg-slate-100'
                            }`}
                    >
                        <ThumbsUp size={14} fill={myVote === 1 ? 'currentColor' : 'none'} />
                        <span>{likes}</span>
                    </button>

                    {/* Dislike */}
                    <button
                        onClick={() => handleVote(-1)}
                        disabled={isUpdating}
                        title={!user ? 'Sign in to vote' : undefined}
                        className={`flex items-center space-x-1.5 text-xs font-semibold px-2.5 py-1.5 rounded-lg transition-all disabled:opacity-50 ${myVote === -1
                            ? 'bg-red-600 text-white'
                            : 'text-gray-400 hover:text-red-600 hover:bg-red-50'
                            }`}
                    >
                        <ThumbsDown size={14} fill={myVote === -1 ? 'currentColor' : 'none'} />
                        <span>{dislikes}</span>
                    </button>
                </div>
            </div>
        </div>
    );
}

// ─── Main Feed ─────────────────────────────────────────────────────────────

export default function ReviewsFeed() {
    const [reviews, setReviews] = useState<Review[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [user, setUser] = useState<any>(null);
    const [showSignInPrompt, setShowSignInPrompt] = useState(false);

    const fetchReviews = useCallback(async () => {
        setLoading(true);
        const supabase = createClient();
        const { data, error } = await supabase
            .from('reviews')
            .select('*, clubs(name, university)')
            .order('created_at', { ascending: false });

        if (!error && data) setReviews(data as Review[]);
        setLoading(false);
    }, []);

    useEffect(() => {
        const supabase = createClient();
        supabase.auth.getSession().then(({ data: { session } }) => {
            setUser(session?.user ?? null);
        });

        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setUser(session?.user ?? null);
        });

        fetchReviews();
        return () => subscription.unsubscribe();
    }, [fetchReviews]);

    const filtered = reviews.filter((r) => {
        const q = search.toLowerCase();
        return (
            r.competition_name.toLowerCase().includes(q) ||
            (r.clubs?.name ?? '').toLowerCase().includes(q) ||
            (r.clubs?.university ?? '').toLowerCase().includes(q)
        );
    });

    return (
        <div className="max-w-5xl mx-auto px-4 py-12">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between mb-10 gap-4">
                <div>
                    <h2 className="text-3xl font-bold text-slate-900">Competition Reviews</h2>
                    <p className="text-gray-500 mt-1">
                        {loading ? 'Loading…' : `${reviews.length} review${reviews.length !== 1 ? 's' : ''} from the circuit`}
                    </p>
                </div>
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input
                        type="text"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Search competitions or clubs…"
                        className="pl-10 pr-4 py-2.5 bg-gray-100 border-none rounded-xl focus:ring-2 focus:ring-blue-500 w-full md:w-80 outline-none"
                    />
                </div>
            </div>

            {/* Sign-in nudge */}
            {showSignInPrompt && (
                <div className="mb-6 flex items-center justify-between bg-[#0B1426] text-white rounded-2xl px-6 py-4 shadow-lg">
                    <p className="text-sm font-semibold">Sign in to like or dislike reviews and join the conversation.</p>
                    <button
                        onClick={() => setShowSignInPrompt(false)}
                        className="ml-4 text-xs text-slate-400 hover:text-white font-bold"
                    >
                        Dismiss
                    </button>
                </div>
            )}

            {/* Content */}
            {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {[1, 2, 3, 4].map((i) => (
                        <div key={i} className="bg-white rounded-2xl border border-gray-100 p-6 animate-pulse">
                            <div className="h-4 bg-slate-100 rounded w-2/3 mb-3" />
                            <div className="h-3 bg-slate-100 rounded w-1/2 mb-6" />
                            <div className="h-3 bg-slate-100 rounded w-full mb-2" />
                            <div className="h-3 bg-slate-100 rounded w-4/5" />
                        </div>
                    ))}
                </div>
            ) : filtered.length === 0 ? (
                <div className="bg-white p-12 rounded-3xl border border-gray-100 text-center">
                    <MessageSquare className="mx-auto text-gray-200 mb-4" size={48} />
                    <h3 className="text-lg font-bold text-slate-900">
                        {search ? 'No matches found' : 'No reviews yet'}
                    </h3>
                    <p className="text-gray-400">
                        {search ? 'Try a different search term.' : 'Be the first to share your experience.'}
                    </p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {filtered.map((review) => (
                        <ReviewCard
                            key={review.id}
                            review={review}
                            user={user}
                            onSignInRequired={() => setShowSignInPrompt(true)}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}
