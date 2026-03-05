import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

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
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const { descriptions, categories, suppliers, employees } = await req.json();

    if (!descriptions || !Array.isArray(descriptions) || descriptions.length === 0) {
      return new Response(JSON.stringify({ error: "descriptions array is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Build context for the AI
    const categoryList = (categories || []).map((c: any) => {
      const subs = (c.subcategories || []).map((s: any) => `  - ${s.name} (id: ${s.id})`).join("\n");
      return `- ${c.name} (id: ${c.id}, tipo: ${c.type})${subs ? "\n" + subs : ""}`;
    }).join("\n");

    const supplierList = (suppliers || []).map((s: any) => `- ${s.name} (id: ${s.id})`).join("\n");
    const employeeList = (employees || []).map((e: any) => `- ${e.full_name} (id: ${e.id})`).join("\n");

    const systemPrompt = `Você é um sistema inteligente de categorização financeira para um restaurante/comércio brasileiro.

Sua tarefa: receber descrições de transações/despesas e mapear cada uma para a categoria, fornecedor e/ou funcionário correto do negócio.

REGRAS:
1. Se a descrição parece ser um NOME DE PESSOA, verifique se corresponde a algum funcionário. Se sim, use category de "Folha de Pagamento > Salários" e retorne o employee_id.
2. Se a descrição corresponde a um FORNECEDOR conhecido, retorne o supplier_id e a categoria mais provável (ex: "Matéria-prima").
3. "Moto", "motoboy", "uber", "99" → "Taxas Operacionais > App Delivery"
4. "Gás", "botijão" → busque na lista de categorias por "Gás e Combustível" ou similar
5. Se não tem certeza (confidence < 0.8), inclua uma "question" curta para o usuário confirmar.
6. SEMPRE retorne IDs reais da lista fornecida. Nunca invente IDs.
7. Se não encontrar correspondência, retorne category_id: null com confidence: 0.

CATEGORIAS DISPONÍVEIS:
${categoryList || "(nenhuma)"}

FORNECEDORES:
${supplierList || "(nenhum)"}

FUNCIONÁRIOS:
${employeeList || "(nenhum)"}`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          {
            role: "user",
            content: `Categorize as seguintes descrições de transações:\n${descriptions.map((d: string, i: number) => `${i + 1}. "${d}"`).join("\n")}`,
          },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "categorize_transactions",
              description: "Retorna a categorização de múltiplas descrições de transações",
              parameters: {
                type: "object",
                properties: {
                  results: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        description: { type: "string", description: "A descrição original" },
                        category_id: { type: "string", description: "ID da categoria mais adequada, ou null se incerto" },
                        employee_id: { type: "string", description: "ID do funcionário se a descrição é um nome de pessoa/funcionário, ou null" },
                        supplier_id: { type: "string", description: "ID do fornecedor se corresponde, ou null" },
                        confidence: { type: "number", description: "Confiança de 0 a 1" },
                        question: { type: "string", description: "Pergunta para o usuário quando confidence < 0.8" },
                      },
                      required: ["description", "confidence"],
                      additionalProperties: false,
                    },
                  },
                },
                required: ["results"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "categorize_transactions" } },
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Muitas requisições. Tente novamente em alguns segundos." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Créditos de IA esgotados." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const text = await response.text();
      console.error("AI gateway error:", response.status, text);
      return new Response(JSON.stringify({ error: "Erro ao categorizar" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const result = await response.json();
    const toolCall = result.choices?.[0]?.message?.tool_calls?.[0];

    if (!toolCall) {
      return new Response(JSON.stringify({ results: descriptions.map((d: string) => ({ description: d, confidence: 0 })) }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const parsed = JSON.parse(toolCall.function.arguments);

    return new Response(JSON.stringify(parsed), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("finance-categorize error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Erro desconhecido" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
