import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const authHeader = req.headers.get("Authorization");
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { unit_id } = await req.json();
    if (!unit_id) throw new Error("unit_id required");

    // Fetch all business context in parallel
    const [brandRes, assetsRes, productsRes, recipesRes] = await Promise.all([
      supabase.from("brand_identity").select("*").eq("unit_id", unit_id).maybeSingle(),
      supabase.from("brand_assets").select("title, type, tags, file_url").eq("unit_id", unit_id).limit(10),
      supabase.from("tablet_products").select("name, description, price, image_url, is_highlight").eq("unit_id", unit_id).eq("is_active", true).limit(20),
      supabase.from("recipes").select("name, description, cost_per_portion, yield_quantity").eq("unit_id", unit_id).limit(15),
    ]);

    const brand = brandRes.data;
    const assets = assetsRes.data || [];
    const products = productsRes.data || [];
    const recipes = recipesRes.data || [];

    // Build date context
    const today = new Date();
    const dayOfWeek = ["domingo", "segunda-feira", "terça-feira", "quarta-feira", "quinta-feira", "sexta-feira", "sábado"][today.getDay()];
    const dateStr = today.toLocaleDateString("pt-BR", { day: "numeric", month: "long", year: "numeric" });

    const systemPrompt = `Você é um especialista em marketing digital para restaurantes e food service no Brasil.
Sua tarefa é gerar 3 sugestões de posts para redes sociais (Instagram) para HOJE.

CONTEXTO DO NEGÓCIO:
- Data de hoje: ${dateStr} (${dayOfWeek})
- Tom de voz: ${brand?.tone_of_voice || "Informal e acolhedor"}
- Tagline: ${brand?.tagline || ""}
- Frases institucionais: ${JSON.stringify(brand?.institutional_phrases || [])}
- Cores da marca: ${JSON.stringify(brand?.colors || {})}
- Instagram: ${brand?.instagram_url || "não informado"}
- Site: ${brand?.website_url || "não informado"}

PRODUTOS DO CARDÁPIO (destaques):
${products.slice(0, 10).map(p => `- ${p.name}: R$${p.price} ${p.is_highlight ? '⭐' : ''} ${p.description || ''}`).join("\n")}

FICHAS TÉCNICAS (custo):
${recipes.slice(0, 8).map(r => `- ${r.name}: custo R$${r.cost_per_portion?.toFixed(2) || '?'}/porção`).join("\n")}

ASSETS VISUAIS DISPONÍVEIS:
${assets.map(a => `- [${a.type}] ${a.title} (tags: ${a.tags?.join(', ')})`).join("\n")}

REGRAS:
1. Cada sugestão deve ser específica para o dia de hoje
2. Se for feriado/data comemorativa, aproveite
3. Inclua legendas prontas para copiar e colar
4. Inclua hashtags relevantes
5. Sugira o melhor horário para postar
6. Gere um prompt de imagem descritivo para cada sugestão
7. Considere dias da semana (ex: segunda pode ser "Começar a semana", sexta "Happy hour")`;

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
          { role: "user", content: "Gere 3 sugestões de posts para hoje. Retorne usando a função suggest_posts." },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "suggest_posts",
              description: "Retorna sugestões de posts para o dia",
              parameters: {
                type: "object",
                properties: {
                  suggestions: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        title: { type: "string", description: "Título curto do post" },
                        caption: { type: "string", description: "Legenda completa pronta para Instagram" },
                        hashtags: { type: "string", description: "Hashtags separadas por espaço" },
                        best_time: { type: "string", description: "Melhor horário para postar (ex: 11:30)" },
                        image_prompt: { type: "string", description: "Prompt descritivo em inglês para gerar imagem do post" },
                        category: { type: "string", enum: ["product", "engagement", "seasonal", "behind_scenes"], description: "Tipo do post" },
                      },
                      required: ["title", "caption", "hashtags", "best_time", "image_prompt", "category"],
                      additionalProperties: false,
                    },
                  },
                },
                required: ["suggestions"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "suggest_posts" } },
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded" }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Payment required" }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
      const errText = await response.text();
      console.error("AI gateway error:", response.status, errText);
      throw new Error("AI gateway error");
    }

    const aiData = await response.json();
    const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
    let suggestions = [];

    if (toolCall?.function?.arguments) {
      const parsed = JSON.parse(toolCall.function.arguments);
      suggestions = parsed.suggestions || [];
    }

    return new Response(JSON.stringify({ suggestions, date: dateStr }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("marketing-daily-suggestions error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
