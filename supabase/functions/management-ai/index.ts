import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

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
  {
    type: "function",
    function: {
      name: "create_task",
      description: "Criar uma tarefa na agenda do gestor. Use quando o usuário pedir para criar, adicionar, lembrar ou agendar uma tarefa, compromisso ou lembrete.",
      parameters: {
        type: "object",
        properties: {
          title: { type: "string", description: "Título da tarefa" },
          date: { type: "string", description: "Data no formato YYYY-MM-DD. Se não informado, usa hoje" },
          period: { type: "string", enum: ["manha", "tarde", "noite"], description: "Período do dia: manha, tarde ou noite. Default: manha" },
          priority: { type: "string", enum: ["low", "medium", "high", "urgent"], description: "Prioridade: low, medium, high ou urgent. Default: medium" },
          notes: { type: "string", description: "Observações adicionais da tarefa" },
          due_time: { type: "string", description: "Horário de vencimento no formato HH:MM (ex: 14:30)" },
        },
        required: ["title"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "register_stock_movement",
      description: "Registrar entrada ou saída de estoque de um item do inventário. Use quando o usuário pedir para dar entrada, baixa, saída, registrar movimentação ou atualizar estoque de um produto.",
      parameters: {
        type: "object",
        properties: {
          item_name: { type: "string", description: "Nome do item do inventário" },
          type: { type: "string", enum: ["entrada", "saida"], description: "Tipo: entrada para adicionar, saida para remover estoque" },
          quantity: { type: "number", description: "Quantidade a movimentar" },
          notes: { type: "string", description: "Observação sobre a movimentação" },
        },
        required: ["item_name", "type", "quantity"],
      },
    },
  },
];

function getSupabaseAdmin() {
  return createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );
}

function getToday(): string {
  return new Date().toISOString().split("T")[0];
}

// ──────────────────────────────────────────────
// Tool: create_transaction
// ──────────────────────────────────────────────
async function executeCreateTransaction(
  args: Record<string, unknown>,
  userId: string,
  unitId: string | null
): Promise<{ success: boolean; message: string }> {
  const sb = getSupabaseAdmin();

  let categoryId: string | null = null;
  let accountId: string | null = null;
  let supplierId: string | null = null;
  let employeeId: string | null = null;

  if (args.category_name) {
    const { data } = await sb.from("finance_categories").select("id").ilike("name", String(args.category_name)).eq("user_id", userId).limit(1).maybeSingle();
    if (data) categoryId = data.id;
  }
  if (args.account_name) {
    const { data } = await sb.from("finance_accounts").select("id").ilike("name", String(args.account_name)).eq("user_id", userId).limit(1).maybeSingle();
    if (data) accountId = data.id;
  }
  if (args.supplier_name) {
    const q = sb.from("suppliers").select("id").ilike("name", String(args.supplier_name)).limit(1);
    if (unitId) q.eq("unit_id", unitId);
    const { data } = await q.maybeSingle();
    if (data) supplierId = data.id;
  }
  if (args.employee_name) {
    const q = sb.from("employees").select("id").ilike("full_name", String(args.employee_name)).limit(1);
    if (unitId) q.eq("unit_id", unitId);
    const { data } = await q.maybeSingle();
    if (data) employeeId = data.id;
  }

  const { error } = await sb.from("finance_transactions").insert({
    user_id: userId,
    unit_id: unitId,
    type: args.type as string,
    amount: Number(args.amount),
    description: String(args.description),
    category_id: categoryId,
    account_id: accountId,
    supplier_id: supplierId,
    employee_id: employeeId,
    date: (args.date as string) || getToday(),
    is_paid: args.is_paid !== false,
  });

  if (error) {
    console.error("Insert transaction error:", error);
    return { success: false, message: `❌ Erro ao criar transação: ${error.message}` };
  }

  const typeLabel = args.type === "income" ? "Receita" : "Despesa";
  const lines = [`[ACTION] ✅ ${typeLabel} criada com sucesso!`, "", `📝 ${args.description}`, `💰 R$ ${Number(args.amount).toFixed(2)}`];
  if (args.category_name) lines.push(`📂 Categoria: ${args.category_name}`);
  if (args.account_name) lines.push(`🏦 Conta: ${args.account_name}`);
  if (args.supplier_name) lines.push(`🚚 Fornecedor: ${args.supplier_name}`);
  if (args.date) lines.push(`📅 Data: ${args.date}`);
  lines.push(args.is_paid === false ? `⏳ Status: Pendente` : `✅ Status: Pago`);

  return { success: true, message: lines.join("\n") };
}

// ──────────────────────────────────────────────
// Tool: create_task
// ──────────────────────────────────────────────
async function executeCreateTask(
  args: Record<string, unknown>,
  userId: string,
  unitId: string | null
): Promise<{ success: boolean; message: string }> {
  const sb = getSupabaseAdmin();

  const date = (args.date as string) || getToday();
  const periodRaw = (args.period as string) || "manha";
  const periodMap: Record<string, string> = { manha: "morning", tarde: "afternoon", noite: "evening", morning: "morning", afternoon: "afternoon", evening: "evening" };
  const period = periodMap[periodRaw] || "morning";
  const priority = (args.priority as string) || "medium";

  const { error } = await sb.from("manager_tasks").insert({
    user_id: userId,
    unit_id: unitId,
    title: String(args.title),
    date,
    period,
    priority,
    notes: args.notes ? String(args.notes) : null,
    due_time: args.due_time ? String(args.due_time) : null,
  });

  if (error) {
    console.error("Insert task error:", error);
    return { success: false, message: `❌ Erro ao criar tarefa: ${error.message}` };
  }

  const periodLabel: Record<string, string> = { manha: "Manhã", tarde: "Tarde", noite: "Noite" };
  const priorityLabel: Record<string, string> = { low: "Baixa", medium: "Média", high: "Alta", urgent: "Urgente" };

  const lines = [`[ACTION] ✅ Tarefa criada com sucesso!`, "", `📝 ${args.title}`, `📅 Data: ${date}`, `🕐 Período: ${periodLabel[period] || period}`, `⚡ Prioridade: ${priorityLabel[priority] || priority}`];
  if (args.due_time) lines.push(`⏰ Horário: ${args.due_time}`);
  if (args.notes) lines.push(`📋 Obs: ${args.notes}`);

  return { success: true, message: lines.join("\n") };
}

