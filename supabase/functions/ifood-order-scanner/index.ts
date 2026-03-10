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
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ success: false, error: 'Unauthorized' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { createClient } = await import("https://esm.sh/@supabase/supabase-js@2");
    const supabaseAuth = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } }
    );
    const token = authHeader.replace('Bearer ', '');
    const { data: claimsData, error: claimsError } = await supabaseAuth.auth.getClaims(token);
    if (claimsError || !claimsData?.claims?.sub) {
      return new Response(JSON.stringify({ success: false, error: 'Unauthorized' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) throw new Error('LOVABLE_API_KEY not configured');

    const { image_base64, image_type } = await req.json();
    if (!image_base64) throw new Error('No image provided');

    const systemPrompt = `Você é um especialista em leitura de pedidos do iFood e apps de delivery brasileiros.
Analise a imagem (screenshot ou foto da tela) e extraia TODOS os dados do pedido.

EXTRAIA:
- platform_order_id: Número/ID do pedido no iFood (ex: "#A1B2", "Pedido 1234")
- platform_display_id: ID curto exibido (ex: "A1B2", "1234")  
- customer_name: Nome do cliente
- customer_phone: Telefone do cliente (se visível)
- customer_address: Endereço completo de entrega
- payment_method: Forma de pagamento (ex: "Cartão de crédito", "Dinheiro", "Pix", "Vale-refeição")
- items: Array de itens do pedido, cada um com:
  - name: Nome do item
  - quantity: Quantidade
  - unit_price: Preço unitário
  - total_price: Preço total do item
  - notes: Observações/customizações do item
  - options: Array de complementos/opções selecionadas (ex: [{name: "Queijo extra", price: 2.00}])
- subtotal: Subtotal dos itens
- delivery_fee: Taxa de entrega
- discount: Desconto aplicado
- total: Valor total do pedido
- notes: Observações gerais do pedido

REGRAS:
1. O ID/número do pedido é MUITO IMPORTANTE - procure em todas as áreas
2. Extraia TODOS os itens com seus detalhes
3. Valores monetários devem ser números (sem R$)
4. Se não conseguir ler algo, use string vazia ou 0
5. Observe complementos, adicionais e observações de cada item
6. Se houver cupom/desconto, registre o valor`;

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          {
            role: 'user',
            content: [
              {
                type: 'image_url',
                image_url: { url: `data:${image_type || 'image/jpeg'};base64,${image_base64}` },
              },
              {
                type: 'text',
                text: 'Analise esta imagem de pedido do iFood/delivery e extraia todos os dados. Responda APENAS com JSON válido via tool call.',
              },
            ],
          },
        ],
        tools: [
          {
            type: 'function',
            function: {
              name: 'extract_ifood_order',
              description: 'Extrair dados completos de um pedido iFood a partir de screenshot',
              parameters: {
                type: 'object',
                properties: {
                  platform_order_id: { type: 'string', description: 'ID do pedido na plataforma' },
                  platform_display_id: { type: 'string', description: 'ID curto exibido' },
                  customer_name: { type: 'string', description: 'Nome do cliente' },
                  customer_phone: { type: 'string', description: 'Telefone do cliente' },
                  customer_address: { type: 'string', description: 'Endereço de entrega' },
                  payment_method: { type: 'string', description: 'Forma de pagamento' },
                  items: {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: {
                        name: { type: 'string' },
                        quantity: { type: 'number' },
                        unit_price: { type: 'number' },
                        total_price: { type: 'number' },
                        notes: { type: 'string' },
                        options: {
                          type: 'array',
                          items: {
                            type: 'object',
                            properties: {
                              name: { type: 'string' },
                              price: { type: 'number' },
                            },
                            required: ['name'],
                            additionalProperties: false,
                          },
                        },
                      },
                      required: ['name', 'quantity', 'unit_price', 'total_price'],
                      additionalProperties: false,
                    },
                  },
                  subtotal: { type: 'number' },
                  delivery_fee: { type: 'number' },
                  discount: { type: 'number' },
                  total: { type: 'number' },
                  notes: { type: 'string' },
                },
                required: ['customer_name', 'items', 'total'],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: 'function', function: { name: 'extract_ifood_order' } },
        max_tokens: 4000,
        temperature: 0.1,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      if (response.status === 429) {
        return new Response(JSON.stringify({ success: false, error: 'Muitas requisições. Tente novamente em alguns segundos.' }), {
          status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ success: false, error: 'Créditos de IA insuficientes.' }), {
          status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      throw new Error(`AI API error [${response.status}]: ${errorText}`);
    }

    const aiResult = await response.json();
    const toolCall = aiResult.choices?.[0]?.message?.tool_calls?.[0];
    let parsedData;

    if (toolCall?.function?.arguments) {
      parsedData = typeof toolCall.function.arguments === 'string'
        ? JSON.parse(toolCall.function.arguments)
        : toolCall.function.arguments;
    } else {
      const content = aiResult.choices?.[0]?.message?.content || '';
      try {
        const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/);
        const jsonStr = jsonMatch ? jsonMatch[1].trim() : content.trim();
        parsedData = JSON.parse(jsonStr);
      } catch {
        throw new Error('Não foi possível interpretar a imagem. Tente com uma foto mais nítida.');
      }
    }

    return new Response(JSON.stringify({
      success: true,
      data: {
        platform_order_id: parsedData.platform_order_id || '',
        platform_display_id: parsedData.platform_display_id || '',
        customer_name: parsedData.customer_name || '',
        customer_phone: parsedData.customer_phone || '',
        customer_address: parsedData.customer_address || '',
        payment_method: parsedData.payment_method || '',
        items: (parsedData.items || []).map((item: any) => ({
          name: item.name || '',
          quantity: item.quantity || 1,
          unit_price: item.unit_price || 0,
          total_price: item.total_price || 0,
          notes: item.notes || '',
          options: item.options || [],
        })),
        subtotal: parsedData.subtotal || 0,
        delivery_fee: parsedData.delivery_fee || 0,
        discount: parsedData.discount || 0,
        total: parsedData.total || 0,
        notes: parsedData.notes || '',
      },
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: unknown) {
    console.error('iFood scanner error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ success: false, error: errorMessage }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
