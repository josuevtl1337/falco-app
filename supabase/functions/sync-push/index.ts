import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";

Deno.serve(async (request) => {
  if (request.method === "OPTIONS")
    return new Response("ok", { headers: corsHeaders });
  if (request.method !== "POST") {
    return Response.json(
      { error: "method_not_allowed" },
      { status: 405, headers: corsHeaders },
    );
  }

  try {
    const body = await request.json();
    if (
      body.protocol_version !== "v1" ||
      !Array.isArray(body.mutations) ||
      body.mutations.length < 1 ||
      body.mutations.length > 200
    ) {
      return Response.json(
        { error: "invalid_request" },
        { status: 400, headers: corsHeaders },
      );
    }

    const deviceId = request.headers.get("x-device-id");
    const deviceSecret = request.headers.get("x-device-secret");
    if (!deviceId || !deviceSecret || deviceId !== body.device_id) {
      return Response.json(
        { error: "unauthorized" },
        { status: 401, headers: corsHeaders },
      );
    }

    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );
    const { data: authenticatedDevice, error: authError } = await admin.rpc(
      "authenticate_device",
      { p_device_id: deviceId, p_secret: deviceSecret },
    );
    if (authError || !authenticatedDevice?.length) {
      return Response.json(
        { error: "unauthorized" },
        { status: 401, headers: corsHeaders },
      );
    }

    const { data, error } = await admin.rpc("apply_sync_batch", {
      p_device_id: deviceId,
      p_batch_id: body.batch_id,
      p_mutations: body.mutations,
    });
    if (error) throw error;

    return Response.json(data, {
      headers: {
        ...corsHeaders,
        "content-type": "application/json",
        "cache-control": "no-store",
      },
    });
  } catch (error) {
    console.error("Sync push failed", error);
    return Response.json(
      { error: "sync_failed" },
      { status: 500, headers: corsHeaders },
    );
  }
});
