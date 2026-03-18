import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const KNOWN_SERVICES: Record<string, { category: string; type: string; defaultCycle: string; managementUrl: string }> = {
  // Streaming
  'netflix': { category: 'streaming', type: 'assinatura', defaultCycle: 'mensal', managementUrl: 'https://www.netflix.com/YourAccount' },
  'spotify': { category: 'streaming', type: 'assinatura', defaultCycle: 'mensal', managementUrl: 'https://www.spotify.com/account/overview/' },
  'disney+': { category: 'streaming', type: 'assinatura', defaultCycle: 'mensal', managementUrl: 'https://www.disneyplus.com/account' },
  'disney plus': { category: 'streaming', type: 'assinatura', defaultCycle: 'mensal', managementUrl: 'https://www.disneyplus.com/account' },
  'amazon prime': { category: 'streaming', type: 'assinatura', defaultCycle: 'mensal', managementUrl: 'https://www.amazon.com.br/gp/primecentral' },
  'hbo max': { category: 'streaming', type: 'assinatura', defaultCycle: 'mensal', managementUrl: 'https://play.max.com/settings/subscription' },
  'apple tv': { category: 'streaming', type: 'assinatura', defaultCycle: 'mensal', managementUrl: 'https://tv.apple.com/settings' },
  'youtube premium': { category: 'streaming', type: 'assinatura', defaultCycle: 'mensal', managementUrl: 'https://www.youtube.com/paid_memberships' },
  'globoplay': { category: 'streaming', type: 'assinatura', defaultCycle: 'mensal', managementUrl: 'https://globoplay.globo.com/minha-conta/' },
  'paramount+': { category: 'streaming', type: 'assinatura', defaultCycle: 'mensal', managementUrl: 'https://www.paramountplus.com/account/' },
  'crunchyroll': { category: 'streaming', type: 'assinatura', defaultCycle: 'mensal', managementUrl: 'https://www.crunchyroll.com/account' },
  'deezer': { category: 'streaming', type: 'assinatura', defaultCycle: 'mensal', managementUrl: 'https://www.deezer.com/account/subscription' },
  'apple music': { category: 'streaming', type: 'assinatura', defaultCycle: 'mensal', managementUrl: 'https://music.apple.com/account' },
  // Software / SaaS
  'adobe': { category: 'software', type: 'assinatura', defaultCycle: 'mensal', managementUrl: 'https://account.adobe.com/plans' },
  'canva': { category: 'software', type: 'assinatura', defaultCycle: 'mensal', managementUrl: 'https://www.canva.com/settings/billing' },
  'chatgpt': { category: 'software', type: 'assinatura', defaultCycle: 'mensal', managementUrl: 'https://chat.openai.com/#settings' },
  'microsoft 365': { category: 'software', type: 'assinatura', defaultCycle: 'anual', managementUrl: 'https://account.microsoft.com/services/' },
  'google workspace': { category: 'software', type: 'assinatura', defaultCycle: 'mensal', managementUrl: 'https://admin.google.com/ac/billing' },
  // Cloud
  'icloud': { category: 'cloud', type: 'assinatura', defaultCycle: 'mensal', managementUrl: 'https://www.icloud.com/settings/' },
  'google one': { category: 'cloud', type: 'assinatura', defaultCycle: 'mensal', managementUrl: 'https://one.google.com/settings' },
  // Restaurant / Food SaaS
  'colibri': { category: 'software', type: 'assinatura', defaultCycle: 'mensal', managementUrl: '' },
  'goomer': { category: 'software', type: 'assinatura', defaultCycle: 'mensal', managementUrl: 'https://www.goomer.com.br/' },
  'saipos': { category: 'software', type: 'assinatura', defaultCycle: 'mensal', managementUrl: 'https://www.saipos.com/' },
  'consumer': { category: 'software', type: 'assinatura', defaultCycle: 'mensal', managementUrl: '' },
  'linx': { category: 'software', type: 'assinatura', defaultCycle: 'mensal', managementUrl: '' },
  'stone': { category: 'software', type: 'assinatura', defaultCycle: 'mensal', managementUrl: 'https://conta.stone.com.br/' },
  'cielo': { category: 'software', type: 'assinatura', defaultCycle: 'mensal', managementUrl: 'https://www.cielo.com.br/' },
  'rede': { category: 'software', type: 'assinatura', defaultCycle: 'mensal', managementUrl: '' },
  'pagseguro': { category: 'software', type: 'assinatura', defaultCycle: 'mensal', managementUrl: 'https://pagseguro.uol.com.br/' },
  'getnet': { category: 'software', type: 'assinatura', defaultCycle: 'mensal', managementUrl: '' },
  'rappi': { category: 'alimentacao', type: 'assinatura', defaultCycle: 'mensal', managementUrl: 'https://www.rappi.com.br/' },
  'aiqfome': { category: 'alimentacao', type: 'assinatura', defaultCycle: 'mensal', managementUrl: '' },
  'contabilizei': { category: 'software', type: 'assinatura', defaultCycle: 'mensal', managementUrl: 'https://www.contabilizei.com.br/' },
  'omie': { category: 'software', type: 'assinatura', defaultCycle: 'mensal', managementUrl: 'https://app.omie.com.br/' },
  'bling': { category: 'software', type: 'assinatura', defaultCycle: 'mensal', managementUrl: 'https://www.bling.com.br/' },
  'totvs': { category: 'software', type: 'assinatura', defaultCycle: 'mensal', managementUrl: '' },
  'simples delivery': { category: 'software', type: 'assinatura', defaultCycle: 'mensal', managementUrl: '' },
  'anota ai': { category: 'software', type: 'assinatura', defaultCycle: 'mensal', managementUrl: '' },
  'anotaai': { category: 'software', type: 'assinatura', defaultCycle: 'mensal', managementUrl: '' },
  'delivery much': { category: 'software', type: 'assinatura', defaultCycle: 'mensal', managementUrl: '' },
  'cardapio web': { category: 'software', type: 'assinatura', defaultCycle: 'mensal', managementUrl: '' },
  'menu control': { category: 'software', type: 'assinatura', defaultCycle: 'mensal', managementUrl: '' },
  // Delivery / Food
  'ifood': { category: 'alimentacao', type: 'assinatura', defaultCycle: 'mensal', managementUrl: 'https://www.ifood.com.br/minha-conta' },
  'uber pass': { category: 'transporte', type: 'assinatura', defaultCycle: 'mensal', managementUrl: 'https://riders.uber.com/membership' },
  'uber eats': { category: 'alimentacao', type: 'assinatura', defaultCycle: 'mensal', managementUrl: '' },
  // Telecoms
  'claro': { category: 'telefonia', type: 'conta_fixa', defaultCycle: 'mensal', managementUrl: 'https://www.claro.com.br/minha-claro' },
  'vivo': { category: 'telefonia', type: 'conta_fixa', defaultCycle: 'mensal', managementUrl: 'https://www.vivo.com.br/para-voce/meu-vivo' },
  'tim': { category: 'telefonia', type: 'conta_fixa', defaultCycle: 'mensal', managementUrl: 'https://www.tim.com.br/meu-tim' },
  'oi': { category: 'telefonia', type: 'conta_fixa', defaultCycle: 'mensal', managementUrl: 'https://www.oi.com.br/minha-oi' },
  // Energy
  'enel': { category: 'energia', type: 'conta_fixa', defaultCycle: 'mensal', managementUrl: 'https://www.enel.com.br' },
  'cpfl': { category: 'energia', type: 'conta_fixa', defaultCycle: 'mensal', managementUrl: 'https://www.cpfl.com.br/agencia-virtual' },
  'light': { category: 'energia', type: 'conta_fixa', defaultCycle: 'mensal', managementUrl: 'https://www.light.com.br/agencia-virtual' },
  'cemig': { category: 'energia', type: 'conta_fixa', defaultCycle: 'mensal', managementUrl: 'https://www.cemig.com.br/atendimento/' },
  'elektro': { category: 'energia', type: 'conta_fixa', defaultCycle: 'mensal', managementUrl: '' },
  'energisa': { category: 'energia', type: 'conta_fixa', defaultCycle: 'mensal', managementUrl: '' },
  'equatorial': { category: 'energia', type: 'conta_fixa', defaultCycle: 'mensal', managementUrl: '' },
  // Water
  'sabesp': { category: 'agua', type: 'conta_fixa', defaultCycle: 'mensal', managementUrl: 'https://www.sabesp.com.br/agencia-virtual' },
  'copasa': { category: 'agua', type: 'conta_fixa', defaultCycle: 'mensal', managementUrl: 'https://www.copasa.com.br/' },
  'cedae': { category: 'agua', type: 'conta_fixa', defaultCycle: 'mensal', managementUrl: 'https://www.cedae.com.br/' },
  // Insurance / Health
  'unimed': { category: 'seguros', type: 'conta_fixa', defaultCycle: 'mensal', managementUrl: 'https://www.unimed.coop.br/' },
  'amil': { category: 'seguros', type: 'conta_fixa', defaultCycle: 'mensal', managementUrl: 'https://www.amil.com.br/' },
  'porto seguro': { category: 'seguros', type: 'conta_fixa', defaultCycle: 'mensal', managementUrl: 'https://www.portoseguro.com.br/' },
  'sulamerica': { category: 'seguros', type: 'conta_fixa', defaultCycle: 'mensal', managementUrl: '' },
  'bradesco saude': { category: 'seguros', type: 'conta_fixa', defaultCycle: 'mensal', managementUrl: '' },
  // Gym
  'smartfit': { category: 'academia', type: 'assinatura', defaultCycle: 'mensal', managementUrl: 'https://www.smartfit.com.br/meu-plano' },
  'smart fit': { category: 'academia', type: 'assinatura', defaultCycle: 'mensal', managementUrl: 'https://www.smartfit.com.br/meu-plano' },
  'gympass': { category: 'academia', type: 'assinatura', defaultCycle: 'mensal', managementUrl: 'https://wellhub.com/' },
  'wellhub': { category: 'academia', type: 'assinatura', defaultCycle: 'mensal', managementUrl: 'https://wellhub.com/' },
  // Gas
  'comgas': { category: 'energia', type: 'conta_fixa', defaultCycle: 'mensal', managementUrl: '' },
  'ultragaz': { category: 'energia', type: 'conta_fixa', defaultCycle: 'mensal', managementUrl: '' },
};

