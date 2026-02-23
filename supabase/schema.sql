-- ============================================================
-- THE CIRCUIT — Database Schema
-- Run this entire script in:
-- Supabase Dashboard → SQL Editor → New Query → Paste → Run
-- ============================================================

-- ─────────────────────────────────────────
-- 1. CLUBS TABLE
--    Stores info about competition-organizing clubs
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.clubs (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL,
  university  TEXT NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─────────────────────────────────────────
-- 2. REVIEWS TABLE
--    Stores participant reviews for competitions
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.reviews (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  club_id           UUID REFERENCES public.clubs(id) ON DELETE SET NULL,
  competition_name  TEXT NOT NULL,
  event_date        DATE,
  ratings           JSONB NOT NULL DEFAULT '{}',
  -- ratings stores: { "case": 1-5, "communication": 1-5, "fairness": 1-5, "logistics": 1-5 }
  comment           TEXT,
  is_anonymous      BOOLEAN NOT NULL DEFAULT TRUE,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─────────────────────────────────────────
-- 3. REVIEW VOTES TABLE
--    One row per (user, review) pair.
--    vote_type: 'like' | 'dislike'
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.review_votes (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  review_id   UUID NOT NULL REFERENCES public.reviews(id) ON DELETE CASCADE,
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  vote_type   TEXT NOT NULL CHECK (vote_type IN ('like', 'dislike')),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (review_id, user_id)   -- one vote per user per review → enables upsert
);

-- ─────────────────────────────────────────
-- 4. ROW LEVEL SECURITY (RLS)
-- ─────────────────────────────────────────

ALTER TABLE public.clubs        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.review_votes ENABLE ROW LEVEL SECURITY;

-- CLUBS: Anyone can read
CREATE POLICY "clubs_read_all"
  ON public.clubs FOR SELECT
  USING (true);

-- CLUBS: Only authenticated users can insert (new club suggestions)
CREATE POLICY "clubs_insert_auth"
  ON public.clubs FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- REVIEWS: Anyone can read
CREATE POLICY "reviews_read_all"
  ON public.reviews FOR SELECT
  USING (true);

-- REVIEWS: Only authenticated users can insert
CREATE POLICY "reviews_insert_auth"
  ON public.reviews FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- REVIEW VOTES: anyone (incl. anon) can read vote counts
CREATE POLICY "review_votes_read_all"
  ON public.review_votes FOR SELECT
  USING (true);

-- REVIEW VOTES: only authenticated users can insert/update their own votes
CREATE POLICY "review_votes_insert_auth"
  ON public.review_votes FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "review_votes_update_own"
  ON public.review_votes FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- REVIEW VOTES: only the vote owner can delete their vote
CREATE POLICY "review_votes_delete_own"
  ON public.review_votes FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- ─────────────────────────────────────────
-- 5. SEED DATA — Pre-load the 4 known clubs
-- ─────────────────────────────────────────
INSERT INTO public.clubs (name, university) VALUES
  ('IBA Business Club',                    'University of Dhaka (DU)'),
  ('BUP Business & Communication Club',    'Bangladesh University of Professionals (BUP)'),
  ('NSU Young Entrepreneurs Society',      'North South University (NSU)'),
  ('IUT Business & ICT Society',           'Islamic University of Technology (IUT)')
ON CONFLICT DO NOTHING;

-- ─────────────────────────────────────────
-- Done! You should see all tables in the
-- Supabase "Table Editor" on the left panel.
-- ─────────────────────────────────────────