

ALTER TABLE public.guide_content
  ADD COLUMN IF NOT EXISTS cleaning_state       JSONB DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS access_type          TEXT  DEFAULT 'fechadura',
  ADD COLUMN IF NOT EXISTS access_location      TEXT,
  ADD COLUMN IF NOT EXISTS access_contact       TEXT,
  ADD COLUMN IF NOT EXISTS access_instructions  TEXT;
