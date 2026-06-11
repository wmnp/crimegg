CREATE OR REPLACE FUNCTION public.add_profile_views(_handle text, _amount integer)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  capped bigint := LEAST(GREATEST(_amount::bigint, 0::bigint), 100000000000::bigint);
  new_total integer;
BEGIN
  UPDATE public.profiles
    SET views = views + capped
    WHERE handle = lower(_handle)
    RETURNING views INTO new_total;
  RETURN COALESCE(new_total, 0);
END;
$function$;