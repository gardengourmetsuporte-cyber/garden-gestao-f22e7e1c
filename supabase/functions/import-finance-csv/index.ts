import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

function normalize(str: string): string {
  return str
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      inQuotes = !inQuotes;
    } else if (ch === ";" && !inQuotes) {
      result.push(current.trim());
      current = "";
    } else {
      current += ch;
    }
  }
  result.push(current.trim());
  return result;
}

function parseDate(dateStr: string): string | null {
  // DD/MM/YYYY → YYYY-MM-DD
  const m = dateStr.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (!m) return null;
  return `${m[3]}-${m[2]}-${m[1]}`;
}

function parseAmount(amountStr: string): number {
  // Remove R$, spaces, handle negative with "-" prefix
  let cleaned = amountStr.replace(/[R$\s]/g, "").trim();
  const negative = cleaned.startsWith("-");
  if (negative) cleaned = cleaned.substring(1);
  // Brazilian format: 1.234,56 → 1234.56
  cleaned = cleaned.replace(/\./g, "").replace(",", ".");
  const val = parseFloat(cleaned);
  return isNaN(val) ? 0 : negative ? -val : val;
}

// Mobills income category mappings
const INCOME_MAPPINGS: Record<string, { parent: string; sub: string }> = {
  pix: { parent: "vendas balcao", sub: "pix" },
  debito: { parent: "vendas balcao", sub: "debito" },
  credito: { parent: "vendas balcao", sub: "credito" },
  dinheiro: { parent: "vendas balcao", sub: "dinheiro" },
  ifood: { parent: "vendas delivery", sub: "ifood" },
  rappi: { parent: "vendas delivery", sub: "rappi" },
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

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

    // Auth client to validate user
    const authClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const {
      data: { user },
      error: authError,
    } = await authClient.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Service client for privileged operations
    const admin = createClient(supabaseUrl, serviceKey);

    const { csvText, unitId, mode } = await req.json();
    if (!csvText || !unitId || !["historical", "full_migration"].includes(mode)) {
      return new Response(
        JSON.stringify({ error: "Missing csvText, unitId, or invalid mode" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Verify unit access
    const { data: hasAccess } = await admin.rpc("user_has_unit_access", {
      _user_id: user.id,
      _unit_id: unitId,
    });
    if (!hasAccess) {
      return new Response(JSON.stringify({ error: "No unit access" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fetch accounts and categories for matching
    const { data: accounts } = await admin
      .from("finance_accounts")
      .select("id, name")
      .eq("unit_id", unitId)
      .eq("is_active", true);

    const { data: categories } = await admin
      .from("finance_categories")
      .select("id, name, type, parent_id")
      .eq("unit_id", unitId);

    const accountMap = new Map<string, string>();
    for (const a of accounts || []) {
      accountMap.set(normalize(a.name), a.id);
    }

    // Build category lookup: normalized name → id (parent + children)
    const catMap = new Map<string, { id: string; type: string; parent_id: string | null }>();
    for (const c of categories || []) {
      catMap.set(normalize(c.name), { id: c.id, type: c.type, parent_id: c.parent_id });
    }

    // Parse CSV lines
    const lines = csvText.split(/\r?\n/).filter((l: string) => l.trim());
    if (lines.length < 2) {
      return new Response(JSON.stringify({ error: "CSV vazio ou inválido" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Detect headers
    const headers = parseCSVLine(lines[0]).map((h: string) => normalize(h));
    const idxDate = headers.findIndex((h: string) => h === "data");
    const idxDesc = headers.findIndex((h: string) => h === "descricao" || h === "descrição");
    const idxCat = headers.findIndex((h: string) => h === "categoria");
    const idxSubcat = headers.findIndex((h: string) => h === "subcategoria");
    const idxAccount = headers.findIndex((h: string) => h === "conta");
    const idxAmount = headers.findIndex((h: string) => h === "valor");

    if (idxDate === -1 || idxAmount === -1) {
      return new Response(
        JSON.stringify({ error: "CSV deve ter colunas 'Data' e 'Valor'" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const unmatchedCategories = new Set<string>();
    const unmatchedAccounts = new Set<string>();
    const toInsert: any[] = [];
    let skipped = 0;

    for (let i = 1; i < lines.length; i++) {
      const cols = parseCSVLine(lines[i]);
      if (cols.length < 2) {
        skipped++;
        continue;
      }

      const dateStr = cols[idxDate] || "";
      const parsedDate = parseDate(dateStr);
      if (!parsedDate) {
        skipped++;
        continue;
      }

      const rawAmount = parseAmount(cols[idxAmount] || "0");
      if (rawAmount === 0) {
        skipped++;
        continue;
      }

      const description = cols[idxDesc] || "";
      const catName = cols[idxCat] || "";
      const subcatName = cols[idxSubcat] || "";
      const accountName = cols[idxAccount] || "";

      const isIncome = rawAmount > 0;
      const amount = Math.abs(rawAmount);
      const type = isIncome ? "income" : "expense";

      // Match account
      let accountId: string | null = null;
      const normAccount = normalize(accountName);
      if (accountMap.has(normAccount)) {
        accountId = accountMap.get(normAccount)!;
      } else if (accountName) {
        unmatchedAccounts.add(accountName);
      }

      // Match category
      let categoryId: string | null = null;
      const normCat = normalize(catName);
      const normSubcat = normalize(subcatName);

      if (isIncome) {
        // Try income-specific mappings first
        const incomeKey = normSubcat || normCat;
        const mapping = INCOME_MAPPINGS[incomeKey];
        if (mapping) {
          // Find subcategory by name under matching parent
          const parentEntry = catMap.get(normalize(mapping.parent));
          if (parentEntry) {
            const subEntry = catMap.get(normalize(mapping.sub));
            if (subEntry && subEntry.parent_id === parentEntry.id) {
              categoryId = subEntry.id;
            } else {
              categoryId = parentEntry.id;
            }
          }
        }
      }

      if (!categoryId) {
        // Try subcategory first, then parent category
        if (normSubcat && catMap.has(normSubcat)) {
          categoryId = catMap.get(normSubcat)!.id;
        } else if (normCat && catMap.has(normCat)) {
          categoryId = catMap.get(normCat)!.id;
        } else {
          // Fuzzy: try contains match
          for (const [key, val] of catMap.entries()) {
            if (normSubcat && key.includes(normSubcat)) {
              categoryId = val.id;
              break;
            }
            if (normCat && key.includes(normCat)) {
              categoryId = val.id;
              break;
            }
          }
          if (!categoryId && (catName || subcatName)) {
            unmatchedCategories.add(subcatName || catName);
          }
        }
      }

      toInsert.push({
        user_id: user.id,
        unit_id: unitId,
        type,
        amount,
        description,
        category_id: categoryId,
        account_id: accountId,
        date: parsedDate,
        is_paid: false, // Always insert as false first
        is_fixed: false,
        is_recurring: false,
        notes: `[Importado do Mobills] ${catName}${subcatName ? " > " + subcatName : ""}`,
        sort_order: i,
      });
    }

    if (toInsert.length === 0) {
      return new Response(
        JSON.stringify({ imported: 0, skipped, unmatchedCategories: [], unmatchedAccounts: [] }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Batch insert (chunks of 500)
    const CHUNK = 500;
    const insertedIds: string[] = [];
    for (let i = 0; i < toInsert.length; i += CHUNK) {
      const chunk = toInsert.slice(i, i + CHUNK);
      const { data, error } = await admin
        .from("finance_transactions")
        .insert(chunk)
        .select("id");
      if (error) {
        console.error("Insert error:", error);
        return new Response(
          JSON.stringify({ error: `Erro ao inserir lote: ${error.message}` }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (data) insertedIds.push(...data.map((d: any) => d.id));
    }

    // If full_migration mode, update all inserted to is_paid = true
    // The trigger will handle balance adjustments incrementally
    if (mode === "full_migration" && insertedIds.length > 0) {
      // Update in chunks
      for (let i = 0; i < insertedIds.length; i += CHUNK) {
        const ids = insertedIds.slice(i, i + CHUNK);
        const { error } = await admin
          .from("finance_transactions")
          .update({ is_paid: true })
          .in("id", ids);
        if (error) {
          console.error("Update is_paid error:", error);
        }
      }

      // Final forced recalculation to ensure consistency
      // Reset all account balances for this unit, then recalculate
      await admin.rpc("recalculate_unit_balances" as any, { p_unit_id: unitId }).catch(() => {
        // If the RPC doesn't exist, do manual recalculation via individual queries
        console.log("recalculate_unit_balances RPC not found, skipping forced recalc");
      });
    }

    return new Response(
      JSON.stringify({
        imported: insertedIds.length,
        skipped,
        unmatchedCategories: [...unmatchedCategories],
        unmatchedAccounts: [...unmatchedAccounts],
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("Unexpected error:", err);
    return new Response(
      JSON.stringify({ error: err.message || "Internal error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
