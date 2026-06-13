
-- New customization columns
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS avatar_shape text NOT NULL DEFAULT 'circle',
  ADD COLUMN IF NOT EXISTS link_style text NOT NULL DEFAULT 'glass',
  ADD COLUMN IF NOT EXISTS bg_blur integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS tilt_card boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS hide_views boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS text_align text NOT NULL DEFAULT 'center',
  ADD COLUMN IF NOT EXISTS particle_density integer NOT NULL DEFAULT 50,
  ADD COLUMN IF NOT EXISTS custom_title text;

-- Pending signups (used between sending an email code and completing account creation)
CREATE TABLE IF NOT EXISTS public.pending_signups (
  email text PRIMARY KEY,
  password text NOT NULL,
  handle text NOT NULL,
  invite_code text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

GRANT ALL ON public.pending_signups TO service_role;
ALTER TABLE public.pending_signups ENABLE ROW LEVEL SECURITY;
-- No policies for anon/authenticated — only the service role (server functions) may touch this table.
