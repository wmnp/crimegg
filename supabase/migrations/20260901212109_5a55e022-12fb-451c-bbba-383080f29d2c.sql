CREATE OR REPLACE FUNCTION public.admin_change_handle(_old text, _new text)
RETURNS boolean
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE clean text := btrim(COALESCE(_new, ''));
BEGIN
  IF NOT public.current_user_is_admin() THEN RAISE EXCEPTION 'forbidden'; END IF;
  IF length(clean) < 1 OR length(clean) > 24 THEN RAISE EXCEPTION 'handle must be 1-24 chars'; END IF;
  IF EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.handle = clean
      AND p.handle <> _old
  ) THEN RAISE EXCEPTION 'handle taken'; END IF;
  UPDATE public.profiles SET handle = clean WHERE handle = _old OR handle = lower(_old);
  RETURN FOUND;
END $$;