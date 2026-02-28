import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const INSIGHT_TOOL = {
  type: "function",
  function: {
    name: "return_insights",
    description: "Return 3-4 operational insights based on the data snapshot.",
    parameters: {
      type: "object",
      properties: {
        insights: {
          type: "array",
          items: {
            type: "object",
            properties: {
              emoji: { type: "string", description: "Single emoji representing the insight" },
              title: { type: "string", description: "Short title (max 30 chars)" },
              description: { type: "string", description: "Brief description (max 80 chars)" },
              action_route: { type: "string", description: "App route to navigate (e.g. /finance, /inventory)" },
            },
            required: ["emoji", "title", "description"],
            additionalProperties: false,
          },
          minItems: 2,
          maxItems: 4,
        },
      },
      required: ["insights"],
      additionalProperties: false,
    },
  },
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: corsHeaders });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const lovableApiKey = Deno.env.get("LOVABLE_API_KEY");

    if (!lovableApiKey) {
      return new Response(JSON.stringify({ error: "LOVABLE_API_KEY not configured" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await supabase.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: corsHeaders });
    }
    const userId = claimsData.claims.sub;

    // Get user's unit
    const { data: userUnit } = await supabase
      .from("user_units")
      .select("unit_id")
      .eq("user_id", userId)
      .eq("is_default", true)
      .single();

    const unitId = userUnit?.unit_id;
    if (!unitId) {
      return new Response(JSON.stringify({ insights: [] }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Gather operational snapshot in parallel
    const today = new Date().toISOString().split("T")[0];
    const monthStart = today.slice(0, 7) + "-01";
    const fiveDaysFromNow = new Date(Date.now() + 5 * 86400000).toISOString().split("T")[0];

    const [
      balanceRes,
      lowStockRes,
      pendingExpensesRes,
      upcomingBillsRes,
      monthIncomeRes,
      monthExpenseRes,
      pendingRedemptionsRes,
      pendingOrdersRes,
    ] = await Promise.all([
      // Total balance across accounts
      supabase.from("finance_accounts").select("balance").eq("unit_id", unitId).eq("is_active", true),
      // Low stock items
      supabase.from("inventory_items").select("name, current_stock, min_stock").eq("unit_id", unitId).filter("current_stock", "lte", "min_stock"),
      // Pending (unpaid) expenses
      supabase.from("finance_transactions").select("amount").eq("unit_id", unitId).eq("type", "expense").eq("is_paid", false).gte("date", monthStart),
      // Bills due in next 5 days
      supabase.from("finance_transactions").select("amount, description, date").eq("unit_id", unitId).eq("type", "expense").eq("is_paid", false).gte("date", today).lte("date", fiveDaysFromNow),
      // Month income
      supabase.from("finance_transactions").select("amount").eq("unit_id", unitId).eq("type", "income").eq("is_paid", true).gte("date", monthStart),
      // Month expenses
      supabase.from("finance_transactions").select("amount").eq("unit_id", unitId).eq("type", "expense").eq("is_paid", true).gte("date", monthStart),
      // Pending reward redemptions
      supabase.from("reward_redemptions").select("id").eq("unit_id", unitId).eq("status", "pending"),
      // Pending orders
      supabase.from("orders").select("id").eq("unit_id", unitId).eq("status", "draft"),
    ]);

    const totalBalance = (balanceRes.data || []).reduce((s, a) => s + (a.balance || 0), 0);
    const lowStockItems = lowStockRes.data || [];
    const pendingExpensesTotal = (pendingExpensesRes.data || []).reduce((s, a) => s + (a.amount || 0), 0);
    const upcomingBills = upcomingBillsRes.data || [];
    const upcomingBillsTotal = upcomingBills.reduce((s, a) => s + (a.amount || 0), 0);
    const monthIncome = (monthIncomeRes.data || []).reduce((s, a) => s + (a.amount || 0), 0);
    const monthExpense = (monthExpenseRes.data || []).reduce((s, a) => s + (a.amount || 0), 0);
    const pendingRedemptions = (pendingRedemptionsRes.data || []).length;
    const pendingOrders = (pendingOrdersRes.data || []).length;

    const fmt = (v: number) => `R$${v.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`;

    const snapshot = `
Dados operacionais de hoje (${today}):
- Saldo total em contas: ${fmt(totalBalance)}
- Receita do mês: ${fmt(monthIncome)}
- Despesa do mês: ${fmt(monthExpense)}
- Margem: ${monthIncome > 0 ? ((1 - monthExpense / monthIncome) * 100).toFixed(1) + "%" : "N/A"}
- Despesas pendentes (não pagas): ${fmt(pendingExpensesTotal)}
- Contas a vencer nos próximos 5 dias: ${upcomingBills.length} (total ${fmt(upcomingBillsTotal)})${upcomingBills.length > 0 ? " — " + upcomingBills.slice(0, 3).map(b => b.description).join(", ") : ""}
- Itens em estoque crítico (abaixo do mínimo): ${lowStockItems.length}${lowStockItems.length > 0 ? " — " + lowStockItems.slice(0, 5).map(i => `${i.name} (${i.current_stock}/${i.min_stock})`).join(", ") : ""}
- Pedidos de compra em rascunho: ${pendingOrders}
- Resgates de prêmios aguardando: ${pendingRedemptions}
`.trim();

    const systemPrompt = `Você é um assistente de gestão para restaurantes brasileiros. Analise os dados operacionais e retorne 3-4 insights CURTOS e ACIONÁVEIS usando a ferramenta return_insights.
Regras:
- Títulos com no máximo 30 caracteres
- Descrições com no máximo 80 caracteres
- Foque nos problemas mais urgentes e oportunidades
- Se tudo estiver ok, dê insights positivos/motivacionais
- Use emojis relevantes (📉📈⚠️💰✅🔥💡🎯)
- action_route: /finance, /inventory, /orders, /rewards, /checklists
- Seja direto e prático, sem enrolação`;

    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${lovableApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash-lite",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: snapshot },
        ],
        tools: [INSIGHT_TOOL],
        tool_choice: { type: "function", function: { name: "return_insights" } },
      }),
    });

    if (!aiResponse.ok) {
      const status = aiResponse.status;
      const text = await aiResponse.text();
      console.error("AI gateway error:", status, text);
      
      if (status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded" }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
      if (status === 402) {
        return new Response(JSON.stringify({ error: "Payment required" }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
      return new Response(JSON.stringify({ insights: [] }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const aiData = await aiResponse.json();
    const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
    
    let insights = [];
    if (toolCall?.function?.arguments) {
      try {
        const parsed = JSON.parse(toolCall.function.arguments);
        insights = parsed.insights || [];
      } catch {
        console.error("Failed to parse tool call arguments");
      }
    }

    return new Response(JSON.stringify({ insights }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("ai-insights error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
