import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT_MAX = 10;
const RATE_LIMIT_WINDOW_MS = 60_000;
const MAX_RETRIES = 5;
const RETRY_DELAY_MS = 2000;

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return false;
  }
  entry.count++;
  return entry.count > RATE_LIMIT_MAX;
}

setInterval(() => {
  const now = Date.now();
  for (const [ip, entry] of rateLimitMap) {
    if (now > entry.resetAt) rateLimitMap.delete(ip);
  }
}, 300_000);

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const clientIp = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  if (isRateLimited(clientIp)) {
    return new Response(
      JSON.stringify({ error: "Muitas tentativas. Tente novamente em 1 minuto." }),
      { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  const url = new URL(req.url);
  const action = url.searchParams.get("action");

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  try {
    if (action === "confirm-qr") {
      const { order_id, token } = await req.json();

      if (!order_id || !token) {
        return new Response(
          JSON.stringify({ error: "order_id e token são obrigatórios" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const { data: qr, error: qrError } = await supabase
        .from("tablet_qr_confirmations")
        .select("*")
        .eq("order_id", order_id)
        .eq("token", token)
        .single();

      if (qrError || !qr) {
        return new Response(
          JSON.stringify({ error: "Token inválido ou pedido não encontrado" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      if (qr.used) {
        return new Response(
          JSON.stringify({ error: "Este QR Code já foi utilizado" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      if (new Date(qr.expires_at) < new Date()) {
        return new Response(
          JSON.stringify({ error: "QR Code expirado. Gere um novo." }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      await supabase
        .from("tablet_qr_confirmations")
        .update({ used: true, used_at: new Date().toISOString() })
        .eq("id", qr.id);

      await supabase
        .from("tablet_orders")
        .update({ status: "confirmed" })
        .eq("id", order_id);

      const pdvResult = await sendToPDVWithRetry(supabase, order_id);

      return new Response(
        JSON.stringify({ success: true, pdv_sent: pdvResult.success, pdv_error: pdvResult.error }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (action === "send-to-pdv" || action === "retry-pdv") {
      const { order_id } = await req.json();

      if (!order_id) {
        return new Response(
          JSON.stringify({ error: "order_id é obrigatório" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Reset retry count on manual retry
      if (action === "retry-pdv") {
        await supabase
          .from("tablet_orders")
          .update({ retry_count: 0 })
          .eq("id", order_id);
      }

      const result = await sendToPDVWithRetry(supabase, order_id);

      return new Response(
        JSON.stringify(result),
        { status: result.success ? 200 : 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ error: "Ação inválida. Use: confirm-qr, send-to-pdv, retry-pdv" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("Error:", err);
    return new Response(
      JSON.stringify({ error: "Erro interno do servidor" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

async function sendToPDVWithRetry(supabase: any, orderId: string) {
  let lastResult = { success: false, error: "Nenhuma tentativa realizada" };

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    // Update retry count
    await supabase
      .from("tablet_orders")
      .update({ retry_count: attempt })
      .eq("id", orderId);

    lastResult = await sendToPDV(supabase, orderId);

    if (lastResult.success) {
      return lastResult;
    }

    // Don't retry on non-recoverable errors
    if (lastResult.error?.includes("não encontrado") || 
        lastResult.error?.includes("código PDV válido") ||
        lastResult.error?.includes("Configuração do PDV")) {
      break;
    }

    // Wait before retrying (exponential backoff)
    if (attempt < MAX_RETRIES) {
      await sleep(RETRY_DELAY_MS * attempt);
    }
  }

  return lastResult;
}

async function sendToPDV(supabase: any, orderId: string) {
  try {
    const { data: order, error: orderError } = await supabase
      .from("tablet_orders")
      .select("*, tablet_order_items(*, tablet_products(codigo_pdv, name))")
      .eq("id", orderId)
      .single();

    if (orderError || !order) {
      await supabase
        .from("tablet_orders")
        .update({ status: "error", error_message: "Pedido não encontrado" })
        .eq("id", orderId);
      return { success: false, error: "Pedido não encontrado" };
    }

    const { data: config, error: configError } = await supabase
      .from("tablet_pdv_config")
      .select("*")
      .eq("unit_id", order.unit_id)
      .eq("is_active", true)
      .single();

    if (configError || !config) {
      await supabase
        .from("tablet_orders")
        .update({ status: "error", error_message: "Configuração do PDV não encontrada" })
        .eq("id", orderId);
      return { success: false, error: "Configuração do PDV não encontrada" };
    }

    // Build payload - support regular items and combos (CMB- prefix)
    const items = (order.tablet_order_items || [])
      .filter((item: any) => item.tablet_products?.codigo_pdv)
      .map((item: any) => {
        const code = item.tablet_products.codigo_pdv;
        const isCombo = code.startsWith("CMB-");
        return {
          codigo_pdv: isCombo ? code.substring(4) : code,
          quantidade: item.quantity,
          observacao: item.notes || "",
          tipo: isCombo ? "combo" : "produto",
        };
      });

    if (items.length === 0) {
      await supabase
        .from("tablet_orders")
        .update({ status: "error", error_message: "Nenhum item com código PDV válido" })
        .eq("id", orderId);
      return { success: false, error: "Nenhum item com código PDV válido" };
    }

    const payload = {
      id_externo_pedido: order.id,
      mesa: order.table_number,
      itens: items,
      ...(config.payment_code ? { codigo_pagamento: config.payment_code } : {}),
    };

    const response = await fetch(config.hub_url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${config.auth_key}`,
      },
      body: JSON.stringify(payload),
    });

    const responseData = await response.text();

    if (response.ok) {
      await supabase
        .from("tablet_orders")
        .update({
          status: "sent_to_pdv",
          pdv_response: { status: response.status, body: responseData, payload },
          error_message: null,
        })
        .eq("id", orderId);
      return { success: true };
    } else {
      const errorMsg = `Hub retornou ${response.status}: ${responseData.substring(0, 200)}`;
      await supabase
        .from("tablet_orders")
        .update({
          status: "error",
          pdv_response: { status: response.status, body: responseData, payload },
          error_message: errorMsg,
        })
        .eq("id", orderId);
      return { success: false, error: errorMsg };
    }
  } catch (err: any) {
    const errorMsg = `Erro de conexão: ${err.message}`;
    await supabase
      .from("tablet_orders")
      .update({ status: "error", error_message: errorMsg })
      .eq("id", orderId);
    return { success: false, error: errorMsg };
  }
}
