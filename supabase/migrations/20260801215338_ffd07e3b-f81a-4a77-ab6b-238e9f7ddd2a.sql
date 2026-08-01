ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS unlocked_badges text[] NOT NULL DEFAULT '{}';
UPDATE public.profiles SET unlocked_badges = badges WHERE array_length(badges, 1) IS NOT NULL;

CREATE TABLE public.app_config (
  key text PRIMARY KEY,
  value text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.app_config TO anon;
GRANT SELECT ON public.app_config TO authenticated;
GRANT ALL ON public.app_config TO service_role;

ALTER TABLE public.app_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "App config is public read" ON public.app_config FOR SELECT USING (true);

CREATE TRIGGER app_config_touch BEFORE UPDATE ON public.app_config
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

INSERT INTO public.app_config (key, value) VALUES
  ('discord_invite', 'https://discord.gg/EtMy9KMHJ'),
  ('role_verified', 'Verified'),
  ('role_og', 'OG'),
  ('role_staff', 'Staff'),
  ('role_vip', 'VIP'),
  ('role_admin', 'Admin'),
  ('role_content_creator', 'Content Creator'),
  ('role_famous', 'Famous'),
  ('famous_followers', '5000'),
  ('famous_views', '1000')
ON CONFLICT (key) DO NOTHING;

CREATE OR REPLACE FUNCTION public.admin_set_config(_key text, _value text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.current_user_is_admin() THEN RAISE EXCEPTION 'forbidden'; END IF;
  INSERT INTO public.app_config (key, value) VALUES (_key, _value)
    ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = now();
  RETURN true;
END $$;

CREATE OR REPLACE FUNCTION public.admin_set_unlocked_badges(_handle text, _badges text[])
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.current_user_is_admin() THEN RAISE EXCEPTION 'forbidden'; END IF;
  UPDATE public.profiles SET unlocked_badges = COALESCE(_badges, '{}') WHERE handle = lower(_handle);
  RETURN FOUND;
END $$;