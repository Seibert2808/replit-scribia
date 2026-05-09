-- ============================================
-- Public landing schema additions (2026-05-08)
--
-- Adds:
--   1. events.slug (URL-friendly id, unique per organizer)
--   2. organizer_profiles table (public profile per organizer)
--   3. RLS policies allowing public SELECT on:
--        - organizer_profiles
--        - events with status='completed'
--        - lectures of completed events
--        - speakers
--   4. updated_at trigger for organizer_profiles
--
-- Apply this BEFORE running the backfill script.
-- After the backfill, run the LOCKDOWN block at the bottom.
-- ============================================

CREATE EXTENSION IF NOT EXISTS unaccent;

-- 1. events.slug
ALTER TABLE public.events
  ADD COLUMN IF NOT EXISTS slug TEXT;

CREATE INDEX IF NOT EXISTS idx_events_slug ON public.events(slug);

-- 2. organizer_profiles
CREATE TABLE IF NOT EXISTS public.organizer_profiles (
  id UUID PRIMARY KEY REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  slug TEXT NOT NULL UNIQUE,
  display_name TEXT NOT NULL,
  description TEXT,
  logo_url TEXT,
  brand_color TEXT DEFAULT '#6B4EFF',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_organizer_profiles_slug ON public.organizer_profiles(slug);

ALTER TABLE public.organizer_profiles ENABLE ROW LEVEL SECURITY;

-- 3. RLS policies (idempotent: drop-then-create)
DROP POLICY IF EXISTS "anyone_read_organizer_profiles" ON public.organizer_profiles;
CREATE POLICY "anyone_read_organizer_profiles"
  ON public.organizer_profiles FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "organizers_manage_own_profile" ON public.organizer_profiles;
CREATE POLICY "organizers_manage_own_profile"
  ON public.organizer_profiles FOR ALL
  USING (
    auth.uid() = id
    OR EXISTS (
      SELECT 1 FROM public.user_profiles up
      WHERE up.id = auth.uid() AND 'super_admin'::public.user_role = ANY(up.roles)
    )
  )
  WITH CHECK (
    auth.uid() = id
    OR EXISTS (
      SELECT 1 FROM public.user_profiles up
      WHERE up.id = auth.uid() AND 'super_admin'::public.user_role = ANY(up.roles)
    )
  );

DROP POLICY IF EXISTS "anyone_read_completed_events" ON public.events;
CREATE POLICY "anyone_read_completed_events"
  ON public.events FOR SELECT
  USING (status = 'completed');

-- Lectures: do NOT add a public-read policy on the table itself, since columns
-- like transcript_text, summary, ebook_content, playbook_content and audio_path
-- are confidential. Expose a column-restricted VIEW for public consumption.
DROP POLICY IF EXISTS "anyone_read_lectures_of_completed_events" ON public.lectures;

CREATE OR REPLACE VIEW public.lectures_public
WITH (security_invoker = false) AS
SELECT
  l.id,
  l.event_id,
  l.speaker_id,
  l.title,
  l.description,
  l.scheduled_at,
  l.duration_seconds,
  l.status,
  l.card_image_url,
  l.created_at
FROM public.lectures l
JOIN public.events e ON e.id = l.event_id
WHERE e.status = 'completed';

GRANT SELECT ON public.lectures_public TO anon, authenticated;

-- Speakers: same pattern. Email is private; expose only public-bio fields.
DROP POLICY IF EXISTS "anyone_read_speakers" ON public.speakers;

CREATE OR REPLACE VIEW public.speakers_public
WITH (security_invoker = false) AS
SELECT
  id,
  name,
  bio,
  company,
  role,
  avatar_url
FROM public.speakers;

GRANT SELECT ON public.speakers_public TO anon, authenticated;

-- 4. updated_at trigger (shared helper, safe to redefine)
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_organizer_profiles_updated_at ON public.organizer_profiles;
CREATE TRIGGER trg_organizer_profiles_updated_at
  BEFORE UPDATE ON public.organizer_profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

-- ============================================
-- LOCKDOWN (run AFTER the backfill script)
-- ============================================
-- ALTER TABLE public.events ALTER COLUMN slug SET NOT NULL;
-- ALTER TABLE public.events ADD CONSTRAINT events_organizer_slug_unique UNIQUE (organizer_id, slug);

-- ============================================
-- ROLLBACK
-- ============================================
-- DROP VIEW IF EXISTS public.speakers_public;
-- DROP VIEW IF EXISTS public.lectures_public;
-- DROP POLICY IF EXISTS "anyone_read_completed_events" ON public.events;
-- DROP TABLE IF EXISTS public.organizer_profiles;
-- ALTER TABLE public.events DROP CONSTRAINT IF EXISTS events_organizer_slug_unique;
-- ALTER TABLE public.events DROP COLUMN IF EXISTS slug;
