
# Copiloto Executor - Integracacao com n8n via Tool Calling

## Resumo

Transformar o Copiloto de consultivo para executor, usando **Gemini Tool Calling** na edge function para detectar intencoes de acao e despachar para o webhook n8n que cria transacoes financeiras.

## Adaptacao de Seguranca (sem Enterprise n8n)

Como voce nao tem o plano Enterprise do n8n para variaveis de ambiente, a seguranca sera garantida assim:
- A **edge function valida o JWT do usuario** antes de qualquer acao (camada principal)
- O webhook n8n recebera o `user_id` e `unit_id` ja validados pela edge function
- Sem secret compartilhado no n8n por enquanto (a protecao e que so a edge function chama o webhook)

**Importante**: Troque a URL de `webhook-test` para `webhook` quando ativar o workflow em producao no n8n.

## Arquitetura do Fluxo

```text
Usuario digita: "Registra despesa de R$200 com agua"
        |
        v
Frontend (useManagementAI) --> Edge Function (management-ai)
        |
        v
Gemini com tools definidas --> Retorna tool_call: create_transaction
        |
        v
Edge Function extrai parametros e chama webhook n8n
        |
        v
n8n cria a transacao no Supabase
        |
        v
Edge Function gera mensagem de confirmacao --> Frontend exibe
```

## Arquivos Modificados

### 1. `supabase/functions/management-ai/index.ts` (reescrita major)

Mudancas:
- Adicionar definicoes de `tools` no payload da IA com a funcao `create_transaction`
- Parametros da tool: `type` (income/expense), `amount`, `description`, `category_name`, `account_name`, `supplier_name`, `employee_name`, `date`, `is_paid`
- Apos receber resposta da IA, verificar se ha `tool_calls` no response
- Se houver tool_call: extrair argumentos, chamar webhook n8n via fetch, retornar confirmacao formatada
- Se nao houver tool_call: retornar texto normal (comportamento atual)
- Adicionar `user_id` e `unit_id` do contexto ao payload do n8n
- URL do webhook n8n configurada como constante (pode migrar para secret futuramente)

### 2. `src/hooks/useManagementAI.ts` (mudancas minimas)

Mudancas:
- Enviar `user_id` e `unit_id` no body da chamada da edge function (necessario para o n8n)
- Adicionar estado `isExecuting` separado do `isLoading` para diferenciar "pensando" de "executando acao"
- Tratar novo campo `action_executed` na resposta para invalidar cache de contexto apos acao

### 3. `src/pages/Copilot.tsx` (mudancas visuais)

Mudancas:
- Renderizar mensagens de acao executada com estilo diferenciado (card verde com icone de check)
- Mostrar indicador "Executando acao..." quando `isExecuting` estiver ativo (diferente dos dots de loading)
- Detectar mensagens que contem marcador `[ACTION]` para aplicar estilo especial

## Detalhes Tecnicos

### Tool Definition para o Gemini

```text
tools: [{
  type: "function",
  function: {
    name: "create_transaction",
    description: "Criar transacao financeira no sistema",
    parameters: {
      type: "object",
      properties: {
        type: { type: "string", enum: ["income", "expense"] },
        amount: { type: "number" },
        description: { type: "string" },
        category_name: { type: "string" },
        account_name: { type: "string" },
        supplier_name: { type: "string" },
        employee_name: { type: "string" },
        date: { type: "string", format: "YYYY-MM-DD" },
        is_paid: { type: "boolean" }
      },
      required: ["type", "amount", "description"]
    }
  }
}]
```

### Fluxo na Edge Function

1. Enviar mensagens + tools para Gemini
2. Verificar `response.choices[0].message.tool_calls`
3. Se presente: extrair `function.arguments`, adicionar `user_id`/`unit_id`, fazer POST para webhook n8n
4. Aguardar resposta do n8n (sucesso/erro)
5. Retornar ao frontend: `{ suggestion: "Transacao criada...", action_executed: true }`

### Prompt do Sistema (adicao)

Adicionar ao system prompt:
- "Quando o usuario pedir para CRIAR, REGISTRAR, LANÇAR ou ADICIONAR uma transacao financeira, use a funcao create_transaction"
- "Sempre confirme os valores antes de executar"
- "Use os dados do contexto para resolver nomes de categorias, contas e fornecedores"

## Sequencia de Implementacao

1. Atualizar a edge function com tool calling e dispatch para n8n
2. Atualizar o hook para enviar user_id/unit_id e tratar resposta de acao
3. Atualizar o frontend com estilos visuais para acoes executadas
4. Deploy e teste

## Limitacoes Conhecidas

- URL do webhook hardcoded na edge function (pode migrar para secret quando tiver Enterprise n8n)
- Apenas 1 acao disponivel inicialmente (criar transacao) - expandivel adicionando mais tools
- Sem botao "desfazer" nesta primeira versao (complexidade adicional)
