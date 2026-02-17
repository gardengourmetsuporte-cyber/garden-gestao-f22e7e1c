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

    // Build a rich data snapshot for the AI
    const dataLines: string[] = [];

    // Finance
    if (context?.accounts?.length) {
      dataLines.push(`\n💰 CONTAS BANCÁRIAS:\n${context.accounts.join('\n')}`);
    }
    if (context?.monthlyIncome !== undefined) {
      dataLines.push(`\n📊 FINANCEIRO DO MÊS:\n- Receita: R$${Number(context.monthlyIncome).toFixed(2)}\n- Despesa: R$${Number(context.monthlyExpense).toFixed(2)}\n- Saldo: R$${Number(context.monthlyBalance).toFixed(2)}\n- Despesas pendentes: R$${Number(context.pendingExpensesTotal || 0).toFixed(2)}`);
    }
    if (context?.pendingExpenses?.length) {
      dataLines.push(`\n📋 DESPESAS PENDENTES:\n${context.pendingExpenses.join('\n')}`);
    }
    if (context?.recentTransactions?.length) {
      dataLines.push(`\n🔄 ÚLTIMAS TRANSAÇÕES (7 dias):\n${context.recentTransactions.join('\n')}`);
    }

    // Stock
    if (context?.lowStockItems?.length) {
      dataLines.push(`\n⚠️ ESTOQUE BAIXO (${context.criticalStockCount || 0} itens críticos):\n${context.lowStockItems.join('\n')}`);
    }

    // Orders
    if (context?.pendingOrders?.length) {
      dataLines.push(`\n📦 PEDIDOS PENDENTES:\n${context.pendingOrders.join('\n')}`);
    }

    // Cash closings
    if (context?.pendingClosings?.length) {
      dataLines.push(`\n🧾 FECHAMENTOS PENDENTES:\n${context.pendingClosings.join('\n')}`);
    }

    // Team
    if (context?.employees?.length) {
      dataLines.push(`\n👥 EQUIPE ATIVA (${context.employees.length}):\n${context.employees.join('\n')}`);
    }

    // Employee payments
    if (context?.employeePayments?.length) {
      dataLines.push(`\n💸 PAGAMENTOS DE FUNCIONÁRIOS (mês atual):\n${context.employeePayments.join('\n')}`);
    }

    // Suppliers
    if (context?.suppliers?.length) {
      dataLines.push(`\n🚚 FORNECEDORES:\n${context.suppliers.join('\n')}`);
    }

    // Tasks
    if (context?.todayTasks?.length) {
      dataLines.push(`\n✅ TAREFAS DE HOJE:\n${context.todayTasks.join('\n')}`);
    }

    // All month transactions
    if (context?.allMonthTransactions?.length) {
      dataLines.push(`\n📑 TODAS TRANSAÇÕES DO MÊS (${context.allMonthTransactions.length}):\n${context.allMonthTransactions.join('\n')}`);
    }

    const dataSnapshot = dataLines.length > 0 ? dataLines.join('\n') : 'Dados ainda carregando...';

    const systemPrompt = `Você é o Copiloto Garden, um assistente de gestão inteligente para restaurantes e estabelecimentos comerciais. Você tem acesso COMPLETO ao banco de dados do estabelecimento e deve usar esses dados para dar respostas precisas e actionáveis.

REGRAS:
- Seja direto e objetivo (máximo 4-5 frases por resposta)
- Use números reais dos dados abaixo, nunca invente valores
- Sugira ações concretas baseadas nos dados
- Use português brasileiro natural
- Use emojis com moderação
- Quando não souber algo específico, diga que não tem essa informação ainda

DADOS ATUAIS DO ESTABELECIMENTO:
- Dia: ${context?.dayOfWeek || 'não informado'} (${context?.timeOfDay || ''})
- Resgates pendentes: ${context?.pendingRedemptions || 0}
${dataSnapshot}

Você tem acesso ao histórico de conversa. Use-o para manter contexto, lembrar preferências do gestor e não repetir informações.`;

    const aiMessages: { role: string; content: string }[] = [
      { role: "system", content: systemPrompt },
    ];

    if (conversationHistory && Array.isArray(conversationHistory)) {
      for (const msg of conversationHistory) {
        aiMessages.push({ role: msg.role, content: msg.content });
      }
    }

    if (!conversationHistory || conversationHistory.length === 0) {
      aiMessages.push({
        role: "user",
        content: "Gere uma saudação personalizada com base no período do dia e dê um resumo rápido da situação financeira e operacional com base nos dados disponíveis. Inclua alertas importantes se houver.",
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
        messages: aiMessages,
        max_tokens: 800,
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
