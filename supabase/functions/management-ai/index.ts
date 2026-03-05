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
  {
    type: "function",
    function: {
      name: "mark_transaction_paid",
      description: "Marcar uma despesa/transação pendente como paga. Use quando o usuário pedir para pagar, quitar, marcar como pago uma conta ou despesa.",
      parameters: {
        type: "object",
        properties: {
          description: { type: "string", description: "Descrição ou parte do nome da transação a buscar" },
          date: { type: "string", description: "Data para desambiguar (YYYY-MM-DD), opcional" },
        },
        required: ["description"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "complete_task",
      description: "Marcar uma tarefa da agenda como concluída. Use quando o usuário pedir para concluir, finalizar, completar ou marcar como feita uma tarefa.",
      parameters: {
        type: "object",
        properties: {
          title: { type: "string", description: "Título ou parte do título da tarefa" },
        },
        required: ["title"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "delete_task",
      description: "Excluir uma tarefa da agenda. Use quando o usuário pedir para remover, apagar ou deletar uma tarefa.",
      parameters: {
        type: "object",
        properties: {
          title: { type: "string", description: "Título ou parte do título da tarefa a excluir" },
        },
        required: ["title"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "create_order",
      description: "Criar um pedido de compra para um fornecedor. Use quando o usuário pedir para fazer pedido, encomendar, comprar itens de um fornecedor.",
      parameters: {
        type: "object",
        properties: {
          supplier_name: { type: "string", description: "Nome do fornecedor" },
          items: {
            type: "array",
            items: {
              type: "object",
              properties: {
                item_name: { type: "string", description: "Nome do item" },
                quantity: { type: "number", description: "Quantidade" },
              },
              required: ["item_name", "quantity"],
            },
            description: "Lista de itens e quantidades",
          },
          notes: { type: "string", description: "Observações do pedido" },
        },
        required: ["supplier_name", "items"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "register_employee_payment",
      description: "Registrar pagamento ou adiantamento para um funcionário. Use quando o usuário pedir para registrar salário, adiantamento, bônus ou comissão de um funcionário.",
      parameters: {
        type: "object",
        properties: {
          employee_name: { type: "string", description: "Nome do funcionário" },
          amount: { type: "number", description: "Valor em reais" },
          type: { type: "string", enum: ["salary", "advance", "bonus", "commission"], description: "Tipo: salary, advance, bonus ou commission" },
          payment_date: { type: "string", description: "Data do pagamento (YYYY-MM-DD). Default: hoje" },
          notes: { type: "string", description: "Observações" },
        },
        required: ["employee_name", "amount", "type"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "mark_closing_validated",
      description: "Validar/aprovar um fechamento de caixa pendente. Use quando o usuário pedir para validar, aprovar ou confirmar um fechamento de caixa.",
      parameters: {
        type: "object",
        properties: {
          date: { type: "string", description: "Data do fechamento a validar (YYYY-MM-DD)" },
        },
        required: ["date"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "save_preference",
      description: "Salvar uma preferência ou atalho do usuário. Use quando o usuário pedir para lembrar, associar ou mapear um apelido/atalho a um significado. Ex: 'quando eu falar luz, entenda como conta de energia'.",
      parameters: {
        type: "object",
        properties: {
          key: { type: "string", description: "O atalho ou apelido (ex: 'luz', 'conta_padrao')" },
          value: { type: "string", description: "O significado completo (ex: 'conta de energia elétrica, categoria: Energia, tipo: expense')" },
          category: { type: "string", enum: ["alias", "default_account", "default_category"], description: "Tipo da preferência. Default: alias" },
        },
        required: ["key", "value"],
      },
    },
  },
  // ── NEW TOOLS (Level 3) ──
  {
    type: "function",
    function: {
      name: "update_transaction",
      description: "Editar uma transação financeira existente. Use quando o usuário pedir para alterar, mudar, corrigir ou atualizar valor, descrição, data ou categoria de uma transação.",
      parameters: {
        type: "object",
        properties: {
          search_description: { type: "string", description: "Descrição ou parte do nome da transação a buscar" },
          search_date: { type: "string", description: "Data da transação para desambiguar (YYYY-MM-DD), opcional" },
          new_amount: { type: "number", description: "Novo valor em reais" },
          new_description: { type: "string", description: "Nova descrição" },
          new_date: { type: "string", description: "Nova data (YYYY-MM-DD)" },
          new_category_name: { type: "string", description: "Novo nome da categoria" },
          new_is_paid: { type: "boolean", description: "Novo status de pagamento" },
        },
        required: ["search_description"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "create_supplier_invoice",
      description: "Registrar boleto ou fatura de fornecedor. Use quando o usuário pedir para registrar, criar ou lançar um boleto, fatura ou conta de fornecedor.",
      parameters: {
        type: "object",
        properties: {
          supplier_name: { type: "string", description: "Nome do fornecedor" },
          description: { type: "string", description: "Descrição do boleto/fatura" },
          amount: { type: "number", description: "Valor em reais" },
          due_date: { type: "string", description: "Data de vencimento (YYYY-MM-DD)" },
          invoice_number: { type: "string", description: "Número da nota/boleto (opcional)" },
          notes: { type: "string", description: "Observações" },
        },
        required: ["supplier_name", "description", "amount", "due_date"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "mark_invoice_paid",
      description: "Marcar boleto/fatura de fornecedor como pago. Use quando o usuário pedir para pagar, quitar ou marcar como pago um boleto de fornecedor.",
      parameters: {
        type: "object",
        properties: {
          supplier_name: { type: "string", description: "Nome do fornecedor (opcional, para filtrar)" },
          description: { type: "string", description: "Descrição ou parte do nome do boleto" },
        },
        required: ["description"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "complete_checklist_item",
      description: "Marcar um item do checklist como concluído. Use quando o usuário pedir para marcar, completar ou concluir um item do checklist de abertura ou fechamento.",
      parameters: {
        type: "object",
        properties: {
          item_name: { type: "string", description: "Nome ou parte do nome do item do checklist" },
          checklist_type: { type: "string", enum: ["abertura", "fechamento"], description: "Tipo do checklist: abertura ou fechamento" },
        },
        required: ["item_name"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "send_order",
      description: "Enviar um pedido de compra para o fornecedor (mudar status de rascunho para enviado). Use quando o usuário pedir para enviar, despachar ou confirmar envio de um pedido.",
      parameters: {
        type: "object",
        properties: {
          supplier_name: { type: "string", description: "Nome do fornecedor do pedido" },
        },
        required: ["supplier_name"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "create_appointment",
      description: "Criar um compromisso com horário específico na agenda. Use quando o usuário pedir para agendar reunião, compromisso ou evento com horário definido.",
      parameters: {
        type: "object",
        properties: {
          title: { type: "string", description: "Título do compromisso" },
          date: { type: "string", description: "Data (YYYY-MM-DD). Default: hoje" },
          time: { type: "string", description: "Horário no formato HH:MM (ex: 14:30)" },
          notes: { type: "string", description: "Observações" },
        },
        required: ["title", "time"],
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

// ── Rate Limiting (30 req/min per user) ──
const userRateLimitMap = new Map<string, { count: number; resetAt: number }>();
const USER_RATE_LIMIT_MAX = 30;
const USER_RATE_LIMIT_WINDOW_MS = 60_000;

function isUserRateLimited(userId: string): boolean {
  const now = Date.now();
  const entry = userRateLimitMap.get(userId);
  if (!entry || now > entry.resetAt) {
    userRateLimitMap.set(userId, { count: 1, resetAt: now + USER_RATE_LIMIT_WINDOW_MS });
    return false;
  }
  entry.count++;
  return entry.count > USER_RATE_LIMIT_MAX;
}

// Cleanup stale entries periodically
setInterval(() => {
  const now = Date.now();
  for (const [id, entry] of userRateLimitMap) {
    if (now > entry.resetAt) userRateLimitMap.delete(id);
  }
}, 300_000);

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
    const q = sb.from("finance_categories").select("id").ilike("name", String(args.category_name)).eq("user_id", userId).limit(1);
    if (unitId) q.eq("unit_id", unitId);
    const { data } = await q.maybeSingle();
    if (data) categoryId = data.id;
  }
  if (args.account_name) {
    const q = sb.from("finance_accounts").select("id").ilike("name", String(args.account_name)).eq("user_id", userId).limit(1);
    if (unitId) q.eq("unit_id", unitId);
    const { data } = await q.maybeSingle();
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

  const periodLabel: Record<string, string> = { morning: "Manhã", afternoon: "Tarde", evening: "Noite" };
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
// Tool: mark_transaction_paid
// ──────────────────────────────────────────────
async function executeMarkTransactionPaid(
  args: Record<string, unknown>,
  userId: string,
  unitId: string | null
): Promise<{ success: boolean; message: string }> {
  const sb = getSupabaseAdmin();

  let query = sb.from("finance_transactions")
    .select("id, description, amount, date, type")
    .eq("user_id", userId)
    .eq("is_paid", false)
    .ilike("description", `%${String(args.description)}%`)
    .limit(5);
  if (unitId) query = query.eq("unit_id", unitId);
  if (args.date) query = query.eq("date", String(args.date));

  const { data: transactions } = await query;

  if (!transactions || transactions.length === 0) {
    return { success: false, message: `❌ Nenhuma transação pendente encontrada com "${args.description}".` };
  }

  if (transactions.length > 1) {
    const list = transactions.map((t: any) => `• ${t.description} - R$${Number(t.amount).toFixed(2)} (${t.date})`).join("\n");
    return { success: false, message: `⚠️ Encontrei ${transactions.length} transações pendentes:\n${list}\n\nEspecifique melhor qual deseja marcar como paga (inclua a data se necessário).` };
  }

  const tx = transactions[0];
  const { error } = await sb.from("finance_transactions").update({ is_paid: true }).eq("id", tx.id);

  if (error) {
    return { success: false, message: `❌ Erro ao atualizar: ${error.message}` };
  }

  return { success: true, message: `[ACTION] ✅ Transação marcada como paga!\n\n📝 ${tx.description}\n💰 R$ ${Number(tx.amount).toFixed(2)}\n📅 Data: ${tx.date}` };
}

// ──────────────────────────────────────────────
// Tool: complete_task
// ──────────────────────────────────────────────
async function executeCompleteTask(
  args: Record<string, unknown>,
  userId: string,
  unitId: string | null
): Promise<{ success: boolean; message: string }> {
  const sb = getSupabaseAdmin();

  let query = sb.from("manager_tasks")
    .select("id, title, date, period")
    .eq("user_id", userId)
    .eq("is_completed", false)
    .ilike("title", `%${String(args.title)}%`)
    .limit(5);
  if (unitId) query = query.eq("unit_id", unitId);

  const { data: tasks } = await query;

  if (!tasks || tasks.length === 0) {
    return { success: false, message: `❌ Nenhuma tarefa pendente encontrada com "${args.title}".` };
  }

  if (tasks.length > 1) {
    const list = tasks.map((t: any) => `• ${t.title} (${t.date})`).join("\n");
    return { success: false, message: `⚠️ Encontrei ${tasks.length} tarefas:\n${list}\n\nEspecifique melhor qual deseja concluir.` };
  }

  const task = tasks[0];
  const { error } = await sb.from("manager_tasks").update({ is_completed: true, completed_at: new Date().toISOString() }).eq("id", task.id);

  if (error) {
    return { success: false, message: `❌ Erro ao concluir tarefa: ${error.message}` };
  }

  return { success: true, message: `[ACTION] ✅ Tarefa concluída!\n\n📝 ${task.title}\n📅 ${task.date}` };
}

// ──────────────────────────────────────────────
// Tool: delete_task
// ──────────────────────────────────────────────
async function executeDeleteTask(
  args: Record<string, unknown>,
  userId: string,
  unitId: string | null
): Promise<{ success: boolean; message: string }> {
  const sb = getSupabaseAdmin();

  let query = sb.from("manager_tasks")
    .select("id, title, date")
    .eq("user_id", userId)
    .ilike("title", `%${String(args.title)}%`)
    .limit(5);
  if (unitId) query = query.eq("unit_id", unitId);

  const { data: tasks } = await query;

  if (!tasks || tasks.length === 0) {
    return { success: false, message: `❌ Nenhuma tarefa encontrada com "${args.title}".` };
  }

  if (tasks.length > 1) {
    const list = tasks.map((t: any) => `• ${t.title} (${t.date})`).join("\n");
    return { success: false, message: `⚠️ Encontrei ${tasks.length} tarefas:\n${list}\n\nEspecifique melhor qual deseja excluir.` };
  }

  const task = tasks[0];
  const { error } = await sb.from("manager_tasks").delete().eq("id", task.id);

  if (error) {
    return { success: false, message: `❌ Erro ao excluir tarefa: ${error.message}` };
  }

  return { success: true, message: `[ACTION] 🗑️ Tarefa excluída!\n\n📝 ${task.title}\n📅 ${task.date}` };
}

// ──────────────────────────────────────────────
// Tool: create_order
// ──────────────────────────────────────────────
async function executeCreateOrder(
  args: Record<string, unknown>,
  userId: string,
  unitId: string | null
): Promise<{ success: boolean; message: string }> {
  const sb = getSupabaseAdmin();

  const sq = sb.from("suppliers").select("id, name").ilike("name", `%${String(args.supplier_name)}%`).limit(1);
  if (unitId) sq.eq("unit_id", unitId);
  const { data: supplier } = await sq.maybeSingle();

  if (!supplier) {
    return { success: false, message: `❌ Fornecedor "${args.supplier_name}" não encontrado.` };
  }

  const { data: order, error: orderError } = await sb.from("orders").insert({
    supplier_id: supplier.id,
    unit_id: unitId,
    status: "draft",
    notes: args.notes ? String(args.notes) : null,
    created_by: userId,
  }).select("id").single();

  if (orderError || !order) {
    return { success: false, message: `❌ Erro ao criar pedido: ${orderError?.message}` };
  }

  const items = args.items as Array<{ item_name: string; quantity: number }>;
  const addedItems: string[] = [];
  const failedItems: string[] = [];

  for (const item of items) {
    const iq = sb.from("inventory_items").select("id, name, unit_type").ilike("name", `%${item.item_name}%`).limit(1);
    if (unitId) iq.eq("unit_id", unitId);
    const { data: invItem } = await iq.maybeSingle();

    if (invItem) {
      await sb.from("order_items").insert({
        order_id: order.id,
        item_id: invItem.id,
        quantity: item.quantity,
        unit_id: unitId,
      });
      addedItems.push(`${invItem.name}: ${item.quantity} ${invItem.unit_type}`);
    } else {
      failedItems.push(item.item_name);
    }
  }

  const lines = [`[ACTION] ✅ Pedido criado para ${supplier.name}!`, ""];
  if (addedItems.length) lines.push(`📦 Itens:\n${addedItems.map(i => `  • ${i}`).join("\n")}`);
  if (failedItems.length) lines.push(`⚠️ Não encontrados: ${failedItems.join(", ")}`);
  if (args.notes) lines.push(`📋 Obs: ${args.notes}`);

  return { success: true, message: lines.join("\n") };
}

// ──────────────────────────────────────────────
// Tool: register_employee_payment
// ──────────────────────────────────────────────
async function executeRegisterEmployeePayment(
  args: Record<string, unknown>,
  userId: string,
  unitId: string | null
): Promise<{ success: boolean; message: string }> {
  const sb = getSupabaseAdmin();

  const eq = sb.from("employees").select("id, full_name").ilike("full_name", `%${String(args.employee_name)}%`).eq("is_active", true).limit(1);
  if (unitId) eq.eq("unit_id", unitId);
  const { data: employee } = await eq.maybeSingle();

  if (!employee) {
    return { success: false, message: `❌ Funcionário "${args.employee_name}" não encontrado.` };
  }

  const now = new Date();
  const paymentDate = (args.payment_date as string) || getToday();

  const { error } = await sb.from("employee_payments").insert({
    employee_id: employee.id,
    unit_id: unitId,
    amount: Number(args.amount),
    type: String(args.type),
    payment_date: paymentDate,
    reference_month: now.getMonth() + 1,
    reference_year: now.getFullYear(),
    is_paid: true,
    paid_at: new Date().toISOString(),
    notes: args.notes ? String(args.notes) : null,
    created_by: userId,
  });

  if (error) {
    return { success: false, message: `❌ Erro ao registrar pagamento: ${error.message}` };
  }

  const typeLabels: Record<string, string> = { salary: "Salário", advance: "Adiantamento", bonus: "Bônus", commission: "Comissão" };

  return {
    success: true,
    message: `[ACTION] ✅ Pagamento registrado!\n\n👤 ${employee.full_name}\n💰 R$ ${Number(args.amount).toFixed(2)}\n📋 Tipo: ${typeLabels[String(args.type)] || args.type}\n📅 Data: ${paymentDate}`,
  };
}

// ──────────────────────────────────────────────
// Tool: mark_closing_validated
// ──────────────────────────────────────────────
async function executeMarkClosingValidated(
  args: Record<string, unknown>,
  userId: string,
  unitId: string | null
): Promise<{ success: boolean; message: string }> {
  const sb = getSupabaseAdmin();

  let query = sb.from("cash_closings")
    .select("id, date, total_amount, unit_name, status")
    .eq("date", String(args.date))
    .eq("status", "pending")
    .limit(1);
  if (unitId) query = query.eq("unit_id", unitId);

  const { data: closing } = await query.maybeSingle();

  if (!closing) {
    return { success: false, message: `❌ Nenhum fechamento pendente encontrado para ${args.date}.` };
  }

  const { error } = await sb.from("cash_closings").update({
    status: "validated",
    validated_by: userId,
    validated_at: new Date().toISOString(),
  }).eq("id", closing.id);

  if (error) {
    return { success: false, message: `❌ Erro ao validar fechamento: ${error.message}` };
  }

  return {
    success: true,
    message: `[ACTION] ✅ Fechamento validado!\n\n📅 Data: ${closing.date}\n💰 Total: R$ ${Number(closing.total_amount || 0).toFixed(2)}\n🏪 ${closing.unit_name}`,
  };
}

// ──────────────────────────────────────────────
// NEW Tool: update_transaction
// ──────────────────────────────────────────────
async function executeUpdateTransaction(
  args: Record<string, unknown>,
  userId: string,
  unitId: string | null
): Promise<{ success: boolean; message: string }> {
  const sb = getSupabaseAdmin();

  let query = sb.from("finance_transactions")
    .select("id, description, amount, date, type, is_paid")
    .eq("user_id", userId)
    .ilike("description", `%${String(args.search_description)}%`)
    .limit(5);
  if (unitId) query = query.eq("unit_id", unitId);
  if (args.search_date) query = query.eq("date", String(args.search_date));

  const { data: transactions } = await query;

  if (!transactions || transactions.length === 0) {
    return { success: false, message: `❌ Nenhuma transação encontrada com "${args.search_description}".` };
  }

  if (transactions.length > 1) {
    const list = transactions.map((t: any) => `• ${t.description} - R$${Number(t.amount).toFixed(2)} (${t.date})`).join("\n");
    return { success: false, message: `⚠️ Encontrei ${transactions.length} transações:\n${list}\n\nEspecifique melhor qual deseja editar (inclua a data).` };
  }

  const tx = transactions[0];
  const updates: Record<string, unknown> = {};
  const changes: string[] = [];

  if (args.new_amount !== undefined) {
    updates.amount = Number(args.new_amount);
    changes.push(`💰 Valor: R$${Number(tx.amount).toFixed(2)} → R$${Number(args.new_amount).toFixed(2)}`);
  }
  if (args.new_description) {
    updates.description = String(args.new_description);
    changes.push(`📝 Descrição: ${tx.description} → ${args.new_description}`);
  }
  if (args.new_date) {
    updates.date = String(args.new_date);
    changes.push(`📅 Data: ${tx.date} → ${args.new_date}`);
  }
  if (args.new_is_paid !== undefined) {
    updates.is_paid = args.new_is_paid;
    changes.push(`✅ Status: ${tx.is_paid ? 'Pago' : 'Pendente'} → ${args.new_is_paid ? 'Pago' : 'Pendente'}`);
  }
  if (args.new_category_name) {
    const q = sb.from("finance_categories").select("id").ilike("name", String(args.new_category_name)).eq("user_id", userId).limit(1);
    if (unitId) q.eq("unit_id", unitId);
    const { data: cat } = await q.maybeSingle();
    if (cat) {
      updates.category_id = cat.id;
      changes.push(`📂 Categoria: ${args.new_category_name}`);
    }
  }

  if (Object.keys(updates).length === 0) {
    return { success: false, message: `⚠️ Nenhuma alteração especificada. Diga o que deseja mudar (valor, descrição, data, etc).` };
  }

  const { error } = await sb.from("finance_transactions").update(updates).eq("id", tx.id);

  if (error) {
    return { success: false, message: `❌ Erro ao atualizar: ${error.message}` };
  }

  return { success: true, message: `[ACTION] ✅ Transação atualizada!\n\n📝 ${tx.description}\n${changes.join("\n")}` };
}

// ──────────────────────────────────────────────
// NEW Tool: create_supplier_invoice
// ──────────────────────────────────────────────
async function executeCreateSupplierInvoice(
  args: Record<string, unknown>,
  userId: string,
  unitId: string | null
): Promise<{ success: boolean; message: string }> {
  const sb = getSupabaseAdmin();

  const sq = sb.from("suppliers").select("id, name").ilike("name", `%${String(args.supplier_name)}%`).limit(1);
  if (unitId) sq.eq("unit_id", unitId);
  const { data: supplier } = await sq.maybeSingle();

  if (!supplier) {
    return { success: false, message: `❌ Fornecedor "${args.supplier_name}" não encontrado.` };
  }

  const { error } = await sb.from("supplier_invoices").insert({
    user_id: userId,
    unit_id: unitId,
    supplier_id: supplier.id,
    description: String(args.description),
    amount: Number(args.amount),
    issue_date: getToday(),
    due_date: String(args.due_date),
    invoice_number: args.invoice_number ? String(args.invoice_number) : null,
    notes: args.notes ? String(args.notes) : null,
    is_paid: false,
  });

  if (error) {
    console.error("Insert supplier invoice error:", error);
    return { success: false, message: `❌ Erro ao registrar boleto: ${error.message}` };
  }

  const lines = [
    `[ACTION] ✅ Boleto registrado!`,
    "",
    `🚚 Fornecedor: ${supplier.name}`,
    `📝 ${args.description}`,
    `💰 R$ ${Number(args.amount).toFixed(2)}`,
    `📅 Vencimento: ${args.due_date}`,
  ];
  if (args.invoice_number) lines.push(`🔢 Nº: ${args.invoice_number}`);
  if (args.notes) lines.push(`📋 Obs: ${args.notes}`);

  return { success: true, message: lines.join("\n") };
}

// ──────────────────────────────────────────────
// NEW Tool: mark_invoice_paid
// ──────────────────────────────────────────────
async function executeMarkInvoicePaid(
  args: Record<string, unknown>,
  userId: string,
  unitId: string | null
): Promise<{ success: boolean; message: string }> {
  const sb = getSupabaseAdmin();

  let query = sb.from("supplier_invoices")
    .select("id, description, amount, due_date, supplier:suppliers(name)")
    .eq("is_paid", false)
    .ilike("description", `%${String(args.description)}%`)
    .limit(5);
  if (unitId) query = query.eq("unit_id", unitId);

  const { data: invoices } = await query;

  if (!invoices || invoices.length === 0) {
    return { success: false, message: `❌ Nenhum boleto pendente encontrado com "${args.description}".` };
  }

  // Filter by supplier if provided
  let filtered = invoices;
  if (args.supplier_name) {
    filtered = invoices.filter((inv: any) =>
      (inv.supplier as any)?.name?.toLowerCase().includes(String(args.supplier_name).toLowerCase())
    );
    if (filtered.length === 0) filtered = invoices;
  }

  if (filtered.length > 1) {
    const list = filtered.map((inv: any) => `• ${(inv.supplier as any)?.name || '?'}: ${inv.description} - R$${Number(inv.amount).toFixed(2)} (vence ${inv.due_date})`).join("\n");
    return { success: false, message: `⚠️ Encontrei ${filtered.length} boletos pendentes:\n${list}\n\nEspecifique melhor qual deseja pagar.` };
  }

  const inv = filtered[0];
  const { error } = await sb.from("supplier_invoices").update({
    is_paid: true,
    paid_at: new Date().toISOString(),
  }).eq("id", inv.id);

  if (error) {
    return { success: false, message: `❌ Erro ao pagar boleto: ${error.message}` };
  }

  return {
    success: true,
    message: `[ACTION] ✅ Boleto pago!\n\n🚚 ${(inv.supplier as any)?.name || '?'}\n📝 ${inv.description}\n💰 R$ ${Number(inv.amount).toFixed(2)}\n📅 Vencimento: ${inv.due_date}`,
  };
}

// ──────────────────────────────────────────────
// NEW Tool: complete_checklist_item
// ──────────────────────────────────────────────
async function executeCompleteChecklistItem(
  args: Record<string, unknown>,
  userId: string,
  unitId: string | null
): Promise<{ success: boolean; message: string }> {
  const sb = getSupabaseAdmin();

  let query = sb.from("checklist_items")
    .select("id, name, checklist_type, points")
    .eq("is_active", true)
    .is("deleted_at", null)
    .ilike("name", `%${String(args.item_name)}%`)
    .limit(5);
  if (unitId) query = query.eq("unit_id", unitId);
  if (args.checklist_type) query = query.eq("checklist_type", String(args.checklist_type));

  const { data: items } = await query;

  if (!items || items.length === 0) {
    return { success: false, message: `❌ Item "${args.item_name}" não encontrado no checklist.` };
  }

  if (items.length > 1) {
    const list = items.map((i: any) => `• ${i.name} (${i.checklist_type})`).join("\n");
    return { success: false, message: `⚠️ Encontrei ${items.length} itens:\n${list}\n\nEspecifique melhor qual deseja marcar.` };
  }

  const item = items[0];
  const today = getToday();

  // Check if already completed today
  const { data: existing } = await sb.from("checklist_completions")
    .select("id")
    .eq("item_id", item.id)
    .eq("date", today)
    .limit(1)
    .maybeSingle();

  if (existing) {
    return { success: false, message: `⚠️ Item "${item.name}" já foi marcado hoje.` };
  }

  const { error } = await sb.from("checklist_completions").insert({
    item_id: item.id,
    checklist_type: item.checklist_type,
    completed_by: userId,
    date: today,
    unit_id: unitId,
    points_awarded: item.points || 1,
    awarded_points: true,
    is_skipped: false,
  });

  if (error) {
    return { success: false, message: `❌ Erro ao marcar item: ${error.message}` };
  }

  const typeLabel = item.checklist_type === "abertura" ? "Abertura" : "Fechamento";

  return {
    success: true,
    message: `[ACTION] ✅ Item do checklist marcado!\n\n📋 ${item.name}\n📂 Tipo: ${typeLabel}\n⭐ Pontos: ${item.points || 1}`,
  };
}

// ──────────────────────────────────────────────
// NEW Tool: send_order
// ──────────────────────────────────────────────
async function executeSendOrder(
  args: Record<string, unknown>,
  _userId: string,
  unitId: string | null
): Promise<{ success: boolean; message: string }> {
  const sb = getSupabaseAdmin();

  // Find supplier
  const sq = sb.from("suppliers").select("id, name").ilike("name", `%${String(args.supplier_name)}%`).limit(1);
  if (unitId) sq.eq("unit_id", unitId);
  const { data: supplier } = await sq.maybeSingle();

  if (!supplier) {
    return { success: false, message: `❌ Fornecedor "${args.supplier_name}" não encontrado.` };
  }

  // Find draft order for this supplier
  let query = sb.from("orders")
    .select("id, status, created_at")
    .eq("supplier_id", supplier.id)
    .eq("status", "draft")
    .order("created_at", { ascending: false })
    .limit(1);
  if (unitId) query = query.eq("unit_id", unitId);

  const { data: order } = await query.maybeSingle();

  if (!order) {
    return { success: false, message: `❌ Nenhum pedido em rascunho encontrado para ${supplier.name}.` };
  }

  const { error } = await sb.from("orders").update({
    status: "sent",
    sent_at: new Date().toISOString(),
  }).eq("id", order.id);

  if (error) {
    return { success: false, message: `❌ Erro ao enviar pedido: ${error.message}` };
  }

  return {
    success: true,
    message: `[ACTION] ✅ Pedido enviado!\n\n🚚 Fornecedor: ${supplier.name}\n📦 Status: Rascunho → Enviado\n📅 Enviado em: ${new Date().toLocaleDateString('pt-BR')}`,
  };
}

// ──────────────────────────────────────────────
// NEW Tool: create_appointment
// ──────────────────────────────────────────────
async function executeCreateAppointment(
  args: Record<string, unknown>,
  userId: string,
  unitId: string | null
): Promise<{ success: boolean; message: string }> {
  const sb = getSupabaseAdmin();

  const date = (args.date as string) || getToday();
  const time = String(args.time);

  const { error } = await sb.from("manager_appointments").insert({
    user_id: userId,
    unit_id: unitId,
    title: String(args.title),
    date,
    scheduled_time: time,
    notes: args.notes ? String(args.notes) : null,
  });

  if (error) {
    console.error("Insert appointment error:", error);
    return { success: false, message: `❌ Erro ao criar compromisso: ${error.message}` };
  }

  const lines = [
    `[ACTION] ✅ Compromisso agendado!`,
    "",
    `📝 ${args.title}`,
    `📅 Data: ${date}`,
    `🕐 Horário: ${time}`,
  ];
  if (args.notes) lines.push(`📋 Obs: ${args.notes}`);

  return { success: true, message: lines.join("\n") };
}

// ──────────────────────────────────────────────
// Tool: save_preference
// ──────────────────────────────────────────────
async function executeSavePreference(
  args: Record<string, unknown>,
  userId: string,
  unitId: string | null
): Promise<{ success: boolean; message: string }> {
  const sb = getSupabaseAdmin();

  const key = String(args.key).toLowerCase().trim();
  const value = String(args.value).trim();
  const category = (args.category as string) || "alias";

  const { error } = await sb.from("copilot_preferences").upsert(
    {
      user_id: userId,
      unit_id: unitId,
      key,
      value,
      category,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id,key" }
  );

  if (error) {
    console.error("Save preference error:", error);
    return { success: false, message: `❌ Erro ao salvar preferência: ${error.message}` };
  }

  const categoryLabels: Record<string, string> = {
    alias: "Atalho",
    default_account: "Conta padrão",
    default_category: "Categoria padrão",
  };

  return {
    success: true,
    message: `[ACTION] ✅ Preferência salva!\n\n🏷️ Tipo: ${categoryLabels[category] || category}\n🔑 "${key}" → "${value}"\n\nNas próximas vezes que você usar "${key}", vou entender automaticamente como "${value}".`,
  };
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
    case "mark_transaction_paid":
      return executeMarkTransactionPaid(args, userId, unitId);
    case "complete_task":
      return executeCompleteTask(args, userId, unitId);
    case "delete_task":
      return executeDeleteTask(args, userId, unitId);
    case "create_order":
      return executeCreateOrder(args, userId, unitId);
    case "register_employee_payment":
      return executeRegisterEmployeePayment(args, userId, unitId);
    case "mark_closing_validated":
      return executeMarkClosingValidated(args, userId, unitId);
    // New tools
    case "update_transaction":
      return executeUpdateTransaction(args, userId, unitId);
    case "create_supplier_invoice":
      return executeCreateSupplierInvoice(args, userId, unitId);
    case "mark_invoice_paid":
      return executeMarkInvoicePaid(args, userId, unitId);
    case "complete_checklist_item":
      return executeCompleteChecklistItem(args, userId, unitId);
    case "send_order":
      return executeSendOrder(args, userId, unitId);
    case "create_appointment":
      return executeCreateAppointment(args, userId, unitId);
    case "save_preference":
      return executeSavePreference(args, userId, unitId);
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

    // ── JWT Authentication ──
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const sbAuth = getSupabaseAdmin();
    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await sbAuth.auth.getClaims(token);
    if (claimsError || !claimsData?.claims?.sub) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const user_id = claimsData.claims.sub as string;

    // ── Rate Limiting ──
    if (isUserRateLimited(user_id)) {
      return new Response(
        JSON.stringify({ error: "Limite de requisições excedido. Tente novamente em 1 minuto." }),
        { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const body = await req.json();
    const { messages: conversationHistory, context, unit_id, image } = body;

    // ── IDOR Protection: validate unit_id belongs to authenticated user ──
    if (unit_id) {
      const sb = getSupabaseAdmin();
      const { data: unitAccess } = await sb
        .from("user_units")
        .select("unit_id")
        .eq("user_id", user_id)
        .eq("unit_id", unit_id)
        .maybeSingle();
      if (!unitAccess) {
        return new Response(
          JSON.stringify({ error: "Acesso negado a esta unidade." }),
          { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    // Load user preferences for context injection
    let preferencesBlock = "";
    if (user_id) {
      const sb = getSupabaseAdmin();
      const { data: prefs } = await sb
        .from("copilot_preferences")
        .select("key, value, category")
        .eq("user_id", user_id)
        .limit(50);
      if (prefs && prefs.length > 0) {
        const prefLines = prefs.map((p: any) => `• "${p.key}" = "${p.value}" (${p.category})`);
        preferencesBlock = `\n\nPREFERÊNCIAS DO USUÁRIO (use para interpretar comandos ambíguos):\n${prefLines.join("\n")}`;
      }
    }

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
    if (context?.checklistProgress) {
      dataLines.push(`\n📋 CHECKLISTS DE HOJE:\n${context.checklistProgress}`);
    }
    if (context?.upcomingInvoices?.length) {
      dataLines.push(`\n📄 BOLETOS/FATURAS PRÓXIMOS:\n${context.upcomingInvoices.join('\n')}`);
    }
    if (context?.budgetStatus?.length) {
      dataLines.push(`\n🎯 ORÇAMENTO vs REALIZADO:\n${context.budgetStatus.join('\n')}`);
    }

    const dataSnapshot = dataLines.length > 0 ? dataLines.join('\n') : 'Dados ainda carregando...';

    const systemPrompt = `Você é o Copiloto Garden, assistente de gestão para restaurantes.

REGRAS DE RESPOSTA:
- Máximo 3 frases curtas + dados numéricos formatados
- NÃO liste todos os dados disponíveis - responda APENAS o que foi perguntado
- Na saudação: dê APENAS saldo total, saldo do mês e 1 alerta mais urgente (se houver)
- Use emojis com moderação (máximo 3 por resposta)
- Nunca invente valores - use os dados abaixo
- Use **negrito** para valores e nomes importantes
- Use listas com • quando listar itens

ANÁLISE DE IMAGENS:
- Quando receber uma imagem, analise e extraia TODAS as informações relevantes
- Para notas fiscais/recibos: extraia itens, quantidades, valores unitários, total, data, fornecedor
- Para fotos de estoque: identifique produtos e estime quantidades
- Para qualquer documento: extraia texto e dados estruturados
- Apresente os dados de forma organizada e ofereça ações (ex: "Quer que eu lance essas despesas?")

AÇÕES EXECUTÁVEIS (use tool calling):
1. create_transaction - Registrar receita/despesa
2. create_task - Criar tarefa/lembrete
3. register_stock_movement - Entrada/saída de estoque
4. mark_transaction_paid - Marcar despesa pendente como paga
5. complete_task - Concluir tarefa da agenda
6. delete_task - Excluir tarefa da agenda
7. create_order - Criar pedido de compra para fornecedor
8. register_employee_payment - Registrar pagamento/adiantamento de funcionário
9. mark_closing_validated - Validar fechamento de caixa pendente
10. update_transaction - Editar transação existente (valor, descrição, data, categoria)
11. create_supplier_invoice - Registrar boleto/fatura de fornecedor
12. mark_invoice_paid - Marcar boleto de fornecedor como pago
13. complete_checklist_item - Marcar item do checklist como concluído
14. send_order - Enviar pedido de compra para fornecedor (rascunho → enviado)
15. create_appointment - Criar compromisso com horário específico
16. save_preference - Salvar atalho/preferência do usuário (ex: "luz" = "conta de energia")

MULTI-AÇÃO: Você pode chamar MÚLTIPLAS tools em uma única resposta quando o usuário pedir várias ações (ex: "registra a nota, dá entrada no estoque e cria o boleto"). Use várias tool_calls na mesma resposta.

REGRAS PARA AÇÕES:
- Se faltar info obrigatória, pergunte antes de executar
- Use nomes de itens/categorias/contas do contexto abaixo
- Para ações destrutivas (delete_task), confirme com o usuário antes
- Seja PROATIVO: sugira ações quando detectar oportunidades (ex: "Vejo 3 despesas pendentes, quer que eu marque alguma como paga?")

CONTEXTO (use sob demanda, NÃO despeje tudo na resposta):
- Dia: ${context?.dayOfWeek || '?'} (${context?.timeOfDay || ''})
${dataSnapshot}${preferencesBlock}`;

    const aiMessages: { role: string; content: any }[] = [
      { role: "system", content: systemPrompt },
    ];

    if (conversationHistory && Array.isArray(conversationHistory)) {
      for (const msg of conversationHistory) {
        if (msg.imageUrl && msg.role === "user") {
          aiMessages.push({
            role: "user",
            content: [
              { type: "text", text: msg.content },
              { type: "image_url", image_url: { url: msg.imageUrl } },
            ],
          });
        } else {
          aiMessages.push({ role: msg.role, content: msg.content });
        }
      }
    }

    if (!conversationHistory || conversationHistory.length === 0) {
      aiMessages.push({
        role: "user",
        content: "Saudação curta (1 linha) + saldo total das contas + saldo do mês. Se tiver alerta urgente, mencione EM UMA FRASE. Nada mais.",
      });
    }

    // ── Multi-tool chaining loop ──
    const MAX_TOOL_ROUNDS = 5;
    let currentMessages = [...aiMessages];
    const allToolResults: string[] = [];
    let finalTextResponse = "";

    for (let round = 0; round < MAX_TOOL_ROUNDS; round++) {
      const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash",
          messages: currentMessages,
          max_tokens: 1200,
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

      // If no tool calls, we have the final text response
      if (!choice?.tool_calls || choice.tool_calls.length === 0) {
        finalTextResponse = choice?.content || "";
        break;
      }

      // Execute ALL tool calls in this round
      // Add assistant message with tool_calls to conversation
      currentMessages.push({
        role: "assistant",
        content: choice.content || "",
        ...({ tool_calls: choice.tool_calls } as any),
      });

      for (const toolCall of choice.tool_calls) {
        let args: Record<string, unknown>;
        try {
          args = typeof toolCall.function.arguments === "string"
            ? JSON.parse(toolCall.function.arguments)
            : toolCall.function.arguments;
        } catch {
          const errMsg = `Não consegui interpretar os parâmetros de ${toolCall.function.name}.`;
          allToolResults.push(errMsg);
          currentMessages.push({
            role: "tool",
            content: errMsg,
            ...({ tool_call_id: toolCall.id } as any),
          });
          continue;
        }

        const result = await executeTool(toolCall.function.name, args, user_id, unit_id || null);
        allToolResults.push(result.message);

        currentMessages.push({
          role: "tool",
          content: result.message,
          ...({ tool_call_id: toolCall.id } as any),
        });
      }
    }

    // Build final response
    const actionExecuted = allToolResults.length > 0;

    if (actionExecuted) {
      // Combine tool results + any final AI commentary
      const combined = allToolResults.join("\n\n---\n\n") + (finalTextResponse ? `\n\n${finalTextResponse}` : "");
      return new Response(
        JSON.stringify({ suggestion: combined, action_executed: true }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // No tool calls at all - pure text response
    const suggestion = finalTextResponse || "Não foi possível gerar sugestões no momento.";

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