function matchKnownService(name: string) {
  const normalized = name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
  for (const [key, service] of Object.entries(KNOWN_SERVICES)) {
    if (normalized.includes(key)) return { matchedName: key, ...service };
  }
  return null;
}

function normalizeDescription(desc: string): string {
  return desc
    .toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/\s*\(?\d+\s*[\/de]+\s*\d+\)?\s*$/i, '') // (6/12), 6/12, 6 de 12
    .replace(/\s*-\s*parc(?:ela)?\s*\d+.*$/i, '') // - parcela 3
    .replace(/\s*#\d+\s*$/i, '') // trailing #123
    .replace(/\s+/g, ' ')
    .trim();
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: corsHeaders });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: corsHeaders });
    }
    const userId = user.id;

    const { unit_id } = await req.json();
    if (!unit_id) {
      return new Response(JSON.stringify({ error: "unit_id required" }), { status: 400, headers: corsHeaders });
    }

    const { data: access } = await supabase.rpc("user_has_unit_access", { _user_id: userId, _unit_id: unit_id });
    if (!access) {
      return new Response(JSON.stringify({ error: "Access denied" }), { status: 403, headers: corsHeaders });
    }

    // 1. Fetch transactions - expanded to 365 days, include supplier_id and employee_id
    const oneYearAgo = new Date();
    oneYearAgo.setDate(oneYearAgo.getDate() - 365);
    const dateStr = oneYearAgo.toISOString().split("T")[0];

    const [fixedResult, recentResult] = await Promise.all([
      supabase
        .from("finance_transactions")
        .select("id, description, amount, date, type, is_fixed, category_id, supplier_id, employee_id")
        .eq("unit_id", unit_id)
        .eq("is_fixed", true)
        .in("type", ["expense", "credit_card"])
        .is("deleted_at", null)
        .order("date", { ascending: false })
        .limit(500),
      supabase
        .from("finance_transactions")
        .select("id, description, amount, date, type, is_fixed, category_id, supplier_id, employee_id")
        .eq("unit_id", unit_id)
        .eq("is_fixed", false)
        .in("type", ["expense", "credit_card"])
        .is("deleted_at", null)
        .gte("date", dateStr)
        .order("date", { ascending: false })
        .limit(1000),
    ]);

    if (fixedResult.error) throw fixedResult.error;
    if (recentResult.error) throw recentResult.error;

    const seenIds = new Set<string>();
    const transactions: typeof fixedResult.data = [];
    for (const tx of [...(fixedResult.data || []), ...(recentResult.data || [])]) {
      if (!seenIds.has(tx.id)) {
        seenIds.add(tx.id);
        transactions.push(tx);
      }
    }

    if (transactions.length === 0) {
      return new Response(JSON.stringify({ suggestions: [] }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // 2. Group by normalized description with supplier/employee tracking
    interface GroupData {
      description: string;
      amount: number;
      months: Set<string>;
      isFixed: boolean;
      count: number;
      amounts: number[];
      hasSupplier: boolean;
      hasEmployee: boolean;
      monthCounts: Record<string, number>; // count per month to detect high-frequency operational
    }

    const groups: Record<string, GroupData> = {};

    for (const tx of transactions) {
      if (!tx.description) continue;
      const normalized = normalizeDescription(tx.description);
      if (!normalized || normalized.length < 2) continue;

      const key = normalized;
      const month = tx.date?.substring(0, 7) || "";

      if (!groups[key]) {
        groups[key] = {
          description: tx.description.replace(/\s*\(?\d+\s*[\/de]+\s*\d+\)?\s*$/i, '').replace(/\s*-\s*parc(?:ela)?\s*\d+.*$/i, '').trim(),
          amount: tx.amount,
          months: new Set(),
          isFixed: !!tx.is_fixed,
          count: 0,
          amounts: [],
          hasSupplier: false,
          hasEmployee: false,
          monthCounts: {},
        };
      }
      groups[key].months.add(month);
      groups[key].count++;
      groups[key].amounts.push(tx.amount);
      if (tx.is_fixed) groups[key].isFixed = true;
      if (tx.supplier_id) groups[key].hasSupplier = true;
      if (tx.employee_id) groups[key].hasEmployee = true;
      groups[key].monthCounts[month] = (groups[key].monthCounts[month] || 0) + 1;
    }

    // Calculate average amount
    for (const g of Object.values(groups)) {
      g.amount = Math.round((g.amounts.reduce((a, b) => a + b, 0) / g.amounts.length) * 100) / 100;
    }

    // 3. Smart filtering - remove noise BEFORE AI
    const candidates = Object.entries(groups).filter(([key, g]) => {
      const isKnown = !!matchKnownService(key);

      // Always keep known services
      if (isKnown) return true;

      // EXCLUDE: has supplier_id (fornecedor) - NOT a subscription/fixed bill
      if (g.hasSupplier) return false;

      // EXCLUDE: has employee_id (funcionário) - salary/payment, not subscription
      if (g.hasEmployee) return false;

      // EXCLUDE: high frequency in same month (>2 times in any month = operational expense)
      const maxInMonth = Math.max(...Object.values(g.monthCounts));
      if (maxInMonth > 2) return false;

      // EXCLUDE: very short descriptions that are likely generic
      if (key.length < 3) return false;

      // EXCLUDE: descriptions matching operational patterns
      const operationalPatterns = [
        /^taxa\s/i,
        /\btaxa\s.*%/i,
        /^tarifa\s/i,
        /^juros\s/i,
        /^multa\s/i,
        /^compra\s/i,
        /^pagamento\s/i,
        /^pix\s/i,
        /^ted\s/i,
        /^doc\s/i,
        /^saque\s/i,
        /^deposito\s/i,
        /^transferencia\s/i,
        /^reembolso\s/i,
        /^estorno\s/i,
        /^sangria\s/i,
        /^suprimento\s/i,
        /^troco\s/i,
        /^vale\s/i,
        /^adiantamento\s/i,
        /^bonificacao\s/i,
        /^comissao\s/i,
        /^frete\s/i,
        /^entrega\s/i,
      ];
      if (operationalPatterns.some(p => p.test(key))) return false;

      // Must be fixed OR appear in 2+ distinct months
      return g.isFixed || g.months.size >= 2;
    }).map(([_, g]) => g);

    if (candidates.length === 0) {
      return new Response(JSON.stringify({ suggestions: [] }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // 4. Get existing subscriptions to filter out
    const { data: existing } = await supabase
      .from("recurring_subscriptions")
      .select("name")
      .eq("unit_id", unit_id);

    const existingNames = new Set((existing || []).map((e: any) => e.name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim()));

    const newCandidates = candidates.filter(c => {
      const norm = c.description.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
      return !existingNames.has(norm);
    });

    if (newCandidates.length === 0) {
      return new Response(JSON.stringify({ suggestions: [] }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // 5. Rank: known services first, then fixed, then by months
    const rankedCandidates = [...newCandidates].sort((a, b) => {
      const aKnown = matchKnownService(a.description) ? 1 : 0;
      const bKnown = matchKnownService(b.description) ? 1 : 0;
      if (aKnown !== bKnown) return bKnown - aKnown;
      if (a.isFixed !== b.isFixed) return Number(b.isFixed) - Number(a.isFixed);
      if (a.months.size !== b.months.size) return b.months.size - a.months.size;
      return b.amount - a.amount;
    });

    // 6. AI classification with improved prompt
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const top = rankedCandidates.slice(0, 20);
    const candidateList = top.map(c => 
      `"${c.description}" - R$ ${c.amount} (${c.months.size} meses, ${c.isFixed ? 'marcado fixo' : 'recorrente'})`
    ).join("\n");

    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          {
            role: "system",
            content: `Você é um assistente financeiro especializado em restaurantes e food service.
Sua tarefa é classificar transações recorrentes como ASSINATURAS ou CONTAS FIXAS reais.

REGRAS IMPORTANTES:
1. Assinaturas: serviços de software, streaming, plataformas digitais (ex: Netflix, Goomer, Colibri, iFood, Stone, Cielo).
2. Contas fixas: utilidades como energia, água, telefone, internet, aluguel, condomínio, seguros, plano de saúde.
3. NUNCA classifique como assinatura ou conta fixa:
   - Compras de fornecedores (matéria-prima, ingredientes, embalagens)
   - Pagamentos de funcionários (salários, adiantamentos, vale-transporte)
   - Gastos operacionais variáveis (manutenção eventual, compras avulsas)
   - Taxas bancárias ou tarifas genéricas
4. Se não tiver certeza se é uma assinatura/conta fixa real, NÃO inclua no resultado.
5. Use o nome comercial limpo do serviço (ex: "Goomer" em vez de "goomer mensalidade").`
          },
          {
            role: "user",
            content: `Classifique APENAS as que são assinaturas ou contas fixas reais:\n\n${candidateList}\n\nRetorne SOMENTE itens que são claramente assinaturas de serviços ou contas fixas. Exclua qualquer coisa que pareça fornecedor, funcionário ou gasto operacional.`
          }
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "classify_recurring",
              description: "Classifica transações recorrentes detectadas. Retorne APENAS itens que são claramente assinaturas ou contas fixas.",
              parameters: {
                type: "object",
                properties: {
                  items: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        original_description: { type: "string", description: "Descrição original da transação" },
                        service_name: { type: "string", description: "Nome limpo do serviço (ex: Netflix, Enel, Goomer)" },
                        category: { type: "string", enum: ["streaming", "software", "cloud", "alimentacao", "transporte", "telefonia", "internet", "seguros", "energia", "agua", "aluguel", "academia", "outros"] },
                        type: { type: "string", enum: ["assinatura", "conta_fixa"] },
                        billing_cycle: { type: "string", enum: ["mensal", "anual", "semanal"] },
                        is_real_service: { type: "boolean", description: "true APENAS se for uma assinatura/conta fixa real, false se for fornecedor/funcionário/operacional" }
                      },
                      required: ["original_description", "service_name", "category", "type", "billing_cycle", "is_real_service"],
                      additionalProperties: false
                    }
                  }
                },
                required: ["items"],
                additionalProperties: false
              }
            }
          }
        ],
        tool_choice: { type: "function", function: { name: "classify_recurring" } }
      }),
    });

    if (!aiResponse.ok) {
      const errText = await aiResponse.text();
      console.error("AI error:", aiResponse.status, errText);

      if (aiResponse.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded, try again later" }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
      if (aiResponse.status === 402) {
        return new Response(JSON.stringify({ error: "Payment required" }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }

      // Fallback: only return known services
      const fallbackSuggestions = newCandidates
        .filter(c => matchKnownService(c.description))
        .slice(0, 10)
        .map(c => {
          const known = matchKnownService(c.description)!;
          return {
            description: c.description,
            name: known.matchedName.charAt(0).toUpperCase() + known.matchedName.slice(1),
            price: c.amount,
            category: known.category,
            type: known.type,
            billing_cycle: known.defaultCycle,
            management_url: known.managementUrl,
            months_detected: c.months.size,
            source: "known_service" as const,
          };
        });
      return new Response(JSON.stringify({ suggestions: fallbackSuggestions }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const aiData = await aiResponse.json();
    let classifiedItems: any[] = [];

    try {
      const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
      if (toolCall?.function?.arguments) {
        const parsed = JSON.parse(toolCall.function.arguments);
        classifiedItems = (parsed.items || []).filter((item: any) => item.is_real_service !== false);
      }
    } catch (e) {
      console.error("Failed to parse AI response:", e);
    }

    // 7. Build final suggestions - only include items validated by AI or known services
    const aiDescriptions = new Set(classifiedItems.map((ai: any) => normalizeDescription(ai.original_description || '')));

    const suggestions = rankedCandidates.slice(0, 30).map(candidate => {
      const normDesc = normalizeDescription(candidate.description);
      const known = matchKnownService(candidate.description);
      const aiMatch = classifiedItems.find((ai: any) =>
        normalizeDescription(ai.original_description || '') === normDesc
      );

      // Only include if known service OR AI validated it
      if (!known && !aiMatch) return null;

      return {
        description: candidate.description,
        name: known
          ? known.matchedName.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
          : (aiMatch?.service_name || candidate.description),
        price: candidate.amount,
        category: known?.category || aiMatch?.category || "outros",
        type: known?.type || aiMatch?.type || (candidate.isFixed ? "conta_fixa" : "assinatura"),
        billing_cycle: known?.defaultCycle || aiMatch?.billing_cycle || "mensal",
        management_url: known?.managementUrl || "",
        months_detected: candidate.months.size,
        source: known ? "known_service" : "ai",
      };
    }).filter(Boolean);

    return new Response(JSON.stringify({ suggestions }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("detect-recurring error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
