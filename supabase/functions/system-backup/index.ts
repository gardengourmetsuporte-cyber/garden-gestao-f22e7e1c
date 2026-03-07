import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const BACKUP_TABLES = [
  "checklist_sectors",
  "checklist_subcategories",
  "checklist_items",
  "categories",
  "inventory_items",
  "employees",
  "employee_schedules",
  "customers",
  "finance_accounts",
  "finance_categories",
  "finance_transactions",
  "finance_tags",
  "finance_budgets",
  "credit_card_invoices",
  "suppliers",
  "supplier_price_history",
  "recipes",
  "recipe_ingredients",
  "brand_identity",
  "brand_assets",
  "brand_references",
  "access_levels",
  "rewards",
  "payment_method_settings",
  "loyalty_rules",
];

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("Missing authorization");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    // User client for auth
    const userClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user }, error: authError } = await userClient.auth.getUser();
    if (authError || !user) throw new Error("Unauthorized");

    // Service client for data operations
    const adminClient = createClient(supabaseUrl, serviceKey);

    const { action, unit_id, backup_id, backup_name } = await req.json();

    if (!unit_id) throw new Error("unit_id required");

    // Verify user has access to this unit
    const { data: hasAccess } = await adminClient.rpc("user_has_unit_access", {
      _user_id: user.id,
      _unit_id: unit_id,
    });
    if (!hasAccess) throw new Error("Access denied");

    if (action === "create") {
      // Collect all data from tables for this unit
      const backupData: Record<string, any[]> = {};
      let totalRecords = 0;
      const tablesIncluded: string[] = [];

      for (const table of BACKUP_TABLES) {
        let query = adminClient.from(table).select("*");

        // Different tables use different filters
        if (["finance_accounts", "finance_categories", "finance_transactions", "finance_tags", "finance_budgets", "credit_card_invoices"].includes(table)) {
          // Finance tables may use user_id + unit_id
          query = query.eq("unit_id", unit_id);
        } else if (["employee_schedules"].includes(table)) {
          // Join through employees
          const { data: empIds } = await adminClient
            .from("employees")
            .select("id")
            .eq("unit_id", unit_id);
          const ids = (empIds || []).map((e: any) => e.id);
          if (ids.length === 0) continue;
          query = adminClient.from(table).select("*").in("employee_id", ids);
        } else if (["supplier_price_history"].includes(table)) {
          query = query.eq("unit_id", unit_id);
        } else if (["recipe_ingredients"].includes(table)) {
          const { data: recipeIds } = await adminClient
            .from("recipes")
            .select("id")
            .eq("unit_id", unit_id);
          const ids = (recipeIds || []).map((r: any) => r.id);
          if (ids.length === 0) continue;
          query = adminClient.from(table).select("*").in("recipe_id", ids);
        } else {
          // Most tables have unit_id
          query = query.eq("unit_id", unit_id);
        }

        const { data, error } = await query;
        if (error) {
          console.error(`Error fetching ${table}:`, error.message);
          continue;
        }

        if (data && data.length > 0) {
          backupData[table] = data;
          totalRecords += data.length;
          tablesIncluded.push(table);
        }
      }

      // Save backup
      const { data: backup, error: insertError } = await adminClient
        .from("system_backups")
        .insert({
          user_id: user.id,
          unit_id,
          name: backup_name || `Backup ${new Date().toLocaleDateString("pt-BR")} ${new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}`,
          backup_data: backupData,
          tables_included: tablesIncluded,
          total_records: totalRecords,
        })
        .select()
        .single();

      if (insertError) throw insertError;

      return new Response(JSON.stringify({ success: true, backup }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "restore") {
      if (!backup_id) throw new Error("backup_id required");

      const { data: backup, error: fetchError } = await adminClient
        .from("system_backups")
        .select("*")
        .eq("id", backup_id)
        .single();

      if (fetchError || !backup) throw new Error("Backup not found");

      const data = backup.backup_data as Record<string, any[]>;

      // First, create an auto-backup of current state
      const currentBackupData: Record<string, any[]> = {};
      let currentTotal = 0;
      const currentTables: string[] = [];

      for (const table of BACKUP_TABLES) {
        let query = adminClient.from(table).select("*");
        if (["employee_schedules"].includes(table)) {
          const { data: empIds } = await adminClient.from("employees").select("id").eq("unit_id", unit_id);
          const ids = (empIds || []).map((e: any) => e.id);
          if (ids.length === 0) continue;
          query = adminClient.from(table).select("*").in("employee_id", ids);
        } else if (["recipe_ingredients"].includes(table)) {
          const { data: recipeIds } = await adminClient.from("recipes").select("id").eq("unit_id", unit_id);
          const ids = (recipeIds || []).map((r: any) => r.id);
          if (ids.length === 0) continue;
          query = adminClient.from(table).select("*").in("recipe_id", ids);
        } else {
          query = query.eq("unit_id", unit_id);
        }
        const { data: d } = await query;
        if (d && d.length > 0) {
          currentBackupData[table] = d;
          currentTotal += d.length;
          currentTables.push(table);
        }
      }

      await adminClient.from("system_backups").insert({
        user_id: user.id,
        unit_id,
        name: `Auto-backup antes de restauração ${new Date().toLocaleDateString("pt-BR")} ${new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}`,
        backup_data: currentBackupData,
        tables_included: currentTables,
        total_records: currentTotal,
      });

      // Restore order matters - delete in reverse dependency order, insert in dependency order
      const deleteOrder = [
        "recipe_ingredients",
        "recipes",
        "supplier_price_history",
        "employee_schedules",
        "finance_transactions",
        "credit_card_invoices",
        "finance_budgets",
        "finance_tags",
        "finance_categories",
        "finance_accounts",
        "checklist_items",
        "checklist_subcategories",
        "checklist_sectors",
        "categories",
        "inventory_items",
        "employees",
        "customers",
        "brand_assets",
        "brand_references",
        "brand_identity",
        "access_levels",
        "rewards",
        "payment_method_settings",
        "loyalty_rules",
      ];

      const insertOrder = [
        "access_levels",
        "checklist_sectors",
        "checklist_subcategories",
        "checklist_items",
        "categories",
        "inventory_items",
        "employees",
        "employee_schedules",
        "customers",
        "finance_accounts",
        "finance_categories",
        "finance_tags",
        "finance_budgets",
        "credit_card_invoices",
        "finance_transactions",
        "suppliers",
        "supplier_price_history",
        "recipes",
        "recipe_ingredients",
        "brand_identity",
        "brand_assets",
        "brand_references",
        "rewards",
        "payment_method_settings",
        "loyalty_rules",
      ];

      // Delete existing data
      for (const table of deleteOrder) {
        if (["employee_schedules"].includes(table)) {
          const { data: empIds } = await adminClient.from("employees").select("id").eq("unit_id", unit_id);
          const ids = (empIds || []).map((e: any) => e.id);
          if (ids.length > 0) {
            await adminClient.from(table).delete().in("employee_id", ids);
          }
        } else if (["recipe_ingredients"].includes(table)) {
          const { data: recipeIds } = await adminClient.from("recipes").select("id").eq("unit_id", unit_id);
          const ids = (recipeIds || []).map((r: any) => r.id);
          if (ids.length > 0) {
            await adminClient.from(table).delete().in("recipe_id", ids);
          }
        } else if (["supplier_price_history"].includes(table)) {
          await adminClient.from(table).delete().eq("unit_id", unit_id);
        } else {
          await adminClient.from(table).delete().eq("unit_id", unit_id);
        }
      }

      // Insert backup data
      for (const table of insertOrder) {
        const rows = data[table];
        if (!rows || rows.length === 0) continue;

        // Remove auto-generated fields that might conflict
        const cleanRows = rows.map((row: any) => {
          const clean = { ...row };
          delete clean.updated_at;
          return clean;
        });

        // Insert in batches of 100
        for (let i = 0; i < cleanRows.length; i += 100) {
          const batch = cleanRows.slice(i, i + 100);
          const { error } = await adminClient.from(table).upsert(batch, { onConflict: "id" });
          if (error) {
            console.error(`Error restoring ${table}:`, error.message);
          }
        }
      }

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "list") {
      const { data: backups, error } = await adminClient
        .from("system_backups")
        .select("id, name, tables_included, total_records, created_at")
        .eq("unit_id", unit_id)
        .order("created_at", { ascending: false })
        .limit(20);

      if (error) throw error;

      return new Response(JSON.stringify({ success: true, backups }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "delete") {
      if (!backup_id) throw new Error("backup_id required");
      const { error } = await adminClient.from("system_backups").delete().eq("id", backup_id);
      if (error) throw error;

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    throw new Error("Invalid action");
  } catch (err) {
    console.error("system-backup error:", err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
