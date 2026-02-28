import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

function parseDateBR(dateStr: string): string | null {
  if (!dateStr) return null;
  // Format: DD/MM/YYYY, HH:MM:SS or DD/MM/YYYY
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

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Verify user
    const anonClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader! } } }
    );
    const { data: { user }, error: authError } = await anonClient.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: corsHeaders });
    }

    const { csvText, unitId } = await req.json();
    if (!csvText || !unitId) {
      return new Response(JSON.stringify({ error: "Missing csvText or unitId" }), { status: 400, headers: corsHeaders });
    }

    // Parse CSV (semicolon-delimited, quoted fields)
    const lines = csvText.split(/\r?\n/).filter((l: string) => l.trim());
    if (lines.length < 2) {
      return new Response(JSON.stringify({ error: "CSV vazio" }), { status: 400, headers: corsHeaders });
    }

    // Skip header
    const records: any[] = [];
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i];
      // Parse semicolon-separated quoted fields
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

      const phone = fields[1]?.trim() || null;
      const email = fields[2]?.trim() || null;
      const birthday = parseBirthdayBR(fields[3] || '');
      // fields[4] = delivery orders (skip, use total)
      const totalSpent = parseFloat(fields[5]?.replace(',', '.') || '0') || 0;
      const totalOrders = parseInt(fields[6] || '0', 10) || 0;
      // fields[7] = first order (skip)
      const lastOrder = parseDateBR(fields[8] || '');
      const address = fields[9]?.trim() || null;

      records.push({
        unit_id: unitId,
        created_by: user.id,
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

    // Batch insert in chunks of 100
    let inserted = 0;
    for (let i = 0; i < records.length; i += 100) {
      const chunk = records.slice(i, i + 100);
      const { error } = await supabase.from('customers').upsert(chunk, {
        onConflict: 'unit_id,phone',
        ignoreDuplicates: true,
      });
      if (error) {
        console.error(`Chunk error at ${i}:`, error);
        return new Response(JSON.stringify({ error: error.message, inserted }), { status: 500, headers: corsHeaders });
      }
      inserted += chunk.length;
    }

    // Recalculate scores for all imported customers
    await supabase.rpc('recalculate_all_customer_scores', { p_unit_id: unitId });

    return new Response(JSON.stringify({ success: true, inserted }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (err) {
    console.error(err);
    return new Response(JSON.stringify({ error: String(err) }), { status: 500, headers: corsHeaders });
  }
});
