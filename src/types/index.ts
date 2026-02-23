// Shared TypeScript types matching the Supabase database schema

export interface Club {
    id: string;
    name: string;
    university: string;
    created_at?: string;
}

export interface ClubRating extends Club {
    average_rating: number;
    total_reviews: number;
}

export interface Review {
    id: string;
    club_id: string | null;
    competition_name: string;
    event_date: string | null;
    ratings: {
        case: number;
        communication: number;
        fairness: number;
        logistics: number;
    };
    comment: string | null;
    is_anonymous: boolean;
    created_at: string;
    likes?: number;
    dislikes?: number;
    // Joined column from clubs table
    clubs?: Pick<Club, 'name' | 'university'> | null;
}
