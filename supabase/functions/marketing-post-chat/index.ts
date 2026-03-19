import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

type MessageContent = string | Array<{ type: "text"; text: string } | { type: "image_url"; image_url: { url: string } }>;
type IncomingMessage = { role: "user" | "assistant" | "system"; content: MessageContent };

const CREATE_POST_INTENT_REGEX = /(crie|criar|gere|gerar|monta|elabore|post|legenda|promo(ção|cao)?|lançamento|lancamento)/i;
const NO_PRODUCTS_CONTRADICTION_REGEX = /(não\s+(possui|tem).{0,20}produt|sem\s+produt|nenhum\s+produt)/i;

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

function normalizeTextForMatch(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function hasRealProductMention(text: string, products: any[]): boolean {
  const normalizedText = normalizeTextForMatch(text);
  const names = products
    .map((product) => String(product?.name || "").trim())
    .filter((name) => name.length >= 3)
    .slice(0, 60);

  return names.some((name) => normalizedText.includes(normalizeTextForMatch(name)));
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

async function fetchBrandData(supabase: any, unitId: string) {
  const [unitRes, brandRes, assetsRes, referencesRes, productsRes] = await Promise.all([
    supabase.from("units").select("name").eq("id", unitId).maybeSingle(),
    supabase.from("brand_identity").select("*").eq("unit_id", unitId).maybeSingle(),
    supabase
      .from("brand_assets")
      .select("title, type, tags, file_url, description")
      .eq("unit_id", unitId)
      .order("updated_at", { ascending: false })
      .limit(20),
    supabase
      .from("brand_references")
      .select("title, type, content")
      .eq("unit_id", unitId)
      .order("sort_order", { ascending: true })
      .limit(20),
    supabase
      .from("tablet_products")
      .select("name, description, price, image_url, is_highlighted, is_active, category")
      .eq("unit_id", unitId)
      .eq("is_active", true)
      .order("is_highlighted", { ascending: false })
      .order("updated_at", { ascending: false })
      .limit(80),
  ]);

  return {
    unitName: unitRes.data?.name || "Restaurante",
    brand: brandRes.data,
    assets: assetsRes.data || [],
    references: referencesRes.data || [],
    products: productsRes.data || [],
  };
}

// --- Generate Art Mode ---
async function handleGenerateArt(
  req: Request,
  body: any,
  LOVABLE_API_KEY: string,
  authHeader: string,
) {
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  const { unit_id, flow_type, product_photo, product_name, product_description } = body;
  const { unitName, brand, assets, products } = await fetchBrandData(supabase, unit_id);

  const today = new Date();
  const dayOfWeek = ["domingo", "segunda-feira", "terça-feira", "quarta-feira", "quinta-feira", "sexta-feira", "sábado"][today.getDay()];

  // Find logo from assets
  const logoAsset = assets.find((a: any) => a.type === 'logo' && a.file_url);
  const logoUrl = logoAsset?.file_url || null;

  // Build product context
  const productsForPrompt = products.slice(0, 20);
  const productsBlock = productsForPrompt.length > 0
    ? productsForPrompt.map((p: any) => `- ${p.name}: R$${formatPrice(p.price)}${p.is_highlighted ? " ⭐" : ""}${p.description ? ` — ${p.description}` : ""}`).join("\n")
    : "Nenhum produto cadastrado";

  const brandColors = brand?.colors ? JSON.stringify(brand.colors) : "verde neon";
  const tonOfVoice = brand?.tone_of_voice || "Informal e acolhedor";
  const tagline = brand?.tagline || "";

  // --- Step 1: Generate caption via text model ---
  let captionPrompt = "";
  if (flow_type === "lancamento") {
    captionPrompt = `Crie um post de LANÇAMENTO para o novo produto "${product_name}" do ${unitName}.
Descrição/Ingredientes: ${product_description || "não informado"}.
Tom de voz: ${tonOfVoice}. Tagline: ${tagline}.
Produtos existentes no cardápio:\n${productsBlock}

REGRAS: Use APENAS dados reais. Gere título curto, legenda pronta para Instagram (com emojis e hashtags), tags e melhor horário.`;
  } else if (flow_type === "promocao") {
    captionPrompt = `Crie um post de PROMOÇÃO para "${product_name}" do ${unitName}.
Detalhes: ${product_description || "não informado"}.
Tom de voz: ${tonOfVoice}. Tagline: ${tagline}.
Produtos do cardápio:\n${productsBlock}

REGRAS: Use APENAS dados reais. Gere título curto, legenda pronta para Instagram (com emojis e hashtags), tags e melhor horário.`;
  } else {
    // post-dia
    captionPrompt = `Crie um post do dia para ${unitName}. Hoje é ${dayOfWeek}.
Tom de voz: ${tonOfVoice}. Tagline: ${tagline}.
Produtos do cardápio:\n${productsBlock}

REGRAS: Use APENAS dados reais. Escolha o produto mais atrativo para destacar hoje. Gere título curto, legenda pronta (com emojis e hashtags), tags e melhor horário.`;
  }

  const captionResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${LOVABLE_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "google/gemini-3-flash-preview",
      messages: [
        { role: "system", content: `Você é um assistente de marketing para "${unitName}". Gere posts profissionais baseados em dados reais.` },
        { role: "user", content: captionPrompt },
      ],
      tools: [
        {
          type: "function",
          function: {
            name: "create_post",
            description: "Gera um post estruturado pronto para publicação",
            parameters: {
              type: "object",
              properties: {
                title: { type: "string", description: "Título curto do post" },
                caption: { type: "string", description: "Legenda completa com hashtags" },
                tags: { type: "array", items: { type: "string" } },
                image_prompt: { type: "string", description: "Prompt em inglês para gerar imagem" },
                best_time: { type: "string", description: "Melhor horário (ex: 11:30)" },
              },
              required: ["title", "caption", "tags", "image_prompt"],
              additionalProperties: false,
            },
          },
        },
      ],
      tool_choice: { type: "function", function: { name: "create_post" } },
    }),
  });

  if (!captionResponse.ok) {
    const errText = await captionResponse.text();
    console.error("Caption AI error:", captionResponse.status, errText);
    throw new Error("Erro ao gerar legenda");
  }

  const captionResult = await captionResponse.json();
  let postData: any = null;

  const captionMessage = captionResult.choices?.[0]?.message;
  if (captionMessage?.tool_calls?.length > 0) {
    for (const toolCall of captionMessage.tool_calls) {
      if (toolCall.function?.name === "create_post") {
        try {
          postData = JSON.parse(toolCall.function.arguments);
          break;
        } catch { /* ignore */ }
      }
    }
  }

  if (!postData) {
    postData = buildFallbackPostData(unitName, products);
  }

  // --- Step 2: Generate image via image model ---
  let generatedImageUrl: string | null = null;
  try {
    const imagePromptParts: any[] = [];

    // Build image generation prompt
    const artPrompt = `Create a professional Instagram social media post art for a restaurant called "${unitName}".
This is ${flow_type === "lancamento" ? "a NEW PRODUCT LAUNCH" : flow_type === "promocao" ? "a SPECIAL PROMOTION" : "a daily post"} for: ${product_name || postData.title}.
${product_description ? `Details: ${product_description}` : ""}

STYLE REQUIREMENTS:
- Modern, appetizing food photography style
- Brand colors: ${brandColors}
- Clean, professional restaurant marketing aesthetic
- Social media ready composition (square format)
- Text overlay with the product name "${product_name || postData.title}" in bold, modern typography
- Use warm, inviting lighting
- Include subtle brand elements
- Round corners on any overlay elements
- Make it look like a premium restaurant advertisement`;

    imagePromptParts.push({ type: "text", text: artPrompt });

    // Include product photo if provided
    if (product_photo) {
      imagePromptParts.push({ type: "image_url", image_url: { url: product_photo } });
    }

    // Include logo if available
    if (logoUrl) {
      imagePromptParts.push({
        type: "text",
        text: "Include this brand logo subtly in the corner of the art:",
      });
      imagePromptParts.push({ type: "image_url", image_url: { url: logoUrl } });
    }

    // Include brand reference images
    const brandVisualRefs = assets
      .filter((a: any) => a.file_url && a.type !== 'logo')
      .slice(0, 2);
    if (brandVisualRefs.length > 0) {
      imagePromptParts.push({
        type: "text",
        text: "Use these brand reference images for style inspiration:",
      });
      for (const ref of brandVisualRefs) {
        imagePromptParts.push({ type: "image_url", image_url: { url: ref.file_url } });
      }
    }

    const imageResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3.1-flash-image-preview",
        messages: [{ role: "user", content: imagePromptParts }],
        modalities: ["image", "text"],
      }),
    });

    if (imageResponse.ok) {
      const imageResult = await imageResponse.json();
      const generatedImages = imageResult.choices?.[0]?.message?.images;

      if (generatedImages && generatedImages.length > 0) {
        const base64Image = generatedImages[0]?.image_url?.url;

        if (base64Image) {
          // Upload to storage
          try {
            const base64Data = base64Image.replace(/^data:image\/\w+;base64,/, "");
            const binaryData = Uint8Array.from(atob(base64Data), c => c.charCodeAt(0));
            const fileName = `${unit_id}/ai-art-${Date.now()}.png`;

            const { error: uploadError } = await supabase.storage
              .from("marketing-media")
              .upload(fileName, binaryData, {
                contentType: "image/png",
                upsert: true,
              });

            if (!uploadError) {
              const { data: urlData } = supabase.storage
                .from("marketing-media")
                .getPublicUrl(fileName);
              generatedImageUrl = urlData.publicUrl;
            } else {
              console.error("Upload error:", uploadError);
              // Return base64 as fallback
              generatedImageUrl = base64Image;
            }
          } catch (uploadErr) {
            console.error("Upload processing error:", uploadErr);
            generatedImageUrl = base64Image;
          }
        }
      }
    } else {
      console.error("Image generation error:", imageResponse.status, await imageResponse.text());
    }
  } catch (imageErr) {
    console.error("Image generation failed:", imageErr);
    // Continue without image - post data is still valid
  }

  return new Response(
    JSON.stringify({
      text: "Arte gerada com sucesso!",
      postData,
      generatedImageUrl,
    }),
    { headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
}

// --- Chat Mode (existing) ---
async function handleChat(
  req: Request,
  body: any,
  LOVABLE_API_KEY: string,
) {
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  const { unit_id, messages } = body;
  const normalizedMessages = messages as IncomingMessage[];
  const { unitName, brand, assets, references, products } = await fetchBrandData(supabase, unit_id);

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
        .map((reference: any) => `- [${reference.type}] ${reference.title || "Sem título"}: ${(reference.content || "").slice(0, 260)}`)
        .join("\n")
    : "Nenhuma referência textual cadastrada";

  const systemPrompt = `Você é um assistente criativo de marketing digital para "${unitName}", especialista em redes sociais para restaurantes e food service no Brasil.

CONTEXTO DA MARCA:
- Data de hoje: ${dateStr} (${dayOfWeek})
- Tom de voz: ${brand?.tone_of_voice || "Informal e acolhedor"}
- Tagline: ${brand?.tagline || ""}
- Frases institucionais: ${JSON.stringify(brand?.institutional_phrases || [])}
- Cores da marca: ${JSON.stringify(brand?.colors || {})}
- Instagram oficial: ${brand?.instagram_url || "não informado"}
- Site: ${brand?.website_url || "não informado"}

${productsBlock}

ASSETS VISUAIS DISPONÍVEIS:
${assetsBlock}

REFERÊNCIAS TEXTUAIS DA MARCA:
${referencesBlock}

REGRAS OBRIGATÓRIAS:
1. NUNCA invente produtos, preços ou promoções. Use APENAS dados reais.
2. Se há produtos no cardápio, NUNCA diga que não existem.
3. Quando pedir criação de post/promoção/legenda, use create_post.
4. Se houver produtos, cite pelo menos 1 produto real.
5. Responda em português brasileiro, objetiva e prática.
6. Gere legenda pronta, hashtags relevantes e melhor horário.
7. Inclua prompt de imagem em inglês ao usar create_post.
8. Analise referências visuais para adaptar ao ${unitName}.`;

  const brandVisualAssets = assets
    .filter((asset: any) => typeof asset.file_url === "string" && asset.file_url.length > 0)
    .slice(0, 4);

  const aiMessages: any[] = [{ role: "system", content: systemPrompt }];

  if (brandVisualAssets.length > 0) {
    aiMessages.push({
      role: "user",
      content: [
        { type: "text", text: "Referências visuais oficiais da marca:" },
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
              caption: { type: "string", description: "Legenda completa pronta para Instagram com hashtags" },
              tags: { type: "array", items: { type: "string" } },
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
    gatewayBody.tool_choice = { type: "function", function: { name: "create_post" } };
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
      return new Response(JSON.stringify({ error: "Limite de requisições excedido." }), {
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
    const errorText = await response.text();
    console.error("AI gateway error:", response.status, errorText);
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
        } catch { /* ignore */ }
      }
    }
  }

  if (!postData && shouldForceCreatePost && products.length > 0) {
    postData = buildFallbackPostData(unitName, products);
  }

  if (postData && products.length > 0 && shouldForceCreatePost) {
    const postText = `${String(postData.title || "")} ${String(postData.caption || "")}`;
    if (!hasRealProductMention(postText, products)) {
      postData = buildFallbackPostData(unitName, products);
      text = "Perfeito! Ajustei o post para usar produtos reais do seu cardápio.";
    }
  }

  if (products.length > 0 && NO_PRODUCTS_CONTRADICTION_REGEX.test(text)) {
    text = "Perfeito! Criei um post com base no seu cardápio real e nas referências da marca.";
  }

  if ((!text || !text.trim()) && postData) {
    text = "Perfeito! Criei um post usando referências reais da sua marca e do cardápio. Clique em 'Usar este post' para aplicar.";
  }

  if (!text || !text.trim()) {
    text = "Consegui analisar sua solicitação e já posso montar um post com base no seu cardápio e referências visuais.";
  }

  return new Response(JSON.stringify({ text, postData }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

// --- Main Handler ---
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

    const body = await req.json();
    const mode = body.mode || "chat";

    if (!body.unit_id) throw new Error("unit_id required");

    if (mode === "generate-art") {
      return await handleGenerateArt(req, body, LOVABLE_API_KEY, authHeader);
    } else {
      if (!body.messages || !Array.isArray(body.messages)) throw new Error("messages required");
      return await handleChat(req, body, LOVABLE_API_KEY);
    }
  } catch (error) {
    console.error("marketing-post-chat error:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
