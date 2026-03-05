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
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Validate user from JWT
    const anonClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );
    const { data: { user }, error: userErr } = await anonClient.auth.getUser();
    if (userErr || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Validate unit access
    const { unit_id, records } = await req.json();
    if (!unit_id || !records || !Array.isArray(records)) {
      return new Response(JSON.stringify({ error: "Missing unit_id or records" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: membership } = await supabase
      .from("user_units")
      .select("role")
      .eq("user_id", user.id)
      .eq("unit_id", unit_id)
      .maybeSingle();

    const hasUnitAdminRole = !!membership && ["owner", "admin"].includes(membership.role);

    const { data: userRoles } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id);

    const hasGlobalAdminRole = (userRoles || []).some((r: any) => ["admin", "super_admin"].includes(r.role));

    if (!membership || (!hasUnitAdminRole && !hasGlobalAdminRole)) {
      return new Response(JSON.stringify({ error: "Forbidden" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get all employees for name matching
    const { data: employees } = await supabase
      .from("employees")
      .select("user_id, full_name")
      .eq("unit_id", unit_id)
      .eq("is_active", true);

    const { data: profiles } = await supabase
      .from("profiles")
      .select("user_id, full_name")
      .in(
        "user_id",
        (employees || []).map((e: any) => e.user_id).filter(Boolean)
      );

    // Build name → user_id map with robust normalization (lowercase + no accents)
    const normalizeName = (value: string) =>
      value
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .replace(/[^a-z\s]/g, " ")
        .replace(/\s+/g, " ")
        .trim();

    const nameMap = new Map<string, string>();
    const allNames: Array<{ normalized: string; userId: string }> = [];

    const registerName = (rawName: string | null | undefined, userId: string | null | undefined) => {
      if (!rawName || !userId) return;
      const normalized = normalizeName(rawName);
      if (!normalized) return;
      nameMap.set(normalized, userId);
      allNames.push({ normalized, userId });
    };

    (employees || []).forEach((e: any) => registerName(e.full_name, e.user_id));
    (profiles || []).forEach((p: any) => registerName(p.full_name, p.user_id));

    const findBestUserId = (employeeName: string) => {
      const normalized = normalizeName(employeeName);
      if (!normalized) return null;

      // 1) exact
      const exact = nameMap.get(normalized);
      if (exact) return exact;

      // 2) contains
      for (const { normalized: candidate, userId } of allNames) {
        if (candidate.includes(normalized) || normalized.includes(candidate)) {
          return userId;
        }
      }

      // 3) token overlap (handles abbreviations like "lucilene p souza")
      const queryTokens = normalized.split(" ").filter(Boolean);
      let bestScore = 0;
      let bestUserId: string | null = null;

      for (const { normalized: candidate, userId } of allNames) {
        const candidateTokens = candidate.split(" ").filter(Boolean);
        let score = 0;

        for (const q of queryTokens) {
          if (candidateTokens.includes(q)) {
            score += 2;
            continue;
          }

          // Match initials ("p" -> "pereira")
          if (q.length === 1 && candidateTokens.some((t) => t.startsWith(q))) {
            score += 1;
            continue;
          }

          // Prefix match for partial names
          if (q.length >= 3 && candidateTokens.some((t) => t.startsWith(q) || q.startsWith(t))) {
            score += 1;
          }
        }

        if (score > bestScore) {
          bestScore = score;
          bestUserId = userId;
        }
      }

      return bestScore >= Math.max(2, queryTokens.length) ? bestUserId : null;
    };

    // Process records
    let imported = 0;
    let skipped = 0;
    const errors: string[] = [];

    for (const rec of records) {
      const { employee_name, date, check_in, check_out, status, notes } = rec;

      // Find user_id by name
      let userId = rec.user_id;
      if (!userId && employee_name) {
        userId = findBestUserId(employee_name);
      }

      if (!userId) {
        skipped++;
        errors.push(`Funcionário não encontrado: ${employee_name}`);
        continue;
      }

      // Map status
      let dbStatus = "manual";
      if (status === "FOLGA") dbStatus = "day_off";
      else if (status === "FALTA") dbStatus = "absent";
      else if (status === "ATESTADO") dbStatus = "day_off";
      else if (check_in && check_out) dbStatus = "completed";
      else if (check_in) dbStatus = "checked_in";

      const row: any = {
        user_id: userId,
        unit_id,
        date,
        expected_start: rec.expected_start || "08:00",
        expected_end: rec.expected_end || "17:00",
        check_in: check_in || null,
        check_out: check_out || null,
        status: dbStatus,
        manual_entry: true,
        adjusted_by: user.id,
        notes:
          status === "ATESTADO"
            ? "Atestado médico"
            : status === "FOLGA"
            ? "Folga"
            : status === "FALTA"
            ? "Falta"
            : notes || null,
        late_minutes: 0,
        early_departure_minutes: 0,
        points_awarded: 0,
      };

      const { error: upsertErr } = await supabase
        .from("time_records")
        .upsert(row, { onConflict: "user_id,date,unit_id" });

      if (upsertErr) {
        skipped++;
        errors.push(`Erro ${date} ${employee_name}: ${upsertErr.message}`);
      } else {
        imported++;
      }
    }

    return new Response(
      JSON.stringify({ imported, skipped, errors }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: (err as Error).message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
