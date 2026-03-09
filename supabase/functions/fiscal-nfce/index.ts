import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // Validate JWT
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    if (userError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { action, sale_id, unit_id } = await req.json();

    // Validate unit access
    const { data: access } = await supabase
      .from('user_units')
      .select('id')
      .eq('user_id', user.id)
      .eq('unit_id', unit_id)
      .single();

    if (!access) {
      return new Response(JSON.stringify({ error: 'Access denied' }), {
        status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (action === 'emit-nfce') {
      // Get Focus NFe API key from secrets
      const focusApiKey = Deno.env.get('FOCUS_NFE_API_KEY');
      const focusEnv = Deno.env.get('FOCUS_NFE_ENV') || 'homologacao'; // homologacao or producao

      if (!focusApiKey) {
        return new Response(JSON.stringify({
          error: 'Integração fiscal não configurada. Configure a API Key do Focus NFe.',
          code: 'MISSING_API_KEY',
        }), {
          status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Fetch sale data
      const { data: sale, error: saleError } = await supabase
        .from('pos_sales')
        .select('*, pos_sale_items(*), pos_sale_payments(*)')
        .eq('id', sale_id)
        .single();

      if (saleError || !sale) {
        return new Response(JSON.stringify({ error: 'Venda não encontrada' }), {
          status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Fetch unit fiscal data
      const { data: unitData } = await supabase
        .from('units')
        .select('name, cnpj, inscricao_estadual, endereco_fiscal')
        .eq('id', unit_id)
        .single();

      // Build NFC-e payload for Focus NFe API
      const baseUrl = focusEnv === 'producao'
        ? 'https://api.focusnfe.com.br'
        : 'https://homologacao.focusnfe.com.br';

      // Map payment methods to fiscal codes
      const paymentCodeMap: Record<string, string> = {
        cash: '01',      // Dinheiro
        debit: '04',     // Cartão de Débito
        credit: '03',    // Cartão de Crédito
        pix: '17',       // Pix
        meal_voucher: '10', // Vale Alimentação
      };

      const nfcePayload = {
        natureza_operacao: 'VENDA',
        tipo_documento: 1,
        finalidade_emissao: 1,
        presenca_comprador: 1, // Presencial
        consumidor_final: 1,
        // Items
        items: sale.pos_sale_items.map((item: any, idx: number) => ({
          numero_item: idx + 1,
          codigo_produto: item.product_code || item.id.slice(0, 8),
          descricao: item.product_name,
          quantidade_comercial: item.quantity,
          valor_unitario_comercial: item.unit_price,
          valor_bruto: item.total_price,
          unidade_comercial: 'UN',
          codigo_ncm: '21069090', // Default NCM for food
          cfop: '5102', // Venda de mercadoria
          icms_situacao_tributaria: '102', // Simples Nacional
          icms_origem: 0,
        })),
        // Payments
        formas_pagamento: sale.pos_sale_payments.map((p: any) => ({
          forma_pagamento: paymentCodeMap[p.method] || '99',
          valor_pagamento: p.amount,
          troco: p.change_amount || 0,
        })),
        // Customer CPF (optional)
        ...(sale.customer_document ? {
          cpf: sale.customer_document.replace(/\D/g, ''),
        } : {}),
        // Discount
        ...(sale.discount > 0 ? {
          valor_desconto: sale.discount,
        } : {}),
      };

      const ref = `sale-${sale.id.slice(0, 8)}`;

      // Call Focus NFe API
      const response = await fetch(`${baseUrl}/v2/nfce?ref=${ref}`, {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${btoa(focusApiKey + ':' + '')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(nfcePayload),
      });

      const result = await response.json();

      if (response.ok && (result.status === 'processando_autorizacao' || result.status === 'autorizado')) {
        // Update sale with fiscal data
        await supabase
          .from('pos_sales')
          .update({
            fiscal_status: 'issued',
            fiscal_key: result.chave_nfe || null,
            fiscal_number: result.numero || null,
            fiscal_xml: result.caminho_xml_nota_fiscal || null,
            updated_at: new Date().toISOString(),
          })
          .eq('id', sale_id);

        return new Response(JSON.stringify({
          success: true,
          status: result.status,
          fiscal_key: result.chave_nfe,
          fiscal_number: result.numero,
          danfe_url: result.caminho_danfe,
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      } else {
        // Update sale with error
        await supabase
          .from('pos_sales')
          .update({
            fiscal_status: 'error',
            fiscal_error: JSON.stringify(result),
            updated_at: new Date().toISOString(),
          })
          .eq('id', sale_id);

        return new Response(JSON.stringify({
          error: 'Erro na emissão da NFC-e',
          details: result,
        }), {
          status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    }

    if (action === 'check-status') {
      const focusApiKey = Deno.env.get('FOCUS_NFE_API_KEY');
      const focusEnv = Deno.env.get('FOCUS_NFE_ENV') || 'homologacao';

      if (!focusApiKey) {
        return new Response(JSON.stringify({ configured: false }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      return new Response(JSON.stringify({ configured: true, environment: focusEnv }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ error: 'Invalid action' }), {
      status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
