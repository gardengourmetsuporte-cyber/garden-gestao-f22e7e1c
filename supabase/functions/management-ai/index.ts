import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// n8n webhook URL - trocar webhook-test para webhook em produção
const N8N_WEBHOOK_URL = "https://gardengourmet.app.n8n.cloud/webhook-test/garden-create-transaction";

const TOOLS = [
  {
    type: "function",
    function: {
      name: "create_transaction",
      description: "Criar uma transação financeira (receita ou despesa) no sistema. Use quando o usuário pedir para registrar, lançar, criar ou adicionar uma transação financeira.",
      parameters: {
        type: "object",
        properties: {
          type: { type: "string", enum: ["income", "expense"], description: "Tipo: income para receita, expense para despesa" },
          amount: { type: "number", description: "Valor em reais (ex: 200.50)" },
          description: { type: "string", description: "Descrição da transação" },
          category_name: { type: "string", description: "Nome da categoria financeira (ex: Alimentação, Água, Energia)" },
          account_name: { type: "string", description: "Nome da conta bancária para registrar" },
          supplier_name: { type: "string", description: "Nome do fornecedor relacionado" },
          employee_name: { type: "string", description: "Nome do funcionário relacionado" },
          date: { type: "string", description: "Data no formato YYYY-MM-DD. Se não informado, usa hoje" },
          is_paid: { type: "boolean", description: "Se a transação já foi paga. Default: true" },
        },
        required: ["type", "amount", "description"],
      },
    },
  },
];

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
    const { messages: conversationHistory, context, user_id, unit_id } = body;

    // Build data snapshot
    const dataLines: string[] = [];

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
    if (context?.lowStockItems?.length) {
      dataLines.push(`\n⚠️ ESTOQUE BAIXO (${context.criticalStockCount || 0} itens críticos):\n${context.lowStockItems.join('\n')}`);
    }
    if (context?.pendingOrders?.length) {
      dataLines.push(`\n📦 PEDIDOS PENDENTES:\n${context.pendingOrders.join('\n')}`);
    }
    if (context?.pendingClosings?.length) {
      dataLines.push(`\n🧾 FECHAMENTOS PENDENTES:\n${context.pendingClosings.join('\n')}`);
    }
    if (context?.employees?.length) {
      dataLines.push(`\n👥 EQUIPE ATIVA (${context.employees.length}):\n${context.employees.join('\n')}`);
    }
    if (context?.employeePayments?.length) {
      dataLines.push(`\n💸 PAGAMENTOS DE FUNCIONÁRIOS (mês atual):\n${context.employeePayments.join('\n')}`);
    }
    if (context?.suppliers?.length) {
      dataLines.push(`\n🚚 FORNECEDORES:\n${context.suppliers.join('\n')}`);
    }
    if (context?.todayTasks?.length) {
      dataLines.push(`\n✅ TAREFAS DE HOJE:\n${context.todayTasks.join('\n')}`);
    }
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

AÇÕES EXECUTÁVEIS:
- Quando o usuário pedir para CRIAR, REGISTRAR, LANÇAR, ADICIONAR ou CADASTRAR uma transação financeira (receita ou despesa), use a função create_transaction
- Use os dados do contexto para resolver nomes de categorias, contas, fornecedores e funcionários
- Sempre confirme os valores extraídos antes de executar a ação
- Se faltar informação obrigatória (tipo, valor ou descrição), pergunte ao usuário
- Para o campo date, se o usuário não especificar, use a data de hoje
- Para is_paid, assuma true se o usuário não disser que é pendente

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

    // First AI call - with tools
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
        tools: TOOLS,
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
    const choice = data.choices?.[0]?.message;

    // Check for tool calls
    if (choice?.tool_calls && choice.tool_calls.length > 0) {
      const toolCall = choice.tool_calls[0];
      
      if (toolCall.function.name === "create_transaction") {
        let args: any;
        try {
          args = typeof toolCall.function.arguments === 'string' 
            ? JSON.parse(toolCall.function.arguments) 
            : toolCall.function.arguments;
        } catch {
          return new Response(
            JSON.stringify({ suggestion: "Não consegui interpretar os dados da transação. Pode repetir?", action_executed: false }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        // Dispatch to n8n webhook
        try {
          const n8nPayload = {
            ...args,
            user_id: user_id || null,
            unit_id: unit_id || null,
          };

          console.log("Dispatching to n8n:", JSON.stringify(n8nPayload));

          const n8nResponse = await fetch(N8N_WEBHOOK_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(n8nPayload),
          });

          if (!n8nResponse.ok) {
            const errText = await n8nResponse.text();
            console.error("n8n error:", n8nResponse.status, errText);
            return new Response(
              JSON.stringify({ 
                suggestion: `❌ Erro ao criar transação: ${errText || 'Erro no servidor de automação'}`, 
                action_executed: false 
              }),
              { headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
          }

          const n8nResult = await n8nResponse.json();
          console.log("n8n result:", JSON.stringify(n8nResult));

          // Build confirmation message
          const typeLabel = args.type === 'income' ? 'Receita' : 'Despesa';
          const confirmationMsg = `[ACTION] ✅ ${typeLabel} criada com sucesso!\n\n` +
            `📝 ${args.description}\n` +
            `💰 R$ ${Number(args.amount).toFixed(2)}\n` +
            (args.category_name ? `📂 Categoria: ${args.category_name}\n` : '') +
            (args.account_name ? `🏦 Conta: ${args.account_name}\n` : '') +
            (args.supplier_name ? `🚚 Fornecedor: ${args.supplier_name}\n` : '') +
            (args.date ? `📅 Data: ${args.date}\n` : '') +
            (args.is_paid === false ? `⏳ Status: Pendente` : `✅ Status: Pago`);

          return new Response(
            JSON.stringify({ suggestion: confirmationMsg, action_executed: true }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        } catch (n8nErr) {
          console.error("n8n dispatch error:", n8nErr);
          return new Response(
            JSON.stringify({ 
              suggestion: "❌ Erro ao conectar com o sistema de automação. Tente novamente.", 
              action_executed: false 
            }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
      }
    }

    // No tool call - return normal text response
    const suggestion = choice?.content || "Não foi possível gerar sugestões no momento.";

    return new Response(
      JSON.stringify({ suggestion, action_executed: false }),
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
