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
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
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
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) throw new Error('LOVABLE_API_KEY not configured');

    const { image_base64, image_type } = await req.json();
    if (!image_base64) throw new Error('No image provided');

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          {
            role: 'system',
            content: `Você é um assistente que extrai dados de contatos e currículos a partir de imagens.
Analise a imagem e extraia as seguintes informações:
- name: nome completo da pessoa
- phone: telefone (com DDD, formato brasileiro)
- sector: classifique em um destes valores exatos: "cozinha", "salao", "entregador", "bar", "outros". 
  Se for um currículo, tente inferir pelo cargo/experiência. Se não conseguir, use "outros".
- notes: informações relevantes como experiência profissional, habilidades, disponibilidade, email, endereço.

IMPORTANTE: Retorne APENAS um JSON válido sem markdown, sem explicações.`,
          },
          {
            role: 'user',
            content: [
              {
                type: 'image_url',
                image_url: { url: `data:${image_type || 'image/jpeg'};base64,${image_base64}` },
              },
              { type: 'text', text: 'Extraia nome, telefone, setor e observações desta imagem. Responda APENAS com JSON: {"name":"...","phone":"...","sector":"...","notes":"..."}' },
            ],
          },
        ],
        tools: [
          {
            type: 'function',
            function: {
              name: 'extract_freelancer',
              description: 'Extract freelancer contact information from an image',
              parameters: {
                type: 'object',
                properties: {
                  name: { type: 'string', description: 'Full name of the person' },
                  phone: { type: 'string', description: 'Phone number with area code' },
                  sector: { type: 'string', enum: ['cozinha', 'salao', 'entregador', 'bar', 'outros'] },
                  notes: { type: 'string', description: 'Relevant notes like experience, skills, availability' },
                },
                required: ['name', 'phone', 'sector'],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: 'function', function: { name: 'extract_freelancer' } },
        max_tokens: 2000,
        temperature: 0.1,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: 'Rate limit exceeded. Tente novamente em alguns segundos.' }), {
          status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: 'Créditos insuficientes.' }), {
          status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      const errorText = await response.text();
      throw new Error(`AI API error [${response.status}]: ${errorText}`);
    }

    const aiResult = await response.json();
    
    // Try tool_calls first, fallback to content parsing
    let parsedData;
    const toolCall = aiResult.choices?.[0]?.message?.tool_calls?.[0];
    if (toolCall?.function?.arguments) {
      parsedData = JSON.parse(toolCall.function.arguments);
    } else {
      const content = aiResult.choices?.[0]?.message?.content || '';
      const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/);
      const jsonStr = jsonMatch ? jsonMatch[1].trim() : content.trim();
      parsedData = JSON.parse(jsonStr);
    }

    return new Response(JSON.stringify({ success: true, data: parsedData }), {
      status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error: unknown) {
    console.error('Freelancer OCR error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ success: false, error: errorMessage }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
