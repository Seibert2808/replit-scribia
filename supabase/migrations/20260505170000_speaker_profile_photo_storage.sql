-- Enable public access for speaker profile photos
-- Profile photos need to be publicly accessible for stories cards and shared materials
-- The speaker-uploads bucket is currently private; we make it public so getPublicUrl works

UPDATE storage.buckets
SET public = true
WHERE id = 'speaker-uploads';

-- Add UPDATE policy so speakers can upsert (replace) their profile photos
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE policyname = 'speaker_uploads_update'
    AND tablename = 'objects'
    AND schemaname = 'storage'
  ) THEN
    CREATE POLICY "speaker_uploads_update"
      ON storage.objects FOR UPDATE TO authenticated
      USING (
        bucket_id = 'speaker-uploads'
        AND public.is_speaker()
      )
      WITH CHECK (
        bucket_id = 'speaker-uploads'
        AND public.is_speaker()
      );
  END IF;
END $$;

-- Add webp to allowed mime types for profile photos
UPDATE storage.buckets
SET allowed_mime_types = ARRAY[
  'application/pdf',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'image/jpeg',
  'image/png',
  'image/webp',
  'application/zip'
]
WHERE id = 'speaker-uploads';
