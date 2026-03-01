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
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

  try {
    // Auth validation via getClaims
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseAuth = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await supabaseAuth.auth.getClaims(token);
    if (claimsError || !claimsData?.claims?.sub) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userId = claimsData.claims.sub as string;
    const supabase = createClient(supabaseUrl, serviceKey);

    const { unit_id, phones, message, segment } = await req.json();
    if (!unit_id || !phones?.length || !message) {
      return new Response(JSON.stringify({ error: "Missing unit_id, phones or message" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get active WhatsApp channel for the unit
    const { data: channel, error: chErr } = await supabase
      .from("whatsapp_channels")
      .select("*")
      .eq("unit_id", unit_id)
      .eq("is_active", true)
      .limit(1)
      .single();

    if (chErr || !channel) {
      return new Response(JSON.stringify({ error: "Nenhum canal WhatsApp ativo encontrado para esta unidade." }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Create campaign record
    const { data: campaign, error: campErr } = await supabase
      .from("customer_campaigns")
      .insert({
        unit_id,
        created_by: userId,
        segment: segment || null,
        message,
        total_recipients: phones.length,
        status: "sending",
      })
      .select("id")
      .single();

    if (campErr) {
      console.error("Failed to create campaign:", campErr);
    }

    let sent = 0;
    let errors = 0;

    for (let i = 0; i < phones.length; i++) {
      const phone = phones[i];
      try {
        const sendUrl = getSendUrl(channel.provider, channel.api_url, channel.instance_name);
        const headers: Record<string, string> = { "Content-Type": "application/json" };
        let body: any = {};

        switch (channel.provider) {
          case "evolution":
            headers["apikey"] = channel.api_key_ref;
            body = { number: `${phone}@s.whatsapp.net`, text: message };
            break;
          case "zapi":
            headers["Client-Token"] = channel.api_key_ref;
            body = { phone, message };
            break;
          default:
            headers["Authorization"] = `Bearer ${channel.api_key_ref}`;
            body = { phone, message };
        }

        const res = await fetch(sendUrl, {
          method: "POST",
          headers,
          body: JSON.stringify(body),
        });

        if (res.ok) {
          sent++;
        } else {
          errors++;
          console.error(`Failed to send to ${phone}: ${res.status}`);
        }
      } catch (e) {
        errors++;
        console.error(`Error sending to ${phone}:`, e);
      }

      // Rate limiting: 1s delay between sends
      if (i < phones.length - 1) {
        await new Promise((r) => setTimeout(r, 1000));
      }
    }

    // Update campaign status
    if (campaign?.id) {
      await supabase
        .from("customer_campaigns")
        .update({ total_sent: sent, total_errors: errors, status: "completed" })
        .eq("id", campaign.id);
    }

    return new Response(JSON.stringify({ ok: true, sent, errors, total: phones.length }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("whatsapp-bulk-send error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
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
