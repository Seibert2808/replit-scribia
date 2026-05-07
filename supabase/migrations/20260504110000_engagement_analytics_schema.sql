-- ============================================
-- ScribIA: Engagement Analytics Schema
-- Epic 10 - Story 10.1: Schema de Engajamento & Analytics
-- ============================================
-- Creates:
--   1. engagement_events (event-sourcing of participant interactions)
--   2. lecture_leads VIEW (aggregated engagement scores)
--   3. speaker_files (uploads from speakers)
--   4. lecture_change_requests (title/description change requests)
--   5. highlight_quote column on lectures
--   6. RLS policies for all new objects
--   7. Trigger for auto-applying approved change requests
--   8. Storage bucket for speaker uploads
-- ============================================

-- ============================================
-- 1. ENGAGEMENT EVENTS (append-only event log)
-- ============================================

CREATE TABLE public.engagement_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lecture_id UUID NOT NULL REFERENCES public.lectures(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL CHECK (event_type IN (
    'audio_play',
    'audio_complete',
    'ebook_download',
    'playbook_download',
    'card_share',
    'page_view'
  )),
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_engagement_events_lecture_user
  ON public.engagement_events(lecture_id, user_id);

CREATE INDEX idx_engagement_events_lecture_type
  ON public.engagement_events(lecture_id, event_type);

CREATE INDEX idx_engagement_events_created_at
  ON public.engagement_events(created_at);

ALTER TABLE public.engagement_events ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 2. LECTURE LEADS VIEW (aggregated engagement)
-- ============================================

CREATE OR REPLACE VIEW public.lecture_leads AS
SELECT
  la.lecture_id,
  la.user_id,
  up.full_name,
  up.email,
  up.avatar_url,
  -- Engagement flags
  EXISTS(
    SELECT 1 FROM public.engagement_events ee
    WHERE ee.lecture_id = la.lecture_id
      AND ee.user_id = la.user_id
      AND ee.event_type = 'audio_complete'
  ) AS audio_completed,
  COALESCE(
    (SELECT MAX((sub.metadata->>'progress_percent')::int)
     FROM public.engagement_events sub
     WHERE sub.lecture_id = la.lecture_id
       AND sub.user_id = la.user_id
       AND sub.event_type = 'audio_play'
       AND sub.metadata->>'progress_percent' IS NOT NULL
    ), 0
  ) AS audio_max_progress,
  EXISTS(
    SELECT 1 FROM public.engagement_events ee
    WHERE ee.lecture_id = la.lecture_id
      AND ee.user_id = la.user_id
      AND ee.event_type = 'ebook_download'
  ) AS ebook_downloaded,
  EXISTS(
    SELECT 1 FROM public.engagement_events ee
    WHERE ee.lecture_id = la.lecture_id
      AND ee.user_id = la.user_id
      AND ee.event_type = 'playbook_download'
  ) AS playbook_downloaded,
  EXISTS(
    SELECT 1 FROM public.engagement_events ee
    WHERE ee.lecture_id = la.lecture_id
      AND ee.user_id = la.user_id
      AND ee.event_type = 'card_share'
  ) AS card_shared,
  -- Engagement score (0-100)
  (
    -- Audio: complete = 35pts, partial = proportional up to 30pts
    CASE WHEN EXISTS(
      SELECT 1 FROM public.engagement_events ee
      WHERE ee.lecture_id = la.lecture_id
        AND ee.user_id = la.user_id
        AND ee.event_type = 'audio_complete'
    ) THEN 35
    ELSE LEAST(30, COALESCE(
      (SELECT MAX((sub.metadata->>'progress_percent')::int)
       FROM public.engagement_events sub
       WHERE sub.lecture_id = la.lecture_id
         AND sub.user_id = la.user_id
         AND sub.event_type = 'audio_play'
         AND sub.metadata->>'progress_percent' IS NOT NULL
      ), 0
    ) * 30 / 100)
    END
    -- Ebook download = 30pts
    + CASE WHEN EXISTS(
        SELECT 1 FROM public.engagement_events ee
        WHERE ee.lecture_id = la.lecture_id
          AND ee.user_id = la.user_id
          AND ee.event_type = 'ebook_download'
      ) THEN 30 ELSE 0 END
    -- Playbook download = 15pts
    + CASE WHEN EXISTS(
        SELECT 1 FROM public.engagement_events ee
        WHERE ee.lecture_id = la.lecture_id
          AND ee.user_id = la.user_id
          AND ee.event_type = 'playbook_download'
      ) THEN 15 ELSE 0 END
    -- Card share = 20pts
    + CASE WHEN EXISTS(
        SELECT 1 FROM public.engagement_events ee
        WHERE ee.lecture_id = la.lecture_id
          AND ee.user_id = la.user_id
          AND ee.event_type = 'card_share'
      ) THEN 20 ELSE 0 END
  ) AS engagement_score,
  -- Lead temperature
  CASE
    WHEN (
      CASE WHEN EXISTS(
        SELECT 1 FROM public.engagement_events ee
        WHERE ee.lecture_id = la.lecture_id AND ee.user_id = la.user_id AND ee.event_type = 'audio_complete'
      ) THEN 35 ELSE LEAST(30, COALESCE(
        (SELECT MAX((sub.metadata->>'progress_percent')::int)
         FROM public.engagement_events sub
         WHERE sub.lecture_id = la.lecture_id AND sub.user_id = la.user_id
           AND sub.event_type = 'audio_play' AND sub.metadata->>'progress_percent' IS NOT NULL
        ), 0) * 30 / 100) END
      + CASE WHEN EXISTS(
          SELECT 1 FROM public.engagement_events ee
          WHERE ee.lecture_id = la.lecture_id AND ee.user_id = la.user_id AND ee.event_type = 'ebook_download'
        ) THEN 30 ELSE 0 END
      + CASE WHEN EXISTS(
          SELECT 1 FROM public.engagement_events ee
          WHERE ee.lecture_id = la.lecture_id AND ee.user_id = la.user_id AND ee.event_type = 'playbook_download'
        ) THEN 15 ELSE 0 END
      + CASE WHEN EXISTS(
          SELECT 1 FROM public.engagement_events ee
          WHERE ee.lecture_id = la.lecture_id AND ee.user_id = la.user_id AND ee.event_type = 'card_share'
        ) THEN 20 ELSE 0 END
    ) >= 70 THEN 'hot'
    WHEN (
      CASE WHEN EXISTS(
        SELECT 1 FROM public.engagement_events ee
        WHERE ee.lecture_id = la.lecture_id AND ee.user_id = la.user_id AND ee.event_type = 'audio_complete'
      ) THEN 35 ELSE LEAST(30, COALESCE(
        (SELECT MAX((sub.metadata->>'progress_percent')::int)
         FROM public.engagement_events sub
         WHERE sub.lecture_id = la.lecture_id AND sub.user_id = la.user_id
           AND sub.event_type = 'audio_play' AND sub.metadata->>'progress_percent' IS NOT NULL
        ), 0) * 30 / 100) END
      + CASE WHEN EXISTS(
          SELECT 1 FROM public.engagement_events ee
          WHERE ee.lecture_id = la.lecture_id AND ee.user_id = la.user_id AND ee.event_type = 'ebook_download'
        ) THEN 30 ELSE 0 END
      + CASE WHEN EXISTS(
          SELECT 1 FROM public.engagement_events ee
          WHERE ee.lecture_id = la.lecture_id AND ee.user_id = la.user_id AND ee.event_type = 'playbook_download'
        ) THEN 15 ELSE 0 END
      + CASE WHEN EXISTS(
          SELECT 1 FROM public.engagement_events ee
          WHERE ee.lecture_id = la.lecture_id AND ee.user_id = la.user_id AND ee.event_type = 'card_share'
        ) THEN 20 ELSE 0 END
    ) >= 30 THEN 'warm'
    ELSE 'cold'
  END AS lead_temperature,
  -- Interaction timestamps
  (SELECT MIN(ee.created_at) FROM public.engagement_events ee
   WHERE ee.lecture_id = la.lecture_id AND ee.user_id = la.user_id
  ) AS first_interaction_at,
  (SELECT MAX(ee.created_at) FROM public.engagement_events ee
   WHERE ee.lecture_id = la.lecture_id AND ee.user_id = la.user_id
  ) AS last_interaction_at
FROM public.lecture_access la
JOIN public.user_profiles up ON up.id = la.user_id;

-- ============================================
-- 3. SPEAKER FILES (uploads by speakers)
-- ============================================

CREATE TABLE public.speaker_files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lecture_id UUID NOT NULL REFERENCES public.lectures(id) ON DELETE CASCADE,
  speaker_id UUID NOT NULL REFERENCES public.speakers(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_type TEXT NOT NULL CHECK (file_type IN (
    'slides',
    'complementary',
    'bibliography',
    'other'
  )),
  file_size_bytes BIGINT,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_speaker_files_lecture_speaker
  ON public.speaker_files(lecture_id, speaker_id);

ALTER TABLE public.speaker_files ENABLE ROW LEVEL SECURITY;

-- Constraint: max 10 files per lecture
CREATE OR REPLACE FUNCTION public.check_speaker_files_limit()
RETURNS TRIGGER AS $$
BEGIN
  IF (SELECT COUNT(*) FROM public.speaker_files WHERE lecture_id = NEW.lecture_id) >= 10 THEN
    RAISE EXCEPTION 'Maximum of 10 files per lecture reached';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER enforce_speaker_files_limit
  BEFORE INSERT ON public.speaker_files
  FOR EACH ROW EXECUTE FUNCTION public.check_speaker_files_limit();

-- ============================================
-- 4. LECTURE CHANGE REQUESTS
-- ============================================

CREATE TABLE public.lecture_change_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lecture_id UUID NOT NULL REFERENCES public.lectures(id) ON DELETE CASCADE,
  speaker_id UUID NOT NULL REFERENCES public.speakers(id) ON DELETE CASCADE,
  request_type TEXT NOT NULL CHECK (request_type IN ('title_change', 'description_change')),
  current_value TEXT NOT NULL,
  requested_value TEXT NOT NULL,
  reason TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  organizer_response TEXT,
  responded_by UUID REFERENCES public.user_profiles(id),
  responded_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_change_requests_lecture
  ON public.lecture_change_requests(lecture_id);

CREATE INDEX idx_change_requests_status
  ON public.lecture_change_requests(status) WHERE status = 'pending';

ALTER TABLE public.lecture_change_requests ENABLE ROW LEVEL SECURITY;

-- Constraint: only 1 pending request per lecture + type
CREATE UNIQUE INDEX idx_unique_pending_request
  ON public.lecture_change_requests(lecture_id, request_type)
  WHERE status = 'pending';

-- ============================================
-- 5. HIGHLIGHT QUOTE on lectures
-- ============================================

ALTER TABLE public.lectures
  ADD COLUMN IF NOT EXISTS highlight_quote VARCHAR(280),
  ADD COLUMN IF NOT EXISTS highlight_quote_updated_at TIMESTAMPTZ;

-- ============================================
-- 6. TRIGGER: Auto-apply approved change requests
-- ============================================

CREATE OR REPLACE FUNCTION public.apply_approved_change_request()
RETURNS TRIGGER AS $$
BEGIN
  -- Only fire when status changes to 'approved'
  IF NEW.status = 'approved' AND (OLD.status IS DISTINCT FROM 'approved') THEN
    -- Set response metadata
    NEW.responded_at := now();
    NEW.responded_by := auth.uid();

    -- Apply the change to lectures
    IF NEW.request_type = 'title_change' THEN
      UPDATE public.lectures SET title = NEW.requested_value WHERE id = NEW.lecture_id;
    ELSIF NEW.request_type = 'description_change' THEN
      UPDATE public.lectures SET description = NEW.requested_value WHERE id = NEW.lecture_id;
    END IF;
  END IF;

  -- Set response metadata on rejection too
  IF NEW.status = 'rejected' AND (OLD.status IS DISTINCT FROM 'rejected') THEN
    NEW.responded_at := now();
    NEW.responded_by := auth.uid();
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_change_request_status_update
  BEFORE UPDATE ON public.lecture_change_requests
  FOR EACH ROW
  WHEN (OLD.status IS DISTINCT FROM NEW.status)
  EXECUTE FUNCTION public.apply_approved_change_request();

-- ============================================
-- 7. RLS POLICIES
-- ============================================

-- ---- engagement_events ----

-- INSERT: service_role only (via Edge Functions / API)
-- No INSERT policy for authenticated = only service_role can insert

-- SELECT: speaker of lecture OR organizer of event OR super_admin
CREATE POLICY "engagement_events_select_speaker"
  ON public.engagement_events FOR SELECT TO authenticated
  USING (public.is_lecture_speaker(lecture_id));

CREATE POLICY "engagement_events_select_organizer"
  ON public.engagement_events FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.lectures l
      WHERE l.id = lecture_id
        AND public.is_event_organizer(l.event_id)
    )
  );

