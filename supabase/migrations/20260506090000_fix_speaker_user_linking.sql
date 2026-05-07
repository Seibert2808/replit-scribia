-- ============================================
-- Fix: Link existing speakers to user_profiles by email match
-- Fix: Ensure user_profiles.roles includes 'speaker' for linked speakers
-- Fix: Update handle_new_user trigger to handle speaker linking more robustly
-- ============================================

-- 1. Link existing speakers to user_profiles where emails match
-- Only updates speakers that have no user_id yet
UPDATE public.speakers s
SET user_id = up.id
FROM public.user_profiles up
WHERE s.email IS NOT NULL
  AND s.user_id IS NULL
  AND lower(s.email) = lower(up.email);

-- 2. Ensure user_profiles.roles includes 'speaker' for all linked speakers
UPDATE public.user_profiles up
SET roles = array_append(up.roles, 'speaker'::public.user_role)
FROM public.speakers s
WHERE s.user_id = up.id
  AND NOT ('speaker'::public.user_role = ANY(up.roles));

-- 3. Ensure user_profiles.roles includes 'participant' for all event_participants
UPDATE public.user_profiles up
SET roles = array_append(up.roles, 'participant'::public.user_role)
FROM public.event_participants ep
WHERE ep.user_id = up.id
  AND NOT ('participant'::public.user_role = ANY(up.roles));

-- 4. Update handle_new_user trigger to also link speakers by email
-- (fallback when speaker_id is not in the invitation)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  _role public.user_role := 'participant';
  _invitation RECORD;
BEGIN
  -- Check if user was invited
  SELECT INTO _invitation id, role, event_id, speaker_id
  FROM public.invitations
  WHERE email = NEW.email
    AND status = 'pending'
    AND expires_at > now()
  ORDER BY created_at DESC
  LIMIT 1;

  IF FOUND THEN
    _role := _invitation.role::public.user_role;

    UPDATE public.invitations
    SET status = 'accepted', accepted_at = now()
    WHERE id = _invitation.id;
  END IF;

  -- Allow role override from auth metadata
  IF NEW.raw_user_meta_data->>'role' IS NOT NULL THEN
    BEGIN
      _role := (NEW.raw_user_meta_data->>'role')::public.user_role;
    EXCEPTION WHEN invalid_text_representation THEN
      _role := 'participant';
    END;
  END IF;

  -- Safety: never auto-assign super_admin
  IF _role = 'super_admin' THEN
    _role := 'participant';
  END IF;

  INSERT INTO public.user_profiles (id, email, full_name, roles)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    ARRAY[_role]
  );

  -- If participant invited to specific event, auto-register
  IF _invitation.event_id IS NOT NULL AND (_role = 'participant' OR _role = 'speaker') THEN
    INSERT INTO public.event_participants (event_id, user_id)
    VALUES (_invitation.event_id, NEW.id)
    ON CONFLICT DO NOTHING;
  END IF;

  -- If speaker invited, link the speaker record to the new user account
  IF _role = 'speaker' THEN
    -- Try by speaker_id from invitation first
    IF _invitation.speaker_id IS NOT NULL THEN
      UPDATE public.speakers
      SET user_id = NEW.id
      WHERE id = _invitation.speaker_id AND user_id IS NULL;
    END IF;

    -- Fallback: link any unlinked speaker with matching email
    UPDATE public.speakers
    SET user_id = NEW.id
    WHERE email = NEW.email AND user_id IS NULL;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Also mark accepted invitations for speakers that already have users
-- (clean up orphaned pending invitations)
UPDATE public.invitations i
SET status = 'accepted', accepted_at = now()
FROM public.speakers s
JOIN public.user_profiles up ON up.id = s.user_id
WHERE i.speaker_id = s.id
  AND i.status = 'pending'
  AND s.user_id IS NOT NULL;
