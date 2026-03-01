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

  try {
    // ── Authentication ──
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
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
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userId = claimsData.claims.sub as string;

    const { prompt, unit_id, topic } = await req.json();

    // ── Input validation ──
    if (prompt && (typeof prompt !== "string" || prompt.length > 2000)) {
      return new Response(JSON.stringify({ error: "Prompt inválido" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (topic && (typeof topic !== "string" || topic.length > 200)) {
      return new Response(JSON.stringify({ error: "Tópico inválido" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ── IDOR Protection: validate unit_id belongs to authenticated user ──
    if (unit_id) {
      const adminClient = createClient(
        Deno.env.get("SUPABASE_URL")!,
        Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
      );
      const { data: unitAccess } = await adminClient
        .from("user_units")
        .select("unit_id")
        .eq("user_id", userId)
        .eq("unit_id", unit_id)
        .maybeSingle();
      if (!unitAccess) {
        return new Response(JSON.stringify({ error: "Acesso negado a esta unidade." }), {
          status: 403,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    // Build business context from database
    let businessContext = "";
    if (unit_id) {
      try {
        const supabase = createClient(
          Deno.env.get("SUPABASE_URL")!,
          Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
        );

        const [productsRes, customersRes] = await Promise.all([
          supabase
            .from("tablet_products")
            .select("name, price, category, image_url, is_highlighted, description")
            .eq("unit_id", unit_id)
            .eq("is_active", true)
            .order("is_highlighted", { ascending: false })
            .limit(30),
          supabase
            .from("customers")
            .select("id", { count: "exact", head: true })
            .eq("unit_id", unit_id),
        ]);

        const products = productsRes.data || [];
        const customerCount = customersRes.count || 0;

        if (products.length > 0) {
          const highlighted = products.filter((p: any) => p.is_highlighted);
          const categories = [...new Set(products.map((p: any) => p.category))];
          const withImage = products.filter((p: any) => p.image_url);

          businessContext += `\n\n--- DADOS DO NEGÓCIO ---`;
          businessContext += `\nTotal de produtos no cardápio: ${products.length}`;
          businessContext += `\nCategorias: ${categories.join(", ")}`;
          if (highlighted.length > 0) {
            businessContext += `\nProdutos em destaque: ${highlighted.map((p: any) => `${p.name} (R$${p.price.toFixed(2)})`).join(", ")}`;
          }
          businessContext += `\nProdutos com foto: ${withImage.length}/${products.length}`;
          businessContext += `\nLista de produtos:`;
          products.slice(0, 20).forEach((p: any) => {
            businessContext += `\n- ${p.name}: R$${p.price.toFixed(2)} [${p.category}]${p.image_url ? " ✅foto" : " ❌sem foto"}${p.description ? ` — ${p.description.slice(0, 60)}` : ""}`;
          });
          businessContext += `\nTotal de clientes cadastrados: ${customerCount}`;
        }
      } catch (err) {
        console.error("Context fetch error (non-fatal):", err);
      }
    }

    const effectivePrompt = topic
      ? `Gere 3-4 sugestões de posts sobre o tema: "${topic}". ${prompt ? `Contexto adicional: ${prompt}` : ""}`
      : `Gere 3-4 sugestões de posts sobre: ${prompt}`;

    const systemPrompt = `Você é um especialista em marketing para pequenos negócios brasileiros (restaurantes, bares, cafeterias, lojas).
Gere sugestões de posts para redes sociais com linguagem brasileira natural, emojis, e hashtags relevantes.
${businessContext ? `\nUse os dados reais do negócio abaixo para criar sugestões personalizadas. SEMPRE referencie produtos reais pelo nome e preço quando apropriado. Quando o produto não tem foto, sugira como tirar uma boa foto dele.` : ""}
${businessContext}
\nSempre responda usando a ferramenta suggest_posts.`;

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
          { role: "user", content: effectivePrompt },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "suggest_posts",
              description: "Retorna sugestões de posts para redes sociais",
              parameters: {
                type: "object",
                properties: {
                  suggestions: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        title: { type: "string", description: "Título curto do post (max 60 chars)" },
                        caption: { type: "string", description: "Legenda completa com emojis (max 300 chars)" },
                        hashtags: {
                          type: "array",
                          items: { type: "string" },
                          description: "5-8 hashtags relevantes sem o #",
                        },
                        best_time: {
                          type: "string",
                          description: "Melhor horário para postar (ex: '11h-12h' ou '18h-20h')",
                        },
                        photo_tip: {
                          type: "string",
                          description: "Dica específica de foto: como fotografar, ângulo, fundo, iluminação. Se o produto não tem foto, sugira como tirar uma.",
                        },
                        product_name: {
                          type: "string",
                          description: "Nome exato do produto do cardápio referenciado (se aplicável, senão vazio)",
                        },
                      },
                      required: ["title", "caption", "hashtags", "best_time", "photo_tip"],
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
        return new Response(JSON.stringify({ error: "Rate limit exceeded" }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Payment required" }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const text = await response.text();
      console.error("AI gateway error:", response.status, text);
      return new Response(JSON.stringify({ error: "AI error" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const result = await response.json();
    const toolCall = result.choices?.[0]?.message?.tool_calls?.[0];

    if (toolCall?.function?.arguments) {
      const parsed = JSON.parse(toolCall.function.arguments);
      return new Response(JSON.stringify(parsed), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ suggestions: [] }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("marketing-suggestions error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
