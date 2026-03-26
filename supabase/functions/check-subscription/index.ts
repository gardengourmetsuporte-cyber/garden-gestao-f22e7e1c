import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const PLAN_MAP: Record<string, string> = {
  "prod_U1rIbxkhP47jp9": "pro",
  "prod_U1rJEnm1kEpp6M": "pro",
  "prod_U1rJugSHUT2cLr": "business",
  "prod_U1rJR8yqlreP40": "business",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[check-subscription] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseAdmin = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } }
  );

  try {
    logStep("Function started");

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY is not set");

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ subscribed: false, plan: "free", subscription_end: null }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseAdmin.auth.getUser(token);
    if (userError || !userData?.user) {
      return new Response(JSON.stringify({ subscribed: false, plan: "free", subscription_end: null }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    const userId = userData.user.id;
    const userEmail = userData.user.email;
    if (!userEmail) {
      return new Response(JSON.stringify({ subscribed: false, plan: "free", subscription_end: null }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    logStep("User authenticated", { userId, email: userEmail });

    // Check if user has a manual override (stripe_customer_id is null but plan is not free)
    const { data: currentProfile } = await supabaseAdmin
      .from("profiles")
      .select("plan, plan_status, stripe_customer_id, trial_ends_at")
      .eq("user_id", userId)
      .maybeSingle();

    // ===== TRIAL CHECK =====
    if (currentProfile?.trial_ends_at) {
      const trialEnd = new Date(currentProfile.trial_ends_at);
      const now = new Date();

      if (trialEnd > now) {
        // Trial is still active
        logStep("Active trial found", { trial_ends_at: currentProfile.trial_ends_at });

        // Ensure profile reflects trialing state
        if (currentProfile.plan !== 'business' || currentProfile.plan_status !== 'trialing') {
          await supabaseAdmin.from("profiles").update({
            plan: "business",
            plan_status: "trialing",
          }).eq("user_id", userId);
        }

        return new Response(JSON.stringify({
          subscribed: true,
          plan: "business",
          subscription_end: currentProfile.trial_ends_at,
          trial: true,
          trial_ends_at: currentProfile.trial_ends_at,
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        });
      } else {
        // Trial expired — clear trial and continue to Stripe check
        logStep("Trial expired, reverting to free");
        await supabaseAdmin.from("profiles").update({
          plan: "free",
          plan_status: "expired",
          trial_ends_at: null,
        }).eq("user_id", userId);
        // Update currentProfile locally so downstream logic uses the correct state
        currentProfile.plan = "free";
        currentProfile.plan_status = "expired";
        currentProfile.trial_ends_at = null;
      }
    }

    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });
    const customers = await stripe.customers.list({ email: userEmail, limit: 1 });

    if (customers.data.length === 0) {
      logStep("No Stripe customer found");

      // If user has a manual plan override (no stripe customer but plan is set), respect it
      if (currentProfile && !currentProfile.stripe_customer_id && currentProfile.plan !== 'free') {
        logStep("Manual plan override detected, keeping current plan", { plan: currentProfile.plan });
        return new Response(JSON.stringify({ 
          subscribed: true, 
          plan: currentProfile.plan, 
          subscription_end: null 
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        });
      }

      // Ensure profile reflects free status
      await supabaseAdmin.from("profiles").update({
        plan: "free",
        plan_status: "active",
      }).eq("user_id", userId);

      return new Response(JSON.stringify({ subscribed: false, plan: "free", subscription_end: null }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    const customerId = customers.data[0].id;
    logStep("Found Stripe customer", { customerId });

    const subscriptions = await stripe.subscriptions.list({
      customer: customerId,
      status: "active",
      limit: 1,
    });

    // Also check trialing
    let sub = subscriptions.data[0];
    if (!sub) {
      const trialingSubs = await stripe.subscriptions.list({
        customer: customerId,
        status: "trialing",
        limit: 1,
      });
      sub = trialingSubs.data[0];
    }

    if (!sub) {
      logStep("No active/trialing subscription");

      // If user has a manual plan override, respect it even with a Stripe customer
      if (currentProfile && currentProfile.plan !== 'free' && currentProfile.plan_status === 'active') {
        logStep("Manual plan override detected with Stripe customer, keeping current plan", { plan: currentProfile.plan });
        return new Response(JSON.stringify({ 
          subscribed: true, 
          plan: currentProfile.plan, 
          subscription_end: null 
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        });
      }

      await supabaseAdmin.from("profiles").update({
        plan: "free",
        plan_status: "canceled",
        stripe_customer_id: customerId,
      }).eq("user_id", userId);

      return new Response(JSON.stringify({ subscribed: false, plan: "free", subscription_end: null }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    const subscriptionEnd = new Date(sub.current_period_end * 1000).toISOString();
    const productId = sub.items.data[0]?.price?.product as string;
    const plan = PLAN_MAP[productId] || "pro";
    logStep("Active subscription found", { plan, subscriptionEnd, productId });

    // Sync profile
    await supabaseAdmin.from("profiles").update({
      plan,
      plan_status: sub.status === "trialing" ? "trialing" : "active",
      stripe_customer_id: customerId,
    }).eq("user_id", userId);

    return new Response(JSON.stringify({
      subscribed: true,
      plan,
      subscription_end: subscriptionEnd,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message: errorMessage });
    
    const isAuthError = errorMessage.includes("Authentication error") || 
                        errorMessage.includes("session") ||
                        errorMessage.includes("not authenticated");
    
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: isAuthError ? 401 : 500,
    });
  }
});
