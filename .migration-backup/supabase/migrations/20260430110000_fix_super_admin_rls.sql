-- ============================================
-- FIX: Ensure super_admin RLS policies and helper functions are correct
-- Problem: super_admin cannot see lectures/events/speakers in dashboard
-- Root cause: migrations were repaired (marked applied) but some policies
--   may not exist in the remote database
-- Solution: Idempotently recreate all super_admin infrastructure
-- ============================================

-- 1. Ensure is_super_admin() uses the roles array (not old role TEXT column)
CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_profiles
    WHERE id = auth.uid() AND 'super_admin'::public.user_role = ANY(roles)
  );
$$;

-- 2. Ensure has_role() helper exists
CREATE OR REPLACE FUNCTION public.has_role(check_role public.user_role)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_profiles
    WHERE id = auth.uid() AND check_role = ANY(roles)
  );
$$;

-- 3. Ensure get_user_role() returns array
CREATE OR REPLACE FUNCTION public.get_user_role()
RETURNS public.user_role[]
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = ''
AS $$
  SELECT roles FROM public.user_profiles
  WHERE id = auth.uid();
$$;

-- ============================================
-- 4. Recreate super_admin policies (DROP IF EXISTS + CREATE)
-- ============================================

-- Events
DROP POLICY IF EXISTS "super_admin_manage_events" ON public.events;
CREATE POLICY "super_admin_manage_events"
  ON public.events FOR ALL
  USING (public.is_super_admin())
  WITH CHECK (public.is_super_admin());

-- Lectures
DROP POLICY IF EXISTS "super_admin_manage_lectures" ON public.lectures;
CREATE POLICY "super_admin_manage_lectures"
  ON public.lectures FOR ALL
  USING (public.is_super_admin())
  WITH CHECK (public.is_super_admin());

-- Speakers
DROP POLICY IF EXISTS "super_admin_manage_speakers_admin" ON public.speakers;
CREATE POLICY "super_admin_manage_speakers_admin"
  ON public.speakers FOR ALL
  USING (public.is_super_admin())
  WITH CHECK (public.is_super_admin());

-- User profiles (read all)
DROP POLICY IF EXISTS "super_admin_read_all_profiles" ON public.user_profiles;
CREATE POLICY "super_admin_read_all_profiles"
  ON public.user_profiles FOR SELECT
  USING (public.is_super_admin());

-- User profiles (update any)
DROP POLICY IF EXISTS "super_admin_update_profiles" ON public.user_profiles;
CREATE POLICY "super_admin_update_profiles"
  ON public.user_profiles FOR UPDATE
  USING (public.is_super_admin())
  WITH CHECK (public.is_super_admin());

-- Event participants
DROP POLICY IF EXISTS "super_admin_manage_participants" ON public.event_participants;
CREATE POLICY "super_admin_manage_participants"
  ON public.event_participants FOR ALL
  USING (public.is_super_admin())
  WITH CHECK (public.is_super_admin());

-- Lecture access
DROP POLICY IF EXISTS "super_admin_manage_lecture_access" ON public.lecture_access;
CREATE POLICY "super_admin_manage_lecture_access"
  ON public.lecture_access FOR ALL
  USING (public.is_super_admin())
  WITH CHECK (public.is_super_admin());

-- Lecture materials
DROP POLICY IF EXISTS "super_admin_manage_lecture_materials" ON public.lecture_materials;
CREATE POLICY "super_admin_manage_lecture_materials"
  ON public.lecture_materials FOR ALL
  USING (public.is_super_admin())
  WITH CHECK (public.is_super_admin());

-- Invitations
DROP POLICY IF EXISTS "super_admin_manage_invitations" ON public.invitations;
CREATE POLICY "super_admin_manage_invitations"
  ON public.invitations FOR ALL
  USING (public.is_super_admin())
  WITH CHECK (public.is_super_admin());
