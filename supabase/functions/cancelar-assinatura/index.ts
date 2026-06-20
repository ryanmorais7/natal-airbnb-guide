import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const MP_ACCESS_TOKEN      = Deno.env.get("MP_ACCESS_TOKEN")           ?? "";
const SUPABASE_URL         = Deno.env.get("SUPABASE_URL")              ?? "";
const SUPABASE_SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });

  try {
    const sb = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

    // Só o próprio anfitrião ou um admin do site pode chamar — valida o token do chamador, não a anon key
    const token = (req.headers.get("Authorization") ?? "").replace("Bearer ", "");
    const { data: userData, error: userErr } = await sb.auth.getUser(token);
    if (userErr || !userData?.user) return json({ ok: false, message: "Não autenticado." }, 401);

    const { hostId } = await req.json();
    if (!hostId) return json({ ok: false, message: "hostId obrigatório." }, 400);

    const { data: caller } = await sb.from("hosts").select("is_admin").eq("id", userData.user.id).single();
    const isAdmin = caller?.is_admin === true;
    const isSelf  = userData.user.id === hostId;
    if (!isAdmin && !isSelf) return json({ ok: false, message: "Sem permissão para cancelar esta assinatura." }, 403);

    const { data: host } = await sb
      .from("hosts")
      .select("subscription_id, subscription_status, is_admin, is_demo")
      .eq("id", hostId)
      .single();

    if (host?.is_admin || host?.is_demo) {
      return json({ ok: false, message: "Esta conta não pode ser cancelada por aqui." }, 400);
    }
    if (!host?.subscription_id) {
      return json({ ok: false, message: "Este anfitrião não tem assinatura no Mercado Pago." }, 400);
    }
    if (host.subscription_status !== "authorized") {
      return json({ ok: false, message: "Esta assinatura já não está ativa." }, 400);
    }

    const mpRes = await fetch(`https://api.mercadopago.com/preapproval/${host.subscription_id}`, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${MP_ACCESS_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ status: "cancelled" }),
    });
    const mpSub = await mpRes.json();

    if (!mpRes.ok) {
      return json({ ok: false, message: mpSub.message || "Erro ao cancelar no Mercado Pago." }, 502);
    }

    await sb.from("hosts").update({
      subscription_status: "cancelled",
      plan_active:         false,
    }).eq("id", hostId);

    return json({ ok: true });

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
