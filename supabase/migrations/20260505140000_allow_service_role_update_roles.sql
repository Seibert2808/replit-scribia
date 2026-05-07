-- Allow service_role (used by Edge Functions and admin API) to update user roles
-- The prevent_role_self_elevation trigger blocks role changes unless is_super_admin()
-- returns true. But service_role has no auth.uid(), so it always fails.
-- Fix: skip the check when there is no authenticated user (service_role context).

CREATE OR REPLACE FUNCTION public.prevent_role_self_elevation()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.roles IS DISTINCT FROM NEW.roles THEN
    -- Allow service_role operations (no auth.uid() means server-side admin call)
    IF auth.uid() IS NULL THEN
      -- Still block super_admin promotion from service_role unless already super_admin
      IF 'super_admin'::public.user_role = ANY(NEW.roles)
         AND NOT ('super_admin'::public.user_role = ANY(OLD.roles)) THEN
        RAISE EXCEPTION 'Cannot promote to super_admin via service role';
      END IF;
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
