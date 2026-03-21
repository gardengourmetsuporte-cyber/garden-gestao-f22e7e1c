import { createClient } from "npm:@supabase/supabase-js@2.57.2";

interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  retryAfterSeconds?: number;
}

/**
 * Simple sliding-window rate limiter using the edge_function_rate_limits table.
 * Uses a 1-minute window with configurable max requests.
 */
export async function checkRateLimit(
  userId: string,
  functionName: string,
  maxRequests: number = 10,
  windowMinutes: number = 1
): Promise<RateLimitResult> {
  const supabaseAdmin = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } }
  );

  const windowStart = new Date(Date.now() - windowMinutes * 60_000).toISOString();

  // Count requests in window
  const { count, error } = await supabaseAdmin
    .from("edge_function_rate_limits")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("function_name", functionName)
    .gte("window_start", windowStart);

  const currentCount = count ?? 0;

  if (currentCount >= maxRequests) {
    return {
      allowed: false,
      remaining: 0,
      retryAfterSeconds: windowMinutes * 60,
    };
  }

  // Record this request
  await supabaseAdmin.from("edge_function_rate_limits").insert({
    user_id: userId,
    function_name: functionName,
    window_start: new Date().toISOString(),
  });

  return {
    allowed: true,
    remaining: maxRequests - currentCount - 1,
  };
}

/**
 * Returns a 429 response with rate limit headers.
 */
export function rateLimitResponse(result: RateLimitResult, corsHeaders: Record<string, string>) {
  return new Response(
    JSON.stringify({ 
      error: "Limite de requisições excedido. Tente novamente em alguns minutos.",
      retry_after: result.retryAfterSeconds,
    }),
    {
      status: 429,
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json",
        "Retry-After": String(result.retryAfterSeconds ?? 60),
      },
    }
  );
}
