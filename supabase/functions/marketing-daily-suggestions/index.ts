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

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { unit_id } = await req.json();
    if (!unit_id) throw new Error("unit_id required");

    // Fetch all business context in parallel
    const [unitRes, brandRes, assetsRes, productsRes, recipesRes] = await Promise.all([
      supabase.from("units").select("name").eq("id", unit_id).maybeSingle(),
      supabase.from("brand_identity").select("*").eq("unit_id", unit_id).maybeSingle(),
      supabase.from("brand_assets").select("title, type, tags, file_url").eq("unit_id", unit_id).limit(10),
      supabase.from("tablet_products").select("name, description, price, image_url, is_highlight, category, is_active").eq("unit_id", unit_id).eq("is_active", true).limit(50),
      supabase.from("recipes").select("name, description, cost_per_portion, yield_quantity").eq("unit_id", unit_id).limit(20),
    ]);

    const unitName = unitRes.data?.name || "Restaurante";
    const brand = brandRes.data;
    const assets = assetsRes.data || [];
    const products = productsRes.data || [];
    const recipes = recipesRes.data || [];

    // Build date context
    const today = new Date();
    const dayOfWeek = ["domingo", "segunda-feira", "terça-feira", "quarta-feira", "quinta-feira", "sexta-feira", "sábado"][today.getDay()];
    const dateStr = today.toLocaleDateString("pt-BR", { day: "numeric", month: "long", year: "numeric" });

    // Build products list with categories
    const highlightProducts = products.filter((p: any) => p.is_highlight);
    const regularProducts = products.filter((p: any) => !p.is_highlight);

    const formatProduct = (p: any) => {
      const cat = p.category || "";
      return `- ${p.name}: R$${Number(p.price).toFixed(2)}${p.is_highlight ? ' ⭐DESTAQUE' : ''}${cat ? ` [${cat}]` : ''}${p.description ? ` — ${p.description}` : ''}`;
    };

    const productsBlock = products.length > 0
      ? `PRODUTOS REAIS DO CARDÁPIO (${products.length} itens ativos):
${highlightProducts.map(formatProduct).join("\n")}
${regularProducts.slice(0, 20).map(formatProduct).join("\n")}`
      : "NENHUM PRODUTO CADASTRADO — NÃO mencione produtos específicos nos posts.";

    const recipesBlock = recipes.length > 0
      ? `FICHAS TÉCNICAS (custo real):
${recipes.map((r: any) => `- ${r.name}: custo R$${r.cost_per_portion?.toFixed(2) || '?'}/porção`).join("\n")}`
      : "";

    const systemPrompt = `Você é um especialista em marketing digital para restaurantes e food service no Brasil.
Sua tarefa é gerar 3 sugestões de posts para redes sociais (Instagram) para HOJE.

NOME DO NEGÓCIO: ${unitName}

CONTEXTO DA MARCA:
- Data de hoje: ${dateStr} (${dayOfWeek})
- Tom de voz: ${brand?.tone_of_voice || "Informal e acolhedor"}
- Tagline: ${brand?.tagline || ""}
- Frases institucionais: ${JSON.stringify(brand?.institutional_phrases || [])}
- Cores da marca: ${JSON.stringify(brand?.colors || {})}
- Instagram: ${brand?.instagram_url || "não informado"}
- Site: ${brand?.website_url || "não informado"}

${productsBlock}

${recipesBlock}

ASSETS VISUAIS DISPONÍVEIS:
${assets.length > 0 ? assets.map((a: any) => `- [${a.type}] ${a.title} (tags: ${a.tags?.join(', ')})`).join("\n") : "Nenhum asset cadastrado"}

═══════════════════════════════════════════
REGRAS CRÍTICAS — LEIA COM ATENÇÃO:
═══════════════════════════════════════════

1. **DISTRIBUIÇÃO OBRIGATÓRIA**: Das 3 sugestões, PELO MENOS 2 DEVEM ser sobre PRODUTOS REAIS do cardápio com nome e preço exatos. No máximo 1 pode ser engajamento/bastidores. NUNCA gere 3 posts genéricos sem produto.

2. **PROIBIÇÃO ABSOLUTA DE INVENÇÃO**: NUNCA invente produtos, pratos, preços, promoções ou combos que NÃO estejam listados acima. Se um item não aparece na lista de produtos, ele NÃO EXISTE.

3. **PRODUTOS REAIS APENAS**: Use EXCLUSIVAMENTE os nomes e preços listados em "PRODUTOS REAIS DO CARDÁPIO". Copie os nomes exatamente como estão escritos. NÃO altere nomes, NÃO crie variações.

4. **FOCO EM VENDA**: Os posts devem ter o objetivo de VENDER. Destaque o produto, mostre o preço, crie desejo. Evite posts vagos sobre "momentos especiais" ou "experiências". Seja direto: "Nosso X por apenas R$Y".

5. **PROMOÇÕES REALISTAS**: Se sugerir promoção/desconto, calcule a partir do preço real listado. NÃO invente valores.

6. **SEM PRODUTOS = SEM MENÇÃO**: Se não houver produtos cadastrados, gere APENAS posts de engajamento e bastidores. NÃO mencione nenhum prato ou preço.

7. **DESTAQUES PRIORITÁRIOS**: Dê preferência aos itens marcados com ⭐DESTAQUE.

8. **DATAS SÃO SECUNDÁRIAS**: Datas comemorativas podem ser usadas como CONTEXTO para vender um produto real, mas NUNCA como tema principal sem produto. Exemplo correto: "Neste São João, experimente nosso X por R$Y". Exemplo ERRADO: "Venha celebrar o São João conosco" sem produto.

9. Use o nome "${unitName}" nos posts quando apropriado.

10. Inclua legendas prontas para copiar e colar com hashtags relevantes.

11. Sugira o melhor horário para postar.

12. Gere um prompt de imagem descritivo (em inglês) para cada sugestão — o prompt deve descrever o produto REAL mencionado no post.`;

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
          { role: "user", content: "Gere 3 sugestões de posts para hoje. Use APENAS produtos e preços reais listados no contexto. Retorne usando a função suggest_posts." },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "suggest_posts",
              description: "Retorna sugestões de posts baseadas EXCLUSIVAMENTE nos dados reais do negócio",
              parameters: {
                type: "object",
                properties: {
                  suggestions: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        title: { type: "string", description: "Título curto do post" },
                        caption: { type: "string", description: "Legenda completa pronta para Instagram — use APENAS produtos e preços reais" },
                        hashtags: { type: "string", description: "Hashtags separadas por espaço" },
                        best_time: { type: "string", description: "Melhor horário para postar (ex: 11:30)" },
                        image_prompt: { type: "string", description: "Prompt descritivo em inglês para gerar imagem do produto REAL mencionado no post" },
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
