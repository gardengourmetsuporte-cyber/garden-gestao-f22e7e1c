import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

type MessageContent = string | Array<{ type: "text"; text: string } | { type: "image_url"; image_url: { url: string } }>;
type IncomingMessage = { role: "user" | "assistant" | "system"; content: MessageContent };

const CREATE_POST_INTENT_REGEX = /(crie|criar|gere|gerar|monta|elabore|post|legenda|promo(ção|cao)?|lançamento|lancamento)/i;

function extractTextFromMessageContent(content: MessageContent): string {
  if (typeof content === "string") return content;
  return content
    .filter((part) => part.type === "text")
    .map((part) => ("text" in part ? part.text : ""))
    .join(" ")
    .trim();
}

function getLastUserText(messages: IncomingMessage[]): string {
  const lastUserMessage = [...messages].reverse().find((message) => message.role === "user");
  if (!lastUserMessage) return "";
  return extractTextFromMessageContent(lastUserMessage.content);
}

function formatPrice(value: unknown): string {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed.toFixed(2) : "0.00";
}

function buildFallbackPostData(unitName: string, products: any[]) {
  const featured = products.find((p: any) => p.is_highlighted) || products[0];
  const featuredName = featured?.name || "item do cardápio";
  const featuredPrice = formatPrice(featured?.price);

  return {
    title: `Destaque do dia: ${featuredName}`,
    caption: `Hoje o destaque no ${unitName} é ${featuredName} por R$${featuredPrice}! 😍\n\nQuer uma legenda personalizada para outro produto? Me diga qual item do cardápio você quer destacar.\n\n#${unitName.replace(/\s+/g, "")} #Cardápio #Promoção #FoodService`,
    tags: ["produto", "cardápio", "promoção"],
    image_prompt: `Professional food photography of ${featuredName} in a restaurant setting, warm lighting, high detail, realistic style, social media ready composition.`,
    best_time: "11:30",
  };
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

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

    const { unit_id, messages } = await req.json();
    if (!unit_id) throw new Error("unit_id required");
    if (!messages || !Array.isArray(messages)) throw new Error("messages required");

    const normalizedMessages = messages as IncomingMessage[];

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const [unitRes, brandRes, assetsRes, referencesRes, productsRes] = await Promise.all([
      supabase.from("units").select("name").eq("id", unit_id).maybeSingle(),
      supabase.from("brand_identity").select("*").eq("unit_id", unit_id).maybeSingle(),
      supabase
        .from("brand_assets")
        .select("title, type, tags, file_url, description")
        .eq("unit_id", unit_id)
        .order("updated_at", { ascending: false })
        .limit(20),
      supabase
        .from("brand_references")
        .select("title, type, content")
        .eq("unit_id", unit_id)
        .order("sort_order", { ascending: true })
        .limit(20),
      supabase
        .from("tablet_products")
        .select("name, description, price, image_url, is_highlighted, category, is_active")
        .eq("unit_id", unit_id)
        .eq("is_active", true)
        .order("is_highlighted", { ascending: false })
        .limit(80),
    ]);

    if (assetsRes.error) console.error("[marketing-post-chat] brand_assets query error:", assetsRes.error);
    if (referencesRes.error) console.error("[marketing-post-chat] brand_references query error:", referencesRes.error);
    if (productsRes.error) console.error("[marketing-post-chat] tablet_products query error:", productsRes.error);

    const unitName = unitRes.data?.name || "Restaurante";
    const brand = brandRes.data;
    const assets = assetsRes.data || [];
    const references = referencesRes.data || [];
    const products = productsRes.data || [];

    const today = new Date();
    const dayOfWeek = ["domingo", "segunda-feira", "terça-feira", "quarta-feira", "quinta-feira", "sexta-feira", "sábado"][today.getDay()];
    const dateStr = today.toLocaleDateString("pt-BR", { day: "numeric", month: "long", year: "numeric" });

    const productsForPrompt = products.slice(0, 40);
    const formatProduct = (product: any) => {
      const category = product.category || "";
      return `- ${product.name}: R$${formatPrice(product.price)}${product.is_highlighted ? " ⭐DESTAQUE" : ""}${category ? ` [${category}]` : ""}${product.description ? ` — ${product.description}` : ""}`;
    };

    const productsBlock = productsForPrompt.length > 0
      ? `PRODUTOS REAIS DO CARDÁPIO (${products.length} itens ativos):\n${productsForPrompt.map(formatProduct).join("\n")}`
      : "NENHUM PRODUTO CADASTRADO — NÃO mencione produtos específicos nos posts.";

    const assetsBlock = assets.length > 0
      ? assets
          .map((asset: any) => `- [${asset.type}] ${asset.title || "Sem título"}${asset.tags?.length ? ` (tags: ${asset.tags.join(", ")})` : ""}${asset.description ? ` — ${asset.description}` : ""}`)
          .join("\n")
      : "Nenhum asset cadastrado";

    const referencesBlock = references.length > 0
      ? references
          .map((ref: any) => `- [${ref.type}] ${ref.title || "Sem título"}: ${(ref.content || "").slice(0, 260)}`)
          .join("\n")
      : "Nenhuma referência textual cadastrada";

    const systemPrompt = `Você é um assistente criativo de marketing digital para "${unitName}", especialista em redes sociais para restaurantes e food service no Brasil.

CONTEXTO DA MARCA:
- Data de hoje: ${dateStr} (${dayOfWeek})
- Tom de voz: ${brand?.tone_of_voice || "Informal e acolhedor"}
- Tagline: ${brand?.tagline || ""}
- Frases institucionais: ${JSON.stringify(brand?.institutional_phrases || [])}
- Cores da marca: ${JSON.stringify(brand?.colors || {})}
- Instagram oficial da marca: ${brand?.instagram_url || "não informado"}
- Site: ${brand?.website_url || "não informado"}

${productsBlock}

ASSETS VISUAIS DISPONÍVEIS:
${assetsBlock}

REFERÊNCIAS TEXTUAIS DA MARCA:
${referencesBlock}

REGRAS OBRIGATÓRIAS:
1. NUNCA invente produtos, preços ou promoções. Use APENAS dados reais listados acima.
2. Se há produtos no cardápio, NUNCA diga que não existem produtos.
3. Quando o usuário pedir criação de post/promoção/legenda, use create_post.
4. Se houver produtos, cite pelo menos 1 produto real no título ou legenda.
5. Responda em português brasileiro, de forma objetiva e prática.
6. Gere legenda pronta para copiar/colar, hashtags relevantes e melhor horário.
7. Inclua prompt de imagem em inglês ao usar create_post.
8. Quando houver imagem de referência (enviada pelo usuário ou assets oficiais), analise layout, estilo visual, paleta e tom para adaptar ao ${unitName}.
9. Se o usuário mencionar link do Instagram, use apenas como contexto de marca; para analisar um post específico, solicite imagem/screenshot da referência.`;

    const brandVisualAssets = assets
      .filter((asset: any) => typeof asset.file_url === "string" && asset.file_url.length > 0)
      .slice(0, 4);

    const aiMessages: any[] = [{ role: "system", content: systemPrompt }];

    if (brandVisualAssets.length > 0) {
      aiMessages.push({
        role: "user",
        content: [
          {
            type: "text",
            text: "Estas são referências visuais oficiais da marca para orientar estilo, composição e identidade visual:",
          },
          ...brandVisualAssets.map((asset: any) => ({
            type: "image_url",
            image_url: { url: asset.file_url },
          })),
        ],
      });
    }

    aiMessages.push(...normalizedMessages.map((message) => ({ role: message.role, content: message.content })));

    const lastUserText = getLastUserText(normalizedMessages);
    const shouldForceCreatePost = CREATE_POST_INTENT_REGEX.test(lastUserText);

    const gatewayBody: Record<string, unknown> = {
      model: "google/gemini-3-flash-preview",
      messages: aiMessages,
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
                caption: {
                  type: "string",
                  description: "Legenda completa pronta para Instagram com hashtags — use APENAS produtos e preços reais",
                },
                tags: {
                  type: "array",
                  items: { type: "string" },
                  description: "Tags/categorias do post (ex: promoção, produto, engajamento)",
                },
                image_prompt: { type: "string", description: "Prompt descritivo em inglês para gerar imagem" },
                best_time: { type: "string", description: "Melhor horário para postar (ex: 11:30)" },
              },
              required: ["title", "caption", "tags", "image_prompt"],
              additionalProperties: false,
            },
          },
        },
      ],
    };

    if (shouldForceCreatePost) {
      gatewayBody.tool_choice = {
        type: "function",
        function: { name: "create_post" },
      };
    }

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(gatewayBody),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Limite de requisições excedido. Tente novamente em alguns segundos." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Créditos de IA esgotados." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const errText = await response.text();
      console.error("AI gateway error:", response.status, errText);
      return new Response(JSON.stringify({ error: "Erro no serviço de IA" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const aiResult = await response.json();
    const choice = aiResult.choices?.[0];
    const message = choice?.message;

    let text = typeof message?.content === "string" ? message.content : "";
    let postData: any = null;

    if (message?.tool_calls?.length > 0) {
      for (const toolCall of message.tool_calls) {
        if (toolCall.function?.name === "create_post") {
          try {
            postData = JSON.parse(toolCall.function.arguments);
            break;
          } catch {
            // ignore parse errors
          }
        }
      }
    }

    if (!postData && shouldForceCreatePost && products.length > 0) {
      postData = buildFallbackPostData(unitName, products);
    }

    if ((!text || !text.trim()) && postData) {
      text = "Perfeito! Criei um post usando referências reais da sua marca e do cardápio. Clique em ‘Usar este post’ para aplicar.";
    }

    if (!text || !text.trim()) {
      text = "Consegui analisar sua solicitação e já posso montar um post com base no seu cardápio e referências visuais.";
    }

    return new Response(JSON.stringify({ text, postData }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("marketing-post-chat error:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
