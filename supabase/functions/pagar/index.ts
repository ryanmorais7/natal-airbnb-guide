import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const MP_ACCESS_TOKEN = Deno.env.get("MP_ACCESS_TOKEN") ?? "";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const STATUS_MESSAGES: Record<string, string> = {
  cc_rejected_insufficient_amount:    "Saldo insuficiente no cartão.",
  cc_rejected_bad_filled_card_number: "Número de cartão inválido.",
  cc_rejected_bad_filled_date:        "Data de validade inválida.",
  cc_rejected_bad_filled_security_code: "CVV inválido.",
  cc_rejected_call_for_authorize:     "Cartão bloqueado. Entre em contato com seu banco.",
  cc_rejected_card_disabled:          "Cartão desativado. Entre em contato com seu banco.",
  cc_rejected_duplicated_payment:     "Pagamento duplicado detectado.",
  cc_rejected_high_risk:              "Pagamento recusado por segurança. Tente outro cartão.",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: cors });
  }

  try {
    const {
      token,
      installments,
      paymentMethodId,
      issuerId,
      email,
      planoId,
      planoPeriodo,
      precoNum,
    } = await req.json();

    if (!token) {
      return json({ ok: false, message: "Token do cartão inválido." }, 400);
    }

    const mpRes = await fetch("https://api.mercadopago.com/v1/payments", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${MP_ACCESS_TOKEN}`,
        "Content-Type": "application/json",
        "X-Idempotency-Key": crypto.randomUUID(),
      },
      body: JSON.stringify({
        token,
        installments:         Number(installments) || 1,
        payment_method_id:    paymentMethodId,
        issuer_id:            issuerId ? Number(issuerId) : undefined,
        transaction_amount:   Number(precoNum),
        description:          `Zamio Guias – Plano ${planoId} (${planoPeriodo})`,
        payer: { email },
      }),
    });

    const payment = await mpRes.json();

    if (payment.status === "approved") {
      return json({ ok: true, paymentId: payment.id });
    }

    const message =
      STATUS_MESSAGES[payment.status_detail] ??
      "Pagamento recusado. Verifique os dados do cartão.";

    return json({ ok: false, message, detail: payment.status_detail }, 402);

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
