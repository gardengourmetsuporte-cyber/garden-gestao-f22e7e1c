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

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } =
      await supabase.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userId = claimsData.claims.sub as string;

    const { csvText, unitId } = await req.json();
    if (!csvText || !unitId) {
      return new Response(
        JSON.stringify({ error: "csvText and unitId required" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // ── IDOR Protection: validate unitId belongs to authenticated user ──
    const adminCheck = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );
    const { data: unitAccess } = await adminCheck
      .from("user_units")
      .select("unit_id")
      .eq("user_id", userId)
      .eq("unit_id", unitId)
      .maybeSingle();
    if (!unitAccess) {
      return new Response(
        JSON.stringify({ error: "Acesso negado a esta unidade." }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Use service role for upserts
    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Parse CSV - flexible delimiter (comma or semicolon)
    const lines = csvText
      .split("\n")
      .map((l: string) => l.trim())
      .filter((l: string) => l.length > 0);
    if (lines.length < 2) {
      return new Response(JSON.stringify({ error: "CSV vazio" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const delimiter = lines[0].includes(";") ? ";" : ",";
    const headers = lines[0]
      .split(delimiter)
      .map((h: string) => h.replace(/"/g, "").trim().toLowerCase());

    // Find column indices - flexible naming
    const nameIdx = headers.findIndex(
      (h: string) => h === "nome" || h === "name" || h === "cliente"
    );
    const phoneIdx = headers.findIndex(
      (h: string) => h === "telefone" || h === "phone" || h === "tel" || h === "celular"
    );
    const valueIdx = headers.findIndex(
      (h: string) => h === "valor" || h === "value" || h === "total" || h === "amount"
    );
    const dateIdx = headers.findIndex(
      (h: string) => h === "data" || h === "date"
    );

    if (nameIdx === -1 && phoneIdx === -1) {
      return new Response(
        JSON.stringify({
          error:
            "CSV precisa ter coluna 'nome' ou 'telefone' para identificar clientes",
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Phone normalization helper (same logic as frontend normalizePhone)
    function normalizePhoneBackend(raw: string | null): string | null {
      if (!raw) return null;
      let digits = raw.replace(/\D/g, "");
      if (digits.length === 0) return null;
      if (digits.startsWith("55") && digits.length >= 12) digits = digits.slice(2);
      if (digits.startsWith("0") && digits.length >= 11) digits = digits.slice(1);
      if (digits.length < 10) return null;
      if (digits.length > 11) digits = digits.slice(0, 11);
      return "55" + digits;
    }

    let updated = 0;
    let created = 0;
    let errors = 0;

    for (let i = 1; i < lines.length; i++) {
      try {
        const cols = lines[i]
          .split(delimiter)
          .map((c: string) => c.replace(/"/g, "").trim());

        const name = nameIdx >= 0 ? cols[nameIdx] : null;
        const rawPhone = phoneIdx >= 0 ? cols[phoneIdx] : null;
        const phone = normalizePhoneBackend(rawPhone);
        const value = valueIdx >= 0 ? parseFloat(cols[valueIdx]?.replace(",", ".") || "0") : 0;
        const dateStr = dateIdx >= 0 ? cols[dateIdx] : null;

        if (!name && !phone) continue;

        // Try to find existing customer by phone first, then by name
        let existingCustomer = null;
        if (phone) {
          const { data } = await admin
            .from("customers")
            .select("id, total_spent, total_orders")
            .eq("unit_id", unitId)
            .eq("phone", phone)
            .maybeSingle();
          existingCustomer = data;
        }
        if (!existingCustomer && name) {
          const { data } = await admin
            .from("customers")
            .select("id, total_spent, total_orders")
            .eq("unit_id", unitId)
            .ilike("name", name)
            .maybeSingle();
          existingCustomer = data;
        }

        if (existingCustomer) {
          // Update existing
          const updateData: Record<string, unknown> = {
            total_spent: (existingCustomer.total_spent || 0) + value,
            total_orders: (existingCustomer.total_orders || 0) + 1,
            updated_at: new Date().toISOString(),
          };
          if (dateStr) {
            // Parse date in DD/MM/YYYY or YYYY-MM-DD format
            let parsedDate = dateStr;
            if (dateStr.includes("/")) {
              const parts = dateStr.split("/");
              if (parts.length === 3) {
                parsedDate = `${parts[2]}-${parts[1].padStart(2, "0")}-${parts[0].padStart(2, "0")}`;
              }
            }
            updateData.last_purchase_at = parsedDate;
          } else {
            updateData.last_purchase_at = new Date().toISOString();
          }

          await admin
            .from("customers")
            .update(updateData)
            .eq("id", existingCustomer.id);
          updated++;
        } else {
          // Create new customer
          const insertData: Record<string, unknown> = {
            unit_id: unitId,
            name: name || `Cliente ${phone}`,
            phone: phone || null,
            origin: "pdv",
            total_spent: value,
            total_orders: value > 0 ? 1 : 0,
            last_purchase_at: new Date().toISOString(),
            score: 0,
            segment: "new",
            loyalty_points: 0,
          };
          if (dateStr) {
            let parsedDate = dateStr;
            if (dateStr.includes("/")) {
              const parts = dateStr.split("/");
              if (parts.length === 3) {
                parsedDate = `${parts[2]}-${parts[1].padStart(2, "0")}-${parts[0].padStart(2, "0")}`;
              }
            }
            insertData.last_purchase_at = parsedDate;
          }

          await admin.from("customers").insert(insertData);
          created++;
        }
      } catch (e) {
        console.error(`Row ${i} error:`, e);
        errors++;
      }
    }

    return new Response(
      JSON.stringify({ updated, created, errors, total: lines.length - 1 }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (err) {
    console.error("import-daily-sales error:", err);
    return new Response(
      JSON.stringify({ error: err.message || "Internal error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
