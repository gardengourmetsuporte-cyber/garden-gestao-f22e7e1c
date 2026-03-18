import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Duplicated from knownServices.ts for edge function context
const KNOWN_SERVICES: Record<string, { category: string; type: string; defaultCycle: string; managementUrl: string }> = {
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
  'adobe': { category: 'software', type: 'assinatura', defaultCycle: 'mensal', managementUrl: 'https://account.adobe.com/plans' },
  'canva': { category: 'software', type: 'assinatura', defaultCycle: 'mensal', managementUrl: 'https://www.canva.com/settings/billing' },
  'chatgpt': { category: 'software', type: 'assinatura', defaultCycle: 'mensal', managementUrl: 'https://chat.openai.com/#settings' },
  'microsoft 365': { category: 'software', type: 'assinatura', defaultCycle: 'anual', managementUrl: 'https://account.microsoft.com/services/' },
  'google workspace': { category: 'software', type: 'assinatura', defaultCycle: 'mensal', managementUrl: 'https://admin.google.com/ac/billing' },
  'icloud': { category: 'cloud', type: 'assinatura', defaultCycle: 'mensal', managementUrl: 'https://www.icloud.com/settings/' },
  'google one': { category: 'cloud', type: 'assinatura', defaultCycle: 'mensal', managementUrl: 'https://one.google.com/settings' },
  'ifood': { category: 'alimentacao', type: 'assinatura', defaultCycle: 'mensal', managementUrl: 'https://www.ifood.com.br/minha-conta' },
  'uber pass': { category: 'transporte', type: 'assinatura', defaultCycle: 'mensal', managementUrl: 'https://riders.uber.com/membership' },
  'claro': { category: 'telefonia', type: 'conta_fixa', defaultCycle: 'mensal', managementUrl: 'https://www.claro.com.br/minha-claro' },
  'vivo': { category: 'telefonia', type: 'conta_fixa', defaultCycle: 'mensal', managementUrl: 'https://www.vivo.com.br/para-voce/meu-vivo' },
  'tim': { category: 'telefonia', type: 'conta_fixa', defaultCycle: 'mensal', managementUrl: 'https://www.tim.com.br/meu-tim' },
  'oi': { category: 'telefonia', type: 'conta_fixa', defaultCycle: 'mensal', managementUrl: 'https://www.oi.com.br/minha-oi' },
  'enel': { category: 'energia', type: 'conta_fixa', defaultCycle: 'mensal', managementUrl: 'https://www.enel.com.br' },
  'cpfl': { category: 'energia', type: 'conta_fixa', defaultCycle: 'mensal', managementUrl: 'https://www.cpfl.com.br/agencia-virtual' },
  'light': { category: 'energia', type: 'conta_fixa', defaultCycle: 'mensal', managementUrl: 'https://www.light.com.br/agencia-virtual' },
  'cemig': { category: 'energia', type: 'conta_fixa', defaultCycle: 'mensal', managementUrl: 'https://www.cemig.com.br/atendimento/' },
  'sabesp': { category: 'agua', type: 'conta_fixa', defaultCycle: 'mensal', managementUrl: 'https://www.sabesp.com.br/agencia-virtual' },
  'copasa': { category: 'agua', type: 'conta_fixa', defaultCycle: 'mensal', managementUrl: 'https://www.copasa.com.br/' },
  'unimed': { category: 'seguros', type: 'conta_fixa', defaultCycle: 'mensal', managementUrl: 'https://www.unimed.coop.br/' },
  'amil': { category: 'seguros', type: 'conta_fixa', defaultCycle: 'mensal', managementUrl: 'https://www.amil.com.br/' },
  'smartfit': { category: 'academia', type: 'assinatura', defaultCycle: 'mensal', managementUrl: 'https://www.smartfit.com.br/meu-plano' },
  'smart fit': { category: 'academia', type: 'assinatura', defaultCycle: 'mensal', managementUrl: 'https://www.smartfit.com.br/meu-plano' },
  'gympass': { category: 'academia', type: 'assinatura', defaultCycle: 'mensal', managementUrl: 'https://wellhub.com/' },
  'wellhub': { category: 'academia', type: 'assinatura', defaultCycle: 'mensal', managementUrl: 'https://wellhub.com/' },
};

