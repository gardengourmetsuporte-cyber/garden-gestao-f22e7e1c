import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// ============ Provider Adapters ============

interface IncomingMessage {
  phone: string;
  content: string;
  name?: string;
  provider: string;
  unitChannelId?: string;
}

function parseIncoming(provider: string, body: any): IncomingMessage | null {
  try {
    switch (provider) {
      case "evolution":
        // Evolution API v2 format
        if (body?.data?.message?.conversation || body?.data?.message?.extendedTextMessage?.text) {
          return {
            phone: body.data.key.remoteJid?.replace("@s.whatsapp.net", "") || "",
            content: body.data.message.conversation || body.data.message.extendedTextMessage?.text || "",
            name: body.data.pushName || undefined,
            provider: "evolution",
          };
        }
        return null;

      case "zapi":
        if (body?.text?.message) {
          return {
            phone: body.phone || "",
            content: body.text.message || "",
            name: body.senderName || undefined,
            provider: "zapi",
          };
        }
        return null;

      case "twilio":
        return {
          phone: (body?.From || "").replace("whatsapp:", "").replace("+", ""),
          content: body?.Body || "",
          name: body?.ProfileName || undefined,
          provider: "twilio",
        };

      case "meta":
        const entry = body?.entry?.[0]?.changes?.[0]?.value;
        const msg = entry?.messages?.[0];
        if (msg?.type === "text") {
          const contact = entry?.contacts?.[0];
          return {
            phone: msg.from || "",
            content: msg.text?.body || "",
            name: contact?.profile?.name || undefined,
            provider: "meta",
          };
        }
        return null;

      default:
        // Generic: try common fields
        return {
          phone: body?.phone || body?.from || "",
          content: body?.message || body?.text || body?.content || "",
          name: body?.name || body?.sender_name || undefined,
          provider: provider || "unknown",
        };
    }
  } catch {
    return null;
  }
}

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
  apiKey: string
): Promise<boolean> {
  // Skip sending if API URL is localhost (unreachable from cloud)
  if (isLocalUrl(apiUrl)) {
    console.warn("[SEND] Skipping send — api_url is localhost (unreachable from cloud). Message saved in DB. Update api_url to a public URL to enable sending.");
    return false;
  }

  try {
    let url = "";
    let headers: Record<string, string> = { "Content-Type": "application/json" };
    let body: any = {};

    switch (provider) {
      case "evolution":
        url = `${apiUrl}/message/sendText`;
        headers["apikey"] = apiKey;
        body = {
          number: phone.includes("@") ? phone : `${phone}@s.whatsapp.net`,
          text,
        };
        break;

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
        body = new URLSearchParams({
          To: `whatsapp:+${phone}`,
          Body: text,
        }).toString();
        break;

      case "meta":
        url = `${apiUrl}/messages`;
        headers["Authorization"] = `Bearer ${apiKey}`;
        body = {
          messaging_product: "whatsapp",
          to: phone,
          type: "text",
          text: { body: text },
        };
        break;

      default:
        url = `${apiUrl}/send`;
        headers["Authorization"] = `Bearer ${apiKey}`;
        body = { phone, message: text };
    }

    console.log("[SEND] Sending to:", url);
    const resp = await fetch(url, {
      method: "POST",
      headers,
      body: typeof body === "string" ? body : JSON.stringify(body),
    });
    console.log("[SEND] Response status:", resp.status);
    return resp.ok;
  } catch (e) {
    console.error("[SEND] Error:", e);
    return false;
  }
}

// ============ Business Hours Check (BRT = UTC-3) ============

function isWithinBusinessHours(hours: any): boolean {
  if (!hours) return true; // null = 24/7
  const now = new Date();
  // Convert to BRT (UTC-3)
  const brt = new Date(now.getTime() - 3 * 60 * 60 * 1000);
  const days = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];
  const dayKey = days[brt.getUTCDay()];
  const dayConfig = hours[dayKey];
  if (!dayConfig || !dayConfig.open || !dayConfig.close) return false;

  const currentMinutes = brt.getUTCHours() * 60 + brt.getUTCMinutes();
  const [openH, openM] = dayConfig.open.split(":").map(Number);
  const [closeH, closeM] = dayConfig.close.split(":").map(Number);
  const openMinutes = openH * 60 + openM;
  const closeMinutes = closeH * 60 + closeM;

  return currentMinutes >= openMinutes && currentMinutes <= closeMinutes;
}

