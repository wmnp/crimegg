
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS is_admin boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS banned boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS soft_banned boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS ban_reason text;

-- Grant admin via password (called from client; password checked server-side)
CREATE OR REPLACE FUNCTION public.grant_admin(_handle text, _password text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  ok boolean := false;
BEGIN
  IF _password <> 'CRIMEGG1238*' THEN
    RETURN false;
  END IF;
  UPDATE public.profiles SET is_admin = true
   WHERE handle = lower(_handle)
   RETURNING true INTO ok;
  RETURN COALESCE(ok, false);
END $$;

REVOKE ALL ON FUNCTION public.grant_admin(text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.grant_admin(text, text) TO anon, authenticated;

-- Helper to check current user is admin
CREATE OR REPLACE FUNCTION public.current_user_is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE((SELECT is_admin FROM public.profiles WHERE id = auth.uid()), false);
$$;
GRANT EXECUTE ON FUNCTION public.current_user_is_admin() TO authenticated;

-- Admin: set UID
CREATE OR REPLACE FUNCTION public.admin_set_uid(_handle text, _uid integer)
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.current_user_is_admin() THEN RAISE EXCEPTION 'forbidden'; END IF;
  UPDATE public.profiles SET uid = _uid WHERE handle = lower(_handle);
  RETURN FOUND;
END $$;
GRANT EXECUTE ON FUNCTION public.admin_set_uid(text, integer) TO authenticated;

-- Admin: ban/unban (hard ban = blocks login via flag, soft = profile hidden)
CREATE OR REPLACE FUNCTION public.admin_set_ban(_handle text, _hard boolean, _soft boolean, _reason text)
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.current_user_is_admin() THEN RAISE EXCEPTION 'forbidden'; END IF;
  UPDATE public.profiles SET banned = _hard, soft_banned = _soft, ban_reason = _reason
    WHERE handle = lower(_handle);
  RETURN FOUND;
END $$;
GRANT EXECUTE ON FUNCTION public.admin_set_ban(text, boolean, boolean, text) TO authenticated;

-- Admin: change handle
CREATE OR REPLACE FUNCTION public.admin_change_handle(_old text, _new text)
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE clean text := lower(regexp_replace(_new, '[^a-z0-9_]', '', 'g'));
BEGIN
  IF NOT public.current_user_is_admin() THEN RAISE EXCEPTION 'forbidden'; END IF;
  IF length(clean) < 1 OR length(clean) > 24 THEN RAISE EXCEPTION 'invalid handle'; END IF;
  UPDATE public.profiles SET handle = clean WHERE handle = lower(_old);
  RETURN FOUND;
END $$;
GRANT EXECUTE ON FUNCTION public.admin_change_handle(text, text) TO authenticated;

-- Admin: reset views
CREATE OR REPLACE FUNCTION public.admin_set_views(_handle text, _views integer)
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.current_user_is_admin() THEN RAISE EXCEPTION 'forbidden'; END IF;
  UPDATE public.profiles SET views = GREATEST(_views, 0) WHERE handle = lower(_handle);
  RETURN FOUND;
END $$;
GRANT EXECUTE ON FUNCTION public.admin_set_views(text, integer) TO authenticated;

-- Admin: force-set badges (comma list)
CREATE OR REPLACE FUNCTION public.admin_set_badges(_handle text, _badges text[])
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.current_user_is_admin() THEN RAISE EXCEPTION 'forbidden'; END IF;
  UPDATE public.profiles SET badges = COALESCE(_badges, '{}') WHERE handle = lower(_handle);
  RETURN FOUND;
END $$;
GRANT EXECUTE ON FUNCTION public.admin_set_badges(text, text[]) TO authenticated;

-- Admin: toggle for_sale
CREATE OR REPLACE FUNCTION public.admin_set_sale(_handle text, _for_sale boolean, _price numeric)
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.current_user_is_admin() THEN RAISE EXCEPTION 'forbidden'; END IF;
  UPDATE public.profiles SET for_sale = _for_sale, sale_price = _price WHERE handle = lower(_handle);
  RETURN FOUND;
END $$;
GRANT EXECUTE ON FUNCTION public.admin_set_sale(text, boolean, numeric) TO authenticated;

-- Admin: wipe profile media (avatar, bg, music, css)
CREATE OR REPLACE FUNCTION public.admin_wipe_customization(_handle text)
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.current_user_is_admin() THEN RAISE EXCEPTION 'forbidden'; END IF;
  UPDATE public.profiles SET avatar_url = NULL, background_url = NULL, music_url = NULL,
    cursor_url = NULL, font_url = NULL, custom_css = NULL, animated_bg = 'none', emoji_rain = NULL
    WHERE handle = lower(_handle);
  RETURN FOUND;
END $$;
GRANT EXECUTE ON FUNCTION public.admin_wipe_customization(text) TO authenticated;

-- Admin: clear bio
CREATE OR REPLACE FUNCTION public.admin_clear_bio(_handle text)
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.current_user_is_admin() THEN RAISE EXCEPTION 'forbidden'; END IF;
  UPDATE public.profiles SET bio = NULL, display_name = NULL WHERE handle = lower(_handle);
  RETURN FOUND;
END $$;
GRANT EXECUTE ON FUNCTION public.admin_clear_bio(text) TO authenticated;

-- Admin: set plan
CREATE OR REPLACE FUNCTION public.admin_set_plan(_handle text, _plan text)
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.current_user_is_admin() THEN RAISE EXCEPTION 'forbidden'; END IF;
  UPDATE public.profiles SET plan = _plan WHERE handle = lower(_handle);
  RETURN FOUND;
END $$;
GRANT EXECUTE ON FUNCTION public.admin_set_plan(text, text) TO authenticated;

-- Admin: delete profile (cascade)
CREATE OR REPLACE FUNCTION public.admin_delete_profile(_handle text)
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _id uuid;
BEGIN
  IF NOT public.current_user_is_admin() THEN RAISE EXCEPTION 'forbidden'; END IF;
  SELECT id INTO _id FROM public.profiles WHERE handle = lower(_handle);
  IF _id IS NULL THEN RETURN false; END IF;
  DELETE FROM public.guestbook WHERE profile_id = _id;
  DELETE FROM public.followers WHERE follower_id = _id OR followed_id = _id;
  DELETE FROM public.links WHERE profile_id = _id;
  DELETE FROM public.profiles WHERE id = _id;
  RETURN true;
END $$;
GRANT EXECUTE ON FUNCTION public.admin_delete_profile(text) TO authenticated;

-- Admin: grant/revoke admin
CREATE OR REPLACE FUNCTION public.admin_set_admin(_handle text, _admin boolean)
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.current_user_is_admin() THEN RAISE EXCEPTION 'forbidden'; END IF;
  UPDATE public.profiles SET is_admin = _admin WHERE handle = lower(_handle);
  RETURN FOUND;
END $$;
GRANT EXECUTE ON FUNCTION public.admin_set_admin(text, boolean) TO authenticated;

-- Self-serve: user changes their OWN handle
CREATE OR REPLACE FUNCTION public.change_my_handle(_new text)
RETURNS text LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE clean text := lower(regexp_replace(_new, '[^a-z0-9_]', '', 'g'));
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'unauthenticated'; END IF;
  IF length(clean) < 1 OR length(clean) > 24 THEN RAISE EXCEPTION 'handle must be 1-24 chars (a-z, 0-9, _)'; END IF;
  IF EXISTS (SELECT 1 FROM public.profiles WHERE handle = clean AND id <> auth.uid()) THEN
    RAISE EXCEPTION 'handle taken';
  END IF;
  UPDATE public.profiles SET handle = clean WHERE id = auth.uid();
  RETURN clean;
END $$;
GRANT EXECUTE ON FUNCTION public.change_my_handle(text) TO authenticated;

-- Restrict view-booster to admins by re-creating add_profile_views with check
CREATE OR REPLACE FUNCTION public.add_profile_views(_handle text, _amount integer)
RETURNS integer LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  capped bigint := LEAST(GREATEST(_amount::bigint, 0::bigint), 100000000000::bigint);
  new_total integer;
BEGIN
  IF NOT public.current_user_is_admin() THEN RAISE EXCEPTION 'admin only'; END IF;
  UPDATE public.profiles SET views = views + capped
    WHERE handle = lower(_handle) RETURNING views INTO new_total;
  RETURN COALESCE(new_total, 0);
END $$;
