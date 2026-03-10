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

function splitCSVLine(line: string, delimiter: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      inQuotes = !inQuotes;
    } else if (ch === delimiter && !inQuotes) {
      result.push(current.trim().replace(/^"|"$/g, ""));
      current = "";
    } else {
      current += ch;
    }
  }
  result.push(current.trim().replace(/^"|"$/g, ""));
  return result;
}

function parseDate(dateStr: string): string | null {
  // DD/MM/YYYY
  const m1 = dateStr.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (m1) return `${m1[3]}-${m1[2].padStart(2, "0")}-${m1[1].padStart(2, "0")}`;
  // YYYY-MM-DD (already ISO)
  const m2 = dateStr.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (m2) return dateStr;
  // DD-MM-YYYY
  const m3 = dateStr.match(/^(\d{1,2})-(\d{1,2})-(\d{4})$/);
  if (m3) return `${m3[3]}-${m3[2].padStart(2, "0")}-${m3[1].padStart(2, "0")}`;
  return null;
}

function parseAmount(amountStr: string): number {
  let cleaned = amountStr.replace(/[R$\s]/g, "").trim();
  const negative = cleaned.startsWith("-");
  if (negative) cleaned = cleaned.substring(1);
  // Detect format: if has both . and , → Brazilian (1.234,56)
  if (cleaned.includes(",") && cleaned.includes(".")) {
    if (cleaned.lastIndexOf(",") > cleaned.lastIndexOf(".")) {
      // Brazilian: 1.234,56
      cleaned = cleaned.replace(/\./g, "").replace(",", ".");
    } else {
      // US: 1,234.56
      cleaned = cleaned.replace(/,/g, "");
    }
  } else if (cleaned.includes(",")) {
    // Could be decimal comma: 1234,56
    cleaned = cleaned.replace(",", ".");
  }
  const val = parseFloat(cleaned);
  return isNaN(val) ? 0 : negative ? -val : val;
}

// Smart income category mappings (Mobills and common PT-BR patterns)
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

    const authClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user }, error: authError } = await authClient.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const admin = createClient(supabaseUrl, serviceKey);

    const body = await req.json();
    const { csvText, unitId, mode, delimiter: delimiterInput, columnMapping } = body;

    if (!csvText || !unitId || !["historical", "full_migration"].includes(mode)) {
      return new Response(
        JSON.stringify({ error: "Missing csvText, unitId, or invalid mode" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!columnMapping || columnMapping.date < 0 || columnMapping.amount < 0) {
      return new Response(
        JSON.stringify({ error: "Mapeamento de colunas obrigatórias (Data e Valor) ausente" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const delimiter = delimiterInput || ";";

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

    // Fetch accounts and categories
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

    const catMap = new Map<string, { id: string; type: string; parent_id: string | null }>();
    for (const c of categories || []) {
      catMap.set(normalize(c.name), { id: c.id, type: c.type, parent_id: c.parent_id });
    }

    // Column indices from client mapping
    const idxDate = columnMapping.date ?? -1;
    const idxDesc = columnMapping.description ?? -1;
    const idxCat = columnMapping.category ?? -1;
    const idxSubcat = columnMapping.subcategory ?? -1;
    const idxAccount = columnMapping.account ?? -1;
    const idxAmount = columnMapping.amount ?? -1;

    const lines = csvText.split(/\r?\n/).filter((l: string) => l.trim());
    if (lines.length < 2) {
      return new Response(JSON.stringify({ error: "CSV vazio ou inválido" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const unmatchedCategories = new Set<string>();
    const unmatchedAccounts = new Set<string>();
    const toInsert: any[] = [];
    let skipped = 0;

    // Skip header (line 0)
    for (let i = 1; i < lines.length; i++) {
      const cols = splitCSVLine(lines[i], delimiter);
      if (cols.length < 2) { skipped++; continue; }

      const dateStr = (idxDate >= 0 ? cols[idxDate] : "") || "";
      const parsedDate = parseDate(dateStr.trim());
      if (!parsedDate) { skipped++; continue; }

      const rawAmount = parseAmount((idxAmount >= 0 ? cols[idxAmount] : "0") || "0");
      if (rawAmount === 0) { skipped++; continue; }

      const description = (idxDesc >= 0 ? cols[idxDesc] : "") || "";
      const catName = (idxCat >= 0 ? cols[idxCat] : "") || "";
      const subcatName = (idxSubcat >= 0 ? cols[idxSubcat] : "") || "";
      const accountName = (idxAccount >= 0 ? cols[idxAccount] : "") || "";

      const isIncome = rawAmount > 0;
      const amount = Math.abs(rawAmount);
      const type = isIncome ? "income" : "expense";

      // Match account
      let accountId: string | null = null;
      const normAccount = normalize(accountName);
      if (normAccount && accountMap.has(normAccount)) {
        accountId = accountMap.get(normAccount)!;
      } else if (accountName) {
        // Fuzzy: partial match
        for (const [key, id] of accountMap.entries()) {
          if (key.includes(normAccount) || normAccount.includes(key)) {
            accountId = id;
            break;
          }
        }
        if (!accountId) unmatchedAccounts.add(accountName);
      }

      // Match category
      let categoryId: string | null = null;
      const normCat = normalize(catName);
      const normSubcat = normalize(subcatName);

      // Try smart income mappings
      if (isIncome) {
        const incomeKey = normSubcat || normCat;
        const mapping = INCOME_MAPPINGS[incomeKey];
        if (mapping) {
          const parentEntry = catMap.get(normalize(mapping.parent));
          if (parentEntry) {
            const subEntry = catMap.get(normalize(mapping.sub));
            categoryId = subEntry && subEntry.parent_id === parentEntry.id
              ? subEntry.id
              : parentEntry.id;
          }
        }
      }

      if (!categoryId) {
        if (normSubcat && catMap.has(normSubcat)) {
          categoryId = catMap.get(normSubcat)!.id;
        } else if (normCat && catMap.has(normCat)) {
          categoryId = catMap.get(normCat)!.id;
        } else {
          // Fuzzy contains
          for (const [key, val] of catMap.entries()) {
            if ((normSubcat && key.includes(normSubcat)) || (normCat && key.includes(normCat))) {
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
        description: description.substring(0, 500),
        category_id: categoryId,
        account_id: accountId,
        date: parsedDate,
        is_paid: false,
        is_fixed: false,
        is_recurring: false,
        notes: `[Importado] ${catName}${subcatName ? " > " + subcatName : ""}`.substring(0, 500),
        sort_order: i,
      });
    }

    if (toInsert.length === 0) {
      return new Response(
        JSON.stringify({ imported: 0, skipped, unmatchedCategories: [...unmatchedCategories], unmatchedAccounts: [...unmatchedAccounts] }),
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

    // Full migration: mark as paid (trigger handles balances)
    if (mode === "full_migration" && insertedIds.length > 0) {
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
