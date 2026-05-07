-- Allow super_admin promotion via service_role (Supabase Dashboard / admin API)
-- Previously blocked by prevent_role_self_elevation() which raised an exception
-- when service_role tried to set super_admin. This is safe because service_role
-- already requires direct database/dashboard access.

CREATE OR REPLACE FUNCTION public.prevent_role_self_elevation()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.roles IS DISTINCT FROM NEW.roles THEN
    -- Allow service_role operations (no auth.uid() means server-side admin call)
    -- This includes Supabase Dashboard, Edge Functions with service_role key
    IF auth.uid() IS NULL THEN
      RETURN NEW;
    END IF;

    IF NOT public.is_super_admin() THEN
      RAISE EXCEPTION 'Only super_admin can change user roles';
    END IF;
    -- Cannot add super_admin role unless you are super_admin
    IF 'super_admin'::public.user_role = ANY(NEW.roles)
       AND NOT ('super_admin'::public.user_role = ANY(OLD.roles)) THEN
      IF NOT public.is_super_admin() THEN
        RAISE EXCEPTION 'Cannot promote to super_admin';
      END IF;
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
