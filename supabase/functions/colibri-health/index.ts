import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { hub_url, auth_key } = await req.json();

    if (!hub_url) {
      return new Response(
        JSON.stringify({ success: false, error: "URL do Hub é obrigatória" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Try a simple GET/HEAD request to test connectivity
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
