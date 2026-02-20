

# Memoria de Preferencias do Copiloto

## O que sera feito

O Copiloto vai aprender atalhos e mapeamentos personalizados do usuario. Por exemplo, quando o gestor diz "luz", o sistema entende automaticamente como "conta de energia eletrica, categoria Energia".

## Implementacao

### 1. Nova tabela `copilot_preferences`

Migracao SQL criando a tabela com os campos:
- `id` (uuid, PK)
- `user_id` (uuid, NOT NULL)
- `unit_id` (uuid, nullable)
- `key` (text) - o atalho/apelido (ex: "luz")
- `value` (text) - o significado completo (ex: "conta de energia eletrica, categoria: Energia, tipo: expense")
- `category` (text) - tipo da preferencia: 'alias', 'default_account', 'default_category'
- `created_at` / `updated_at`

RLS: usuarios gerenciam apenas suas proprias preferencias (`auth.uid() = user_id`).
Indice unico em `(user_id, key)` para evitar duplicatas.

### 2. Nova tool `save_preference` na edge function

Adicionar ao `management-ai/index.ts`:
- Nova tool definition no array TOOLS
- Funcao `executeSavePreference` que faz upsert na tabela
- O modelo chama automaticamente quando detecta que o usuario esta definindo um atalho

Exemplos de uso:
- "Quando eu falar 'luz', entenda como conta de energia" -> `save_preference(key: "luz", value: "conta de energia eletrica, categoria: Energia")`
- "Minha conta padrao e Nubank" -> `save_preference(key: "conta_padrao", value: "Nubank", category: "default_account")`

### 3. Carregar preferencias no contexto da IA

No handler principal do `management-ai`:
- Buscar todas as preferencias do usuario antes de montar o system prompt
- Injetar como bloco no prompt: `PREFERENCIAS DO USUARIO: 'luz' = 'conta de energia...'`
- O modelo usa essas preferencias para interpretar comandos ambiguos

### 4. Carregar preferencias no frontend (hook)

No `useManagementAI.ts`:
- Adicionar fetch de preferencias ao `fetchFullContext`
- Enviar no campo `context.preferences` para a edge function

---

## Detalhes Tecnicos

### Arquivos modificados:
1. **Nova migracao SQL** - tabela `copilot_preferences` + RLS + indice unico
2. **`supabase/functions/management-ai/index.ts`** - nova tool `save_preference` + carregar preferencias no prompt
3. **`src/hooks/useManagementAI.ts`** - buscar preferencias no contexto
4. **`.lovable/plan.md`** - atualizar status

### Fluxo:
1. Usuario diz: "quando eu falar luz, entenda como conta de energia"
2. Modelo detecta intencao e chama `save_preference(key: "luz", value: "conta de energia eletrica, categoria: Energia, tipo: expense")`
3. Funcao faz upsert na tabela
4. Nas proximas mensagens, as preferencias sao carregadas no prompt
5. Usuario diz: "registra a luz desse mes, R$280"
6. Modelo le preferencia e cria transacao com categoria correta automaticamente

