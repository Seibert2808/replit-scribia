-- Fix: Organizers cannot upload branding (logo) to materials bucket
-- Problem: Only service_role has INSERT on materials bucket,
--   but event-header.tsx uploads logo via client-side supabase (authenticated user)
-- Solution: Add INSERT + UPDATE policies for organizers on branding paths

-- 1. Allow organizers to INSERT branding assets (logo)
CREATE POLICY "organizers_upload_branding"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'materials' AND
    (storage.foldername(name))[2] = 'branding' AND
    EXISTS (
      SELECT 1 FROM public.events e
      WHERE e.organizer_id = auth.uid()
        AND e.id::text = (storage.foldername(name))[1]
    )
  );

-- 2. Allow organizers to UPDATE (upsert) branding assets
CREATE POLICY "organizers_update_branding"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'materials' AND
    (storage.foldername(name))[2] = 'branding' AND
    EXISTS (
      SELECT 1 FROM public.events e
      WHERE e.organizer_id = auth.uid()
        AND e.id::text = (storage.foldername(name))[1]
    )
  )
  WITH CHECK (
    bucket_id = 'materials' AND
    (storage.foldername(name))[2] = 'branding' AND
    EXISTS (
      SELECT 1 FROM public.events e
      WHERE e.organizer_id = auth.uid()
        AND e.id::text = (storage.foldername(name))[1]
    )
  );

-- 3. Allow organizers to DELETE branding assets (remove logo)
CREATE POLICY "organizers_delete_branding"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'materials' AND
    (storage.foldername(name))[2] = 'branding' AND
    EXISTS (
      SELECT 1 FROM public.events e
      WHERE e.organizer_id = auth.uid()
        AND e.id::text = (storage.foldername(name))[1]
    )
  );