CREATE POLICY "engagement_events_select_super_admin"
  ON public.engagement_events FOR SELECT TO authenticated
  USING (public.is_super_admin());

-- service_role can do everything (for Edge Functions to insert)
CREATE POLICY "engagement_events_service_role"
  ON public.engagement_events FOR ALL TO service_role
  USING (true)
  WITH CHECK (true);

-- ---- speaker_files ----

-- Speaker can manage their own files
CREATE POLICY "speaker_files_speaker_manage"
  ON public.speaker_files FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.speakers s
      WHERE s.id = speaker_id AND s.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.speakers s
      WHERE s.id = speaker_id AND s.user_id = auth.uid()
    )
  );

-- Organizer can read files for their events
CREATE POLICY "speaker_files_organizer_read"
  ON public.speaker_files FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.lectures l
      WHERE l.id = lecture_id
        AND public.is_event_organizer(l.event_id)
    )
  );

-- Super admin can read all
CREATE POLICY "speaker_files_super_admin"
  ON public.speaker_files FOR SELECT TO authenticated
  USING (public.is_super_admin());

-- ---- lecture_change_requests ----

-- Speaker can create requests for their own lectures
CREATE POLICY "change_requests_speaker_insert"
  ON public.lecture_change_requests FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.speakers s
      WHERE s.id = speaker_id AND s.user_id = auth.uid()
    )
    AND public.is_lecture_speaker(lecture_id)
  );