function matchKnownService(name: string) {
  const normalized = name.toLowerCase().trim();
  for (const [key, service] of Object.entries(KNOWN_SERVICES)) {
    if (normalized.includes(key)) return { matchedName: key, ...service };
  }
  return null;
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

    // Verify user has access to this unit
    const { data: access } = await supabase.rpc("user_has_unit_access", { _user_id: userId, _unit_id: unit_id });
    if (!access) {
      return new Response(JSON.stringify({ error: "Access denied" }), { status: 403, headers: corsHeaders });
    }

    // 1. Get ALL fixed transactions + last 180 days recurring
    const halfYearAgo = new Date();
    halfYearAgo.setDate(halfYearAgo.getDate() - 180);
    const dateStr = halfYearAgo.toISOString().split("T")[0];

    // Fetch fixed transactions (no date limit) + recent transactions
    const [fixedResult, recentResult] = await Promise.all([
      supabase
        .from("finance_transactions")
        .select("id, description, amount, date, type, is_fixed, category_id")
        .eq("unit_id", unit_id)
        .eq("is_fixed", true)
        .in("type", ["expense", "credit_card"])
        .order("date", { ascending: false })
        .limit(500),
      supabase
        .from("finance_transactions")
        .select("id, description, amount, date, type, is_fixed, category_id")
        .eq("unit_id", unit_id)
        .eq("is_fixed", false)
        .in("type", ["expense", "credit_card"])
        .gte("date", dateStr)
        .order("date", { ascending: false })
        .limit(500),
    ]);

    if (fixedResult.error) throw fixedResult.error;
    if (recentResult.error) throw recentResult.error;

    // Merge and deduplicate
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

    // 2. Group by normalized description (ignoring amount differences and month suffixes like "(6/12)")
    const groups: Record<string, { description: string; amount: number; months: Set<string>; isFixed: boolean; count: number; amounts: number[] }> = {};
    
    for (const tx of transactions) {
      if (!tx.description) continue;
      // Normalize: remove parenthetical suffixes like (6/12), (11/12), trim
      const normalized = tx.description.toLowerCase().trim().replace(/\s*\(\d+\/\d+\)\s*$/, '').trim();
      const key = normalized;
      const month = tx.date?.substring(0, 7) || "";
      if (!groups[key]) {
        groups[key] = { description: tx.description.replace(/\s*\(\d+\/\d+\)\s*$/, '').trim(), amount: tx.amount, months: new Set(), isFixed: !!tx.is_fixed, count: 0, amounts: [] };
      }
      groups[key].months.add(month);
      groups[key].count++;
      groups[key].amounts.push(tx.amount);
      if (tx.is_fixed) groups[key].isFixed = true;
    }

    // Calculate average amount for each group
    for (const g of Object.values(groups)) {
      g.amount = Math.round((g.amounts.reduce((a, b) => a + b, 0) / g.amounts.length) * 100) / 100;
    }

    // Filter: is_fixed OR appears in 2+ distinct months
    const candidates = Object.values(groups).filter(g => g.isFixed || g.months.size >= 2);
    
    if (candidates.length === 0) {
      return new Response(JSON.stringify({ suggestions: [] }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // 3. Get existing recurring_subscriptions to filter out
    const { data: existing } = await supabase
      .from("recurring_subscriptions")
      .select("name")
      .eq("unit_id", unit_id);

    const existingNames = new Set((existing || []).map((e: any) => e.name.toLowerCase().trim()));

    // Filter out already registered
    const newCandidates = candidates.filter(c => !existingNames.has(c.description.toLowerCase().trim()));

    if (newCandidates.length === 0) {
      return new Response(JSON.stringify({ suggestions: [] }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // 4. Use AI to classify
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const candidateList = newCandidates.slice(0, 20).map(c => `"${c.description}" - R$ ${c.amount} (${c.months.size} meses, ${c.isFixed ? 'marcado fixo' : 'recorrente'})`).join("\n");

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
            content: "Você é um assistente financeiro que classifica transações recorrentes. Analise as transações e extraia informações estruturadas usando a tool fornecida."
          },
          {
            role: "user",
            content: `Classifique estas transações recorrentes detectadas:\n\n${candidateList}\n\nPara cada uma, identifique o nome do serviço/conta, categoria e tipo.`
          }
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "classify_recurring",
              description: "Classifica transações recorrentes detectadas",
              parameters: {
                type: "object",
                properties: {
                  items: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        original_description: { type: "string", description: "Descrição original da transação" },
                        service_name: { type: "string", description: "Nome limpo do serviço (ex: Netflix, Enel, Aluguel)" },
                        category: { type: "string", enum: ["streaming", "software", "cloud", "alimentacao", "transporte", "telefonia", "internet", "seguros", "energia", "agua", "aluguel", "academia", "outros"] },
                        type: { type: "string", enum: ["assinatura", "conta_fixa"] },
                        billing_cycle: { type: "string", enum: ["mensal", "anual", "semanal"] }
                      },
                      required: ["original_description", "service_name", "category", "type", "billing_cycle"],
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

      // Fallback: return suggestions without AI classification
      const fallbackSuggestions = newCandidates.slice(0, 10).map(c => {
        const known = matchKnownService(c.description);
        return {
          description: c.description,
          name: known ? known.matchedName.charAt(0).toUpperCase() + known.matchedName.slice(1) : c.description,
          price: c.amount,
          category: known?.category || "outros",
          type: known?.type || (c.isFixed ? "conta_fixa" : "assinatura"),
          billing_cycle: known?.defaultCycle || "mensal",
          management_url: known?.managementUrl || "",
          months_detected: c.months.size,
          source: "pattern" as const,
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
        classifiedItems = parsed.items || [];
      }
    } catch (e) {
      console.error("Failed to parse AI response:", e);
    }

    // 5. Build suggestions enriched with known services
    const suggestions = newCandidates.slice(0, 20).map(candidate => {
      const aiMatch = classifiedItems.find((ai: any) => 
        ai.original_description?.toLowerCase().trim() === candidate.description.toLowerCase().trim()
      );
      const known = matchKnownService(candidate.description);

      return {
        description: candidate.description,
        name: known ? known.matchedName.charAt(0).toUpperCase() + known.matchedName.slice(1) : (aiMatch?.service_name || candidate.description),
        price: candidate.amount,
        category: known?.category || aiMatch?.category || "outros",
        type: known?.type || aiMatch?.type || (candidate.isFixed ? "conta_fixa" : "assinatura"),
        billing_cycle: known?.defaultCycle || aiMatch?.billing_cycle || "mensal",
        management_url: known?.managementUrl || "",
        months_detected: candidate.months.size,
        source: known ? "known_service" : (aiMatch ? "ai" : "pattern"),
      };
    });

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
