

## Criar transacoes direto na Edge Function (sem n8n)

A edge function `management-ai` sera modificada para inserir transacoes financeiras diretamente no banco de dados, eliminando a dependencia do webhook n8n.

### O que muda

1. Remover a chamada ao webhook n8n
2. Criar um client Supabase dentro da edge function usando a Service Role Key (ja disponivel automaticamente)
3. Quando a IA chamar a tool `create_transaction`, a edge function vai:
   - Resolver nomes de categoria, conta, fornecedor e funcionario para seus UUIDs
   - Inserir diretamente na tabela `finance_transactions`
   - O trigger existente do banco atualiza automaticamente o saldo da conta

### Detalhes tecnicos

**Arquivo modificado:** `supabase/functions/management-ai/index.ts`

Mudancas principais:
- Importar `createClient` do Supabase
- Remover constante `N8N_WEBHOOK_URL` e todo o bloco de dispatch para n8n
- Adicionar funcao `executeCreateTransaction` que:
  - Cria client Supabase com `SUPABASE_URL` e `SUPABASE_SERVICE_ROLE_KEY` (variaveis ja disponiveis automaticamente em edge functions)
  - Faz lookup por nome para resolver `category_name` -> `category_id` na tabela `finance_categories`
  - Faz lookup por nome para resolver `account_name` -> `account_id` na tabela `finance_accounts`
  - Faz lookup por nome para resolver `supplier_name` -> `supplier_id` na tabela `suppliers`
  - Faz lookup por nome para resolver `employee_name` -> `employee_id` na tabela `employees`
  - Insere o registro em `finance_transactions` com todos os campos obrigatorios (`user_id`, `unit_id`, `type`, `amount`, `description`, `date`, `is_paid`, `category_id`, `account_id`, `supplier_id`, `employee_id`)
  - Retorna sucesso ou erro

**Nenhuma mudanca no frontend** -- o hook `useManagementAI.ts` continua funcionando igual, so recebe a resposta da edge function.

### Resultado esperado

Quando voce pedir ao Copiloto para criar uma transacao, ela sera inserida diretamente no banco e aparecera imediatamente na lista de transacoes financeiras.
