import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

  try {
    // Validate auth
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: claimsData, error: claimsError } = await userClient.auth.getClaims(
      authHeader.replace("Bearer ", "")
    );
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userId = claimsData.claims.sub as string;

    // Use service role for DB operations
    const supabase = createClient(supabaseUrl, serviceKey);

    const { conversation_id, content } = await req.json();
    if (!conversation_id || !content) {
      return new Response(JSON.stringify({ error: "Missing conversation_id or content" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get conversation with channel and contact
    const { data: conv, error: convErr } = await supabase
      .from("whatsapp_conversations")
      .select("*, channel:whatsapp_channels(*), contact:whatsapp_contacts(*)")
      .eq("id", conversation_id)
      .single();

    if (convErr || !conv) {
      return new Response(JSON.stringify({ error: "Conversation not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Save message
    await supabase.from("whatsapp_messages").insert({
      conversation_id,
      direction: "outbound",
      sender_type: "human",
      content,
    });

    // Send via provider
    const channel = conv.channel;
    const contact = conv.contact;
    if (channel?.api_url && channel?.api_key_ref && contact?.phone) {
      const sendUrl = getSendUrl(channel.provider, channel.api_url, channel.instance_name);
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      let body: any = {};

      switch (channel.provider) {
        case "evolution":
          headers["apikey"] = channel.api_key_ref;
          body = { number: `${contact.phone}@s.whatsapp.net`, text: content };
          break;
        case "zapi":
          headers["Client-Token"] = channel.api_key_ref;
          body = { phone: contact.phone, message: content };
          break;
        default:
          headers["Authorization"] = `Bearer ${channel.api_key_ref}`;
          body = { phone: contact.phone, message: content };
      }

      try {
        await fetch(sendUrl, {
          method: "POST",
          headers,
          body: JSON.stringify(body),
        });
      } catch (e) {
        console.error("Failed to send via provider:", e);
      }
    }

    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("whatsapp-send error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});

function getSendUrl(provider: string, apiUrl: string, instanceName?: string): string {
  switch (provider) {
    case "evolution":
      return `${apiUrl}/message/sendText/${instanceName || "whatsapp-gestao"}`;
    case "zapi":
      return `${apiUrl}/send-text`;
    default:
      return `${apiUrl}/send`;
  }
}
