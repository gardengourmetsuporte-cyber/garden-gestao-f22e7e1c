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

    const { unit_id, messages } = await req.json();
    if (!unit_id) throw new Error("unit_id required");
    if (!messages || !Array.isArray(messages)) throw new Error("messages required");

    // Fetch brand context (RAG)
    const [unitRes, brandRes, assetsRes, productsRes, recipesRes, categoriesRes] = await Promise.all([
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
    const categories = categoriesRes.data || [];

    const catMap: Record<string, string> = {};
    categories.forEach((c: any) => { catMap[c.id] = c.name; });

    const today = new Date();
    const dayOfWeek = ["domingo", "segunda-feira", "terça-feira", "quarta-feira", "quinta-feira", "sexta-feira", "sábado"][today.getDay()];
    const dateStr = today.toLocaleDateString("pt-BR", { day: "numeric", month: "long", year: "numeric" });

    const formatProduct = (p: any) => {
      const cat = p.category_id ? catMap[p.category_id] || "" : "";
      return `- ${p.name}: R$${Number(p.price).toFixed(2)}${p.is_highlight ? ' ⭐DESTAQUE' : ''}${cat ? ` [${cat}]` : ''}${p.description ? ` — ${p.description}` : ''}`;
    };

    const productsBlock = products.length > 0
      ? `PRODUTOS REAIS DO CARDÁPIO (${products.length} itens ativos):\n${products.map(formatProduct).join("\n")}`
      : "NENHUM PRODUTO CADASTRADO — NÃO mencione produtos específicos nos posts.";

    const recipesBlock = recipes.length > 0
      ? `FICHAS TÉCNICAS (custo real):\n${recipes.map((r: any) => `- ${r.name}: custo R$${r.cost_per_portion?.toFixed(2) || '?'}/porção`).join("\n")}`
      : "";

    const systemPrompt = `Você é um assistente criativo de marketing digital para "${unitName}", especialista em redes sociais para restaurantes e food service no Brasil.

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

REGRAS:
1. NUNCA invente produtos, preços ou promoções. Use APENAS dados reais listados acima.
2. Responda em português brasileiro, de forma concisa e prática.
3. Quando o usuário pedir para criar um post, use a função create_post para retornar os dados estruturados.
4. Você pode conversar livremente para refinar ideias antes de gerar o post final.
5. Use o nome "${unitName}" nos posts quando apropriado.
6. Gere legendas prontas para copiar/colar com hashtags relevantes.
7. Sugira horários ideais para publicação.
8. Inclua um prompt de imagem em inglês para geração de arte quando usar create_post.
9. Quando o usuário enviar uma IMAGEM de referência (criativo, arte, post de concorrente, etc.), analise o layout, estilo visual, cores, tipografia e tom da mensagem. Em seguida, REPRODUZA o conceito adaptado para "${unitName}" usando APENAS os dados reais (produtos, preços, marca). Descreva o que identificou na imagem e gere o post correspondente.`;

    // Build AI messages - support multimodal content (images)
    const aiMessages: any[] = [
      { role: "system", content: systemPrompt },
      ...messages,
    ];

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: aiMessages,
        stream: true,
        tools: [
          {
            type: "function",
            function: {
              name: "create_post",
              description: "Gera um post estruturado pronto para publicação, baseado EXCLUSIVAMENTE nos dados reais do negócio",
              parameters: {
                type: "object",
                properties: {
                  title: { type: "string", description: "Título curto do post" },
                  caption: { type: "string", description: "Legenda completa pronta para Instagram com hashtags — use APENAS produtos e preços reais" },
                  tags: { type: "array", items: { type: "string" }, description: "Tags/categorias do post (ex: promoção, produto, engajamento)" },
                  image_prompt: { type: "string", description: "Prompt descritivo em inglês para gerar imagem" },
                  best_time: { type: "string", description: "Melhor horário para postar (ex: 11:30)" },
                },
                required: ["title", "caption", "tags", "image_prompt"],
                additionalProperties: false,
              },
            },
          },
        ],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Limite de requisições excedido. Tente novamente em alguns segundos." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Créditos de IA esgotados. Adicione créditos ao workspace." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errText = await response.text();
      console.error("AI gateway error:", response.status, errText);
      return new Response(JSON.stringify({ error: "Erro no serviço de IA" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("marketing-post-chat error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
