import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-webhook-secret',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const action = url.searchParams.get('action') || 'receive';

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    // Verify webhook secret for external calls
    const webhookSecret = req.headers.get('x-webhook-secret');
    const expectedSecret = Deno.env.get('DELIVERY_HUB_WEBHOOK_SECRET');

    if (action === 'receive') {
      // External webhook: receive order from platform
      if (expectedSecret && webhookSecret !== expectedSecret) {
        return new Response(JSON.stringify({ error: 'Invalid webhook secret' }), {
          status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const body = await req.json();
      const {
        unit_id, platform = 'manual', platform_order_id, platform_display_id,
        customer_name = '', customer_phone, customer_address,
        subtotal = 0, delivery_fee = 0, discount = 0, total = 0,
        payment_method, notes, items = [], platform_data = {},
      } = body;

      if (!unit_id) {
        return new Response(JSON.stringify({ error: 'unit_id is required' }), {
          status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Insert order
      const { data: order, error: orderError } = await supabase
        .from('delivery_hub_orders')
        .insert({
          unit_id, platform, platform_order_id, platform_display_id,
          customer_name, customer_phone, customer_address,
          subtotal, delivery_fee, discount, total,
          payment_method, notes, platform_data,
          status: 'new',
        })
        .select('id')
        .single();

      if (orderError) throw orderError;

      // Insert items
      if (items.length > 0) {
        const orderItems = items.map((item: any) => ({
          order_id: order.id,
          name: item.name || '',
          quantity: item.quantity || 1,
          unit_price: item.unit_price || 0,
          total_price: item.total_price || (item.unit_price || 0) * (item.quantity || 1),
          notes: item.notes || null,
          options: item.options || [],
        }));

        const { error: itemsError } = await supabase
          .from('delivery_hub_order_items')
          .insert(orderItems);

        if (itemsError) throw itemsError;
      }

      // Send push notification to unit admins
      try {
        const { data: unitUsers } = await supabase
          .from('user_units')
          .select('user_id')
          .eq('unit_id', unit_id);

        if (unitUsers) {
          for (const uu of unitUsers) {
            await supabase.from('notifications').insert({
              user_id: uu.user_id,
              type: 'info',
              title: `🛵 Novo pedido ${platform.toUpperCase()}`,
              description: `Pedido #${platform_display_id || order.id.slice(0, 8)} — ${customer_name} — R$ ${Number(total).toFixed(2)}`,
              origin: 'delivery_hub',
            });
          }
        }
      } catch (e) {
        console.error('[delivery-hub-webhook] Push notification error:', e);
      }

      return new Response(JSON.stringify({ ok: true, order_id: order.id }), {
        status: 201, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (action === 'update-status') {
      // Internal: update order status (requires auth)
      const authHeader = req.headers.get('Authorization');
      if (!authHeader) {
        return new Response(JSON.stringify({ error: 'Unauthorized' }), {
          status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const userClient = createClient(
        Deno.env.get('SUPABASE_URL')!,
        Deno.env.get('SUPABASE_ANON_KEY')!,
        { global: { headers: { Authorization: authHeader } } }
      );

      const { data: claims, error: claimsError } = await userClient.auth.getClaims(
        authHeader.replace('Bearer ', '')
      );
      if (claimsError || !claims?.claims) {
        return new Response(JSON.stringify({ error: 'Unauthorized' }), {
          status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const body = await req.json();
      const { order_id, status, cancel_reason } = body;

      const timestampFields: Record<string, string> = {
        accepted: 'accepted_at',
        ready: 'ready_at',
        delivered: 'delivered_at',
        cancelled: 'cancelled_at',
      };

      const updateData: any = { status, updated_at: new Date().toISOString() };
      if (timestampFields[status]) updateData[timestampFields[status]] = new Date().toISOString();
      if (status === 'cancelled' && cancel_reason) updateData.cancel_reason = cancel_reason;

      const { error } = await supabase
        .from('delivery_hub_orders')
        .update(updateData)
        .eq('id', order_id);

      if (error) throw error;

      return new Response(JSON.stringify({ ok: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ error: 'Unknown action' }), {
      status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err: any) {
    console.error('[delivery-hub-webhook] Error:', err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
