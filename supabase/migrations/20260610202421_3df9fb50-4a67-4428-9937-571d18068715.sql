
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS theme text NOT NULL DEFAULT 'crime',
  ADD COLUMN IF NOT EXISTS glow_text boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS cursor_trail boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS scanlines boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS badges text[] NOT NULL DEFAULT '{}'::text[],
  ADD COLUMN IF NOT EXISTS visualizer boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS blur_amount integer NOT NULL DEFAULT 20;

CREATE OR REPLACE FUNCTION public.increment_profile_views(_handle text)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  UPDATE public.profiles SET views = views + 1 WHERE handle = lower(_handle);
$$;

GRANT EXECUTE ON FUNCTION public.increment_profile_views(text) TO anon, authenticated;

CREATE TABLE IF NOT EXISTS public.guestbook (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  author_name text NOT NULL,
  message text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT ON public.guestbook TO anon, authenticated;
GRANT ALL ON public.guestbook TO service_role;

ALTER TABLE public.guestbook ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Guestbook is public read" ON public.guestbook FOR SELECT USING (true);
CREATE POLICY "Anyone can post to guestbook" ON public.guestbook FOR INSERT WITH CHECK (
  length(author_name) BETWEEN 1 AND 32 AND length(message) BETWEEN 1 AND 500
);

CREATE INDEX IF NOT EXISTS guestbook_profile_id_created_at_idx
  ON public.guestbook(profile_id, created_at DESC);
