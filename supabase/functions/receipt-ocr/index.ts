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

    const { image_base64 } = await req.json();
    if (!image_base64) {
      return new Response(JSON.stringify({ error: "image_base64 is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "system",
            content: `Você é um especialista em analisar comprovantes de pagamento brasileiros (Pix, TED, DOC, boleto, transferência bancária). Extraia os dados estruturados do comprovante usando a função fornecida. Sempre retorne valores numéricos sem formatação (ex: 150.50 e não "R$ 150,50"). Para a data, use formato YYYY-MM-DD. Para suggested_type, use "expense" na maioria dos casos (pagamentos saindo), e "income" apenas se for um recebimento. Para suggested_category_name, sugira uma categoria baseada no beneficiário/descrição (ex: "Energia" para conta de luz, "Mercado" para supermercado, "Aluguel" para pagamento de aluguel, etc). Se não souber, sugira "Outros".`,
          },
          {
            role: "user",
            content: [
              {
                type: "image_url",
                image_url: {
                  url: image_base64.startsWith("data:")
                    ? image_base64
                    : `data:image/jpeg;base64,${image_base64}`,
                },
              },
              {
                type: "text",
                text: "Analise este comprovante de pagamento e extraia todos os dados relevantes.",
              },
            ],
          },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "extract_receipt_data",
              description: "Extrair dados estruturados de um comprovante de pagamento",
              parameters: {
                type: "object",
                properties: {
                  amount: {
                    type: "number",
                    description: "Valor do pagamento em reais (ex: 150.50)",
                  },
                  date: {
                    type: "string",
                    description: "Data do pagamento no formato YYYY-MM-DD",
                  },
                  description: {
                    type: "string",
                    description: "Nome do beneficiário ou descrição do pagamento",
                  },
                  transfer_type: {
                    type: "string",
                    enum: ["pix", "ted", "doc", "boleto", "transferencia", "outro"],
                    description: "Tipo de transferência",
                  },
                  bank_info: {
                    type: "string",
                    description: "Informações do banco (nome do banco, agência, etc) se visíveis",
                  },
                  suggested_type: {
                    type: "string",
                    enum: ["expense", "income"],
                    description: "Sugestão se é despesa ou receita",
                  },
                  suggested_category_name: {
                    type: "string",
                    description: "Sugestão de categoria baseada no beneficiário (ex: Energia, Aluguel, Mercado, Matéria-prima, Salários, etc)",
                  },
                },
                required: ["amount", "date", "description", "suggested_type", "suggested_category_name"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "extract_receipt_data" } },
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Muitas requisições. Tente novamente em alguns segundos." }), {
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
      const text = await response.text();
      console.error("AI gateway error:", response.status, text);
      return new Response(JSON.stringify({ error: "Erro ao processar comprovante" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const result = await response.json();
    const toolCall = result.choices?.[0]?.message?.tool_calls?.[0];

    if (!toolCall) {
      return new Response(JSON.stringify({ error: "Não foi possível extrair dados do comprovante" }), {
        status: 422,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const extractedData = JSON.parse(toolCall.function.arguments);

    return new Response(JSON.stringify(extractedData), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("receipt-ocr error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Erro desconhecido" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
