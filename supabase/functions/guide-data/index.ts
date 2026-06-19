import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL         = Deno.env.get("SUPABASE_URL")              ?? "";
const SUPABASE_SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const CONTENT_FIELDS = [
  "property_name","wifi_name","wifi_password","address","maps_url","maps_embed",
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

    if (!token) return json({ ok: false, error: "invalid" }, 400);

    const sb = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

    // Busca o token e valida
    const { data: gt } = await sb
      .from("guest_tokens")
      .select("host_id, guest_name, expires_at, lock_code")
      .eq("token", token)
      .single();

    if (!gt) return json({ ok: false, error: "invalid" }, 404);

    if (new Date(gt.expires_at) < new Date()) {
      return json({ ok: false, error: "expired" }, 403);
    }

    // Busca conteúdo do guia
    const { data: content } = await sb
      .from("guide_content")
      .select(CONTENT_FIELDS)
      .eq("host_id", gt.host_id)
      .single();

    const { data: host } = await sb
      .from("hosts")
      .select("id, property_name, subscription_status, is_demo, is_admin")
      .eq("id", gt.host_id)
      .single();

    if (host && host.subscription_status && host.subscription_status !== "authorized" && !host.is_demo && !host.is_admin) {
      return json({ ok: false, error: "inactive" }, 403);
    }

    const { data: media } = await sb
      .from("room_media")
      .select("room, type, url, position")
      .eq("host_id", gt.host_id)
      .order("position", { ascending: true });

    const mergedContent = { ...(content ?? {}), room_media: media ?? [] };
    if (gt.lock_code) mergedContent.lock_code = gt.lock_code;

    return json({
      ok:        true,
      content:   mergedContent,
      host:      { id: host?.id, property_name: host?.property_name },
      guestName: gt.guest_name ?? null,
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
