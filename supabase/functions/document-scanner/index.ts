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

    const { image_base64, image_type, context } = await req.json();
    if (!image_base64) throw new Error('No image provided');

    // Build context sections for better matching
    let contextSection = '';
    if (context?.employees?.length) {
      contextSection += `\n\nFUNCIONÁRIOS DA EMPRESA:\n${context.employees.map((e: any) => `- ID: ${e.id} | Nome: "${e.name}"`).join('\n')}`;
    }
    if (context?.inventory_items?.length) {
      contextSection += `\n\nITENS DE ESTOQUE:\n${context.inventory_items.map((i: any) => `- ID: ${i.id} | Nome: "${i.name}" | Unidade: ${i.unit_type} | Preço: R$${i.unit_price || 0}`).join('\n')}`;
    }
    if (context?.suppliers?.length) {
      contextSection += `\n\nFORNECEDORES:\n${context.suppliers.map((s: any) => `- ID: ${s.id} | Nome: "${s.name}"`).join('\n')}`;
    }
    if (context?.finance_categories?.length) {
      contextSection += `\n\nCATEGORIAS FINANCEIRAS:\n${context.finance_categories.map((c: any) => `- ID: ${c.id} | Nome: "${c.name}" | Tipo: ${c.type} | Pai: ${c.parent_name || 'raiz'}`).join('\n')}`;
    }

    const systemPrompt = `Você é um sistema inteligente de classificação e extração de dados de documentos empresariais brasileiros.

TAREFA: Analise a imagem, classifique o tipo de documento e extraia todos os dados relevantes.

TIPOS DE DOCUMENTO SUPORTADOS:
1. "pix_receipt" - Comprovante de Pix/transferência (pagamento de funcionário, fornecedor, etc.)
2. "invoice" - Nota Fiscal (DANFE) com produtos
3. "boleto" - Boleto bancário
4. "stock_exit" - Papel/lista de saída de estoque (anotação manual ou impressa)
5. "payslip" - Holerite/Contracheque de funcionário
6. "generic_receipt" - Recibo, cupom fiscal ou comprovante genérico de despesa
7. "unknown" - Documento não reconhecido

REGRAS DE EXTRAÇÃO POR TIPO:

Para "pix_receipt":
- amount: valor da transferência
- date: data (YYYY-MM-DD)
- payer_name: nome do pagador
- receiver_name: nome do recebedor
- description: descrição/motivo
- matched_employee_id: ID do funcionário se identificável (ou null)
- payment_type: "salary" | "vale" | "bonus" | "other"

Para "invoice":
- supplier_name, invoice_number, invoice_date, total_amount
- items: [{ description, quantity, unit_type, unit_price, total, matched_item_id, confidence }]
- matched_supplier_id: ID do fornecedor se identificável

Para "boleto":
- amount, due_date (YYYY-MM-DD), barcode, beneficiary_name
- matched_supplier_id, suggested_category_id

Para "stock_exit":
- items: [{ description, quantity, unit_type, matched_item_id, confidence }]

Para "payslip":
- employee_name, matched_employee_id, reference_month, reference_year
- base_salary, net_salary, total_deductions

Para "generic_receipt":
- description, amount, date, suggested_category_id, vendor_name

SEMPRE RETORNE:
- missing_info: lista de informações que não puderam ser extraídas ou estão ambíguas
- suggested_actions: lista de ações sugeridas ao usuário
- confidence: 0-1 de confiança geral na classificação
${contextSection}

RESPONDA APENAS com JSON válido:
{
  "document_type": "string",
  "confidence": number,
  "extracted_data": { ... },
  "missing_info": [{ "field": "string", "message": "string" }],
  "suggested_actions": [{ "action": "string", "description": "string" }]
}`;

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
              { type: 'text', text: 'Analise esta imagem, classifique o documento e extraia todos os dados. Responda APENAS com JSON.' },
            ],
          },
        ],
        max_tokens: 4000,
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
        return new Response(JSON.stringify({ error: 'Créditos insuficientes. Adicione créditos ao workspace.' }), {
          status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      const errorText = await response.text();
      throw new Error(`AI API error [${response.status}]: ${errorText}`);
    }

    const aiResult = await response.json();
    const content = aiResult.choices?.[0]?.message?.content || '';

    let parsedData;
    try {
      const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/);
      const jsonStr = jsonMatch ? jsonMatch[1].trim() : content.trim();
      parsedData = JSON.parse(jsonStr);
    } catch {
      console.error('Failed to parse AI response:', content);
      throw new Error('Não foi possível interpretar a imagem. Tente novamente com uma foto mais nítida.');
    }

    return new Response(JSON.stringify({ success: true, data: parsedData }), {
      status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error: unknown) {
    console.error('Document scanner error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ success: false, error: errorMessage }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
