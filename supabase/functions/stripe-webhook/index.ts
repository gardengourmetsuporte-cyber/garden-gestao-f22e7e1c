import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const PLAN_MAP: Record<string, string> = {
  "prod_U1rIbxkhP47jp9": "pro",
  "prod_U1rJEnm1kEpp6M": "pro",
  "prod_U1rJugSHUT2cLr": "business",
  "prod_U1rJR8yqlreP40": "business",
};

serve(async (req) => {
  try {
    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");
    if (!stripeKey || !webhookSecret) throw new Error("Missing Stripe env vars");

    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });
    const body = await req.text();
    const signature = req.headers.get("stripe-signature");
    if (!signature) throw new Error("No signature");

    const event = await stripe.webhooks.constructEventAsync(body, signature, webhookSecret);
    console.log(`[stripe-webhook] Event: ${event.type}`);

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;
      const customerEmail = session.customer_details?.email || session.customer_email;
      const customerId = session.customer as string;
      const subscriptionId = session.subscription as string;

      if (!customerEmail) {
        console.log("[stripe-webhook] No customer email found");
        return new Response(JSON.stringify({ received: true }), { status: 200 });
      }

      // Get plan from subscription product
      let plan = session.metadata?.planId || "pro";
      if (subscriptionId) {
        const sub = await stripe.subscriptions.retrieve(subscriptionId);
        const productId = sub.items.data[0]?.price?.product as string;
        if (productId && PLAN_MAP[productId]) {
          plan = PLAN_MAP[productId];
        }
      }

      // Find user by email and update profile
      const { data: users } = await supabaseAdmin.auth.admin.listUsers();
      const user = users?.users?.find(u => u.email === customerEmail);

      if (user) {
        await supabaseAdmin.from("profiles").update({
          plan,
          plan_status: "active",
          stripe_customer_id: customerId,
        }).eq("user_id", user.id);
        console.log(`[stripe-webhook] Updated user ${user.id} to plan=${plan}`);
      } else {
        console.log(`[stripe-webhook] No user found for checkout session`);
      }
    }

    if (event.type === "customer.subscription.deleted") {
      const subscription = event.data.object as Stripe.Subscription;
      const customerId = subscription.customer as string;

      const { data } = await supabaseAdmin
        .from("profiles")
        .update({ plan_status: "canceled" })
        .eq("stripe_customer_id", customerId)
        .select("user_id");

      console.log(`[stripe-webhook] Subscription canceled, affected rows: ${data?.length || 0}`);
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error("[stripe-webhook] ERROR:", msg);
    return new Response(JSON.stringify({ error: msg }), {
      headers: { "Content-Type": "application/json" },
      status: 400,
    });
  }
});
