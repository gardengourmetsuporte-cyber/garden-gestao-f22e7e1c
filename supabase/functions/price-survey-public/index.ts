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

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  try {
    const url = new URL(req.url);
    const token = url.searchParams.get("token");

    if (!token) {
      return new Response(JSON.stringify({ error: "Token required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Find the survey supplier by token
    const { data: surveySupplier, error: ssError } = await supabase
      .from("price_survey_suppliers")
      .select(`
        id, survey_id, supplier_id, status, responded_at,
        supplier:suppliers(id, name, phone),
        survey:price_surveys(id, title, unit_id, status, notes, category_ids)
      `)
      .eq("token", token)
      .single();

    if (ssError || !surveySupplier) {
      return new Response(JSON.stringify({ error: "Token inválido" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const unitId = (surveySupplier.survey as any)?.unit_id;
    const supplierId = surveySupplier.supplier_id;
    const categoryIds: string[] = (surveySupplier.survey as any)?.category_ids || [];

    // ========== GET: Return inventory items grouped by category ==========
    if (req.method === "GET") {
      // Get all inventory items for this unit
      let itemsQuery = supabase
        .from("inventory_items")
        .select("id, name, unit_type, unit_price, current_stock, min_stock, category_id")
        .eq("unit_id", unitId)
        .order("name");

      // Filter by selected categories if any were specified
      if (categoryIds.length > 0) {
        itemsQuery = itemsQuery.in("category_id", categoryIds);
      }

      const { data: items, error: itemsError } = await itemsQuery;
      if (itemsError) throw itemsError;

      // Get categories
      const { data: categories } = await supabase
        .from("categories")
        .select("id, name, color")
        .eq("unit_id", unitId)
        .order("sort_order");

      // Get existing responses if already responded
      let existingResponses: any[] = [];
      if (surveySupplier.status === "responded") {
        const { data: responses } = await supabase
          .from("price_survey_responses")
          .select("item_id, unit_price, brand, has_item")
          .eq("survey_supplier_id", surveySupplier.id);
        existingResponses = responses || [];
      }

      // Get supplier's last known prices
      const { data: lastPrices } = await supabase
        .from("supplier_last_prices")
        .select("item_id, unit_price, brand")
        .eq("supplier_id", supplierId);

      return new Response(
        JSON.stringify({
          survey: surveySupplier.survey,
          supplier: surveySupplier.supplier,
          surveySupplierStatus: surveySupplier.status,
          items: items || [],
          categories: categories || [],
          existingResponses,
          lastPrices: lastPrices || [],
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ========== POST: Save supplier responses ==========
    if (req.method === "POST") {
      const body = await req.json();
      const responses: Array<{
        item_id: string;
        unit_price: number;
        brand?: string;
        has_item: boolean;
      }> = body.responses || [];

      if (responses.length === 0) {
        return new Response(JSON.stringify({ error: "Nenhuma resposta enviada" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Delete old responses if re-submitting
      await supabase
        .from("price_survey_responses")
        .delete()
        .eq("survey_supplier_id", surveySupplier.id);

      // Insert new responses
      const responsesToInsert = responses.map((r) => ({
        survey_supplier_id: surveySupplier.id,
        item_id: r.item_id,
        unit_price: r.unit_price || 0,
        brand: r.brand || null,
        has_item: r.has_item,
      }));

      const { error: insertError } = await supabase
        .from("price_survey_responses")
        .insert(responsesToInsert);

      if (insertError) throw insertError;

      // Update survey supplier status
      await supabase
        .from("price_survey_suppliers")
        .update({ status: "responded", responded_at: new Date().toISOString() })
        .eq("id", surveySupplier.id);

      // Upsert supplier_last_prices for items that have prices
      const lastPricesUpsert = responses
        .filter((r) => r.has_item && r.unit_price > 0)
        .map((r) => ({
          supplier_id: supplierId,
          item_id: r.item_id,
          unit_price: r.unit_price,
          brand: r.brand || null,
          unit_id: unitId,
        }));

      if (lastPricesUpsert.length > 0) {
        await supabase
          .from("supplier_last_prices")
          .upsert(lastPricesUpsert, { onConflict: "supplier_id,item_id" });
      }

      // Check if all suppliers responded → auto-complete survey
      const { data: allSuppliers } = await supabase
        .from("price_survey_suppliers")
        .select("status")
        .eq("survey_id", surveySupplier.survey_id);

      const allResponded = allSuppliers?.every((s) => s.status === "responded");
      if (allResponded) {
        await supabase
          .from("price_surveys")
          .update({ status: "completed", updated_at: new Date().toISOString() })
          .eq("id", surveySupplier.survey_id);
      }

      return new Response(
        JSON.stringify({ success: true }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err: any) {
    console.error("price-survey-public error:", err);
    return new Response(
      JSON.stringify({ error: err.message || "Internal error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
