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

    // ========== VERIFY PHONE ==========
    if (req.method === "GET" && action === "verify-phone") {
      const phone = url.searchParams.get("phone");
      if (!phone) {
        return new Response(JSON.stringify({ error: "Phone required" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const normalizedInput = normalizePhone(phone);

      // Find the quotation_supplier by token
      const { data: qs, error: qsError } = await supabase
        .from("quotation_suppliers")
        .select("id, supplier:suppliers(id, name, phone)")
        .eq("token", token)
        .single();

      if (qsError || !qs) {
        return new Response(JSON.stringify({ error: "Invalid token" }), {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const supplierPhone = normalizePhone((qs as any).supplier?.phone);

      if (!supplierPhone || normalizedInput !== supplierPhone) {
        return new Response(
          JSON.stringify({ error: "Telefone não corresponde ao cadastro", valid: false }),
          {
            status: 403,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      return new Response(
        JSON.stringify({
          valid: true,
          supplier_id: (qs as any).supplier?.id,
          supplier_name: (qs as any).supplier?.name,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ========== GET: return quotation data ==========
    if (req.method === "GET") {
      const { data: qs, error: qsError } = await supabase
        .from("quotation_suppliers")
        .select(`
          id, status, notes, quotation_id,
          supplier:suppliers(id, name, phone, portal_token),
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

      const supplierId = (qs as any).supplier?.id;

      // Get items for this quotation
      const { data: items } = await supabase
        .from("quotation_items")
        .select(`id, quantity, item:inventory_items(id, name, unit_type)`)
        .eq("quotation_id", qs.quotation_id);

      // Get existing prices from this supplier for this quotation
      const { data: prices } = await supabase
        .from("quotation_prices")
        .select("*")
        .eq("quotation_supplier_id", qs.id);

      // Get last prices for this supplier across all quotations
      let lastPrices: any[] = [];
      if (supplierId && items && items.length > 0) {
        const itemIds = items.map((i: any) => i.item?.id).filter(Boolean);
        if (itemIds.length > 0) {
          const { data: lp } = await supabase
            .from("supplier_last_prices")
            .select("*")
            .eq("supplier_id", supplierId)
            .in("item_id", itemIds);
          lastPrices = lp || [];
        }
      }

      // If contested, find which items this supplier lost
      let contestedItemIds: string[] = [];
      if (qs.status === "contested") {
        const { data: allPrices } = await supabase
          .from("quotation_prices")
          .select("quotation_item_id, quotation_supplier_id, unit_price")
          .in("quotation_item_id", (items || []).map((i: any) => i.id));

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

      // Check if supplier has a phone (needs login)
      const hasPhone = !!(qs as any).supplier?.phone;

      return new Response(
        JSON.stringify({
          quotation_supplier_id: qs.id,
          supplier_id: supplierId,
          supplier_name: (qs as any).supplier?.name,
          supplier_has_phone: hasPhone,
          quotation_title: (qs as any).quotation?.title,
          quotation_status: (qs as any).quotation?.status,
          deadline: (qs as any).quotation?.deadline,
          unit_name: (qs as any).quotation?.unit?.name,
          supplier_status: qs.status,
          items: items || [],
          existing_prices: prices || [],
          contested_item_ids: contestedItemIds,
          last_prices: lastPrices,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ========== POST: submit prices ==========
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
        .select("id, quotation_id, status, supplier:suppliers(id)")
        .eq("token", token)
        .eq("id", quotation_supplier_id)
        .single();

      if (!qs) {
        return new Response(JSON.stringify({ error: "Unauthorized" }), {
          status: 403,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const supplierId = (qs as any).supplier?.id;

      // Determine round
      const { data: maxRound } = await supabase
        .from("quotation_prices")
        .select("round")
        .eq("quotation_supplier_id", qs.id)
        .order("round", { ascending: false })
        .limit(1);

      const nextRound = maxRound && maxRound.length > 0 ? maxRound[0].round + 1 : 1;

      // Get item mapping (quotation_item_id -> inventory_item_id)
      const { data: qItems } = await supabase
        .from("quotation_items")
        .select("id, item:inventory_items(id)")
        .eq("quotation_id", qs.quotation_id);

      const qItemToInventory: Record<string, string> = {};
      (qItems || []).forEach((qi: any) => {
        if (qi.item?.id) qItemToInventory[qi.id] = qi.item.id;
      });

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

        // Upsert supplier_last_prices
        if (supplierId) {
          const lastPricesUpsert = pricesToInsert
            .filter((p: any) => qItemToInventory[p.quotation_item_id])
            .map((p: any) => ({
              supplier_id: supplierId,
              item_id: qItemToInventory[p.quotation_item_id],
              unit_price: p.unit_price,
              brand: p.brand,
              last_quoted_at: new Date().toISOString(),
            }));

          if (lastPricesUpsert.length > 0) {
            await supabase
              .from("supplier_last_prices")
              .upsert(lastPricesUpsert, { onConflict: "supplier_id,item_id" });
          }
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

      // Check if all suppliers responded
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
