import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseAuth = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await supabaseAuth.auth.getClaims(token);
    if (claimsError || !claimsData?.claims?.sub) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const userId = claimsData.claims.sub as string;

    const { action, unit_id, prompt } = await req.json();

    if (!action || !unit_id) {
      return new Response(JSON.stringify({ error: "action and unit_id required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // IDOR check
    const adminClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );
    const { data: unitAccess } = await adminClient
      .from("user_units").select("unit_id")
      .eq("user_id", userId).eq("unit_id", unit_id).maybeSingle();
    if (!unitAccess) {
      return new Response(JSON.stringify({ error: "Access denied" }), {
        status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fetch brand context
    const [identityRes, assetsRes] = await Promise.all([
      adminClient.from("brand_identity").select("*").eq("unit_id", unit_id).maybeSingle(),
      adminClient.from("brand_assets").select("type, title, tags, description").eq("unit_id", unit_id).limit(50),
    ]);

    const identity = identityRes.data;
    const assets = assetsRes.data || [];

    let brandContext = "";
    if (identity) {
      brandContext += `\n--- IDENTIDADE DA MARCA ---`;
      brandContext += `\nCores: Primária ${identity.colors?.primary}, Secundária ${identity.colors?.secondary}, Destaque ${identity.colors?.accent}`;
      brandContext += `\nTipografia: Títulos ${identity.typography?.headings}, Corpo ${identity.typography?.body}`;
      if (identity.tagline) brandContext += `\nSlogan: "${identity.tagline}"`;
      if (identity.tone_of_voice) brandContext += `\nTom de voz: ${identity.tone_of_voice}`;
      if (identity.institutional_phrases?.length > 0) {
        brandContext += `\nFrases institucionais: ${identity.institutional_phrases.join(" | ")}`;
      }
    }

    if (assets.length > 0) {
      brandContext += `\n\n--- ASSETS DA MARCA ---`;
      const byType: Record<string, string[]> = {};
      for (const a of assets) {
        const t = a.type || "outro";
        if (!byType[t]) byType[t] = [];
        byType[t].push(`${a.title}${a.tags?.length ? ` [${a.tags.join(",")}]` : ""}`);
      }
      for (const [type, items] of Object.entries(byType)) {
        brandContext += `\n${type}: ${items.join(", ")}`;
      }
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const systemPrompts: Record<string, string> = {
      generate_copy: `Você é um copywriter profissional para negócios brasileiros. Gere copies (textos para redes sociais, anúncios, WhatsApp) seguindo rigorosamente o tom de voz e identidade da marca abaixo. Use o slogan e frases institucionais quando apropriado. Escreva em português brasileiro natural.${brandContext}`,
      suggest_creative: `Você é um diretor criativo especializado em marketing para restaurantes e pequenos negócios brasileiros. Sugira ideias de criativos (posts, stories, reels, banners) baseados nos assets e identidade da marca abaixo. Descreva o visual, composição, texto e formato.${brandContext}`,
      generate_prompt: `Você é um especialista em prompts para ferramentas de design (Canva, Midjourney, DALL-E). Gere prompts otimizados para criar peças visuais que sigam a identidade da marca abaixo. Inclua cores exatas, tipografia, estilo e composição.${brandContext}`,
    };

    const systemPrompt = systemPrompts[action] || systemPrompts.generate_copy;
    const userPrompt = prompt || (
      action === "generate_copy" ? "Gere 3 copies diferentes para posts de redes sociais." :
      action === "suggest_creative" ? "Sugira 3 ideias de criativos para as próximas campanhas." :
      "Gere 3 prompts para criar peças visuais profissionais."
    );

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded" }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Payment required" }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const text = await response.text();
      console.error("AI error:", response.status, text);
      throw new Error("AI gateway error");
    }

    const aiResult = await response.json();
    const content = aiResult.choices?.[0]?.message?.content || "";

    return new Response(JSON.stringify({ result: content }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("brand-ai-generate error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
