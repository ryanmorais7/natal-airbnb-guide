

-- 1. Adicionar coluna is_admin na tabela hosts
ALTER TABLE public.hosts ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT FALSE;

-- 2. Função para checar admin sem causar recursão no RLS
CREATE OR REPLACE FUNCTION public.is_current_user_admin()
RETURNS BOOLEAN LANGUAGE sql SECURITY DEFINER STABLE SET search_path = public AS $$
  SELECT COALESCE((SELECT is_admin FROM hosts WHERE id = auth.uid() LIMIT 1), false)
$$;

-- 3. Permitir que o admin leia e edite qualquer guide_content
CREATE POLICY "admin_manage_content" ON public.guide_content
  FOR ALL USING (public.is_current_user_admin());

-- 4. Permitir que o admin leia e gerencie qualquer host
CREATE POLICY "admin_manage_hosts" ON public.hosts
  FOR ALL USING (public.is_current_user_admin());

-- 5. Marcar SEU usuário como admin (seu e-mail cadastrado)
UPDATE public.hosts SET is_admin = TRUE WHERE email = 'seu-email@aqui.com';

-- Verificar:
SELECT id, email, slug, is_admin FROM public.hosts;
