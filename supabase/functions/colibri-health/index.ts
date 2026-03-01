import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// ── SSRF Protection: block internal/private IP ranges ──
function isBlockedUrl(rawUrl: string): boolean {
  try {
    const u = new URL(rawUrl);
    const host = u.hostname.toLowerCase();
    // Block private/internal targets
    if (
      host === "localhost" ||
      host === "127.0.0.1" ||
      host === "0.0.0.0" ||
      host === "[::1]" ||
      host.endsWith(".internal") ||
      host.endsWith(".local") ||
      host.startsWith("10.") ||
      host.startsWith("192.168.") ||
      /^172\.(1[6-9]|2\d|3[01])\./.test(host) ||
      host === "metadata.google.internal" ||
      host === "169.254.169.254"
    ) {
      return true;
    }
    // Block non-http(s) schemes
    if (u.protocol !== "http:" && u.protocol !== "https:") {
      return true;
    }
    return false;
  } catch {
    return true; // Invalid URL = blocked
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // ── Authentication ──
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(
        JSON.stringify({ success: false, error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseAuth = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await supabaseAuth.auth.getClaims(token);
    if (claimsError || !claimsData?.claims?.sub) {
      return new Response(
        JSON.stringify({ success: false, error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { hub_url, auth_key } = await req.json();

    if (!hub_url) {
      return new Response(
        JSON.stringify({ success: false, error: "URL do Hub é obrigatória" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ── SSRF Protection ──
    if (isBlockedUrl(hub_url)) {
      return new Response(
        JSON.stringify({ success: false, error: "URL bloqueada: endereços internos ou privados não são permitidos." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Try a simple GET request to test connectivity
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);

    try {
      const res = await fetch(hub_url, {
        method: "GET",
        headers: {
          ...(auth_key ? { Authorization: `Bearer ${auth_key}` } : {}),
        },
        signal: controller.signal,
      });
      clearTimeout(timeout);

      return new Response(
        JSON.stringify({
          success: true,
          status: res.status,
          statusText: res.statusText,
          message: res.ok
            ? "Conexão estabelecida com sucesso!"
            : `Hub respondeu com status ${res.status}. Verifique a URL e credenciais.`,
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    } catch (fetchErr: any) {
      clearTimeout(timeout);
      const isTimeout = fetchErr.name === "AbortError";
      return new Response(
        JSON.stringify({
          success: false,
          error: isTimeout
            ? "Timeout: O Hub não respondeu em 8 segundos. Verifique se o Gestor de Pedidos está rodando e acessível."
            : `Erro de conexão: ${fetchErr.message}. Verifique se a URL está correta e o servidor acessível.`,
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
  } catch (err: any) {
    return new Response(
      JSON.stringify({ success: false, error: "Erro interno: " + err.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
