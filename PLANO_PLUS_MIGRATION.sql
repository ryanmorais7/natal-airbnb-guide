-- Adiciona o plano "Plus" ao allowlist de escolher_plano, e corrige 2 fluxos do
-- admin que ficaram quebrados pelo SECURITY_PATCH_CRITICAL.sql (aquele patch
-- revogou UPDATE direto em colunas administrativas de hosts pra qualquer
-- usuario autenticado, incluindo o admin -- esses 2 fluxos faziam update
-- direto usando a propria sessao do admin).

-- Mesma função de antes, só troca o allowlist de plan_id pra incluir 'plus'.
CREATE OR REPLACE FUNCTION public.escolher_plano(
  p_plan_id text, p_plan_name text, p_with_trial boolean, p_phone text DEFAULT NULL
) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF p_plan_id NOT IN ('individual', 'plus', 'pro') THEN
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

-- Usada por js/admin.js (salvarEdicao) pra editar plano/assinatura de qualquer host.
-- So funciona pra quem é admin (is_current_user_admin()).
CREATE OR REPLACE FUNCTION public.admin_set_host_plan(
  p_host_id uuid, p_plan_id text, p_plan_name text, p_subscription_status text,
  p_plan_active boolean, p_trial_ends_at timestamptz, p_is_demo boolean
) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.is_current_user_admin() THEN
    RAISE EXCEPTION 'not allowed';
  END IF;
  IF p_plan_id IS NOT NULL AND p_plan_id NOT IN ('individual', 'plus', 'pro') THEN
    RAISE EXCEPTION 'plano invalido';
  END IF;

  UPDATE public.hosts SET
    plan_id              = p_plan_id,
    plan_name            = p_plan_name,
    subscription_status  = p_subscription_status,
    plan_active          = p_plan_active,
    trial_ends_at        = p_trial_ends_at,
    is_demo              = p_is_demo
  WHERE id = p_host_id;
END;
$$;
GRANT EXECUTE ON FUNCTION public.admin_set_host_plan(uuid, text, text, text, boolean, timestamptz, boolean) TO authenticated;

-- Usada por js/admin.js (convite "Acesso Livre") pra conceder Pro completo sem cobranca.
-- So funciona pra quem é admin.
CREATE OR REPLACE FUNCTION public.admin_grant_free_pro(p_email text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.is_current_user_admin() THEN
    RAISE EXCEPTION 'not allowed';
  END IF;

  UPDATE public.hosts SET
    plan_id = 'pro', plan_name = 'Pro (Parceria)', plan_active = true
  WHERE email = p_email;
END;
$$;
GRANT EXECUTE ON FUNCTION public.admin_grant_free_pro(text) TO authenticated;