-- Speaker can view their own requests
CREATE POLICY "change_requests_speaker_select"
  ON public.lecture_change_requests FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.speakers s
      WHERE s.id = speaker_id AND s.user_id = auth.uid()
    )
  );

-- Organizer can view and respond to requests for their events
CREATE POLICY "change_requests_organizer_select"
  ON public.lecture_change_requests FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.lectures l
      WHERE l.id = lecture_id
        AND public.is_event_organizer(l.event_id)
    )
  );

CREATE POLICY "change_requests_organizer_update"
  ON public.lecture_change_requests FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.lectures l
      WHERE l.id = lecture_id
        AND public.is_event_organizer(l.event_id)
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.lectures l
      WHERE l.id = lecture_id
        AND public.is_event_organizer(l.event_id)
    )
  );

-- Super admin can manage all requests
CREATE POLICY "change_requests_super_admin"
  ON public.lecture_change_requests FOR ALL TO authenticated
  USING (public.is_super_admin())
  WITH CHECK (public.is_super_admin());

-- ---- lectures: highlight_quote update by speaker ----
-- Speaker can update highlight_quote on their assigned lectures
-- (Existing policies already allow organizer and super_admin to update lectures)

DROP POLICY IF EXISTS "lectures_speaker_update_highlight" ON public.lectures;
CREATE POLICY "lectures_speaker_update_highlight"
  ON public.lectures FOR UPDATE TO authenticated
  USING (public.is_lecture_speaker(id))
  WITH CHECK (public.is_lecture_speaker(id));

