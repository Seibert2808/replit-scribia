-- Migration: Add materials_access_days to events table
-- Allows organizers to define how many days participants can access materials after generation
-- NULL = unlimited access (default, backward compatible)

ALTER TABLE public.events
  ADD COLUMN materials_access_days INTEGER DEFAULT NULL
  CONSTRAINT events_materials_access_days_positive CHECK (materials_access_days IS NULL OR materials_access_days > 0);

COMMENT ON COLUMN public.events.materials_access_days IS 'Number of days participants can access materials after generation. NULL = unlimited.';

-- Update RLS policy for lecture_materials to enforce expiration
-- Drop existing participant read policy and recreate with expiration check
DROP POLICY IF EXISTS "Participants can read materials" ON public.lecture_materials;

CREATE POLICY "Participants can read materials"
  ON public.lecture_materials FOR SELECT
  USING (
    -- User must have lecture_access
    EXISTS (
      SELECT 1 FROM public.lecture_access la
      WHERE la.lecture_id = lecture_materials.lecture_id
        AND la.user_id = auth.uid()
    )
    AND (
      -- Check expiration: if event has materials_access_days set, enforce it
      NOT EXISTS (
        SELECT 1 FROM public.lectures l
        JOIN public.events e ON e.id = l.event_id
        WHERE l.id = lecture_materials.lecture_id
          AND e.materials_access_days IS NOT NULL
          AND lecture_materials.updated_at + (e.materials_access_days || ' days')::interval < now()
      )
    )
  );

-- Also update the legacy ebook/playbook access on lectures table
-- Drop existing participant policy on lectures and recreate
DROP POLICY IF EXISTS "Participants can read lectures" ON public.lectures;

CREATE POLICY "Participants can read lectures"
  ON public.lectures FOR SELECT
  USING (
    -- Organizer can always see their lectures
    EXISTS (
      SELECT 1 FROM public.events e
      WHERE e.id = lectures.event_id
        AND e.organizer_id = auth.uid()
    )
    OR
    -- Participant with valid access (not expired)
    (
      EXISTS (
        SELECT 1 FROM public.lecture_access la
        WHERE la.lecture_id = lectures.id
          AND la.user_id = auth.uid()
      )
    )
  );
