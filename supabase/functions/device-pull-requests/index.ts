import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";

const MAX_REQUESTS = 50;

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
    return Response.json(
      { error: "unauthorized" },
      { status: 401, headers: corsHeaders },
    );
  }

  try {
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

    const [expenses, stockAdjustments] = await Promise.all([
      admin
        .from("admin_expense_requests")
        .select(
          "id,amount,category,description,expense_date,created_at,created_by",
        )
        .eq("business_id", device.business_id)
        .eq("branch_id", device.branch_id)
        .eq("status", "pending")
        .order("created_at", { ascending: true })
        .limit(MAX_REQUESTS),
      admin
        .from("admin_stock_adjustment_requests")
        .select(
          "id,stock_product_public_id,stock_product_name,mode,quantity,reason,note,created_at,created_by",
        )
        .eq("business_id", device.business_id)
        .eq("branch_id", device.branch_id)
        .eq("status", "pending")
        .order("created_at", { ascending: true })
        .limit(MAX_REQUESTS),
    ]);

    if (expenses.error) throw expenses.error;
    if (stockAdjustments.error) throw stockAdjustments.error;

    return Response.json(
      {
        server_time: new Date().toISOString(),
        expense_requests: expenses.data ?? [],
        stock_adjustment_requests: stockAdjustments.data ?? [],
      },
      {
        headers: {
          ...corsHeaders,
          "content-type": "application/json",
          "cache-control": "no-store",
        },
      },
    );
  } catch (error) {
    console.error("Device pull requests failed", error);
    return Response.json(
      { error: "pull_failed" },
      { status: 500, headers: corsHeaders },
    );
  }
});
