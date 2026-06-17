import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const MP_ACCESS_TOKEN      = Deno.env.get("MP_ACCESS_TOKEN")           ?? "";
const SUPABASE_URL         = Deno.env.get("SUPABASE_URL")              ?? "";
const SUPABASE_SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

serve(async (req) => {
  // MP exige retorno 200 em qualquer caso para não retentar indefinidamente
  if (req.method !== "POST") return new Response("ok", { status: 200 });

  try {
    const payload = await req.json();
    const { type, data, action } = payload as {
      type?: string;
      action?: string;
      data?: { id?: string | number };
    };

    const isSubEvent = type === "subscription_preapproval";
    const isPayEvent = type === "payment" && action === "payment.updated";

    if (isSubEvent && data?.id) {
      await handleSubscription(String(data.id));
    } else if (isPayEvent && data?.id) {
      await handlePayment(String(data.id));
    }

  } catch {
    // ignora e retorna 200 para MP não retentar
  }

  return new Response("ok", { status: 200 });
});

async function handleSubscription(subscriptionId: string) {
  const res = await fetch(`https://api.mercadopago.com/preapproval/${subscriptionId}`, {
    headers: { Authorization: `Bearer ${MP_ACCESS_TOKEN}` },
  });
  const sub = await res.json();
  if (!sub?.id) return;

  const status = sub.status as string; // authorized | paused | cancelled | pending | expired
  await updateHostBySubscription(subscriptionId, status);
}

async function handlePayment(paymentId: string) {
  const res = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
    headers: { Authorization: `Bearer ${MP_ACCESS_TOKEN}` },
  });
  const payment = await res.json();
  if (!payment?.preapproval_id) return;

  // Atualiza status da assinatura associada ao pagamento
  await handleSubscription(String(payment.preapproval_id));
}

async function updateHostBySubscription(subscriptionId: string, status: string) {
  const sb = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

  const upd: Record<string, unknown> = { subscription_status: status };
  if (status === "cancelled" || status === "expired") upd.plan_active = false;
  if (status === "authorized") upd.plan_active = true;

  await sb.from("hosts").update(upd).eq("subscription_id", subscriptionId);
}