-- ============================================
-- 8. STORAGE BUCKET: speaker-uploads
-- ============================================

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'speaker-uploads',
  'speaker-uploads',
  false,
  104857600, -- 100MB
  ARRAY[
    'application/pdf',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'image/jpeg',
    'image/png',
    'application/zip'
  ]
)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for speaker-uploads bucket

-- Speakers can upload to their own lecture folders
CREATE POLICY "speaker_uploads_insert"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'speaker-uploads'
    AND public.is_speaker()
  );

-- Speakers can read their own uploads
CREATE POLICY "speaker_uploads_select"
  ON storage.objects FOR SELECT TO authenticated
  USING (
    bucket_id = 'speaker-uploads'
    AND (
      public.is_speaker()
      OR public.has_role('organizer'::public.user_role)
      OR public.is_super_admin()
    )
  );

-- Speakers can delete their own uploads
CREATE POLICY "speaker_uploads_delete"
  ON storage.objects FOR DELETE TO authenticated
  USING (
    bucket_id = 'speaker-uploads'
    AND public.is_speaker()
  );

-- Service role full access
CREATE POLICY "speaker_uploads_service_role"
  ON storage.objects FOR ALL TO service_role
  USING (bucket_id = 'speaker-uploads')
  WITH CHECK (bucket_id = 'speaker-uploads');

-- ============================================
-- 9. GRANTS
-- ============================================

GRANT SELECT ON public.engagement_events TO authenticated;
GRANT ALL ON public.engagement_events TO service_role;

GRANT ALL ON public.speaker_files TO authenticated;
GRANT ALL ON public.speaker_files TO service_role;

GRANT ALL ON public.lecture_change_requests TO authenticated;
GRANT ALL ON public.lecture_change_requests TO service_role;

GRANT SELECT ON public.lecture_leads TO authenticated;
GRANT SELECT ON public.lecture_leads TO service_role;