// ============ Main Handler ============

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, serviceKey);
  const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

  try {
    const body = await req.json();
    console.log("[WEBHOOK] Received payload:", JSON.stringify(body).substring(0, 500));

    // Determine provider from query param or body
    const url = new URL(req.url);
    const providerParam = url.searchParams.get("provider") || "evolution";
    const channelIdParam = url.searchParams.get("channel_id");
    console.log("[WEBHOOK] Provider:", providerParam, "Channel ID:", channelIdParam);

    // Find channel
    let channel: any = null;
    if (channelIdParam) {
      const { data } = await supabase
        .from("whatsapp_channels")
        .select("*")
        .eq("id", channelIdParam)
        .eq("is_active", true)
        .single();
      channel = data;
    }

    if (!channel) {
      // Try to find an active channel for this provider
      const { data } = await supabase
        .from("whatsapp_channels")
        .select("*")
        .eq("provider", providerParam)
        .eq("is_active", true)
        .limit(1)
        .single();
      channel = data;
    }

    if (!channel) {
      console.log("[WEBHOOK] No active channel found for provider:", providerParam);
      return new Response(JSON.stringify({ ok: false, error: "No active channel" }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log("[WEBHOOK] Channel found:", channel.id, "Provider:", channel.provider, "API URL:", channel.api_url);

    // Parse incoming message
    const incoming = parseIncoming(channel.provider, body);
    console.log("[WEBHOOK] Parsed message:", incoming ? JSON.stringify(incoming).substring(0, 300) : "null (skipped)");
    
    if (!incoming || !incoming.phone || !incoming.content) {
      console.log("[WEBHOOK] Skipping - no valid message parsed from event");
      return new Response(JSON.stringify({ ok: true, skipped: true }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const unitId = channel.unit_id;

    // Upsert contact
    const { data: existingContact } = await supabase
      .from("whatsapp_contacts")
      .select("*")
      .eq("unit_id", unitId)
      .eq("phone", incoming.phone)
      .single();

    let contactId: string;
    if (existingContact) {
      contactId = existingContact.id;
      await supabase
        .from("whatsapp_contacts")
        .update({
          name: incoming.name || existingContact.name,
          last_interaction_at: new Date().toISOString(),
        })
        .eq("id", contactId);
    } else {
      const { data: newContact } = await supabase
        .from("whatsapp_contacts")
        .insert({
          unit_id: unitId,
          phone: incoming.phone,
          name: incoming.name || null,
        })
        .select("id")
        .single();
      contactId = newContact!.id;
    }

    // Find or create active conversation
    const { data: activeConv } = await supabase
      .from("whatsapp_conversations")
      .select("*")
      .eq("contact_id", contactId)
      .eq("channel_id", channel.id)
      .neq("status", "closed")
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    let conversationId: string;
    if (activeConv) {
      conversationId = activeConv.id;
    } else {
      const { data: newConv } = await supabase
        .from("whatsapp_conversations")
        .insert({
          channel_id: channel.id,
          contact_id: contactId,
          unit_id: unitId,
          status: "ai_active",
        })
        .select("id")
        .single();
      conversationId = newConv!.id;
    }

    // Save inbound message
    const { data: savedMsg } = await supabase
      .from("whatsapp_messages")
      .insert({
        conversation_id: conversationId,
        direction: "inbound",
        sender_type: "customer",
        content: incoming.content,
      })
      .select("id")
      .single();

    // Check conversation status - if human_active, don't use AI
    const convStatus = activeConv?.status || "ai_active";
    if (convStatus === "human_active") {
      return new Response(JSON.stringify({ ok: true, mode: "human" }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check business hours
    if (!isWithinBusinessHours(channel.business_hours)) {
      const fallback = channel.fallback_message || "Estamos fora do horário de atendimento.";
      
      // Save outbound
      await supabase.from("whatsapp_messages").insert({
        conversation_id: conversationId,
        direction: "outbound",
        sender_type: "ai",
        content: fallback,
      });

      // Log
      await supabase.from("whatsapp_ai_logs").insert({
        conversation_id: conversationId,
        message_id: savedMsg?.id,
        action: "off_hours",
        reasoning: "Mensagem recebida fora do horário de funcionamento.",
      });

      // Send via provider
      if (channel.api_url && channel.api_key_ref) {
        await sendMessage(channel.provider, channel.api_url, incoming.phone, fallback, channel.api_key_ref);
      }

      return new Response(JSON.stringify({ ok: true, action: "off_hours" }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ============ AI Processing ============

    if (!LOVABLE_API_KEY) {
      console.error("LOVABLE_API_KEY not configured");
      return new Response(JSON.stringify({ ok: false, error: "AI not configured" }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Gather context
    const [{ data: recentMessages }, { data: menuItems }, { data: draftOrder }, { data: knowledgeArticles }] = await Promise.all([
      supabase
        .from("whatsapp_messages")
        .select("*")
        .eq("conversation_id", conversationId)
        .order("created_at", { ascending: false })
        .limit(20),
      supabase
        .from("tablet_products")
        .select("id, name, price, category, description, is_active")
        .eq("unit_id", unitId)
        .eq("is_active", true)
        .order("category")
        .order("sort_order"),
      supabase
        .from("whatsapp_orders")
        .select("*")
        .eq("conversation_id", conversationId)
        .eq("status", "draft")
        .single(),
      supabase
        .from("whatsapp_knowledge_base")
        .select("title, content, category")
        .eq("unit_id", unitId)
        .eq("is_active", true)
        .order("sort_order"),
    ]);

    // Build messages for AI
    const menuFormatted = (menuItems || [])
      .map((p: any) => `- ${p.name} (${p.category}): R$ ${p.price.toFixed(2)}${p.description ? ` - ${p.description}` : ""}`)
      .join("\n");

    const knowledgeFormatted = (knowledgeArticles || [])
      .map((a: any) => `[${a.title}]\n${a.content}`)
      .join("\n\n");

    const historyMessages = (recentMessages || [])
      .reverse()
      .map((m: any) => ({
        role: m.sender_type === "customer" ? "user" : "assistant",
        content: m.content,
      }));

    const systemPrompt = `${channel.ai_personality || "Você é um assistente virtual."}

REGRAS IMPORTANTES:
- Nunca invente informações sobre produtos, preços ou disponibilidade.
- Sempre consulte o cardápio fornecido antes de responder sobre produtos.
- Use a BASE DE CONHECIMENTO para responder perguntas gerais (horários, endereço, pagamento, etc).
- Se não souber responder algo, encaminhe para um atendente humano.
- Seja simpático, claro e objetivo.
- Responda em português brasileiro.

${knowledgeFormatted ? `BASE DE CONHECIMENTO DO RESTAURANTE:\n\n${knowledgeFormatted}\n` : ""}
CARDÁPIO ATUAL:
${menuFormatted || "Nenhum produto disponível no momento."}

${draftOrder ? `PEDIDO EM ANDAMENTO:
Itens: ${JSON.stringify(draftOrder.items)}
Total: R$ ${draftOrder.total}` : "Não há pedido em andamento."}

Use as tools disponíveis para:
- Buscar produtos no cardápio
- Criar/atualizar pedidos
- Encaminhar para atendente humano quando necessário`;

    const tools = [
      {
        type: "function",
        function: {
          name: "search_menu",
          description: "Busca produtos no cardápio por nome ou categoria",
          parameters: {
            type: "object",
            properties: {
              query: { type: "string", description: "Termo de busca" },
            },
            required: ["query"],
          },
        },
      },
      {
        type: "function",
        function: {
          name: "create_order",
          description: "Cria ou atualiza um pedido com os itens selecionados pelo cliente",
          parameters: {
            type: "object",
            properties: {
              items: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    product_id: { type: "string" },
                    name: { type: "string" },
                    qty: { type: "number" },
                    price: { type: "number" },
                  },
                  required: ["product_id", "name", "qty", "price"],
                },
              },
              notes: { type: "string", description: "Observações do cliente" },
            },
            required: ["items"],
          },
        },
      },
      {
        type: "function",
        function: {
          name: "escalate_to_human",
          description: "Encaminha a conversa para um atendente humano",
          parameters: {
            type: "object",
            properties: {
              reason: { type: "string", description: "Motivo da escalação" },
            },
            required: ["reason"],
          },
        },
      },
    ];

    // Call AI
    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          ...historyMessages,
        ],
        tools,
        stream: false,
      }),
    });

    if (!aiResponse.ok) {
      const errText = await aiResponse.text();
      console.error("AI error:", aiResponse.status, errText);

      if (aiResponse.status === 429 || aiResponse.status === 402) {
        // Rate limit or payment issue - respond gracefully
        const fallbackMsg = "Desculpe, nosso sistema está temporariamente indisponível. Por favor, tente novamente em alguns minutos.";
        await supabase.from("whatsapp_messages").insert({
          conversation_id: conversationId,
          direction: "outbound",
          sender_type: "ai",
          content: fallbackMsg,
        });
        if (channel.api_url && channel.api_key_ref) {
          await sendMessage(channel.provider, channel.api_url, incoming.phone, fallbackMsg, channel.api_key_ref);
        }
      }

      return new Response(JSON.stringify({ ok: false, error: "AI error" }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const aiData = await aiResponse.json();
    const choice = aiData.choices?.[0];
    let responseText = "";
    let actionType = "respond";
    let reasoning = "";

    // Handle tool calls
    if (choice?.message?.tool_calls?.length > 0) {
      for (const toolCall of choice.message.tool_calls) {
        const fnName = toolCall.function.name;
        const args = JSON.parse(toolCall.function.arguments || "{}");

        if (fnName === "search_menu") {
          const query = args.query?.toLowerCase() || "";
          const results = (menuItems || []).filter(
            (p: any) =>
              p.name.toLowerCase().includes(query) ||
              p.category.toLowerCase().includes(query) ||
              (p.description || "").toLowerCase().includes(query)
          );
          reasoning = `Buscou "${args.query}" - encontrou ${results.length} resultados`;
          
          if (results.length > 0) {
            responseText = `Encontrei ${results.length} opção(ões):\n\n` +
              results.map((p: any) => `• *${p.name}* - R$ ${p.price.toFixed(2)}${p.description ? `\n  ${p.description}` : ""}`).join("\n\n");
          } else {
            responseText = `Desculpe, não encontrei "${args.query}" no cardápio. Posso ajudar com outra coisa?`;
          }

        } else if (fnName === "create_order") {
          actionType = "create_order";
          const orderItems = args.items || [];
          const total = orderItems.reduce((sum: number, i: any) => sum + i.price * i.qty, 0);

          if (draftOrder) {
            await supabase.from("whatsapp_orders").update({
              items: orderItems,
              total,
              notes: args.notes || draftOrder.notes,
            }).eq("id", draftOrder.id);
          } else {
            await supabase.from("whatsapp_orders").insert({
              conversation_id: conversationId,
              contact_id: contactId,
              unit_id: unitId,
              items: orderItems,
              total,
              notes: args.notes || null,
              status: "draft",
            });
          }

          // Update contact order count
          await supabase.from("whatsapp_contacts").update({
            total_orders: (existingContact?.total_orders || 0) + 1,
          }).eq("id", contactId);

          responseText = `Pedido montado! 🛒\n\n` +
            orderItems.map((i: any) => `• ${i.qty}x ${i.name} - R$ ${(i.price * i.qty).toFixed(2)}`).join("\n") +
            `\n\n*Total: R$ ${total.toFixed(2)}*\n\nDeseja confirmar o pedido?`;
          reasoning = `Criou pedido com ${orderItems.length} item(ns), total R$ ${total.toFixed(2)}`;

        } else if (fnName === "escalate_to_human") {
          actionType = "escalate";
          await supabase.from("whatsapp_conversations").update({
            status: "human_active",
          }).eq("id", conversationId);

          responseText = `Vou transferir você para um de nossos atendentes. Aguarde um momento! 🙋‍♂️`;
          reasoning = `Escalação: ${args.reason}`;
        }
      }
    } else {
      // Regular text response
      responseText = choice?.message?.content || "Desculpe, não consegui processar sua mensagem.";
      reasoning = "Resposta direta sem tool call";
    }

    // Save outbound message
    const { data: outMsg } = await supabase.from("whatsapp_messages").insert({
      conversation_id: conversationId,
      direction: "outbound",
      sender_type: "ai",
      content: responseText,
    }).select("id").single();

    // Log AI decision
    await supabase.from("whatsapp_ai_logs").insert({
      conversation_id: conversationId,
      message_id: savedMsg?.id,
      action: actionType,
      reasoning,
      context_used: {
        menu_items_count: menuItems?.length || 0,
        history_messages_count: recentMessages?.length || 0,
        has_draft_order: !!draftOrder,
      },
    });

    // Send via provider
    if (channel.api_url && channel.api_key_ref) {
      await sendMessage(channel.provider, channel.api_url, incoming.phone, responseText, channel.api_key_ref);
    }

    return new Response(
      JSON.stringify({ ok: true, action: actionType }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (e) {
    console.error("webhook error:", e);
    return new Response(
      JSON.stringify({ ok: false, error: e instanceof Error ? e.message : "Unknown error" }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
