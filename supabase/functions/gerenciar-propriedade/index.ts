import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL         = Deno.env.get("SUPABASE_URL")              ?? "";
const SUPABASE_SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

const PLAN_LIMITS: Record<string, number> = { plus: 15, pro: 50 };
const NON_BLOCKING_STATUSES = new Set(["authorized", "convidada"]);

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });

  try {
    const sb = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

    const token = (req.headers.get("Authorization") ?? "").replace("Bearer ", "");
    const { data: userData, error: userErr } = await sb.auth.getUser(token);
    if (userErr || !userData?.user) return json({ ok: false, message: "Não autenticado." }, 401);
    const callerId = userData.user.id;

    const { action, propertyId } = await req.json();

    const { data: account } = await sb
      .from("hosts")
      .select("plan_id, subscription_status, trial_ends_at, is_admin, is_demo")
      .eq("id", callerId)
      .single();

    if (action === "criar") {
      if (!account) return json({ ok: false, message: "Conta não encontrada." }, 404);

      const trialExpired = !!account.trial_ends_at
        && new Date(account.trial_ends_at) < new Date()
        && account.subscription_status !== "authorized";
      const blocked = !account.is_admin && (
        (account.subscription_status && !NON_BLOCKING_STATUSES.has(account.subscription_status)) || trialExpired
      );
      if (blocked) {
        return json({ ok: false, message: "Sua assinatura precisa estar ativa para adicionar propriedades." }, 403);
      }
      const maxProperties = PLAN_LIMITS[account.plan_id ?? ""];
      if (!account.is_admin && !maxProperties) {
        return json({ ok: false, message: "Adicionar propriedades é exclusivo dos planos Plus e Pro." }, 403);
      }

      const { count } = await sb
        .from("hosts")
        .select("id", { count: "exact", head: true })
        .or(`id.eq.${callerId},owner_id.eq.${callerId}`);

      if (!account.is_admin && (count ?? 0) >= maxProperties) {
        return json({ ok: false, message: `Limite de ${maxProperties} propriedades por conta atingido.` }, 403);
      }

      const internalEmail = `prop-${crypto.randomUUID()}@airguia.internal`;
      const { data: created, error: createErr } = await sb.auth.admin.createUser({
        email:         internalEmail,
        password:      crypto.randomUUID(),
        email_confirm: true,
      });
      if (createErr || !created?.user) {
        return json({ ok: false, message: createErr?.message || "Não foi possível criar a propriedade." }, 500);
      }

      const newId = created.user.id;
      await sb.from("hosts").update({
        owner_id:      callerId,
        property_name: "Nova Propriedade",
      }).eq("id", newId);

      return json({ ok: true, propertyId: newId });
    }

    if (action === "excluir") {
      if (!propertyId) return json({ ok: false, message: "propertyId obrigatório." }, 400);
      if (propertyId === callerId) {
        return json({ ok: false, message: "Não é possível excluir a propriedade principal da conta." }, 400);
      }

      const { data: property } = await sb
        .from("hosts")
        .select("id, owner_id")
        .eq("id", propertyId)
        .single();

      if (!property || property.owner_id !== callerId) {
        return json({ ok: false, message: "Propriedade não encontrada ou sem permissão." }, 404);
      }

      await sb.from("guest_tokens").delete().eq("host_id", propertyId);
      await sb.from("room_media").delete().eq("host_id", propertyId);
      await sb.from("guide_content").delete().eq("host_id", propertyId);

      const { error: delErr } = await sb.auth.admin.deleteUser(propertyId);
      if (delErr) return json({ ok: false, message: delErr.message }, 500);

      return json({ ok: true });
    }

    return json({ ok: false, message: "Ação inválida." }, 400);

  } catch (err) {
    return json({ ok: false, message: "Erro interno: " + (err as Error).message }, 500);
  }
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...cors, "Content-Type": "application/json" },
  });
}
