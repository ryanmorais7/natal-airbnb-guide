
-- 1. Tabela de perfis dos anfitriões
CREATE TABLE IF NOT EXISTS public.hosts (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT,
  owner_name TEXT DEFAULT '',
  property_name TEXT DEFAULT 'Minha Propriedade',
  slug TEXT UNIQUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Tabela com conteúdo do guia (um por anfitrião)
CREATE TABLE IF NOT EXISTS public.guide_content (
  host_id UUID REFERENCES public.hosts(id) ON DELETE CASCADE PRIMARY KEY,
  property_name TEXT DEFAULT '',
  welcome_message TEXT DEFAULT 'Seja bem-vindo(a)! Preparamos este guia para tornar sua estadia mais confortável.',
  address TEXT DEFAULT '',
  maps_url TEXT DEFAULT '',
  maps_embed TEXT DEFAULT '',
  checkin_time TEXT DEFAULT '13:00',
  checkout_time TEXT DEFAULT '11:00',
  access_code TEXT DEFAULT '',
  wifi_name TEXT DEFAULT '',
  wifi_password TEXT DEFAULT '',
  hero_image_url TEXT DEFAULT '',
  restaurants JSONB DEFAULT '[]'::jsonb,
  markets JSONB DEFAULT '[]'::jsonb,
  pharmacies JSONB DEFAULT '[]'::jsonb,
  activities JSONB DEFAULT '[]'::jsonb,
  gyms JSONB DEFAULT '[]'::jsonb,
  emergency JSONB DEFAULT '[]'::jsonb,
  rules TEXT DEFAULT '',
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Ativar Row Level Security
ALTER TABLE public.hosts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.guide_content ENABLE ROW LEVEL SECURITY;

-- 4. Políticas de acesso
CREATE POLICY "host_self"       ON public.hosts         FOR ALL    USING (auth.uid() = id);
CREATE POLICY "host_public"     ON public.hosts         FOR SELECT USING (true);
CREATE POLICY "content_owner"   ON public.guide_content FOR ALL    USING (auth.uid() = host_id);
CREATE POLICY "content_public"  ON public.guide_content FOR SELECT USING (true);

-- 5. Trigger: cria perfil automático ao cadastrar novo usuário
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.hosts (id, email)
  VALUES (NEW.id, NEW.email)
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
