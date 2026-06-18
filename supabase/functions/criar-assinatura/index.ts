import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const MP_ACCESS_TOKEN = Deno.env.get("MP_ACCESS_TOKEN") ?? "";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Preços canônicos para evitar adulteração via frontend
const AMOUNTS: Record<string, Record<string, number>> = {
  individual: { mensal: 34.90, anual: 334.80 },
  pro:        { mensal: 69.90, anual: 658.80  },
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });

  try {
    const { email, planoId, planoPeriodo, withTrial = true, hostId } = await req.json();

    if (!email)  return json({ ok: false, message: "E-mail obrigatório." }, 400);
    if (!hostId) return json({ ok: false, message: "Conta não encontrada." }, 400);

    const periodo  = planoPeriodo === "anual" ? "anual" : "mensal";
    const planKey  = (planoId ?? "individual") as string;
    const amount   = AMOUNTS[planKey]?.[periodo] ?? (periodo === "anual" ? 334.80 : 34.90);
    const frequency     = periodo === "anual" ? 12 : 1;
    const frequencyType = "months";

    const trialEndsAt = withTrial
      ? new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
      : null;

    const autoRecurring: Record<string, unknown> = {
      frequency,
      frequency_type:     frequencyType,
      transaction_amount: amount,
      currency_id:        "BRL",
    };
    if (withTrial) {
      autoRecurring.free_trial = { frequency: 7, frequency_type: "days" };
    }

    // Sem card_token_id + status "pending" => MP retorna init_point (checkout hospedado)
    const body: Record<string, unknown> = {
      reason:             `AirGuia – Plano ${planKey} (${periodo})`,
      external_reference: String(hostId),
      payer_email:        email,
      auto_recurring:     autoRecurring,
      back_url:           "https://guiazamio.vercel.app/painel.html",
      status:             "pending",
    };

    const res = await fetch("https://api.mercadopago.com/preapproval", {
      method: "POST",
      headers: {
        Authorization:       `Bearer ${MP_ACCESS_TOKEN}`,
        "Content-Type":      "application/json",
        "X-Idempotency-Key": crypto.randomUUID(),
      },
      body: JSON.stringify(body),
    });

    const sub = await res.json();

    if (res.ok && sub.id && sub.init_point) {
      return json({
        ok:             true,
        subscriptionId: String(sub.id),
        initPoint:      sub.init_point,
        trialEndsAt,
        withTrial,
      });
    }

    const msg = sub.message ?? "Não foi possível iniciar o pagamento. Tente novamente.";
    return json({ ok: false, message: msg }, 402);

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
