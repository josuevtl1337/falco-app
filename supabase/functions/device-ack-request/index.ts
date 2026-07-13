import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";

type RequestType = "expense" | "stock_adjustment";
type RequestStatus = "applied" | "rejected";

function isRequestType(value: unknown): value is RequestType {
  return value === "expense" || value === "stock_adjustment";
}

function isRequestStatus(value: unknown): value is RequestStatus {
  return value === "applied" || value === "rejected";
}

Deno.serve(async (request) => {
  if (request.method === "OPTIONS")
    return new Response("ok", { headers: corsHeaders });
  if (request.method !== "POST") {
    return Response.json(
      { error: "method_not_allowed" },
      { status: 405, headers: corsHeaders },
    );
  }

  const deviceId = request.headers.get("x-device-id");
  const deviceSecret = request.headers.get("x-device-secret");
  if (!deviceId || !deviceSecret) {
    return Response.json(
      { error: "unauthorized" },
      { status: 401, headers: corsHeaders },
    );
  }

  try {
    const body = await request.json();
    if (
      !isRequestType(body.request_type) ||
      !isRequestStatus(body.status) ||
      typeof body.request_id !== "string"
    ) {
      return Response.json(
        { error: "invalid_request" },
        { status: 400, headers: corsHeaders },
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

    const device = authenticatedDevice[0] as {
      business_id: string;
      branch_id: string;
    };
    const table =
      body.request_type === "expense"
        ? "admin_expense_requests"
        : "admin_stock_adjustment_requests";

    const updatePayload = {
      status: body.status,
      source_device_id: deviceId,
      local_public_id:
        typeof body.local_public_id === "string" ? body.local_public_id : null,
      error_message:
        typeof body.error_message === "string"
          ? body.error_message.slice(0, 500)
          : null,
      applied_at: new Date().toISOString(),
    };

    const { data, error } = await admin
      .from(table)
      .update(updatePayload)
      .eq("id", body.request_id)
      .eq("business_id", device.business_id)
      .eq("branch_id", device.branch_id)
      .eq("status", "pending")
      .select("id,status")
      .single();

    if (error) throw error;

    return Response.json(
      { acknowledged: true, request: data },
      {
        headers: {
          ...corsHeaders,
          "content-type": "application/json",
          "cache-control": "no-store",
        },
      },
    );
  } catch (error) {
    console.error("Device ack request failed", error);
    return Response.json(
      { error: "ack_failed" },
      { status: 500, headers: corsHeaders },
    );
  }
});
