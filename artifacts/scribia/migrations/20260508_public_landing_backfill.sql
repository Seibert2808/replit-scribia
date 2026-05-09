-- ============================================
-- Public landing backfill (2026-05-08)
--
-- Run AFTER applying 20260508_public_landing_schema.sql.
-- Idempotent: safe to re-run; only fills NULL slugs and missing organizer_profiles.
-- ============================================

-- 1. Backfill events.slug from name, deduping within each organizer
WITH new_slugs AS (
  SELECT
    id,
    organizer_id,
    lower(regexp_replace(regexp_replace(unaccent(name), '[^a-zA-Z0-9]+', '-', 'g'), '(^-|-$)', '', 'g')) AS base_slug,
    ROW_NUMBER() OVER (
      PARTITION BY organizer_id,
        lower(regexp_replace(regexp_replace(unaccent(name), '[^a-zA-Z0-9]+', '-', 'g'), '(^-|-$)', '', 'g'))
      ORDER BY created_at
    ) AS rn
  FROM public.events
  WHERE slug IS NULL
)
UPDATE public.events e
SET slug = CASE
  WHEN s.base_slug = '' THEN substr(e.id::text, 1, 8)
  WHEN s.rn = 1 THEN s.base_slug
  ELSE s.base_slug || '-' || s.rn::text
END
FROM new_slugs s
WHERE e.id = s.id;

-- 2. Backfill organizer_profiles for every user with the 'organizer' role
WITH org_slugs AS (
  SELECT
    up.id,
    up.full_name,
    lower(regexp_replace(regexp_replace(unaccent(up.full_name), '[^a-zA-Z0-9]+', '-', 'g'), '(^-|-$)', '', 'g')) AS base_slug,
    ROW_NUMBER() OVER (
      PARTITION BY lower(regexp_replace(regexp_replace(unaccent(up.full_name), '[^a-zA-Z0-9]+', '-', 'g'), '(^-|-$)', '', 'g'))
      ORDER BY up.created_at
    ) AS rn
  FROM public.user_profiles up
  WHERE 'organizer'::public.user_role = ANY(up.roles)
    AND NOT EXISTS (SELECT 1 FROM public.organizer_profiles op WHERE op.id = up.id)
)
INSERT INTO public.organizer_profiles (id, slug, display_name)
SELECT
  s.id,
  CASE
    WHEN s.base_slug = '' THEN substr(s.id::text, 1, 8)
    WHEN s.rn = 1 THEN s.base_slug
    ELSE s.base_slug || '-' || s.rn::text
  END,
  s.full_name
FROM org_slugs s
ON CONFLICT (id) DO NOTHING;

-- 3. Sanity checks (read-only; re-run after the lockdown)
-- SELECT count(*) FILTER (WHERE slug IS NULL) AS events_without_slug FROM public.events;
-- SELECT count(*) AS organizers_without_profile
-- FROM public.user_profiles up
-- WHERE 'organizer'::public.user_role = ANY(up.roles)
--   AND NOT EXISTS (SELECT 1 FROM public.organizer_profiles op WHERE op.id = up.id);
