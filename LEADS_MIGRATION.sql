-- Captura de leads: gente que preenche o cadastro mas pode nao concluir o pagamento
-- Inserido pelo cadastro.html ainda sem login (anon), so o admin consegue ler/gerenciar.

CREATE TABLE IF NOT EXISTS public.leads (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email           TEXT NOT NULL UNIQUE,
  phone           TEXT,
  plano_interesse TEXT,
  contacted       BOOLEAN DEFAULT false,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;

-- Qualquer visitante (anon) pode criar seu lead pelo e-mail, mas nao ler a lista nem editar
CREATE POLICY "leads_insert_public" ON public.leads
  FOR INSERT WITH CHECK (true);

-- So o admin do site consegue ver, editar (marcar como contatado) e excluir
CREATE POLICY "leads_admin_select" ON public.leads
  FOR SELECT USING (public.is_current_user_admin());

CREATE POLICY "leads_admin_update" ON public.leads
  FOR UPDATE USING (public.is_current_user_admin());

CREATE POLICY "leads_admin_delete" ON public.leads
  FOR DELETE USING (public.is_current_user_admin());
