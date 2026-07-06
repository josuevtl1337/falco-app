import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";

Deno.serve(async (request) => {
  if (request.method === "OPTIONS")
    return new Response("ok", { headers: corsHeaders });
  if (request.method !== "GET") {
    return Response.json(
      { error: "method_not_allowed" },
      { status: 405, headers: corsHeaders },
    );
  }

  const deviceId = request.headers.get("x-device-id");
  const deviceSecret = request.headers.get("x-device-secret");
  if (!deviceId || !deviceSecret) {
    return Response.json({ ok: false }, { status: 401, headers: corsHeaders });
  }

  const admin = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );
  const { data, error } = await admin.rpc("authenticate_device", {
    p_device_id: deviceId,
    p_secret: deviceSecret,
  });
  const ok = !error && Boolean(data?.length);
  return Response.json(
    { ok, server_time: new Date().toISOString() },
    {
      status: ok ? 200 : 401,
      headers: { ...corsHeaders, "cache-control": "no-store" },
    },
  );
});
