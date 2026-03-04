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
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
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
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    const { image_base64, image_type } = await req.json();

    if (!image_base64) {
      throw new Error('No image provided');
    }

    const systemPrompt = `Você é um especialista em leitura de pedidos, comandas e notas de delivery brasileiras.
Analise a imagem enviada e extraia os dados de entrega.

EXTRAIA:
- customer_name: Nome do cliente (se visível)
- full_address: Endereço completo de entrega
- neighborhood: Bairro (OBRIGATÓRIO - se não visível, inferir da cidade/região)
- city: Cidade
- reference: Ponto de referência (se houver)
- items_summary: Resumo dos itens do pedido (ex: "2x Hambúrguer, 1x Coca-Cola")
- total: Valor total do pedido (número, 0 se não visível)

REGRAS:
1. Sempre tente extrair o bairro - é a chave de agrupamento das rotas
2. Se o endereço não estiver claro, extraia o máximo possível
3. Se houver múltiplos pedidos na imagem, extraia apenas o primeiro
4. Valores monetários devem ser números (sem R$)
5. Se não conseguir ler algo, use string vazia ao invés de inventar`;

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
                image_url: {
                  url: `data:${image_type || 'image/jpeg'};base64,${image_base64}`,
                },
              },
              {
                type: 'text',
                text: 'Analise esta imagem de pedido/comanda e extraia os dados de entrega. Responda APENAS com JSON válido.',
              },
            ],
          },
        ],
        tools: [
          {
            type: 'function',
            function: {
              name: 'extract_delivery',
              description: 'Extrair dados de entrega de uma imagem de pedido',
              parameters: {
                type: 'object',
                properties: {
                  customer_name: { type: 'string', description: 'Nome do cliente' },
                  full_address: { type: 'string', description: 'Endereço completo' },
                  neighborhood: { type: 'string', description: 'Bairro' },
                  city: { type: 'string', description: 'Cidade' },
                  reference: { type: 'string', description: 'Ponto de referência' },
                  items_summary: { type: 'string', description: 'Resumo dos itens' },
                  total: { type: 'number', description: 'Valor total do pedido' },
                },
                required: ['customer_name', 'full_address', 'neighborhood'],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: 'function', function: { name: 'extract_delivery' } },
        max_tokens: 2000,
        temperature: 0.1,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      if (response.status === 429) {
        return new Response(JSON.stringify({ success: false, error: 'Muitas requisições. Tente novamente em alguns segundos.' }), {
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ success: false, error: 'Créditos de IA insuficientes.' }), {
          status: 402,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      throw new Error(`AI API error [${response.status}]: ${errorText}`);
    }

    const aiResult = await response.json();
    
    // Extract from tool call
    const toolCall = aiResult.choices?.[0]?.message?.tool_calls?.[0];
    let parsedData;
    
    if (toolCall?.function?.arguments) {
      parsedData = typeof toolCall.function.arguments === 'string' 
        ? JSON.parse(toolCall.function.arguments) 
        : toolCall.function.arguments;
    } else {
      // Fallback: try parsing content directly
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
        customer_name: parsedData.customer_name || '',
        full_address: parsedData.full_address || '',
        neighborhood: parsedData.neighborhood || '',
        city: parsedData.city || '',
        reference: parsedData.reference || '',
        items_summary: parsedData.items_summary || '',
        total: parsedData.total || 0,
      },
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: unknown) {
    console.error('Delivery OCR error:', error);
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
