-- ============================================
-- FIX: RLS recursion — policies that reference other RLS-protected tables
-- Problem: Policy on `lectures` does EXISTS on `lecture_access` (also RLS-protected)
--   → sub-query blocked by RLS → user sees nothing
-- Solution: Use SECURITY DEFINER helper functions that bypass RLS for sub-queries
-- ============================================

-- 1. Helper: Does user have lecture_access for a given lecture?
CREATE OR REPLACE FUNCTION public.has_lecture_access(lec_uuid UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.lecture_access
    WHERE lecture_id = lec_uuid AND user_id = auth.uid()
  );
$$;

-- 2. Helper: Is user a participant of a given event?
-- (already exists but recreate to ensure it's SECURITY DEFINER)
CREATE OR REPLACE FUNCTION public.is_event_participant(event_uuid UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.event_participants
    WHERE event_id = event_uuid AND user_id = auth.uid()
  );
$$;

-- ============================================
-- 3. Fix lectures policies — use helper functions
-- ============================================

DROP POLICY IF EXISTS "participants_view_accessible_lectures" ON public.lectures;
CREATE POLICY "participants_view_accessible_lectures"
  ON public.lectures FOR SELECT
  USING (public.has_lecture_access(id));

-- Remove the duplicate policy we accidentally created
DROP POLICY IF EXISTS "Participants can read lectures" ON public.lectures;

-- ============================================
-- 4. Fix lecture_materials policy — use helper function
-- ============================================

DROP POLICY IF EXISTS "participants_read_materials" ON public.lecture_materials;
CREATE POLICY "participants_read_materials"
  ON public.lecture_materials FOR SELECT
  USING (
    public.has_lecture_access(lecture_id)
    AND (
      NOT EXISTS (
        SELECT 1 FROM public.lectures l
        JOIN public.events e ON e.id = l.event_id
        WHERE l.id = lecture_materials.lecture_id
          AND e.materials_access_days IS NOT NULL
          AND lecture_materials.updated_at + (e.materials_access_days || ' days')::interval < now()
      )
    )
  );

-- Also ensure the old authenticated_read_materials policy uses the function
DROP POLICY IF EXISTS "authenticated_read_materials" ON public.lecture_materials;

-- ============================================
-- 5. Fix event_participants policies — avoid recursion
-- ============================================

DROP POLICY IF EXISTS "participants_read_own" ON public.event_participants;
CREATE POLICY "participants_read_own"
  ON public.event_participants FOR SELECT
  USING (user_id = auth.uid());

-- ============================================
-- 6. Fix events policies — participants see their events
-- ============================================

DROP POLICY IF EXISTS "participants_view_joined_active_events" ON public.events;
CREATE POLICY "participants_view_joined_active_events"
  ON public.events FOR SELECT
  USING (public.is_event_participant(id));

-- ============================================
-- 7. Fix user_profiles — organizers read participant profiles
-- ============================================

DROP POLICY IF EXISTS "organizers_read_event_participants" ON public.user_profiles;
CREATE POLICY "organizers_read_event_participants"
  ON public.user_profiles FOR SELECT
  USING (
    public.is_super_admin()
    OR auth.uid() = id
    OR EXISTS (
      SELECT 1 FROM public.events e
      JOIN public.event_participants ep ON ep.event_id = e.id
      WHERE ep.user_id = user_profiles.id
        AND e.organizer_id = auth.uid()
    )
  );
