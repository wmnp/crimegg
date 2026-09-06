CREATE TABLE public.invite_redemptions (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  code text NOT NULL,
  user_id uuid,
  handle text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

GRANT ALL ON public.invite_redemptions TO service_role;

ALTER TABLE public.invite_redemptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can read redemptions" ON public.invite_redemptions
  FOR SELECT TO authenticated
  USING (public.current_user_is_admin());

CREATE INDEX invite_redemptions_code_idx ON public.invite_redemptions (code);

CREATE OR REPLACE FUNCTION public.admin_list_invite_redemptions()
RETURNS TABLE(code text, handle text, user_id uuid, created_at timestamp with time zone)
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  IF NOT public.current_user_is_admin() THEN RAISE EXCEPTION 'forbidden'; END IF;
  RETURN QUERY SELECT r.code, r.handle, r.user_id, r.created_at
    FROM public.invite_redemptions r ORDER BY r.created_at DESC LIMIT 500;
END $function$;