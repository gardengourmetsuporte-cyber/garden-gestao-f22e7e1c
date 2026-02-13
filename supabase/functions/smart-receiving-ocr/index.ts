import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    const { image_base64, image_type, inventory_items } = await req.json();

    if (!image_base64) {
      throw new Error('No image provided');
    }

    // Build inventory context for matching
    const inventoryContext = inventory_items?.length > 0
      ? `\n\nINVENTÁRIO ATUAL (use para fazer matching dos produtos):\n${inventory_items.map((i: any) => `- ID: ${i.id} | Nome: "${i.name}" | Unidade: ${i.unit_type} | Preço unitário: R$${i.unit_price || 0}`).join('\n')}`
      : '';

    const systemPrompt = `Você é um especialista em leitura de notas fiscais brasileiras (DANFE) e boletos bancários.
Analise a imagem enviada e extraia os dados estruturados.

REGRAS:
1. Para NOTAS FISCAIS (DANFE), extraia:
   - supplier_name: Nome/Razão Social do emitente
   - invoice_number: Número da NF
   - invoice_date: Data de emissão (formato YYYY-MM-DD)
   - total_amount: Valor total da nota
   - items: Lista de produtos com { description, quantity, unit_type, unit_price, total }
   
2. Para BOLETOS, extraia:
   - boleto_amount: Valor do boleto
   - boleto_due_date: Data de vencimento (formato YYYY-MM-DD)
   - boleto_barcode: Linha digitável se visível
   - supplier_name: Nome do beneficiário

3. Para cada item da nota, tente fazer matching com o inventário existente:
   - matched_item_id: ID do item correspondente no inventário (ou null se não encontrar)
   - confidence: Grau de confiança do match (0 a 1)
   - Se o nome do produto na nota for similar a um item do inventário, faça o match
${inventoryContext}

RESPONDA APENAS com JSON válido no formato:
{
  "document_type": "invoice" | "boleto" | "both",
  "supplier_name": "string",
  "invoice_number": "string | null",
  "invoice_date": "YYYY-MM-DD | null",
  "total_amount": number,
  "boleto_amount": number | null,
  "boleto_due_date": "YYYY-MM-DD | null",
  "boleto_barcode": "string | null",
  "items": [
    {
      "description": "string",
      "quantity": number,
      "unit_type": "unidade | kg | litro",
      "unit_price": number,
      "total": number,
      "matched_item_id": "uuid | null",
      "matched_name": "string | null",
      "confidence": number
    }
  ]
}`;

    // Call OpenAI GPT-4o via Lovable AI proxy
    const response = await fetch('https://ai-proxy.lovable.dev/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'openai/gpt-5',
        messages: [
          { role: 'system', content: systemPrompt },
          {
            role: 'user',
            content: [
              {
                type: 'image_url',
                image_url: {
                  url: `data:${image_type || 'image/jpeg'};base64,${image_base64}`,
                },
              },
              {
                type: 'text',
                text: 'Analise esta imagem e extraia todos os dados. Responda APENAS com o JSON.',
              },
            ],
          },
        ],
        max_tokens: 4000,
        temperature: 0.1,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`AI API error [${response.status}]: ${errorText}`);
    }

    const aiResult = await response.json();
    const content = aiResult.choices?.[0]?.message?.content || '';

    // Parse the JSON from AI response
    let parsedData;
    try {
      // Try to extract JSON from markdown code block if present
      const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/);
      const jsonStr = jsonMatch ? jsonMatch[1].trim() : content.trim();
      parsedData = JSON.parse(jsonStr);
    } catch (parseError) {
      console.error('Failed to parse AI response:', content);
      throw new Error('Não foi possível interpretar a imagem. Tente novamente com uma foto mais nítida.');
    }

    return new Response(JSON.stringify({
      success: true,
      data: parsedData,
      raw_response: content,
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: unknown) {
    console.error('Smart receiving OCR error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({
      success: false,
      error: errorMessage,
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
