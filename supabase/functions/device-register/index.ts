import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";

const uuidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

Deno.serve(async (request) => {
  if (request.method === "OPTIONS")
    return new Response("ok", { headers: corsHeaders });
  if (request.method !== "POST") {
    return Response.json(
      { error: "method_not_allowed" },
      { status: 405, headers: corsHeaders },
    );
  }

  const registrationToken = Deno.env.get("DEVICE_REGISTRATION_TOKEN");
  if (
    !registrationToken ||
    request.headers.get("x-registration-token") !== registrationToken
  ) {
    return Response.json(
      { error: "unauthorized" },
      { status: 401, headers: corsHeaders },
    );
  }

  try {
    const { device_id, business_id, branch_id, name, secret } =
      await request.json();
    const valid =
      [device_id, business_id, branch_id].every(
        (value) => typeof value === "string" && uuidPattern.test(value),
      ) &&
      typeof name === "string" &&
      name.trim().length > 0 &&
      name.length <= 100 &&
      typeof secret === "string" &&
      secret.length >= 32;
    if (!valid) {
      return Response.json(
        { error: "invalid_request" },
        { status: 400, headers: corsHeaders },
      );
    }

    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );
    const { error } = await admin.from("devices").upsert({
      id: device_id,
      business_id,
      branch_id,
      name: name.trim(),
      secret_hash: "pending",
    });
    if (error) throw error;

    const { error: hashError } = await admin.rpc("set_device_secret", {
      p_device_id: device_id,
      p_secret: secret,
    });
    if (hashError) throw hashError;

    return Response.json({ registered: true }, { headers: corsHeaders });
  } catch (error) {
    console.error("Device registration failed", error);
    return Response.json(
      { error: "registration_failed" },
      { status: 500, headers: corsHeaders },
    );
  }
});
