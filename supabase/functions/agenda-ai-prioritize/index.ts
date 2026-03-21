import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

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

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: corsHeaders });
    }
    const userId = user.id;

    const { tasks, apply, approved_tasks } = await req.json();

    // === APPLY MODE ===
    if (apply && Array.isArray(approved_tasks)) {
      const validTasks = approved_tasks.filter((t: any) =>
        t.id && ["low", "medium", "high"].includes(t.suggested_priority)
      );
      const updatePromises = validTasks.map((t: any) =>
        supabase.from("manager_tasks").update({ priority: t.suggested_priority }).eq("id", t.id).eq("user_id", userId)
      );
      await Promise.all(updatePromises);
      return new Response(JSON.stringify({ applied: true, updated_count: validTasks.length }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // === SUGGEST MODE ===
    if (!tasks || !Array.isArray(tasks) || tasks.length === 0) {
      return new Response(JSON.stringify({ error: "No tasks provided" }), { status: 400, headers: corsHeaders });
    }

    const limitedTasks = tasks.slice(0, 50);
    const today = new Date().toISOString().split("T")[0];
    const dayOfWeek = new Date().toLocaleDateString("pt-BR", { weekday: "long" });

    const tasksSummary = limitedTasks.map((t: any) => {
      const overdueDays = t.due_date && t.due_date < today
        ? Math.floor((new Date(today).getTime() - new Date(t.due_date).getTime()) / 86400000)
        : 0;
      return `- "${t.title}" | Prioridade: ${t.priority} | Data: ${t.due_date || "sem data"} | Categoria: ${t.category_name || "nenhuma"} | Notas: ${t.notes || "nenhuma"} | Atraso: ${overdueDays > 0 ? overdueDays + " dias" : "no prazo"} | ID: ${t.id}`;
    }).join("\n");

    const systemPrompt = `Você é um assistente de gestão especializado em priorização de tarefas para donos de negócios de food service. Analise as tarefas pendentes e:

1. Reorganize por prioridade real considerando:
   - Tarefas atrasadas (maior urgência)
   - Tarefas com data de hoje
   - Impacto no negócio (financeiro > operacional > administrativo)
   - Tarefas sem data (menor urgência)

2. Faça uma avaliação geral da agenda do gestor:
   - Identifique pontos fortes (ex: boa organização por categorias, datas bem definidas)
   - Identifique pontos fracos (ex: muitas tarefas atrasadas, falta de priorização)
   - Dê dicas práticas e actionáveis para melhorar a gestão
   - Atribua uma nota de 1 a 10 para o nível de organização

Hoje é ${today} (${dayOfWeek}).

Use a ferramenta reprioritize_tasks para retornar as prioridades atualizadas e a avaliação.`;

    const userPrompt = `Analise e repriorize estas tarefas pendentes:\n\n${tasksSummary}`;

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "reprioritize_tasks",
              description: "Retorna a lista de tarefas com prioridades atualizadas, um resumo, e uma avaliação geral da agenda.",
              parameters: {
                type: "object",
                properties: {
                  tasks: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        id: { type: "string", description: "ID da tarefa" },
                        suggested_priority: { type: "string", enum: ["low", "medium", "high"] },
                        reason: { type: "string", description: "Motivo curto da prioridade" },
                      },
                      required: ["id", "suggested_priority", "reason"],
                      additionalProperties: false,
                    },
                  },
                  summary: { type: "string", description: "Resumo geral da análise em 1-2 frases" },
                  evaluation: {
                    type: "object",
                    description: "Avaliação geral da agenda do gestor",
                    properties: {
                      score: { type: "number", description: "Nota de organização de 1 a 10" },
                      strengths: {
                        type: "array",
                        items: { type: "string" },
                        description: "Lista de pontos fortes da agenda (2-4 itens curtos)",
                      },
                      weaknesses: {
                        type: "array",
                        items: { type: "string" },
                        description: "Lista de pontos fracos da agenda (2-4 itens curtos)",
                      },
                      tips: {
                        type: "array",
                        items: { type: "string" },
                        description: "Lista de dicas práticas para melhorar (2-4 itens curtos)",
                      },
                    },
                    required: ["score", "strengths", "weaknesses", "tips"],
                    additionalProperties: false,
                  },
                },
                required: ["tasks", "summary", "evaluation"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "reprioritize_tasks" } },
      }),
    });

    if (!response.ok) {
      const status = response.status;
      const text = await response.text();
      console.error("AI gateway error:", status, text);
      if (status === 429) {
        return new Response(JSON.stringify({ error: "Muitas requisições. Tente novamente em alguns minutos." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (status === 402) {
        return new Response(JSON.stringify({ error: "Créditos insuficientes." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      throw new Error("AI gateway error");
    }

    const aiData = await response.json();
    const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];

    if (!toolCall?.function?.arguments) {
      throw new Error("No tool call in response");
    }

    const result = JSON.parse(toolCall.function.arguments);
    const validTasks = result.tasks?.filter((t: any) =>
      t.id && ["low", "medium", "high"].includes(t.suggested_priority)
    ) || [];

    return new Response(JSON.stringify({
      suggestions: validTasks,
      summary: result.summary || "Análise concluída.",
      evaluation: result.evaluation || null,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (err) {
    console.error("agenda-ai-prioritize error:", err);
    return new Response(JSON.stringify({ error: err instanceof Error ? err.message : "Erro interno" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