// ──────────────────────────────────────────────
// Tool: register_stock_movement
// ──────────────────────────────────────────────
async function executeStockMovement(
  args: Record<string, unknown>,
  userId: string,
  unitId: string | null
): Promise<{ success: boolean; message: string }> {
  const sb = getSupabaseAdmin();

  // Resolve item_name -> item_id
  const q = sb.from("inventory_items").select("id, name, current_stock, unit_type").ilike("name", String(args.item_name)).limit(1);
  if (unitId) q.eq("unit_id", unitId);
  const { data: item } = await q.maybeSingle();

  if (!item) {
    return { success: false, message: `❌ Item "${args.item_name}" não encontrado no inventário.` };
  }

  const movType = args.type as string;
  const quantity = Number(args.quantity);

  if (movType === "saida" && item.current_stock < quantity) {
    return { success: false, message: `⚠️ Estoque insuficiente de "${item.name}". Atual: ${item.current_stock} ${item.unit_type}` };
  }

  const { error } = await sb.from("stock_movements").insert({
    item_id: item.id,
    type: movType,
    quantity,
    user_id: userId,
    unit_id: unitId,
    notes: args.notes ? String(args.notes) : null,
  });

  if (error) {
    console.error("Insert stock movement error:", error);
    return { success: false, message: `❌ Erro ao registrar movimentação: ${error.message}` };
  }

  const typeLabel = movType === "entrada" ? "📥 Entrada" : "📤 Saída";
  const newStock = movType === "entrada" ? item.current_stock + quantity : item.current_stock - quantity;

  const lines = [
    `[ACTION] ✅ Movimentação registrada!`,
    "",
    `${typeLabel} de estoque`,
    `📦 Item: ${item.name}`,
    `🔢 Quantidade: ${quantity} ${item.unit_type}`,
    `📊 Estoque anterior: ${item.current_stock} → Novo: ${newStock}`,
  ];
  if (args.notes) lines.push(`📋 Obs: ${args.notes}`);

  return { success: true, message: lines.join("\n") };
}

// ──────────────────────────────────────────────
// Tool dispatcher
// ──────────────────────────────────────────────
async function executeTool(
  name: string,
  args: Record<string, unknown>,
  userId: string,
  unitId: string | null
): Promise<{ success: boolean; message: string }> {
  switch (name) {
    case "create_transaction":
      return executeCreateTransaction(args, userId, unitId);
    case "create_task":
      return executeCreateTask(args, userId, unitId);
    case "register_stock_movement":
      return executeStockMovement(args, userId, unitId);
    default:
      return { success: false, message: `Função "${name}" não reconhecida.` };
  }
}

// ──────────────────────────────────────────────
// Main handler
// ──────────────────────────────────────────────
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

    const systemPrompt = `Você é o Copiloto Garden, assistente de gestão para restaurantes.

REGRAS DE RESPOSTA:
- Máximo 3 frases curtas + dados numéricos formatados
- NÃO liste todos os dados disponíveis - responda APENAS o que foi perguntado
- Na saudação: dê APENAS saldo total, saldo do mês e 1 alerta mais urgente (se houver)
- Use emojis com moderação (máximo 3 por resposta)
- Nunca invente valores - use os dados abaixo

AÇÕES EXECUTÁVEIS (use tool calling):
1. create_transaction - Registrar receita/despesa. Obrigatório: type, amount, description
2. create_task - Criar tarefa/lembrete. Obrigatório: title
3. register_stock_movement - Entrada/saída de estoque. Obrigatório: item_name, type, quantity

REGRAS PARA AÇÕES:
- Se faltar info obrigatória, pergunte antes de executar
- Use nomes de itens/categorias/contas do contexto abaixo

CONTEXTO (use sob demanda, NÃO despeje tudo na resposta):
- Dia: ${context?.dayOfWeek || '?'} (${context?.timeOfDay || ''})
${dataSnapshot}`;

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
        content: "Saudação curta (1 linha) + saldo total das contas + saldo do mês. Se tiver alerta urgente, mencione EM UMA FRASE. Nada mais.",
      });
    }

    // AI call with tools
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

    // Handle tool calls
    if (choice?.tool_calls && choice.tool_calls.length > 0) {
      const toolCall = choice.tool_calls[0];

      let args: Record<string, unknown>;
      try {
        args = typeof toolCall.function.arguments === "string"
          ? JSON.parse(toolCall.function.arguments)
          : toolCall.function.arguments;
      } catch {
        return new Response(
          JSON.stringify({ suggestion: "Não consegui interpretar os dados. Pode repetir?", action_executed: false }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const result = await executeTool(toolCall.function.name, args, user_id, unit_id || null);

      return new Response(
        JSON.stringify({ suggestion: result.message, action_executed: result.success }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // No tool call - return normal text
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
