import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
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

      // Validate QR token
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

      // Mark token as used
      await supabase
        .from("tablet_qr_confirmations")
        .update({ used: true, used_at: new Date().toISOString() })
        .eq("id", qr.id);

      // Update order status to confirmed
      await supabase
        .from("tablet_orders")
        .update({ status: "confirmed" })
        .eq("id", order_id);

      // Auto-send to PDV
      const pdvResult = await sendToPDV(supabase, order_id);

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

      const result = await sendToPDV(supabase, order_id);

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

async function sendToPDV(supabase: any, orderId: string) {
  try {
    // Get order with items
    const { data: order, error: orderError } = await supabase
      .from("tablet_orders")
      .select("*, tablet_order_items(*, tablet_products(codigo_pdv))")
      .eq("id", orderId)
      .single();

    if (orderError || !order) {
      await supabase
        .from("tablet_orders")
        .update({ status: "error", error_message: "Pedido não encontrado" })
        .eq("id", orderId);
      return { success: false, error: "Pedido não encontrado" };
    }

    // Get PDV config for this unit
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

    // Build payload for Colibri Hub
    const items = (order.tablet_order_items || [])
      .filter((item: any) => item.tablet_products?.codigo_pdv)
      .map((item: any) => ({
        codigo_pdv: item.tablet_products.codigo_pdv,
        quantidade: item.quantity,
        observacao: item.notes || "",
      }));

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
    };

    // Send to Colibri Hub
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
          pdv_response: { status: response.status, body: responseData },
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
          pdv_response: { status: response.status, body: responseData },
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
