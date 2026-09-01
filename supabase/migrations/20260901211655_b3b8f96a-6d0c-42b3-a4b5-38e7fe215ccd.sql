CREATE OR REPLACE FUNCTION public.admin_list_invites()
RETURNS TABLE (code text, uses_remaining integer, created_at timestamptz)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  IF NOT public.current_user_is_admin() THEN RAISE EXCEPTION 'forbidden'; END IF;
  RETURN QUERY SELECT i.code, i.uses_remaining, i.created_at
    FROM public.invite_codes i ORDER BY i.created_at DESC LIMIT 200;
END $$;

CREATE OR REPLACE FUNCTION public.admin_create_invite(_code text DEFAULT NULL, _uses integer DEFAULT 1)
RETURNS text
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE clean text;
BEGIN
  IF NOT public.current_user_is_admin() THEN RAISE EXCEPTION 'forbidden'; END IF;
  clean := lower(regexp_replace(COALESCE(NULLIF(trim(_code), ''), ''), '[^a-zA-Z0-9_-]', '', 'g'));
  IF clean = '' THEN
    clean := lower(substr(replace(encode(gen_random_bytes(9), 'base64'), '/', ''), 1, 10));
    clean := regexp_replace(clean, '[^a-z0-9]', '', 'g');
  END IF;
  IF length(clean) < 3 OR length(clean) > 32 THEN RAISE EXCEPTION 'code must be 3-32 chars'; END IF;
  IF EXISTS (SELECT 1 FROM public.invite_codes WHERE code = clean) THEN RAISE EXCEPTION 'code already exists'; END IF;
  INSERT INTO public.invite_codes (code, uses_remaining)
    VALUES (clean, GREATEST(COALESCE(_uses, 1), 1));
  RETURN clean;
END $$;

CREATE OR REPLACE FUNCTION public.admin_delete_invite(_code text)
RETURNS boolean
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  IF NOT public.current_user_is_admin() THEN RAISE EXCEPTION 'forbidden'; END IF;
  DELETE FROM public.invite_codes WHERE code = lower(_code);
  RETURN FOUND;
END $$;

CREATE OR REPLACE FUNCTION public.admin_set_invite_uses(_code text, _uses integer)
RETURNS boolean
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  IF NOT public.current_user_is_admin() THEN RAISE EXCEPTION 'forbidden'; END IF;
  UPDATE public.invite_codes SET uses_remaining = GREATEST(COALESCE(_uses, 0), 0)
    WHERE code = lower(_code);
  RETURN FOUND;
END $$;

REVOKE ALL ON FUNCTION public.admin_list_invites() FROM anon;
REVOKE ALL ON FUNCTION public.admin_create_invite(text, integer) FROM anon;
REVOKE ALL ON FUNCTION public.admin_delete_invite(text) FROM anon;
REVOKE ALL ON FUNCTION public.admin_set_invite_uses(text, integer) FROM anon;
GRANT EXECUTE ON FUNCTION public.admin_list_invites() TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_create_invite(text, integer) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_delete_invite(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_set_invite_uses(text, integer) TO authenticated;