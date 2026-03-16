import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const { texts, targetLocale } = await req.json();

    if (!texts || !Array.isArray(texts) || texts.length === 0 || !targetLocale) {
      return new Response(JSON.stringify({ error: "Missing texts array or targetLocale" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const langName: Record<string, string> = {
      en: "English",
      es: "Spanish",
    };

    const target = langName[targetLocale];
    if (!target) {
      return new Response(JSON.stringify({ error: "Unsupported locale" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Batch texts into groups of 50 to avoid token limits
    const BATCH_SIZE = 50;
    const allTranslations: Record<string, string> = {};

    for (let i = 0; i < texts.length; i += BATCH_SIZE) {
      const batch = texts.slice(i, i + BATCH_SIZE);
      const numbered = batch.map((t: string, idx: number) => `${idx + 1}. ${t}`).join("\n");

      const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash-lite",
          messages: [
            {
              role: "system",
              content: `You are a professional restaurant menu translator. Translate the following Brazilian Portuguese menu items to ${target}. These are food/drink names, descriptions, and option names from a restaurant menu. Keep brand names unchanged. Maintain culinary terms where appropriate (e.g., "Filé Mignon" stays "Filé Mignon" in English). Return ONLY a JSON object mapping the original Portuguese text to its translation, like: {"original text": "translated text"}. No explanations.`,
            },
            {
              role: "user",
              content: `Translate these menu items:\n${numbered}`,
            },
          ],
        }),
      });

      if (!response.ok) {
        if (response.status === 429) {
          return new Response(JSON.stringify({ error: "Rate limit exceeded, try again later" }), {
            status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        if (response.status === 402) {
          return new Response(JSON.stringify({ error: "Payment required" }), {
            status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        const err = await response.text();
        console.error("AI error:", response.status, err);
        throw new Error("AI translation failed");
      }

      const data = await response.json();
      const content = data.choices?.[0]?.message?.content || "";

      // Parse JSON from the response (handle markdown code blocks)
      let parsed: Record<string, string> = {};
      try {
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          parsed = JSON.parse(jsonMatch[0]);
        }
      } catch (e) {
        console.error("Failed to parse translation response:", content);
        // Fallback: return original texts
        batch.forEach((t: string) => { allTranslations[t] = t; });
        continue;
      }

      Object.assign(allTranslations, parsed);
    }

    return new Response(JSON.stringify({ translations: allTranslations }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("translate-menu error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
