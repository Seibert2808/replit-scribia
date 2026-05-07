-- ============================================
-- ScribIA: Multi-Profile Livebook Schema
-- Story 9.1 — Schema Multi-Perfil de Livebooks
-- ============================================

-- 1. Profile type check constraint (more flexible than ENUM)
-- Values: junior_compact, junior_complete, pleno_compact, pleno_complete, senior_compact, senior_complete

-- 2. Table: lecture_materials
-- Stores individual generated materials (ebook/playbook) per profile per lecture
CREATE TABLE public.lecture_materials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lecture_id UUID NOT NULL REFERENCES public.lectures(id) ON DELETE CASCADE,
  profile_type TEXT NOT NULL CHECK (profile_type IN (
    'junior_compact', 'junior_complete',
    'pleno_compact', 'pleno_complete',
    'senior_compact', 'senior_complete'
  )),
  content_type TEXT NOT NULL CHECK (content_type IN ('ebook', 'playbook')),
  markdown_content TEXT,
  pdf_url TEXT,
  images JSONB DEFAULT '[]'::jsonb,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'generating', 'completed', 'failed')),
  word_count INTEGER,
  generation_metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT unique_lecture_profile_content UNIQUE (lecture_id, profile_type, content_type)
);

-- Indexes
CREATE INDEX idx_lecture_materials_lecture_id ON public.lecture_materials(lecture_id);
CREATE INDEX idx_lecture_materials_status ON public.lecture_materials(status);

-- 3. Table: generation_configs
-- Output configuration per lecture (1:1)
CREATE TABLE public.generation_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lecture_id UUID NOT NULL REFERENCES public.lectures(id) ON DELETE CASCADE,
  selected_profiles JSONB NOT NULL DEFAULT '["junior_complete", "pleno_complete"]'::jsonb,
  content_format TEXT NOT NULL DEFAULT 'developed' CHECK (content_format IN ('topics', 'developed')),
  include_glossary BOOLEAN NOT NULL DEFAULT true,
  include_timeline BOOLEAN NOT NULL DEFAULT true,
  include_quiz BOOLEAN NOT NULL DEFAULT false,
  include_connection_map BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT unique_generation_config_lecture UNIQUE (lecture_id)
);

CREATE INDEX idx_generation_configs_lecture_id ON public.generation_configs(lecture_id);

-- 4. Enrich speakers table with biography fields
ALTER TABLE public.speakers
  ADD COLUMN IF NOT EXISTS mini_bio VARCHAR(800),
  ADD COLUMN IF NOT EXISTS formation JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS expertise_tags TEXT[],
  ADD COLUMN IF NOT EXISTS featured_publications TEXT[],
  ADD COLUMN IF NOT EXISTS linkedin_url TEXT,
  ADD COLUMN IF NOT EXISTS lattes_url TEXT,
  ADD COLUMN IF NOT EXISTS orcid TEXT,
  ADD COLUMN IF NOT EXISTS profile_photo_url TEXT,
  ADD COLUMN IF NOT EXISTS pronouns VARCHAR(20);

-- 5. Mark legacy columns as deprecated (comment only, no removal)
COMMENT ON COLUMN public.lectures.ebook_content IS 'DEPRECATED: use lecture_materials table for multi-profile content';
COMMENT ON COLUMN public.lectures.playbook_content IS 'DEPRECATED: use lecture_materials table for multi-profile content';
COMMENT ON COLUMN public.lectures.ebook_url IS 'DEPRECATED: use lecture_materials.pdf_url';
COMMENT ON COLUMN public.lectures.playbook_url IS 'DEPRECATED: use lecture_materials.pdf_url';

-- 6. RLS for lecture_materials
ALTER TABLE public.lecture_materials ENABLE ROW LEVEL SECURITY;

-- Service role full access (edge functions write here)
GRANT SELECT, INSERT, UPDATE, DELETE ON public.lecture_materials TO service_role;
GRANT SELECT ON public.lecture_materials TO authenticated;

-- Authenticated users can read materials for lectures they have access to
CREATE POLICY "authenticated_read_materials"
  ON public.lecture_materials FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.lectures l
      JOIN public.events e ON l.event_id = e.id
      WHERE l.id = lecture_materials.lecture_id
      AND (
        e.organizer_id = auth.uid()
        OR EXISTS (
          SELECT 1 FROM public.speakers s
          WHERE s.id = l.speaker_id AND s.user_id = auth.uid()
        )
        OR EXISTS (
          SELECT 1 FROM public.lecture_access la
          WHERE la.lecture_id = l.id AND la.user_id = auth.uid()
        )
      )
    )
  );

-- Service role can do everything
CREATE POLICY "service_role_manage_materials"
  ON public.lecture_materials FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role')
  WITH CHECK (auth.jwt() ->> 'role' = 'service_role');

-- Super admin can manage all materials
CREATE POLICY "super_admin_manage_materials"
  ON public.lecture_materials FOR ALL
  USING (public.is_super_admin())
  WITH CHECK (public.is_super_admin());

-- 7. RLS for generation_configs
ALTER TABLE public.generation_configs ENABLE ROW LEVEL SECURITY;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.generation_configs TO service_role;
GRANT SELECT, INSERT, UPDATE ON public.generation_configs TO authenticated;

-- Organizer can manage configs for their events' lectures
CREATE POLICY "organizer_manage_configs"
  ON public.generation_configs FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.lectures l
      JOIN public.events e ON l.event_id = e.id
      WHERE l.id = generation_configs.lecture_id
      AND e.organizer_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.lectures l
      JOIN public.events e ON l.event_id = e.id
      WHERE l.id = generation_configs.lecture_id
      AND e.organizer_id = auth.uid()
    )
  );

-- Super admin can manage all configs
CREATE POLICY "super_admin_manage_configs"
  ON public.generation_configs FOR ALL
  USING (public.is_super_admin())
  WITH CHECK (public.is_super_admin());

-- Service role full access
CREATE POLICY "service_role_manage_configs"
  ON public.generation_configs FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role')
  WITH CHECK (auth.jwt() ->> 'role' = 'service_role');

-- 8. Updated_at triggers
CREATE TRIGGER set_updated_at_lecture_materials
  BEFORE UPDATE ON public.lecture_materials
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_updated_at_generation_configs
  BEFORE UPDATE ON public.generation_configs
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ============================================
-- ROLLBACK
-- ============================================
-- DROP TRIGGER IF EXISTS set_updated_at_generation_configs ON public.generation_configs;
-- DROP TRIGGER IF EXISTS set_updated_at_lecture_materials ON public.lecture_materials;
-- DROP TABLE IF EXISTS public.generation_configs;
-- DROP TABLE IF EXISTS public.lecture_materials;
-- ALTER TABLE public.speakers DROP COLUMN IF EXISTS mini_bio, DROP COLUMN IF EXISTS formation, DROP COLUMN IF EXISTS expertise_tags, DROP COLUMN IF EXISTS featured_publications, DROP COLUMN IF EXISTS linkedin_url, DROP COLUMN IF EXISTS lattes_url, DROP COLUMN IF EXISTS orcid, DROP COLUMN IF EXISTS profile_photo_url, DROP COLUMN IF EXISTS pronouns;
