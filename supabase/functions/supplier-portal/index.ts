import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

function normalizePhone(raw: string | null | undefined): string | null {
  if (!raw) return null;
  let digits = raw.replace(/\D/g, "");
  if (digits.length === 0) return null;
  if (digits.startsWith("55") && digits.length >= 12) digits = digits.slice(2);
  if (digits.startsWith("0") && digits.length >= 11) digits = digits.slice(1);
  if (digits.length < 10) return null;
  if (digits.length > 11) digits = digits.slice(0, 11);
  return "55" + digits;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  try {
    const url = new URL(req.url);
    const token = url.searchParams.get("token");
    const action = url.searchParams.get("action");

    if (!token) {
      return new Response(JSON.stringify({ error: "Token required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Find supplier by portal_token
    const { data: supplier, error: sError } = await supabase
      .from("suppliers")
      .select("id, name, phone, unit_id, portal_token")
      .eq("portal_token", token)
      .single();

    if (sError || !supplier) {
      return new Response(JSON.stringify({ error: "Invalid token" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ========== VERIFY PHONE ==========
    if (action === "verify-phone") {
      const phone = url.searchParams.get("phone");
      if (!phone) {
        return new Response(JSON.stringify({ error: "Phone required" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const normalizedInput = normalizePhone(phone);
      const supplierPhone = normalizePhone(supplier.phone);

      if (!supplierPhone || normalizedInput !== supplierPhone) {
        return new Response(
          JSON.stringify({ error: "Telefone não corresponde ao cadastro", valid: false }),
          { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      return new Response(
        JSON.stringify({ valid: true, supplier_id: supplier.id, supplier_name: supplier.name }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ========== SUMMARY (default GET) ==========
    if (!action || action === "summary") {
      const now = new Date();
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split("T")[0];
      const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split("T")[0];

      // Orders this month
      const { data: orders } = await supabase
        .from("orders")
        .select("id, status, created_at")
        .eq("supplier_id", supplier.id)
        .gte("created_at", monthStart)
        .lte("created_at", monthEnd + "T23:59:59");

      const totalOrders = orders?.length || 0;
      const sentOrders = orders?.filter((o: any) => o.status === "sent").length || 0;
      const receivedOrders = orders?.filter((o: any) => o.status === "received").length || 0;

      // Invoices summary
      const { data: invoices } = await supabase
        .from("supplier_invoices")
        .select("id, amount, due_date, is_paid, paid_at")
        .eq("supplier_id", supplier.id);

      const today = now.toISOString().split("T")[0];
      const pendingInvoices = invoices?.filter((i: any) => !i.is_paid) || [];
      const overdueInvoices = pendingInvoices.filter((i: any) => i.due_date < today);
      const totalPendingAmount = pendingInvoices.reduce((s: number, i: any) => s + Number(i.amount), 0);
      const totalOverdueAmount = overdueInvoices.reduce((s: number, i: any) => s + Number(i.amount), 0);

      // Total sold this month (from paid invoices)
      const monthInvoices = invoices?.filter(
        (i: any) => i.is_paid && i.paid_at && i.paid_at >= monthStart
      ) || [];
      const totalSoldMonth = monthInvoices.reduce((s: number, i: any) => s + Number(i.amount), 0);

      // Next due date
      const nextDue = pendingInvoices
        .sort((a: any, b: any) => a.due_date.localeCompare(b.due_date))[0]?.due_date || null;

      return new Response(
        JSON.stringify({
          supplier_id: supplier.id,
          supplier_name: supplier.name,
          has_phone: !!supplier.phone,
          summary: {
            total_orders_month: totalOrders,
            sent_orders: sentOrders,
            received_orders: receivedOrders,
            total_sold_month: totalSoldMonth,
            pending_invoices_count: pendingInvoices.length,
            pending_invoices_amount: totalPendingAmount,
            overdue_invoices_count: overdueInvoices.length,
            overdue_invoices_amount: totalOverdueAmount,
            next_due_date: nextDue,
          },
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ========== ORDERS ==========
    if (action === "orders") {
      const { data: orders } = await supabase
        .from("orders")
        .select(`
          id, status, notes, sent_at, created_at, updated_at,
          order_items(id, quantity, notes, item:inventory_items(id, name, unit_type))
        `)
        .eq("supplier_id", supplier.id)
        .order("created_at", { ascending: false })
        .limit(50);

      return new Response(
        JSON.stringify({ orders: orders || [] }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ========== INVOICES ==========
    if (action === "invoices") {
      const { data: invoices } = await supabase
        .from("supplier_invoices")
        .select("id, invoice_number, description, amount, issue_date, due_date, is_paid, paid_at, notes")
        .eq("supplier_id", supplier.id)
        .order("due_date", { ascending: false })
        .limit(100);

      return new Response(
        JSON.stringify({ invoices: invoices || [] }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(JSON.stringify({ error: "Invalid action" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
