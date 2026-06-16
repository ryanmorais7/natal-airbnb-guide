-- Execute no Supabase SQL Editor para adicionar suporte a temas

ALTER TABLE public.guide_content
  ADD COLUMN IF NOT EXISTS theme_id          TEXT DEFAULT 'oliva',
  ADD COLUMN IF NOT EXISTS theme_color       TEXT DEFAULT '#4A6741',
  ADD COLUMN IF NOT EXISTS theme_color_light TEXT DEFAULT '#6B8E61';
