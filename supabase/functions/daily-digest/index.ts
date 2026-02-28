import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const supabase = createClient(supabaseUrl, serviceRoleKey);

  try {
    const today = new Date().toISOString().split('T')[0];
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

    // Get all units
    const { data: units } = await supabase.from('units').select('id, name');

    // Get all admin users
    const { data: adminRoles } = await supabase.from('user_roles').select('user_id').in('role', ['admin', 'super_admin']);
    const adminIds = [...new Set((adminRoles || []).map((r: { user_id: string }) => r.user_id))];

    // For each admin, get their units and build digest
    const digestResults: Array<{ userId: string; sent: boolean }> = [];

    for (const adminId of adminIds) {
      const { data: userUnits } = await supabase.from('user_units').select('unit_id').eq('user_id', adminId);
      const unitIds = (userUnits || []).map((u: { unit_id: string }) => u.unit_id);
      if (unitIds.length === 0) continue;

      const sections: string[] = [];
      let alertCount = 0;

      // 1. Unpaid expenses due today or overdue
      const { data: dueExpenses } = await supabase
        .from('finance_transactions')
        .select('description, amount, date')
        .eq('user_id', adminId)
        .eq('type', 'expense')
        .eq('is_paid', false)
        .lte('date', today)
        .order('date', { ascending: true })
        .limit(20);

      if (dueExpenses && dueExpenses.length > 0) {
        const overdueCount = dueExpenses.filter((e: { date: string }) => e.date < today).length;
        const todayCount = dueExpenses.filter((e: { date: string }) => e.date === today).length;
        const total = dueExpenses.reduce((s: number, e: { amount: number }) => s + Number(e.amount), 0);
        let line = `💰 ${dueExpenses.length} conta(s) pendente(s) - R$ ${total.toFixed(2)}`;
        if (overdueCount > 0) line += ` (${overdueCount} vencida(s))`;
        if (todayCount > 0) line += ` (${todayCount} vence(m) hoje)`;
        sections.push(line);
        alertCount += dueExpenses.length;
      }

      // 2. Unpaid supplier invoices due today or overdue
      const { data: dueInvoices } = await supabase
        .from('supplier_invoices')
        .select('invoice_number, amount, due_date')
        .in('unit_id', unitIds)
        .eq('is_paid', false)
        .lte('due_date', today)
        .limit(10);

      if (dueInvoices && dueInvoices.length > 0) {
        const total = dueInvoices.reduce((s: number, i: { amount: number }) => s + Number(i.amount), 0);
        sections.push(`📋 ${dueInvoices.length} boleto(s) pendente(s) - R$ ${total.toFixed(2)}`);
        alertCount += dueInvoices.length;
      }

      // 3. Critical stock (zero or below minimum)
      const { data: criticalStock } = await supabase
        .from('inventory_items')
        .select('name, current_stock, min_stock')
        .in('unit_id', unitIds)
        .or('current_stock.eq.0,current_stock.lte.min_stock')
        .limit(15);

      // Filter properly since .or with column reference doesn't work well
      const realCritical = (criticalStock || []).filter(
        (i: { current_stock: number; min_stock: number }) => i.current_stock <= i.min_stock
      );

      if (realCritical.length > 0) {
        const zeroCount = realCritical.filter((i: { current_stock: number }) => i.current_stock === 0).length;
        const lowCount = realCritical.length - zeroCount;
        let line = `📦 Estoque crítico: `;
        if (zeroCount > 0) line += `${zeroCount} zerado(s)`;
        if (zeroCount > 0 && lowCount > 0) line += `, `;
        if (lowCount > 0) line += `${lowCount} abaixo do mínimo`;
        const names = realCritical.slice(0, 3).map((i: { name: string }) => i.name).join(', ');
        line += ` (${names}${realCritical.length > 3 ? '...' : ''})`;
        sections.push(line);
        alertCount += realCritical.length;
      }

      // 4. Pending tasks for today
      const { data: pendingTasks } = await supabase
        .from('manager_tasks')
        .select('title')
        .eq('user_id', adminId)
        .eq('date', today)
        .eq('is_completed', false)
        .limit(20);

      if (pendingTasks && pendingTasks.length > 0) {
        sections.push(`📝 ${pendingTasks.length} tarefa(s) pendente(s) para hoje`);
        alertCount += pendingTasks.length;
      }

      // 5. Cash closing not done yesterday
      const { data: yesterdayClosing } = await supabase
        .from('cash_closings')
        .select('id')
        .in('unit_id', unitIds)
        .eq('date', yesterday)
        .limit(1);

      if (!yesterdayClosing || yesterdayClosing.length === 0) {
        sections.push(`🏧 Fechamento de caixa de ontem não registrado`);
        alertCount++;
      }

      // 6. Pending orders (draft status)
      const { data: draftOrders } = await supabase
        .from('orders')
        .select('id')
        .in('unit_id', unitIds)
        .eq('status', 'draft');

      if (draftOrders && draftOrders.length > 0) {
        sections.push(`🛒 ${draftOrders.length} pedido(s) em rascunho`);
        alertCount += draftOrders.length;
      }

      // 7. Checklist deadlines - items not completed today
      const { data: checklistDeadlines } = await supabase
        .from('checklist_deadline_settings')
        .select('checklist_type, deadline_hour, deadline_minute')
        .in('unit_id', unitIds)
        .eq('is_active', true);

      if (checklistDeadlines && checklistDeadlines.length > 0) {
        // Check if today's checklists have pending items
        const { data: todayCompletions } = await supabase
          .from('checklist_completions')
          .select('checklist_type')
          .in('unit_id', unitIds)
          .eq('date', today);

        const completedTypes = new Set((todayCompletions || []).map((c: { checklist_type: string }) => c.checklist_type));
        const pendingDeadlines = checklistDeadlines.filter(
          (d: { checklist_type: string }) => !completedTypes.has(d.checklist_type)
        );

        if (pendingDeadlines.length > 0) {
          const types = pendingDeadlines.map((d: { checklist_type: string; deadline_hour: number; deadline_minute: number }) => 
            `${d.checklist_type} (até ${String(d.deadline_hour).padStart(2, '0')}:${String(d.deadline_minute).padStart(2, '0')})`
          ).join(', ');
          sections.push(`⏰ Checklists com prazo hoje: ${types}`);
          alertCount += pendingDeadlines.length;
        }
      }

      // 8. Appointments today
      const { data: appointments } = await supabase
        .from('manager_appointments')
        .select('title, scheduled_time')
        .eq('user_id', adminId)
        .eq('date', today)
        .order('scheduled_time', { ascending: true });

      if (appointments && appointments.length > 0) {
        const appts = appointments.map((a: { title: string; scheduled_time: string }) => `${a.scheduled_time.slice(0, 5)} - ${a.title}`).join(', ');
        sections.push(`📅 Compromissos: ${appts}`);
      }

      // Build final digest
      if (sections.length === 0) {
        // No alerts - send a positive message
        sections.push('✅ Tudo em ordem! Nenhuma pendência crítica.');
      }

      const digestTitle = alertCount > 0
        ? `🌅 Bom dia! ${alertCount} pendência(s) hoje`
        : '🌅 Bom dia! Tudo em ordem';

      const digestBody = sections.join('\n');

      // Create in-app notification
      await supabase.from('notifications').insert({
        user_id: adminId,
        type: alertCount > 0 ? 'alert' : 'info',
        title: digestTitle,
        description: digestBody,
        origin: 'sistema',
      });

      // Send push notification via push-notifier
      try {
        const pushUrl = `${supabaseUrl}/functions/v1/push-notifier?action=send-push`;
        await fetch(pushUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${serviceRoleKey}`,
          },
          body: JSON.stringify({
            user_id: adminId,
            title: digestTitle,
            message: sections.slice(0, 3).join(' | '),
            url: '/alerts',
            tag: 'daily-digest',
          }),
        });
      } catch (pushErr) {
        console.error('[daily-digest] Push error for user', adminId, pushErr);
      }

      digestResults.push({ userId: adminId, sent: true });
    }

    return new Response(JSON.stringify({
      success: true,
      digestsSent: digestResults.length,
      date: today,
      results: digestResults,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err: unknown) {
    console.error('[daily-digest] Error:', err);
    return new Response(JSON.stringify({ error: err instanceof Error ? err.message : String(err) }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
