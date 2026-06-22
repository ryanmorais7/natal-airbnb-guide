import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL         = Deno.env.get("SUPABASE_URL")              ?? "";
const SUPABASE_SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const CONTENT_FIELDS = [
  "property_name","wifi_name","wifi_password","wifi_qr_url","address","maps_url","maps_embed",
  "theme_color","theme_color_light","checkin_time","checkout_time",
  "lock_code","lock_code_valid_until","access_type","access_location",
  "access_contact","access_instructions","welcome_message","hero_image_url",
  "rules","restaurantes","mercados","farmacias","atividades",
  "academias","lavanderias","emergencia","room_items",
].join(",");

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });

  try {
    const url   = new URL(req.url);
    const token = url.searchParams.get("t");
    const slug  = url.searchParams.get("h");

    if (!token && !slug) return json({ ok: false, error: "invalid" }, 400);

    const sb = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

    let hostId: string;
    let guestName: string | null = null;
    let lockCodeOverride: string | null = null;

    if (token) {
      // Acesso via link de hóspede com token
      const { data: gt } = await sb
        .from("guest_tokens")
        .select("host_id, guest_name, expires_at, lock_code")
        .eq("token", token)
        .single();

      if (!gt) return json({ ok: false, error: "invalid" }, 404);

      if (new Date(gt.expires_at) < new Date()) {
        return json({ ok: false, error: "expired" }, 403);
      }
      hostId           = gt.host_id;
      guestName         = gt.guest_name ?? null;
      lockCodeOverride  = gt.lock_code ?? null;
    } else {
      // Acesso via slug (preview do anfitrião / demo) — sem expiração própria
      const { data: hostBySlug } = await sb.from("hosts").select("id").eq("slug", slug as string).single();
      if (!hostBySlug) return json({ ok: false, error: "invalid" }, 404);
      hostId = hostBySlug.id;
    }

    // Busca conteúdo do guia
    const { data: content } = await sb
      .from("guide_content")
      .select(CONTENT_FIELDS)
      .eq("host_id", hostId)
      .single();

    const { data: host } = await sb
      .from("hosts")
      .select("id, property_name, subscription_status, trial_ends_at, is_demo, is_admin, owner_id")
      .eq("id", hostId)
      .single();

    // Propriedade extra (owner_id preenchido): assinatura/teste vivem na conta dona, nao nesta linha
    let billing = host;
    if (host?.owner_id) {
      const { data: owner } = await sb
        .from("hosts")
        .select("subscription_status, trial_ends_at, is_demo, is_admin")
        .eq("id", host.owner_id)
        .single();
      if (owner) billing = owner as typeof host;
    }

    const NON_BLOCKING_STATUSES = new Set(["authorized", "convidada"]);
    const trialExpired = !!billing?.trial_ends_at
      && new Date(billing.trial_ends_at) < new Date()
      && billing.subscription_status !== "authorized";
    const realBlock = !!billing?.subscription_status && !NON_BLOCKING_STATUSES.has(billing.subscription_status);

    if (host && billing && !billing.is_demo && !billing.is_admin && (realBlock || trialExpired)) {
      return json({ ok: false, error: "inactive" }, 403);
    }

    const { data: media } = await sb
      .from("room_media")
      .select("room, type, url, position")
      .eq("host_id", hostId)
      .order("position", { ascending: true });

    const mergedContent = { ...(content ?? {}), room_media: media ?? [] };
    if (lockCodeOverride) mergedContent.lock_code = lockCodeOverride;

    return json({
      ok:        true,
      content:   mergedContent,
      host:      { id: host?.id, property_name: host?.property_name },
      guestName,
    });

  } catch (err) {
    return json({ ok: false, error: "server_error", message: (err as Error).message }, 500);
  }
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...cors, "Content-Type": "application/json" },
  });
}
