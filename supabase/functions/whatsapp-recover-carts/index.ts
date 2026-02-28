import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers":
        "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// ============ SEND ADAPTER ============

function isLocalUrl(url: string): boolean {
    try {
        const u = new URL(url);
        return u.hostname === "localhost" || u.hostname === "127.0.0.1" || u.hostname === "0.0.0.0";
    } catch {
        return false;
    }
}

async function sendMessage(
    provider: string,
    apiUrl: string,
    phone: string,
    text: string,
    apiKey: string,
    instanceName?: string
): Promise<boolean> {
    if (isLocalUrl(apiUrl)) return false;

    try {
        let url = "";
        let headers: Record<string, string> = { "Content-Type": "application/json" };
        let body: any = {};

        switch (provider) {
            case "evolution": {
                const instName = instanceName || "whatsapp-gestao";
                url = `${apiUrl}/message/sendText/${instName}`;
                headers["apikey"] = apiKey;
                body = {
                    number: phone.includes("@") ? phone : `${phone}@s.whatsapp.net`,
                    text,
                };
                break;
            }
            case "zapi":
                url = `${apiUrl}/send-text`;
                headers["Client-Token"] = apiKey;
                body = { phone, message: text };
                break;
            case "twilio":
                url = apiUrl;
                const [sid, token] = apiKey.split(":");
                headers["Authorization"] = `Basic ${btoa(`${sid}:${token}`)}`;
                headers["Content-Type"] = "application/x-www-form-urlencoded";
                body = new URLSearchParams({ To: `whatsapp:+${phone}`, Body: text }).toString();
                break;
            case "meta":
                url = `${apiUrl}/messages`;
                headers["Authorization"] = `Bearer ${apiKey}`;
                body = { messaging_product: "whatsapp", to: phone, type: "text", text: { body: text } };
                break;
            default:
                url = `${apiUrl}/send`;
                headers["Authorization"] = `Bearer ${apiKey}`;
                body = { phone, message: text };
        }

        const resp = await fetch(url, {
            method: "POST",
            headers,
            body: typeof body === "string" ? body : JSON.stringify(body),
        });
        return resp.ok;
    } catch (e) {
        console.error("[SEND] Error:", e);
        return false;
    }
}

// ============ HANDLER ============

serve(async (req) => {
    if (req.method === "OPTIONS") {
        return new Response(null, { headers: corsHeaders });
    }

    try {
        const { unit_id } = await req.json();
        if (!unit_id) throw new Error("Missing unit_id");

        const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
        const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
        const supabase = createClient(supabaseUrl, serviceKey);

        // 1. Get the primary active Whatsapp Channel for this unit
        const { data: channel } = await supabase
            .from("whatsapp_channels")
            .select("*")
            .eq("unit_id", unit_id)
            .eq("is_active", true)
            .limit(1)
            .single();

        if (!channel || !channel.api_url || !channel.api_key_ref) {
            throw new Error("Nenhum canal ativo e configurado encontrado para este ambiente.");
        }

        // 2. Scan for 'draft' orders (abandoned carts)
        // Carts that have been draft for more than 15 minutes
        const fifteenMinsAgo = new Date(Date.now() - 15 * 60 * 1000).toISOString();

        const { data: abandonedOrders } = await supabase
            .from("whatsapp_orders")
            .select("*, contact:whatsapp_contacts(*), conversation:whatsapp_conversations(*)")
            .eq("unit_id", unit_id)
            .eq("status", "draft")
            .lt("updated_at", fifteenMinsAgo);

        if (!abandonedOrders || abandonedOrders.length === 0) {
            return new Response(JSON.stringify({ ok: true, recovered_count: 0 }), {
                status: 200,
                headers: { ...corsHeaders, "Content-Type": "application/json" },
            });
        }

        let recoveredCount = 0;

        for (const order of abandonedOrders) {
            if (!order.contact?.phone) continue;

            const itemsText = (order.items || [])
                .map((i: any) => `• ${i.qty}x ${i.name}`)
                .join("\\n");

            const firstName = order.contact.name ? order.contact.name.split(" ")[0] : "aí";

            const recoveryMsg = `Oi ${firstName}, tudo bem? 😊\\nNotamos que você começou um pedido conosco mas não chegou a finalizar:\\n\\n${itemsText}\\n\\n*Total: R$ ${order.total.toFixed(2)}*\\n\\nAconteceu alguma coisa? Posso ajudar com mais alguma dúvida ou confirmar o pedido para preparar e te enviar?`;

            // Dispatch to external API
            const sent = await sendMessage(
                channel.provider,
                channel.api_url,
                order.contact.phone,
                recoveryMsg,
                channel.api_key_ref,
                channel.instance_name
            );

            if (sent) {
                // Save msg to conversation history
                if (order.conversation?.[0]?.id) {
                    await supabase.from("whatsapp_messages").insert({
                        conversation_id: order.conversation[0].id,
                        direction: "outbound",
                        sender_type: "ai",
                        content: recoveryMsg,
                    });

                    // Log for AI context
                    await supabase.from("whatsapp_ai_logs").insert({
                        conversation_id: order.conversation[0].id,
                        action: "cart_recovery",
                        reasoning: "Disparo automático para recuperação de carrinho após inatividade.",
                    });
                }

                // Touch the updated_at so we don't spam if they don't reply immediately
                await supabase
                    .from("whatsapp_orders")
                    .update({ updated_at: new Date().toISOString() })
                    .eq("id", order.id);

                recoveredCount++;
            }
        }

        return new Response(JSON.stringify({ ok: true, recovered_count: recoveredCount }), {
            status: 200,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
    } catch (e: any) {
        console.error("recover-error:", e.message);
        return new Response(JSON.stringify({ ok: false, error: e.message }), {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
    }
});
