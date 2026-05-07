-- ============================================
-- FIX: Ensure ALL base RLS policies exist
-- Problem: migrations were repaired (marked applied) without executing,
--   so fundamental policies like "users read own profile" may be missing
-- Solution: Idempotently recreate all essential base policies
-- ============================================

-- ============================================
-- 1. USER PROFILES - base policies
-- ============================================
DROP POLICY IF EXISTS "users_read_own_profile" ON public.user_profiles;
CREATE POLICY "users_read_own_profile"
  ON public.user_profiles FOR SELECT
  USING (auth.uid() = id);

DROP POLICY IF EXISTS "users_update_own_profile" ON public.user_profiles;
CREATE POLICY "users_update_own_profile"
  ON public.user_profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Organizers can read profiles of their event participants
DROP POLICY IF EXISTS "organizers_read_event_participants" ON public.user_profiles;
CREATE POLICY "organizers_read_event_participants"
  ON public.user_profiles FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.event_participants ep
      JOIN public.events e ON e.id = ep.event_id
      WHERE ep.user_id = user_profiles.id
        AND e.organizer_id = auth.uid()
    )
  );

-- ============================================
-- 2. EVENTS - base policies
-- ============================================

-- Organizers manage their own events
DROP POLICY IF EXISTS "organizers_manage_own_events" ON public.events;
CREATE POLICY "organizers_manage_own_events"
  ON public.events FOR ALL
  USING (organizer_id = auth.uid())
  WITH CHECK (organizer_id = auth.uid());

-- Participants view active events they joined
DROP POLICY IF EXISTS "participants_view_joined_active_events" ON public.events;
CREATE POLICY "participants_view_joined_active_events"
  ON public.events FOR SELECT
  USING (status = 'active' AND public.is_event_participant(id));

-- ============================================
-- 3. LECTURES - base policies
-- ============================================

-- Organizers manage lectures of their events
DROP POLICY IF EXISTS "organizers_manage_lectures_by_event" ON public.lectures;
CREATE POLICY "organizers_manage_lectures_by_event"
  ON public.lectures FOR ALL
  USING (public.is_event_organizer(event_id))
  WITH CHECK (public.is_event_organizer(event_id));

-- Participants view accessible lectures
DROP POLICY IF EXISTS "participants_view_accessible_lectures" ON public.lectures;
CREATE POLICY "participants_view_accessible_lectures"
  ON public.lectures FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.lecture_access la
      WHERE la.lecture_id = lectures.id
        AND la.user_id = auth.uid()
    )
  );

-- ============================================
-- 4. EVENT PARTICIPANTS - base policies
-- ============================================

DROP POLICY IF EXISTS "organizers_manage_participants_by_event" ON public.event_participants;
CREATE POLICY "organizers_manage_participants_by_event"
  ON public.event_participants FOR ALL
  USING (public.is_event_organizer(event_id))
  WITH CHECK (public.is_event_organizer(event_id));

-- Participants read own participation
DROP POLICY IF EXISTS "participants_read_own" ON public.event_participants;
CREATE POLICY "participants_read_own"
  ON public.event_participants FOR SELECT
  USING (user_id = auth.uid());

-- ============================================
-- 5. LECTURE ACCESS - base policies
-- ============================================

DROP POLICY IF EXISTS "organizers_manage_access_by_event" ON public.lecture_access;
CREATE POLICY "organizers_manage_access_by_event"
  ON public.lecture_access FOR ALL
  USING (public.is_lecture_organizer(lecture_id))
  WITH CHECK (public.is_lecture_organizer(lecture_id));

-- Users read own access
DROP POLICY IF EXISTS "users_read_own_access" ON public.lecture_access;
CREATE POLICY "users_read_own_access"
  ON public.lecture_access FOR SELECT
  USING (user_id = auth.uid());

-- Users update own access (download count, accessed_at)
DROP POLICY IF EXISTS "users_update_own_access" ON public.lecture_access;
CREATE POLICY "users_update_own_access"
  ON public.lecture_access FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- ============================================
-- 6. SPEAKERS - base policies
-- ============================================

DROP POLICY IF EXISTS "organizers_manage_speakers" ON public.speakers;
CREATE POLICY "organizers_manage_speakers"
  ON public.speakers FOR ALL
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);

-- ============================================
-- 7. LECTURE MATERIALS - base policies
-- ============================================

-- Participants can read completed materials (with expiration check)
DROP POLICY IF EXISTS "Participants can read materials" ON public.lecture_materials;
DROP POLICY IF EXISTS "participants_read_materials" ON public.lecture_materials;
CREATE POLICY "participants_read_materials"
  ON public.lecture_materials FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.lecture_access la
      WHERE la.lecture_id = lecture_materials.lecture_id
        AND la.user_id = auth.uid()
    )
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

-- ============================================
-- 8. HELPER FUNCTIONS (ensure they exist)
-- ============================================

CREATE OR REPLACE FUNCTION public.is_event_organizer(event_uuid UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.events
    WHERE id = event_uuid AND organizer_id = auth.uid()
  );
$$;

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

CREATE OR REPLACE FUNCTION public.is_lecture_organizer(lec_uuid UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.lectures l
    JOIN public.events e ON e.id = l.event_id
    WHERE l.id = lec_uuid AND e.organizer_id = auth.uid()
  );
$$;
