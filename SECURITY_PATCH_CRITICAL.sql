-- Patch minimo para os 4 achados CRITICOS confirmados na auditoria de seguranca:
--   1. Escalacao de privilegio em hosts (qualquer usuario podia setar is_admin/plan_active/etc na propria linha)
--   2. Stored XSS no admin via escAttr                -> corrigido só no client (js/admin.js, js/painel.js), nada aqui
--   3. Leitura publica irrestrita de hosts/guide_content (policies "FOR SELECT USING (true)")
--   4. Stored XSS no guia do hospede                   -> corrigido só no client (js/guia.js), nada aqui
--
-- Rodar uma unica vez no SQL Editor do Supabase.

-- ============================================================
-- Achado #3: remove a leitura publica irrestrita.
-- O fluxo publico do hospede (token e agora tambem slug) passa a depender
-- exclusivamente da Edge Function guide-data, que usa service_role e devolve
-- só os campos permitidos (CONTENT_FIELDS), já validando bloqueio de assinatura.
-- ============================================================
DROP POLICY IF EXISTS "host_public"    ON public.hosts;
DROP POLICY IF EXISTS "content_public" ON public.guide_content;

-- ============================================================
-- Achado #1: ninguem além do service_role (usado pelas Edge Functions) pode
-- mais alterar colunas administrativas/financeiras de hosts.
-- Isso NAO afeta o service_role (usado por mp-webhook, criar-assinatura,
-- gerenciar-propriedade, cancelar-assinatura), só a role "authenticated"
-- (usuario logado normal usando a anon key).
-- ============================================================
REVOKE UPDATE (
  is_admin, owner_id,
  plan_id, plan_name, plan_active, plan_started_at,
  subscription_status, subscription_id, trial_ends_at
) ON public.hosts FROM authenticated;

-- ------------------------------------------------------------
-- Funcoes SECURITY DEFINER para as 2 acoes legitimas que hoje dependiam de
-- update direto do client nessas colunas, pra nao quebrar teste-gratis/checkout.
-- ------------------------------------------------------------

-- Usada por js/pagamento.js ao escolher um plano (com ou sem teste gratis).
CREATE OR REPLACE FUNCTION public.escolher_plano(
  p_plan_id text, p_plan_name text, p_with_trial boolean, p_phone text DEFAULT NULL
) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF p_plan_id NOT IN ('individual', 'pro') THEN
    RAISE EXCEPTION 'plano invalido';
  END IF;

  IF p_with_trial THEN
    UPDATE public.hosts SET
      plan_id = p_plan_id, plan_name = p_plan_name, plan_active = true,
      plan_started_at = now(), subscription_status = null, subscription_id = null,
      trial_ends_at = now() + interval '7 days',
      phone = COALESCE(p_phone, phone)
    WHERE id = auth.uid();
  ELSE
    UPDATE public.hosts SET
      plan_id = p_plan_id, plan_name = p_plan_name, plan_active = false,
      plan_started_at = now(), subscription_status = 'pending',
      phone = COALESCE(p_phone, phone)
    WHERE id = auth.uid();
  END IF;
END;
$$;
GRANT EXECUTE ON FUNCTION public.escolher_plano(text, text, boolean, text) TO authenticated;

-- Usada por js/pagamento.js depois que a Edge Function criar-assinatura devolve
-- o subscriptionId real do Mercado Pago. So funciona enquanto a assinatura do
-- chamador estiver "pending" (evita reuso pra sobrescrever uma assinatura já ativa).
CREATE OR REPLACE FUNCTION public.registrar_subscription_id(p_subscription_id text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  UPDATE public.hosts SET subscription_id = p_subscription_id
  WHERE id = auth.uid() AND subscription_status = 'pending';
END;
$$;
GRANT EXECUTE ON FUNCTION public.registrar_subscription_id(text) TO authenticated;

-- Usada por js/login.js (entrarDemo -> seedDemoAccount) pra marcar/recriar a
-- conta demo. So funciona pro e-mail demo@airguia.com — qualquer outra conta
-- que chamar isso recebe erro, nao "ganha" is_demo/plan Pro de graça.
CREATE OR REPLACE FUNCTION public.seed_demo_account()
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  caller_email text;
BEGIN
  SELECT email INTO caller_email FROM auth.users WHERE id = auth.uid();
  IF caller_email IS DISTINCT FROM 'demo@airguia.com' THEN
    RAISE EXCEPTION 'not allowed';
  END IF;

  INSERT INTO public.hosts (id, email, is_demo, plan_id, plan_name, plan_active, property_name, owner_name, slug)
  VALUES (auth.uid(), 'demo@airguia.com', true, 'pro', 'Pro (Demo)', true, 'Casa Vista Mar — Demo', 'Anfitrião Demo', 'demo')
  ON CONFLICT (id) DO UPDATE SET
    email = excluded.email, is_demo = excluded.is_demo, plan_id = excluded.plan_id,
    plan_name = excluded.plan_name, plan_active = excluded.plan_active,
    property_name = excluded.property_name, owner_name = excluded.owner_name, slug = excluded.slug;
END;
$$;
GRANT EXECUTE ON FUNCTION public.seed_demo_account() TO authenticated;
