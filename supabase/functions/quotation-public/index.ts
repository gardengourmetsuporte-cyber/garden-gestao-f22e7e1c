import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
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

    // GET: return quotation data for supplier
    if (req.method === "GET") {
      // Find the quotation_supplier by token
      const { data: qs, error: qsError } = await supabase
        .from("quotation_suppliers")
        .select(`
          id, status, notes, quotation_id,
          supplier:suppliers(id, name),
          quotation:quotations(id, title, status, deadline, notes, unit_id,
            unit:units(name)
          )
        `)
        .eq("token", token)
        .single();

      if (qsError || !qs) {
        return new Response(JSON.stringify({ error: "Invalid token" }), {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Get items for this quotation
      const { data: items } = await supabase
        .from("quotation_items")
        .select(`
          id, quantity,
          item:inventory_items(id, name, unit_type)
        `)
        .eq("quotation_id", qs.quotation_id);

      // Get existing prices from this supplier for this quotation
      const { data: prices } = await supabase
        .from("quotation_prices")
        .select("*")
        .eq("quotation_supplier_id", qs.id);

      // If contested, find which items this supplier lost
      let contestedItemIds: string[] = [];
      if (qs.status === "contested") {
        const { data: allPrices } = await supabase
          .from("quotation_prices")
          .select("quotation_item_id, quotation_supplier_id, unit_price")
          .in("quotation_item_id", (items || []).map((i: any) => i.id));

        // For each item, check if this supplier has a higher price than another
        const itemPriceMap: Record<string, { suppId: string; price: number }[]> = {};
        (allPrices || []).forEach((p: any) => {
          if (!itemPriceMap[p.quotation_item_id]) itemPriceMap[p.quotation_item_id] = [];
          itemPriceMap[p.quotation_item_id].push({ suppId: p.quotation_supplier_id, price: p.unit_price });
        });

        for (const [itemId, priceList] of Object.entries(itemPriceMap)) {
          const myPrice = priceList.find((p) => p.suppId === qs.id);
          const otherPrices = priceList.filter((p) => p.suppId !== qs.id);
          if (myPrice && otherPrices.some((p) => p.price < myPrice.price)) {
            contestedItemIds.push(itemId);
          }
        }
      }

      return new Response(
        JSON.stringify({
          quotation_supplier_id: qs.id,
          supplier_name: (qs as any).supplier?.name,
          quotation_title: (qs as any).quotation?.title,
          quotation_status: (qs as any).quotation?.status,
          deadline: (qs as any).quotation?.deadline,
          unit_name: (qs as any).quotation?.unit?.name,
          supplier_status: qs.status,
          items: items || [],
          existing_prices: prices || [],
          contested_item_ids: contestedItemIds,
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // POST: submit prices
    if (req.method === "POST") {
      const body = await req.json();
      const { quotation_supplier_id, prices, general_notes } = body;

      if (!quotation_supplier_id || !prices || !Array.isArray(prices)) {
        return new Response(JSON.stringify({ error: "Invalid data" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Verify token matches the supplier
      const { data: qs } = await supabase
        .from("quotation_suppliers")
        .select("id, quotation_id, status")
        .eq("token", token)
        .eq("id", quotation_supplier_id)
        .single();

      if (!qs) {
        return new Response(JSON.stringify({ error: "Unauthorized" }), {
          status: 403,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Determine round
      const { data: maxRound } = await supabase
        .from("quotation_prices")
        .select("round")
        .eq("quotation_supplier_id", qs.id)
        .order("round", { ascending: false })
        .limit(1);

      const nextRound = maxRound && maxRound.length > 0 ? maxRound[0].round + 1 : 1;

      // Insert prices
      const pricesToInsert = prices
        .filter((p: any) => p.unit_price > 0)
        .map((p: any) => ({
          quotation_item_id: p.quotation_item_id,
          quotation_supplier_id: qs.id,
          unit_price: p.unit_price,
          brand: p.brand || null,
          notes: p.notes || null,
          round: nextRound,
        }));

      if (pricesToInsert.length > 0) {
        const { error: insertError } = await supabase
          .from("quotation_prices")
          .insert(pricesToInsert);

        if (insertError) {
          return new Response(JSON.stringify({ error: insertError.message }), {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
      }

      // Update supplier status
      await supabase
        .from("quotation_suppliers")
        .update({
          status: "responded",
          responded_at: new Date().toISOString(),
          notes: general_notes || null,
        })
        .eq("id", qs.id);

      // Check if all suppliers responded, update quotation status
      const { data: allSuppliers } = await supabase
        .from("quotation_suppliers")
        .select("status")
        .eq("quotation_id", qs.quotation_id);

      const allResponded = allSuppliers?.every((s: any) => s.status === "responded");
      if (allResponded) {
        await supabase
          .from("quotations")
          .update({ status: "comparing" })
          .eq("id", qs.quotation_id);
      }

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
