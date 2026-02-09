import { createClient } from "npm:@supabase/supabase-js@2";
import webpush from "npm:web-push@3.6.7";

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
  const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);

  const url = new URL(req.url);
  const action = url.searchParams.get('action');

  try {
    // Get or generate VAPID keys
    async function getVapidConfig() {
      const { data } = await supabaseAdmin.from('push_config').select('*').limit(1).maybeSingle();
      if (data) return data;

      const keys = webpush.generateVAPIDKeys();
      const { data: newConfig, error } = await supabaseAdmin.from('push_config').insert({
        vapid_public_key: keys.publicKey,
        vapid_private_key: keys.privateKey,
        vapid_subject: 'mailto:admin@garden-gestao.com',
      }).select().single();

      if (error) throw error;
      return newConfig;
    }

    // === GET VAPID PUBLIC KEY ===
    if (action === 'vapid-key') {
      const config = await getVapidConfig();
      return new Response(JSON.stringify({ publicKey: config.vapid_public_key }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // === SUBSCRIBE ===
    if (action === 'subscribe') {
      const authHeader = req.headers.get('Authorization');
      if (!authHeader?.startsWith('Bearer ')) {
        return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: corsHeaders });
      }

      const supabaseUser = createClient(supabaseUrl, Deno.env.get('SUPABASE_ANON_KEY')!, {
        global: { headers: { Authorization: authHeader } },
      });

      const token = authHeader.replace('Bearer ', '');
      const { data: claimsData, error: claimsError } = await supabaseUser.auth.getClaims(token);
      if (claimsError || !claimsData?.claims) {
        return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: corsHeaders });
      }

      const userId = claimsData.claims.sub;
      const { subscription } = await req.json();

      await supabaseAdmin.from('push_subscriptions').upsert({
        user_id: userId,
        endpoint: subscription.endpoint,
        p256dh: subscription.keys.p256dh,
        auth: subscription.keys.auth,
      }, { onConflict: 'user_id,endpoint' });

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // === UNSUBSCRIBE ===
    if (action === 'unsubscribe') {
      const authHeader = req.headers.get('Authorization');
      if (!authHeader?.startsWith('Bearer ')) {
        return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: corsHeaders });
      }

      const supabaseUser = createClient(supabaseUrl, Deno.env.get('SUPABASE_ANON_KEY')!, {
        global: { headers: { Authorization: authHeader } },
      });

      const token = authHeader.replace('Bearer ', '');
      const { data: claimsData, error: claimsError } = await supabaseUser.auth.getClaims(token);
      if (claimsError || !claimsData?.claims) {
        return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: corsHeaders });
      }

      const userId = claimsData.claims.sub;
      const { endpoint } = await req.json();

      await supabaseAdmin.from('push_subscriptions').delete()
        .eq('user_id', userId)
        .eq('endpoint', endpoint);

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // === CHECK ALERTS (called by cron) ===
    if (action === 'check-alerts') {
      const config = await getVapidConfig();
      webpush.setVapidDetails(config.vapid_subject, config.vapid_public_key, config.vapid_private_key);

      // Get all admin user IDs
      const { data: adminRoles } = await supabaseAdmin.from('user_roles').select('user_id').eq('role', 'admin');
      const adminIds = (adminRoles || []).map((r: { user_id: string }) => r.user_id);

      const today = new Date().toISOString().split('T')[0];
      const notifications: Array<{ userId: string; title: string; body: string; url: string; tag: string }> = [];

      for (const adminId of adminIds) {
        // 1. Bills due today
        const { data: dueTodayTx } = await supabaseAdmin
          .from('finance_transactions')
          .select('id, description, amount')
          .eq('user_id', adminId)
          .eq('type', 'expense')
          .eq('is_paid', false)
          .eq('date', today);

        if (dueTodayTx && dueTodayTx.length > 0) {
          const total = dueTodayTx.reduce((s: number, t: { amount: number }) => s + Number(t.amount), 0);
          notifications.push({
            userId: adminId,
            title: '💰 Contas a Pagar Hoje',
            body: `${dueTodayTx.length} conta(s) vencendo hoje - R$ ${total.toFixed(2)}`,
            url: '/finance',
            tag: 'bills-due-today',
          });
        }

        // 2. Overdue bills
        const { data: overdueTx } = await supabaseAdmin
          .from('finance_transactions')
          .select('id, description, amount')
          .eq('user_id', adminId)
          .eq('type', 'expense')
          .eq('is_paid', false)
          .lt('date', today);

        if (overdueTx && overdueTx.length > 0) {
          const total = overdueTx.reduce((s: number, t: { amount: number }) => s + Number(t.amount), 0);
          notifications.push({
            userId: adminId,
            title: '⚠️ Contas Vencidas',
            body: `${overdueTx.length} conta(s) vencida(s) - R$ ${total.toFixed(2)}`,
            url: '/finance',
            tag: 'bills-overdue',
          });
        }

        // 3. Negative balance accounts
        const { data: negAccounts } = await supabaseAdmin
          .from('finance_accounts')
          .select('name, balance')
          .eq('user_id', adminId)
          .eq('is_active', true)
          .lt('balance', 0);

        if (negAccounts && negAccounts.length > 0) {
          notifications.push({
            userId: adminId,
            title: '🔴 Saldo Negativo',
            body: negAccounts.map((a: { name: string; balance: number }) => `${a.name}: R$ ${Number(a.balance).toFixed(2)}`).join(', '),
            url: '/finance',
            tag: 'negative-balance',
          });
        }

        // 4. Pending supplier invoices due today
        const { data: dueInvoices } = await supabaseAdmin
          .from('supplier_invoices')
          .select('id, description, amount')
          .eq('user_id', adminId)
          .eq('is_paid', false)
          .eq('due_date', today);

        if (dueInvoices && dueInvoices.length > 0) {
          const total = dueInvoices.reduce((s: number, i: { amount: number }) => s + Number(i.amount), 0);
          notifications.push({
            userId: adminId,
            title: '📋 Notas de Fornecedor Hoje',
            body: `${dueInvoices.length} nota(s) vencendo hoje - R$ ${total.toFixed(2)}`,
            url: '/inventory',
            tag: 'supplier-invoices-due',
          });
        }
      }

      // 5. Zero stock items (notify all admins)
      const { data: zeroStock } = await supabaseAdmin
        .from('inventory_items')
        .select('name')
        .eq('current_stock', 0);

      if (zeroStock && zeroStock.length > 0) {
        const names = zeroStock.slice(0, 3).map((i: { name: string }) => i.name).join(', ');
        const suffix = zeroStock.length > 3 ? `... (+${zeroStock.length - 3})` : '';
        for (const adminId of adminIds) {
          notifications.push({
            userId: adminId,
            title: '📦 Estoque Zerado',
            body: `${zeroStock.length} item(ns): ${names}${suffix}`,
            url: '/inventory',
            tag: 'zero-stock',
          });
        }
      }

      // Send all notifications
      let sent = 0;
      let failed = 0;

      for (const notif of notifications) {
        const { data: subs } = await supabaseAdmin
          .from('push_subscriptions')
          .select('*')
          .eq('user_id', notif.userId);

        for (const sub of (subs || [])) {
          try {
            await webpush.sendNotification(
              {
                endpoint: sub.endpoint,
                keys: { p256dh: sub.p256dh, auth: sub.auth },
              },
              JSON.stringify({
                title: notif.title,
                body: notif.body,
                url: notif.url,
                tag: notif.tag,
              })
            );
            sent++;
          } catch (err: unknown) {
            failed++;
            const statusCode = (err as { statusCode?: number })?.statusCode;
            if (statusCode === 410 || statusCode === 404) {
              await supabaseAdmin.from('push_subscriptions').delete().eq('id', sub.id);
            }
          }
        }
      }

      return new Response(JSON.stringify({ sent, failed, alerts: notifications.length }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ error: 'Unknown action' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
