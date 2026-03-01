import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseAuth = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await supabaseAuth.auth.getClaims(token);
    if (claimsError || !claimsData?.claims?.sub) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userId = claimsData.claims.sub as string;
    const { unit_id } = await req.json();

    if (!unit_id) {
      return new Response(JSON.stringify({ error: "unit_id required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Use service role for cross-table access
    const sb = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Validate unit access
    const { data: unitAccess } = await sb
      .from("user_units")
      .select("unit_id")
      .eq("user_id", userId)
      .eq("unit_id", unit_id)
      .maybeSingle();

    if (!unitAccess) {
      return new Response(JSON.stringify({ error: "Access denied" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const now = new Date();
    const todayStr = now.toISOString().split("T")[0];
    const monthStart = todayStr.slice(0, 7) + "-01";
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split("T")[0];
    const last7days = new Date(now.getTime() - 7 * 86400000).toISOString().split("T")[0];
    const next7days = new Date(now.getTime() + 7 * 86400000).toISOString().split("T")[0];

    // Execute all queries in parallel (server-side = low latency)
    const [
      accountsRes, incomeRes, expenseRes, pendingExpRes,
      lowStockRes, ordersRes, closingsRes, employeesRes,
      suppliersRes, recentTxRes, tasksRes, employeePaymentsRes,
      allMonthTxRes, checklistItemsRes, checklistCompletionsRes,
      supplierInvoicesRes, budgetsRes, budgetSpentRes, preferencesRes,
    ] = await Promise.all([
      sb.from("finance_accounts").select("name, type, balance").eq("unit_id", unit_id).eq("is_active", true),
      sb.from("finance_transactions").select("amount").eq("user_id", userId).eq("unit_id", unit_id).eq("type", "income").eq("is_paid", true).gte("date", monthStart).lte("date", monthEnd),
      sb.from("finance_transactions").select("amount").eq("user_id", userId).eq("unit_id", unit_id).in("type", ["expense", "credit_card"]).eq("is_paid", true).gte("date", monthStart).lte("date", monthEnd),
      sb.from("finance_transactions").select("amount, description, date").eq("user_id", userId).eq("unit_id", unit_id).in("type", ["expense", "credit_card"]).eq("is_paid", false).gte("date", monthStart).lte("date", monthEnd).order("date").limit(30),
      sb.from("inventory_items").select("name, current_stock, min_stock").eq("unit_id", unit_id).order("current_stock"),
      sb.from("orders").select("status, supplier:suppliers(name), created_at").eq("unit_id", unit_id).in("status", ["draft", "sent"]).order("created_at", { ascending: false }).limit(10),
      sb.from("cash_closings").select("date, total_amount, status, unit_name").eq("unit_id", unit_id).eq("status", "pending").order("date", { ascending: false }).limit(5),
      sb.from("employees").select("full_name, role, is_active, base_salary").eq("unit_id", unit_id).eq("is_active", true),
      sb.from("suppliers").select("name, delivery_frequency").eq("unit_id", unit_id),
      sb.from("finance_transactions").select("description, amount, type, date, is_paid, category:finance_categories(name), employee:employees(full_name), supplier:suppliers(name)").eq("user_id", userId).eq("unit_id", unit_id).gte("date", last7days).order("date", { ascending: false }).limit(50),
      sb.from("manager_tasks").select("title, is_completed, priority, period").eq("user_id", userId).eq("date", todayStr),
      sb.from("employee_payments").select("amount, type, is_paid, payment_date, employee:employees(full_name)").eq("unit_id", unit_id).eq("reference_month", now.getMonth() + 1).eq("reference_year", now.getFullYear()).order("payment_date", { ascending: false }).limit(30),
      sb.from("finance_transactions").select("description, amount, type, date, is_paid").eq("user_id", userId).eq("unit_id", unit_id).gte("date", monthStart).lte("date", monthEnd).order("date", { ascending: false }).limit(100),
      sb.from("checklist_items").select("id, checklist_type").eq("unit_id", unit_id).eq("is_active", true).is("deleted_at", null),
      sb.from("checklist_completions").select("id, checklist_type, is_skipped").eq("unit_id", unit_id).eq("date", todayStr),
      sb.from("supplier_invoices").select("description, amount, due_date, is_paid, supplier:suppliers(name)").eq("unit_id", unit_id).eq("is_paid", false).gte("due_date", todayStr).lte("due_date", next7days).order("due_date").limit(10),
      sb.from("finance_budgets").select("planned_amount, category:finance_categories(id, name)").eq("unit_id", unit_id).eq("user_id", userId).eq("month", now.getMonth() + 1).eq("year", now.getFullYear()),
      sb.from("finance_transactions").select("amount, category_id").eq("user_id", userId).eq("unit_id", unit_id).in("type", ["expense", "credit_card"]).eq("is_paid", true).gte("date", monthStart).lte("date", monthEnd),
      sb.from("copilot_preferences").select("key, value, category").eq("user_id", userId).limit(50),
    ]);

    // Process data
    const totalIncome = (incomeRes.data || []).reduce((s: number, t: any) => s + Number(t.amount), 0);
    const totalExpense = (expenseRes.data || []).reduce((s: number, t: any) => s + Number(t.amount), 0);
    const totalPending = (pendingExpRes.data || []).reduce((s: number, t: any) => s + Number(t.amount), 0);
    const lowStockItems = (lowStockRes.data || []).filter((i: any) => i.current_stock <= i.min_stock);

    const checklistItems = checklistItemsRes.data || [];
    const checklistCompletions = checklistCompletionsRes.data || [];
    const abertura = checklistItems.filter((i: any) => i.checklist_type === "abertura");
    const fechamento = checklistItems.filter((i: any) => i.checklist_type === "fechamento");
    const aberturaCompleted = checklistCompletions.filter((c: any) => c.checklist_type === "abertura").length;
    const fechamentoCompleted = checklistCompletions.filter((c: any) => c.checklist_type === "fechamento").length;
    const checklistProgress = `Abertura: ${aberturaCompleted}/${abertura.length} (${abertura.length > 0 ? Math.round((aberturaCompleted / abertura.length) * 100) : 0}%) | Fechamento: ${fechamentoCompleted}/${fechamento.length} (${fechamento.length > 0 ? Math.round((fechamentoCompleted / fechamento.length) * 100) : 0}%)`;

    const upcomingInvoices = (supplierInvoicesRes.data || []).map((inv: any) =>
      `${(inv.supplier as any)?.name || "?"}: ${inv.description} - R$${Number(inv.amount).toFixed(2)} (vence ${inv.due_date})`
    );

    const budgetData = budgetsRes.data || [];
    const spentByCat: Record<string, number> = {};
    (budgetSpentRes.data || []).forEach((t: any) => {
      if (t.category_id) spentByCat[t.category_id] = (spentByCat[t.category_id] || 0) + Number(t.amount);
    });
    const budgetStatus = budgetData.map((b: any) => {
      const catName = (b.category as any)?.name || "Sem categoria";
      const spent = spentByCat[(b.category as any)?.id] || 0;
      const pct = b.planned_amount > 0 ? Math.round((spent / b.planned_amount) * 100) : 0;
      return `${catName}: R$${spent.toFixed(2)} / R$${Number(b.planned_amount).toFixed(2)} (${pct}%)`;
    });

    const fmt = (v: number) => `R$${v.toFixed(2)}`;

    const context = {
      criticalStockCount: lowStockItems.length,
      accounts: (accountsRes.data || []).map((a: any) => `${a.name} (${a.type}): ${fmt(Number(a.balance))}`),
      monthlyIncome: totalIncome,
      monthlyExpense: totalExpense,
      monthlyBalance: totalIncome - totalExpense,
      pendingExpensesTotal: totalPending,
      pendingExpenses: (pendingExpRes.data || []).map((e: any) => `${e.description}: ${fmt(Number(e.amount))} (${e.date})`),
      recentTransactions: (recentTxRes.data || []).map((t: any) => `${t.date} | ${t.type === "income" ? "+" : "-"}${fmt(Number(t.amount))} | ${t.description} | ${t.is_paid ? "pago" : "pendente"} | cat: ${(t.category as any)?.name || "sem"} | func: ${(t.employee as any)?.full_name || "-"} | forn: ${(t.supplier as any)?.name || "-"}`),
      allMonthTransactions: (allMonthTxRes.data || []).map((t: any) => `${t.date} | ${t.type === "income" ? "+" : "-"}${fmt(Number(t.amount))} | ${t.description} | ${t.is_paid ? "pago" : "pendente"}`),
      lowStockItems: lowStockItems.slice(0, 10).map((i: any) => `${i.name}: ${i.current_stock}/${i.min_stock}`),
      pendingOrders: (ordersRes.data || []).map((o: any) => `${(o.supplier as any)?.name || "?"}: ${o.status}`),
      pendingClosings: (closingsRes.data || []).map((c: any) => `${c.date}: ${fmt(Number(c.total_amount || 0))} (${c.unit_name})`),
      employees: (employeesRes.data || []).map((e: any) => `${e.full_name} (${e.role || "sem cargo"}) - Salário: ${fmt(Number(e.base_salary || 0))}`),
      employeePayments: (employeePaymentsRes.data || []).map((p: any) => `${(p.employee as any)?.full_name || "?"}: ${fmt(Number(p.amount))} (${p.type}) - ${p.is_paid ? "pago" : "pendente"}`),
      suppliers: (suppliersRes.data || []).map((s: any) => `${s.name} [${s.delivery_frequency || "weekly"}]`),
      todayTasks: (tasksRes.data || []).map((t: any) => `${t.is_completed ? "✅" : "⬜"} ${t.title} (${t.priority}, ${t.period})`),
      checklistProgress,
      upcomingInvoices,
      budgetStatus,
      preferences: (preferencesRes.data || []).map((p: any) => `${p.key} = ${p.value} (${p.category})`),
    };

    // Compute context stats for UI chips
    const contextStats = {
      pendingExpensesCount: (pendingExpRes.data || []).length,
      pendingExpensesTotal: totalPending,
      lowStockCount: lowStockItems.length,
      pendingTasksCount: (tasksRes.data || []).filter((t: any) => !t.is_completed).length,
      upcomingInvoicesCount: (supplierInvoicesRes.data || []).length,
      checklistPct: abertura.length > 0 ? Math.round((aberturaCompleted / abertura.length) * 100) : 0,
    };

    return new Response(
      JSON.stringify({ context, contextStats }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err: any) {
    console.error("copilot-context error:", err);
    return new Response(
      JSON.stringify({ error: err.message || "Internal error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
