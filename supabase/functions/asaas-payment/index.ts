import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const ASAAS_PROD_URL = "https://api.asaas.com/v3";
const ASAAS_SANDBOX_URL = "https://sandbox.asaas.com/api/v3";

function getSupabase(serviceRole = false) {
  const url = Deno.env.get("SUPABASE_URL")!;
  const key = serviceRole
    ? Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    : Deno.env.get("SUPABASE_ANON_KEY")!;
  return createClient(url, key);
}

async function getAsaasConfig(unitId: string) {
  const sb = getSupabase(true);
  const { data } = await sb
    .from("asaas_config")
    .select("*")
    .eq("unit_id", unitId)
    .maybeSingle();
  if (!data || !data.is_active) return null;

  const apiKey = Deno.env.get("ASAAS_API_KEY");
  if (!apiKey) return null;

  const baseUrl =
    data.environment === "production" ? ASAAS_PROD_URL : ASAAS_SANDBOX_URL;
  return { ...data, apiKey, baseUrl };
}

async function asaasFetch(
  baseUrl: string,
  apiKey: string,
  path: string,
  method: string,
  body?: Record<string, unknown>
) {
  const res = await fetch(`${baseUrl}${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      access_token: apiKey,
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json();
  if (!res.ok) {
    console.error("[asaas-payment] ASAAS API error:", JSON.stringify(data));
    throw new Error(data?.errors?.[0]?.description || "ASAAS API error");
  }
  return data;
}

// Find or create ASAAS customer
async function findOrCreateCustomer(
  baseUrl: string,
  apiKey: string,
  name: string,
  email?: string | null,
  cpf?: string | null
) {
  // Try to find by email
  if (email) {
    const found = await asaasFetch(
      baseUrl,
      apiKey,
      `/customers?email=${encodeURIComponent(email)}`,
      "GET"
    );
    if (found?.data?.length > 0) return found.data[0];
  }

  // Create new
  const customer = await asaasFetch(baseUrl, apiKey, "/customers", "POST", {
    name: name || "Cliente",
    email: email || undefined,
    cpfCnpj: cpf || undefined,
  });
  return customer;
}

// Create payment
async function createPayment(req: Request) {
  const { order_id, billing_type, cpf } = await req.json();

  if (!order_id || !billing_type) {
    return new Response(
      JSON.stringify({ error: "order_id and billing_type required" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  const sb = getSupabase(true);

  // Get order
  const { data: order, error: orderErr } = await sb
    .from("tablet_orders")
    .select("*")
    .eq("id", order_id)
    .single();

  if (orderErr || !order) {
    return new Response(
      JSON.stringify({ error: "Order not found" }),
      { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  const config = await getAsaasConfig(order.unit_id);
  if (!config) {
    return new Response(
      JSON.stringify({ error: "ASAAS not configured for this unit" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  // Find/create customer in ASAAS
  const customerName = (order as any).customer_name || "Cliente";
  const customerEmail = (order as any).customer_email || null;
  const asaasCustomer = await findOrCreateCustomer(
    config.baseUrl,
    config.apiKey,
    customerName,
    customerEmail,
    cpf
  );

  // Determine due date (today + 1 day for boleto, today for pix/card)
  const now = new Date();
  const dueDate = new Date(now);
  if (billing_type === "BOLETO") dueDate.setDate(dueDate.getDate() + 3);
  else dueDate.setDate(dueDate.getDate() + 1);
  const dueDateStr = dueDate.toISOString().split("T")[0];

  // Create payment
  const paymentBody: Record<string, unknown> = {
    customer: asaasCustomer.id,
    billingType: billing_type, // PIX, CREDIT_CARD, BOLETO
    value: (order as any).total || 0,
    dueDate: dueDateStr,
    description: `Pedido #${(order as any).order_number || order_id.slice(0, 8)}`,
    externalReference: order_id,
  };

  const payment = await asaasFetch(
    config.baseUrl,
    config.apiKey,
    "/payments",
    "POST",
    paymentBody
  );

  // If PIX, get QR code
  let pixData = null;
  if (billing_type === "PIX" && payment.id) {
    try {
      pixData = await asaasFetch(
        config.baseUrl,
        config.apiKey,
        `/payments/${payment.id}/pixQrCode`,
        "GET"
      );
    } catch (e) {
      console.warn("[asaas-payment] PIX QR code fetch failed:", e);
    }
  }

  // Update order with payment info
  await sb
    .from("tablet_orders")
    .update({
      payment_method: billing_type.toLowerCase(),
      payment_status: "pending",
      payment_link: payment.invoiceUrl || payment.bankSlipUrl || null,
      asaas_payment_id: payment.id,
    } as any)
    .eq("id", order_id);

  return new Response(
    JSON.stringify({
      payment_id: payment.id,
      status: payment.status,
      invoice_url: payment.invoiceUrl,
      bank_slip_url: payment.bankSlipUrl,
      pix_qr_code: pixData?.encodedImage || null,
      pix_copia_e_cola: pixData?.payload || null,
      due_date: dueDateStr,
    }),
    { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
}

// Check payment status
async function checkStatus(req: Request) {
  const { order_id } = await req.json();
  if (!order_id) {
    return new Response(
      JSON.stringify({ error: "order_id required" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  const sb = getSupabase(true);
  const { data: order } = await sb
    .from("tablet_orders")
    .select("asaas_payment_id, unit_id, payment_status, status")
    .eq("id", order_id)
    .single();

  if (!order || !(order as any).asaas_payment_id) {
    return new Response(
      JSON.stringify({ error: "No payment found" }),
      { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  const config = await getAsaasConfig((order as any).unit_id);
  if (!config) {
    return new Response(
      JSON.stringify({ payment_status: (order as any).payment_status }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  const payment = await asaasFetch(
    config.baseUrl,
    config.apiKey,
    `/payments/${(order as any).asaas_payment_id}`,
    "GET"
  );

  // Map ASAAS status to our status
  let paymentStatus = "pending";
  if (["RECEIVED", "CONFIRMED", "RECEIVED_IN_CASH"].includes(payment.status)) {
    paymentStatus = "confirmed";
  } else if (["OVERDUE"].includes(payment.status)) {
    paymentStatus = "overdue";
  } else if (["REFUNDED", "REFUND_REQUESTED"].includes(payment.status)) {
    paymentStatus = "refunded";
  }

  // Update order
  const updates: Record<string, unknown> = { payment_status: paymentStatus };
  if (paymentStatus === "confirmed" && (order as any).status === "awaiting_payment") {
    updates.status = "confirmed";
  }

  await sb.from("tablet_orders").update(updates as any).eq("id", order_id);

  return new Response(
    JSON.stringify({ payment_status: paymentStatus, asaas_status: payment.status }),
    { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
}

// Webhook from ASAAS
async function handleWebhook(req: Request) {
  const body = await req.json();
  const event = body?.event;
  const payment = body?.payment;

  if (!event || !payment?.externalReference) {
    return new Response("OK", { status: 200, headers: corsHeaders });
  }

  const sb = getSupabase(true);
  const orderId = payment.externalReference;

  let paymentStatus = "pending";
  if (
    ["PAYMENT_RECEIVED", "PAYMENT_CONFIRMED"].includes(event)
  ) {
    paymentStatus = "confirmed";
  } else if (event === "PAYMENT_OVERDUE") {
    paymentStatus = "overdue";
  } else if (["PAYMENT_REFUNDED", "PAYMENT_REFUND_IN_PROGRESS"].includes(event)) {
    paymentStatus = "refunded";
  }

  const updates: Record<string, unknown> = { payment_status: paymentStatus };

  // Auto-confirm order on payment
  if (paymentStatus === "confirmed") {
    const { data: order } = await sb
      .from("tablet_orders")
      .select("status")
      .eq("id", orderId)
      .single();
    if (order && (order as any).status === "awaiting_payment") {
      updates.status = "confirmed";
    }
  }

  await sb.from("tablet_orders").update(updates as any).eq("id", orderId);

  console.log(`[asaas-payment] Webhook processed: ${event} for order ${orderId}`);
  return new Response("OK", { status: 200, headers: corsHeaders });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const url = new URL(req.url);
  const action = url.searchParams.get("action");

  try {
    switch (action) {
      case "create-payment":
        return await createPayment(req);
      case "check-status":
        return await checkStatus(req);
      case "webhook":
        return await handleWebhook(req);
      default:
        return new Response(
          JSON.stringify({ error: "Invalid action" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
    }
  } catch (err: any) {
    console.error("[asaas-payment] Error:", err?.message || err);
    return new Response(
      JSON.stringify({ error: err?.message || "Internal error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
