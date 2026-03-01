import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

function parseDateBR(dateStr: string): string | null {
  if (!dateStr) return null;
  const match = dateStr.match(/(\d{2})\/(\d{2})\/(\d{4})(?:,?\s*(\d{2}):(\d{2}):(\d{2}))?/);
  if (!match) return null;
  const [, dd, mm, yyyy, hh, mi, ss] = match;
  return `${yyyy}-${mm}-${dd}T${hh || '00'}:${mi || '00'}:${ss || '00'}`;
}

function parseBirthdayBR(dateStr: string): string | null {
  if (!dateStr) return null;
  const match = dateStr.match(/(\d{2})\/(\d{2})\/(\d{4})/);
  if (!match) return null;
  const [, dd, mm, yyyy] = match;
  return `${yyyy}-${mm}-${dd}`;
}

function normalizePhone(raw: string | null): string | null {
  if (!raw) return null;
  let digits = raw.replace(/\D/g, '');
  if (digits.length === 0) return null;
  if (digits.startsWith('55') && digits.length >= 12) digits = digits.slice(2);
  if (digits.startsWith('0') && digits.length >= 11) digits = digits.slice(1);
  if (digits.length < 10) return null;
  if (digits.length > 11) digits = digits.slice(0, 11);
  return '55' + digits;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: corsHeaders });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Verify user via getClaims (faster than getUser)
    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await supabase.auth.getClaims(token);
    if (claimsError || !claimsData?.claims?.sub) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: corsHeaders });
    }

    const userId = claimsData.claims.sub as string;

    const { csvText, unitId } = await req.json();
    if (!csvText || !unitId) {
      return new Response(JSON.stringify({ error: "Missing csvText or unitId" }), { status: 400, headers: corsHeaders });
    }

    // Parse CSV (semicolon-delimited, quoted fields)
    const lines = csvText.split(/\r?\n/).filter((l: string) => l.trim());
    if (lines.length < 2) {
      return new Response(JSON.stringify({ error: "CSV vazio" }), { status: 400, headers: corsHeaders });
    }

    // Fetch ALL existing phones for this unit (paginated to bypass 1000 limit)
    const existingPhones = new Set<string>();
    let from = 0;
    const pageSize = 1000;
    while (true) {
      const { data: page } = await supabase
        .from('customers')
        .select('phone')
        .eq('unit_id', unitId)
        .not('phone', 'is', null)
        .range(from, from + pageSize - 1);
      if (!page || page.length === 0) break;
      for (const c of page) {
        if (c.phone) existingPhones.add(c.phone);
      }
      if (page.length < pageSize) break;
      from += pageSize;
    }

    // Skip header and parse records
    const records: any[] = [];
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i];
      const fields: string[] = [];
      let current = '';
      let inQuotes = false;
      for (let j = 0; j < line.length; j++) {
        const ch = line[j];
        if (ch === '"') {
          inQuotes = !inQuotes;
        } else if (ch === ';' && !inQuotes) {
          fields.push(current.trim());
          current = '';
        } else {
          current += ch;
        }
      }
      fields.push(current.trim());

      const name = fields[0]?.trim();
      if (!name) continue;

      const phone = normalizePhone(fields[1]?.trim() || null);
      const email = fields[2]?.trim() || null;
      const birthday = parseBirthdayBR(fields[3] || '');
      const totalSpent = parseFloat(fields[5]?.replace(',', '.') || '0') || 0;
      const totalOrders = parseInt(fields[6] || '0', 10) || 0;
      const lastOrder = parseDateBR(fields[8] || '');
      const address = fields[9]?.trim() || null;

      // Skip duplicates by phone
      if (phone && existingPhones.has(phone)) continue;
      // Track within batch too
      if (phone) existingPhones.add(phone);

      records.push({
        unit_id: unitId,
        created_by: userId,
        name,
        phone,
        email,
        birthday,
        total_spent: totalSpent,
        total_orders: totalOrders,
        last_purchase_at: lastOrder,
        origin: 'csv',
        notes: address,
      });
    }

    // Batch insert in chunks of 100, fallback to individual on conflict
    let inserted = 0;
    for (let i = 0; i < records.length; i += 100) {
      const chunk = records.slice(i, i + 100);
      const { error } = await supabase.from('customers').insert(chunk);
      if (error) {
        if (error.code === '23505') {
          // Duplicate in chunk — insert one by one, skipping conflicts
          console.warn(`Chunk ${i} had duplicates, inserting individually`);
          for (const record of chunk) {
            const { error: singleErr } = await supabase.from('customers').insert(record);
            if (singleErr) {
              if (singleErr.code === '23505') continue; // skip duplicate
              console.error('Single insert error:', singleErr);
            } else {
              inserted++;
            }
          }
        } else {
          console.error(`Chunk error at ${i}:`, error);
          return new Response(JSON.stringify({ error: error.message, inserted }), { status: 500, headers: corsHeaders });
        }
      } else {
        inserted += chunk.length;
      }
    }

    // Recalculate scores for all imported customers
    if (inserted > 0) {
      await supabase.rpc('recalculate_all_customer_scores', { p_unit_id: unitId });
    }

    return new Response(JSON.stringify({ success: true, inserted }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (err) {
    console.error(err);
    return new Response(JSON.stringify({ error: String(err) }), { status: 500, headers: corsHeaders });
  }
});
