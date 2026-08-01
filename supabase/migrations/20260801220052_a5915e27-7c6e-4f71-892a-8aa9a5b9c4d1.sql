CREATE OR REPLACE FUNCTION public.guard_profile_privileges()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF current_setting('role', true) = 'service_role' OR public.current_user_is_admin() THEN
    RETURN NEW;
  END IF;
  NEW.unlocked_badges := OLD.unlocked_badges;
  NEW.is_admin := OLD.is_admin;
  NEW.banned := OLD.banned;
  NEW.soft_banned := OLD.soft_banned;
  NEW.ban_reason := OLD.ban_reason;
  NEW.uid := OLD.uid;
  NEW.views := OLD.views;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS profiles_guard_privileges ON public.profiles;
CREATE TRIGGER profiles_guard_privileges
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.guard_profile_privileges();