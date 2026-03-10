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
  const m1 = dateStr.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (m1) return `${m1[3]}-${m1[2].padStart(2, "0")}-${m1[1].padStart(2, "0")}`;
  const m2 = dateStr.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (m2) return dateStr;
  const m3 = dateStr.match(/^(\d{1,2})-(\d{1,2})-(\d{4})$/);
  if (m3) return `${m3[3]}-${m3[2].padStart(2, "0")}-${m3[1].padStart(2, "0")}`;
  return null;
}

function parseAmount(amountStr: string): number {
  let cleaned = amountStr.replace(/[R$\s]/g, "").trim();
  const negative = cleaned.startsWith("-");
  if (negative) cleaned = cleaned.substring(1);
  if (cleaned.includes(",") && cleaned.includes(".")) {
    if (cleaned.lastIndexOf(",") > cleaned.lastIndexOf(".")) {
      cleaned = cleaned.replace(/\./g, "").replace(",", ".");
    } else {
      cleaned = cleaned.replace(/,/g, "");
    }
  } else if (cleaned.includes(",")) {
    cleaned = cleaned.replace(",", ".");
  }
  const val = parseFloat(cleaned);
  return isNaN(val) ? 0 : negative ? -val : val;
}

const INCOME_MAPPINGS: Record<string, { parent: string; sub: string }> = {
  pix: { parent: "vendas balcao", sub: "pix" },
  debito: { parent: "vendas balcao", sub: "debito" },
  credito: { parent: "vendas balcao", sub: "credito" },
  dinheiro: { parent: "vendas balcao", sub: "dinheiro" },
  ifood: { parent: "vendas delivery", sub: "ifood" },
  rappi: { parent: "vendas delivery", sub: "rappi" },
};

// Alias map: normalized CSV name → normalized system category name
// Handles typos, abbreviations, and alternative names from common Brazilian finance apps
const CATEGORY_ALIASES: Record<string, string> = {
  // Pró-labore
  "prolabore": "pro-labore",
  "pro labore": "pro-labore",
  "pro-labore": "pro-labore",
  "retirada socio": "pro-labore",
  "retirada sócio": "pro-labore",
  // Despesas Administrativas (common typo)
  "despesas adiministrativas": "despesas administrativas",
  "desp administrativas": "despesas administrativas",
  "desp. administrativas": "despesas administrativas",
  "despesas adm": "despesas administrativas",
  // Limpeza
  "limpesa": "limpeza",
  "produtos limpesa": "limpeza",
  "produtos limpeza": "limpeza",
  "produtos de limpeza": "limpeza",
  "material limpeza": "limpeza",
  // Embalagem → Embalagens
  "embalagem": "embalagens",
  "embalagen": "embalagens",
  // Matéria-prima
  "materia prima": "materia-prima",
  "matéria prima": "materia-prima",
  // Descartáveis
  "descartaveis": "descartaveis",
  "descartavel": "descartaveis",
  // Seguros
  "seguros": "seguros",
  "seguro": "seguros",
  // Financiamentos
  "emprestimo": "financiamentos",
  "empréstimo": "financiamentos",
  "emprestimo porto": "financiamentos",
  "empréstimo porto": "financiamentos",
  "financiamento": "financiamentos",
  // Tarifa Bancária
  "tarifa banco": "tarifa bancaria",
  "tarifa bancaria": "tarifa bancaria",
  "tarifas bancarias": "tarifa bancaria",
  // Taxa Funcionamento → Laudos e Prefeitura
  "taxa funcionamento": "laudos e prefeitura",
  "taxa prefeitura": "laudos e prefeitura",
  "alvara": "alvara",
  // Combustível
  "combustivel": "combustivel",
  "gasolina": "combustivel",
  // Doces
  "doces": "doces",
  "doce": "doces",
  // Extorno
  "extorno": "extorno",
  // Detetização
  "detetizador": "limpeza",
  "dedetizacao": "limpeza",
  "dedetização": "limpeza",
  // Venda de imobilizado
  "venda imbilizado": "outros",
  "venda imobilizado": "outros",
};

