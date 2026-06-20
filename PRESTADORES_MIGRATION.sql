-- Prestadores de servico (eletricista, pintor, dedetizador, etc.)
-- Cadastro publico na landing, exibido pro anfitriao em Manutencao apos aprovacao do admin.

ALTER TABLE public.guide_content ADD COLUMN IF NOT EXISTS city  TEXT;
ALTER TABLE public.guide_content ADD COLUMN IF NOT EXISTS state TEXT;

CREATE TABLE IF NOT EXISTS public.service_providers (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL,
  phone       TEXT NOT NULL,
  city        TEXT NOT NULL,
  state       TEXT NOT NULL,
  categories  JSONB NOT NULL DEFAULT '[]',  -- ex: ["eletricista","ar_condicionado"]
  status      TEXT NOT NULL DEFAULT 'pendente',  -- pendente | aprovado | rejeitado
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.service_providers ENABLE ROW LEVEL SECURITY;

-- Qualquer visitante pode se cadastrar, mas sempre entra como pendente
CREATE POLICY "providers_insert_public" ON public.service_providers
  FOR INSERT WITH CHECK (status = 'pendente');

-- Qualquer anfitriao logado pode ver prestadores ja aprovados (pra exibir em Manutencao)
CREATE POLICY "providers_select_approved" ON public.service_providers
  FOR SELECT USING (status = 'aprovado');

-- So o admin aprova/rejeita/exclui
CREATE POLICY "providers_admin_select_all" ON public.service_providers
  FOR SELECT USING (public.is_current_user_admin());
CREATE POLICY "providers_admin_update" ON public.service_providers
  FOR UPDATE USING (public.is_current_user_admin());
CREATE POLICY "providers_admin_delete" ON public.service_providers
  FOR DELETE USING (public.is_current_user_admin());
