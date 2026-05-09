-- ============================================
-- Official organizers (2026-05-08)
--
-- Adds:
--   1. organizer_profiles.is_official (BOOLEAN) — flagged in /organizadores
--   2. organizer_profiles.auth_user_id (UUID, nullable) — replaces the
--      "id IS user_profiles.id" coupling so we can have official "captive"
--      pages (e.g. Arca Hub RJ) that don't yet have a real Scribia user.
--   3. Backfills auth_user_id = id for existing rows.
--   4. Loosens id FK so seeded officials can use a fresh UUID.
--   5. RLS policy now matches on auth_user_id (or super_admin), keeping
--      legacy rows working because their auth_user_id == id after backfill.
--   6. Seeds Arca Hub RJ as an official organizer.
--
-- Idempotent.
-- ============================================

-- 1. is_official flag
ALTER TABLE public.organizer_profiles
  ADD COLUMN IF NOT EXISTS is_official BOOLEAN NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_organizer_profiles_is_official
  ON public.organizer_profiles(is_official)
  WHERE is_official = true;

-- 2. auth_user_id (nullable; legacy rows already have id == user_profiles.id)
ALTER TABLE public.organizer_profiles
  ADD COLUMN IF NOT EXISTS auth_user_id UUID
  REFERENCES public.user_profiles(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_organizer_profiles_auth_user_id
  ON public.organizer_profiles(auth_user_id);

-- 3. Backfill auth_user_id for legacy rows where id == user.id
UPDATE public.organizer_profiles op
SET auth_user_id = op.id
WHERE op.auth_user_id IS NULL
  AND EXISTS (SELECT 1 FROM public.user_profiles up WHERE up.id = op.id);

-- 4. Drop the old id->user_profiles FK so seeded officials can use a fresh UUID,
--    and add a default for new rows that aren't tied to a user yet.
ALTER TABLE public.organizer_profiles
  DROP CONSTRAINT IF EXISTS organizer_profiles_id_fkey;

ALTER TABLE public.organizer_profiles
  ALTER COLUMN id SET DEFAULT gen_random_uuid();

-- 5. RLS: own-profile management now matches auth_user_id (legacy rows still
--    work because auth_user_id == id after backfill).
DROP POLICY IF EXISTS "organizers_manage_own_profile" ON public.organizer_profiles;
CREATE POLICY "organizers_manage_own_profile"
  ON public.organizer_profiles FOR ALL
  USING (
    auth.uid() = auth_user_id
    OR EXISTS (
      SELECT 1 FROM public.user_profiles up
      WHERE up.id = auth.uid() AND 'super_admin'::public.user_role = ANY(up.roles)
    )
  )
  WITH CHECK (
    auth.uid() = auth_user_id
    OR EXISTS (
      SELECT 1 FROM public.user_profiles up
      WHERE up.id = auth.uid() AND 'super_admin'::public.user_role = ANY(up.roles)
    )
  );

-- 6. Seed: Arca Hub RJ — official, captive page, no user account yet.
INSERT INTO public.organizer_profiles
  (slug, display_name, description, brand_color, is_official)
VALUES (
  'arca-hub-rj',
  'Arca Hub RJ',
  'Hub de inovação no Rio de Janeiro. Parceiro oficial do Scribia em eventos, encontros e programas de aceleração.',
  '#6B4EFF',
  true
)
ON CONFLICT (slug) DO UPDATE SET
  is_official = EXCLUDED.is_official,
  display_name = EXCLUDED.display_name,
  description = COALESCE(public.organizer_profiles.description, EXCLUDED.description),
  brand_color = COALESCE(public.organizer_profiles.brand_color, EXCLUDED.brand_color);

-- ============================================
-- ROLLBACK
-- ============================================
-- DELETE FROM public.organizer_profiles WHERE slug = 'arca-hub-rj' AND auth_user_id IS NULL;
-- DROP POLICY IF EXISTS "organizers_manage_own_profile" ON public.organizer_profiles;
-- ALTER TABLE public.organizer_profiles ALTER COLUMN id DROP DEFAULT;
-- -- Re-add the id FK only if every row has id matching a user_profiles row:
-- -- ALTER TABLE public.organizer_profiles
-- --   ADD CONSTRAINT organizer_profiles_id_fkey FOREIGN KEY (id) REFERENCES public.user_profiles(id) ON DELETE CASCADE;
-- ALTER TABLE public.organizer_profiles DROP COLUMN IF EXISTS auth_user_id;
-- ALTER TABLE public.organizer_profiles DROP COLUMN IF EXISTS is_official;