function resolveAlias(name: string): string {
  const n = normalize(name);
  return CATEGORY_ALIASES[n] || n;
}

function fuzzyMatch(needle: string, haystack: string): boolean {
  // Check if one contains the other
  if (haystack.includes(needle) || needle.includes(haystack)) return true;
  // Check Levenshtein-like similarity for short strings
  if (needle.length >= 4 && haystack.length >= 4) {
    const shorter = needle.length < haystack.length ? needle : haystack;
    const longer = needle.length < haystack.length ? haystack : needle;
    if (shorter.length / longer.length > 0.6) {
      let matches = 0;
      for (let i = 0; i < shorter.length; i++) {
        if (longer.includes(shorter[i])) matches++;
      }
      return matches / shorter.length > 0.8;
    }
  }
  return false;
}

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

    // ===== FIX IMPORTED ACTION =====
    if (body.action === "fix_imported") {
      const { unitId } = body;
      if (!unitId) {
        return new Response(JSON.stringify({ error: "Missing unitId" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

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

      // Find unpaid imported transactions
      const { data: unpaidTxns, error: fetchErr } = await admin
        .from("finance_transactions")
        .select("id")
        .eq("unit_id", unitId)
        .eq("is_paid", false)
        .like("notes", "%[Importado]%");

      if (fetchErr) {
        return new Response(JSON.stringify({ error: fetchErr.message }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      if (!unpaidTxns || unpaidTxns.length === 0) {
        return new Response(
          JSON.stringify({ updated: 0, adjustments: [] }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Save current balances
      const { data: accountsBefore } = await admin
        .from("finance_accounts")
        .select("id, name, balance")
        .eq("unit_id", unitId)
        .eq("is_active", true);

      const balancesBefore = new Map<string, number>();
      for (const a of accountsBefore || []) {
        balancesBefore.set(a.id, a.balance);
      }

      // Batch update to is_paid = true
      const ids = unpaidTxns.map((t: any) => t.id);
      const CHUNK = 500;
      for (let i = 0; i < ids.length; i += CHUNK) {
        const batch = ids.slice(i, i + CHUNK);
        const { error: upErr } = await admin
          .from("finance_transactions")
          .update({ is_paid: true })
          .in("id", batch);
        if (upErr) console.error("Update batch error:", upErr);
      }

      // Calculate diffs and create adjustments at 2020-01-01
      const { data: accountsAfter } = await admin
        .from("finance_accounts")
        .select("id, name, balance")
        .eq("unit_id", unitId)
        .eq("is_active", true);

      const adjustments: any[] = [];
      for (const acc of accountsAfter || []) {
        const oldBal = balancesBefore.get(acc.id);
        if (oldBal === undefined) continue;
        const diff = acc.balance - oldBal;
        if (Math.abs(diff) < 0.01) continue;

        const adjType = diff > 0 ? "expense" : "income";
        const adjAmount = Math.abs(diff);

        const { error: adjErr } = await admin
          .from("finance_transactions")
          .insert({
            user_id: user.id,
            unit_id: unitId,
            type: adjType,
            amount: adjAmount,
            description: "[Ajuste de importação retroativo]",
            account_id: acc.id,
            date: "2020-01-01",
            is_paid: true,
            is_fixed: false,
            is_recurring: false,
            notes: `Ajuste automático para manter saldo anterior (${oldBal.toFixed(2)}) após correção de importação`,
            sort_order: 0,
          });

        if (adjErr) {
          console.error("Adjustment error:", adjErr);
        } else {
          adjustments.push({
            accountName: acc.name,
            oldBalance: oldBal,
            newBalance: acc.balance,
            adjustmentAmount: adjAmount,
          });
        }
      }

      return new Response(
        JSON.stringify({ updated: ids.length, adjustments }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ===== NORMAL IMPORT FLOW =====
    const { csvText, unitId, compensateBalance, delimiter: delimiterInput, columnMapping } = body;

    if (!csvText || !unitId) {
      return new Response(
        JSON.stringify({ error: "Missing csvText or unitId" }),
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
      .select("id, name, balance")
      .eq("unit_id", unitId)
      .eq("is_active", true);

    const { data: categories } = await admin
      .from("finance_categories")
      .select("id, name, type, parent_id")
      .eq("unit_id", unitId);

    const accountMap = new Map<string, string>();
    const accountBalancesBefore = new Map<string, number>();
    for (const a of accounts || []) {
      accountMap.set(normalize(a.name), a.id);
      accountBalancesBefore.set(a.id, a.balance);
    }

    const catMap = new Map<string, { id: string; type: string; parent_id: string | null }>();
    for (const c of categories || []) {
      catMap.set(normalize(c.name), { id: c.id, type: c.type, parent_id: c.parent_id });
    }

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
        // Resolve aliases first
        const aliasedCat = resolveAlias(catName);
        const aliasedSubcat = subcatName ? resolveAlias(subcatName) : "";

        // Try subcategory first (aliased), then category (aliased)
        const candidates = [aliasedSubcat, aliasedCat, normSubcat, normCat].filter(Boolean);
        
        for (const candidate of candidates) {
          if (catMap.has(candidate)) {
            categoryId = catMap.get(candidate)!.id;
            break;
          }
        }

        // Fuzzy match if still not found
        if (!categoryId) {
          for (const candidate of candidates) {
            if (!candidate) continue;
            for (const [key, val] of catMap.entries()) {
              if (fuzzyMatch(candidate, key)) {
                categoryId = val.id;
                break;
              }
            }
            if (categoryId) break;
          }
        }

        if (!categoryId && (catName || subcatName)) {
          unmatchedCategories.add(subcatName || catName);
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
        JSON.stringify({ imported: 0, skipped, unmatchedCategories: [...unmatchedCategories], unmatchedAccounts: [...unmatchedAccounts], adjustments: [] }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Batch insert (as is_paid = false, no balance trigger fires)
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

    // Now mark all as paid (trigger will update balances)
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

    // Handle balance compensation
    const adjustments: { accountName: string; oldBalance: number; newBalance: number; adjustmentAmount: number }[] = [];

    if (compensateBalance && accounts) {
      // Fetch updated balances
      const { data: updatedAccounts } = await admin
        .from("finance_accounts")
        .select("id, name, balance")
        .eq("unit_id", unitId)
        .eq("is_active", true);

      for (const acc of updatedAccounts || []) {
        const oldBalance = accountBalancesBefore.get(acc.id);
        if (oldBalance === undefined) continue;
        const diff = acc.balance - oldBalance;
        if (Math.abs(diff) < 0.01) continue;

        // Create adjustment transaction to restore original balance
        // If balance increased (diff > 0), we need an expense to bring it back down
        // If balance decreased (diff < 0), we need an income to bring it back up
        const adjType = diff > 0 ? "expense" : "income";
        const adjAmount = Math.abs(diff);

        const { error: adjError } = await admin
          .from("finance_transactions")
          .insert({
            user_id: user.id,
            unit_id: unitId,
            type: adjType,
            amount: adjAmount,
            description: "[Ajuste de importação]",
            account_id: acc.id,
            date: new Date().toISOString().split("T")[0],
            is_paid: true,
            is_fixed: false,
            is_recurring: false,
            notes: `Ajuste automático para manter saldo anterior (${oldBalance.toFixed(2)}) após importação CSV`,
            sort_order: 0,
          });

        if (adjError) {
          console.error("Adjustment error:", adjError);
        } else {
          adjustments.push({
            accountName: acc.name,
            oldBalance,
            newBalance: acc.balance,
            adjustmentAmount: adjAmount,
          });
        }
      }
    }

    return new Response(
      JSON.stringify({
        imported: insertedIds.length,
        skipped,
        unmatchedCategories: [...unmatchedCategories],
        unmatchedAccounts: [...unmatchedAccounts],
        adjustments,
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
