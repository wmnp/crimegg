
-- Marketplace columns on profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS for_sale boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS sale_price numeric;

-- Followers
CREATE TABLE IF NOT EXISTS public.followers (
  follower_id uuid NOT NULL,
  profile_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (follower_id, profile_id)
);
GRANT SELECT ON public.followers TO anon;
GRANT SELECT, INSERT, DELETE ON public.followers TO authenticated;
GRANT ALL ON public.followers TO service_role;
ALTER TABLE public.followers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Followers public read" ON public.followers FOR SELECT USING (true);
CREATE POLICY "Auth users follow" ON public.followers FOR INSERT TO authenticated WITH CHECK (auth.uid() = follower_id);
CREATE POLICY "Auth users unfollow" ON public.followers FOR DELETE TO authenticated USING (auth.uid() = follower_id);

-- View adder (capped, security definer so it can update any profile by handle)
CREATE OR REPLACE FUNCTION public.add_profile_views(_handle text, _amount integer)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  capped integer := LEAST(GREATEST(_amount, 0), 100000);
  new_total integer;
BEGIN
  UPDATE public.profiles
    SET views = views + capped
    WHERE handle = lower(_handle)
    RETURNING views INTO new_total;
  RETURN COALESCE(new_total, 0);
END;
$$;
GRANT EXECUTE ON FUNCTION public.add_profile_views(text, integer) TO anon, authenticated;
