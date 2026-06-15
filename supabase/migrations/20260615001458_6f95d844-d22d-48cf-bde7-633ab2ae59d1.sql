
-- 1. WIPE all users except 'crime' (cascades to profiles, links, followers, guestbook via fk... but we have no fks on auth.users, so wipe manually)
DELETE FROM public.guestbook WHERE profile_id IN (SELECT id FROM public.profiles WHERE handle <> 'crime');
DELETE FROM public.followers WHERE profile_id IN (SELECT id FROM public.profiles WHERE handle <> 'crime') OR follower_id IN (SELECT id FROM public.profiles WHERE handle <> 'crime');
DELETE FROM public.links WHERE profile_id IN (SELECT id FROM public.profiles WHERE handle <> 'crime');
DELETE FROM public.profiles WHERE handle <> 'crime';
DELETE FROM auth.users WHERE id NOT IN (SELECT id FROM public.profiles);
DELETE FROM public.pending_signups;

-- 2. UID system: sequence + column
CREATE SEQUENCE IF NOT EXISTS public.profiles_uid_seq START 1;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS uid INTEGER UNIQUE;
UPDATE public.profiles SET uid = 1 WHERE handle = 'crime' AND uid IS NULL;
-- advance seq past 1
SELECT setval('public.profiles_uid_seq', GREATEST(1, COALESCE((SELECT MAX(uid) FROM public.profiles), 0)));
ALTER TABLE public.profiles ALTER COLUMN uid SET DEFAULT nextval('public.profiles_uid_seq');

-- 3. Customization columns
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS custom_css TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS animated_bg TEXT NOT NULL DEFAULT 'none',
  ADD COLUMN IF NOT EXISTS emoji_rain TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS discord_id TEXT,
  ADD COLUMN IF NOT EXISTS discord_username TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS profiles_discord_id_key ON public.profiles(discord_id) WHERE discord_id IS NOT NULL;

-- 4. Per-link accent color
ALTER TABLE public.links ADD COLUMN IF NOT EXISTS accent_color TEXT;
