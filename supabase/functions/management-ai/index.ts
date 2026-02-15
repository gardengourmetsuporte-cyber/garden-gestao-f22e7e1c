import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const body = await req.json();
    const { messages: conversationHistory, context } = body;

    const systemPrompt = `Você é o Copiloto IA, um assistente de gestão para restaurantes e estabelecimentos comerciais. Seu papel é ajudar o gestor a organizar seu dia e tomar decisões baseadas nos dados do sistema.

Seja sempre:
- Direto e objetivo (máximo 3-4 frases)
- Prático e focado em ações concretas
- Amigável mas profissional
- Use português brasileiro natural
- Use emojis com moderação para tornar a leitura agradável

Contexto atual do sistema:
- Estoque crítico: ${context?.criticalStockCount || 0} itens com estoque baixo
- Resgates de recompensas pendentes: ${context?.pendingRedemptions || 0}
- Dia: ${context?.dayOfWeek || 'não informado'}
- Período: ${context?.timeOfDay || 'não informado'}

Você tem acesso ao histórico de conversa. Use-o para manter contexto e não repetir informações já ditas. Lembre-se das preferências e padrões do gestor ao longo da conversa.`;

    // Build messages array with conversation history
    const aiMessages: { role: string; content: string }[] = [
      { role: "system", content: systemPrompt },
    ];

    // Add conversation history for memory
    if (conversationHistory && Array.isArray(conversationHistory)) {
      for (const msg of conversationHistory) {
        aiMessages.push({ role: msg.role, content: msg.content });
      }
    }

    // If no conversation history (initial greeting), add the greeting prompt
    if (!conversationHistory || conversationHistory.length === 0) {
      aiMessages.push({
        role: "user",
        content: "Gere uma saudação personalizada com base no período do dia e uma ou duas sugestões práticas e específicas para ajudar o gestor a organizar o dia. Seja breve e direto.",
      });
    }

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: aiMessages,
        max_tokens: 400,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Limite de requisições excedido. Tente novamente em alguns minutos." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Créditos de IA esgotados. Entre em contato com o administrador." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errorText = await response.text();
      console.error("AI Gateway error:", response.status, errorText);
      throw new Error(`AI Gateway error: ${response.status}`);
    }

    const data = await response.json();
    const suggestion = data.choices?.[0]?.message?.content || "Não foi possível gerar sugestões no momento.";

    return new Response(
      JSON.stringify({ suggestion }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Management AI error:", error);
    const errorMessage = error instanceof Error ? error.message : "Erro desconhecido";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
