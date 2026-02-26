

## Plano: Contestação de Checklist

### Contexto
O admin precisa poder contestar um item que um funcionário marcou como feito, registrando que ele verificou e o item não foi realmente concluído. Isso deve penalizar o funcionário (remover os pontos) e manter um registro de auditoria.

### 1. Nova tabela no banco de dados

**`checklist_contestations`** — registra cada contestação feita por um admin:

| Coluna | Tipo | Descrição |
|---|---|---|
| `id` | uuid PK | — |
| `completion_id` | uuid FK → checklist_completions | Conclusão contestada |
| `item_id` | uuid FK → checklist_items | Referência ao item |
| `contested_by` | uuid | Admin que contestou |
| `original_completed_by` | uuid | Funcionário original |
| `reason` | text NOT NULL | Motivo da contestação |
| `date` | date | Data do checklist |
| `points_removed` | integer | Pontos que foram removidos |
| `unit_id` | uuid FK → units | Unidade |
| `created_at` | timestamptz | — |

RLS: somente usuários com acesso à unidade podem ver/inserir.

### 2. Lógica da contestação

Quando o admin contesta:
1. A `checklist_completion` existente é **atualizada**: `awarded_points = false`, `points_awarded = 0`, `is_skipped = false` e um novo campo `is_contested = true` é adicionado à tabela `checklist_completions`
2. Um registro é inserido em `checklist_contestations` com o motivo
3. Uma **notificação** é criada para o funcionário informando que seu item foi contestado

Alternativa mais simples (sem nova tabela): adicionar `is_contested`, `contested_by`, `contested_reason` e `contested_at` diretamente na `checklist_completions`. Isso evita joins e simplifica queries.

**Decisão: usar campos na própria `checklist_completions`** — mais simples, menos joins, e cada completion só pode ter uma contestação.

### 3. Alterações no banco

Migration SQL:
```sql
ALTER TABLE checklist_completions 
  ADD COLUMN is_contested boolean NOT NULL DEFAULT false,
  ADD COLUMN contested_by uuid,
  ADD COLUMN contested_reason text,
  ADD COLUMN contested_at timestamptz;
```

### 4. Alterações no frontend

**`ChecklistView.tsx`** — Para itens completed, quando `isAdmin`:
- Adicionar botão "Contestar" (ícone `AlertTriangle`) no painel inline expandido ao clicar no item concluído
- Ao clicar, abre um mini-form inline com campo de texto para o motivo e botão confirmar
- Visual: fundo laranja/amber para itens contestados (diferente de "não fiz" que é vermelho)

**`useChecklists.ts`**:
- Nova função `contestCompletion(completionId, reason)` que:
  - Faz UPDATE na completion: `is_contested = true`, `awarded_points = false`, `points_awarded = 0`, `contested_by`, `contested_reason`, `contested_at`
  - Insere notificação para o funcionário
  - Invalida caches de completions, points, leaderboard

**`types/database.ts`**:
- Adicionar campos `is_contested`, `contested_by`, `contested_reason`, `contested_at` na interface `ChecklistCompletion`

### 5. Visual do item contestado

- Borda e fundo **amber/warning** (`bg-amber-500/10 border-amber-500/30`)
- Ícone `AlertTriangle` no badge em vez de check/X
- Texto "Contestado" + motivo visível
- Info de quem contestou e quando
- Funcionário vê destaque visual diferente no seu checklist

### 6. Arquivos a editar

1. **Migration SQL** — adicionar colunas à `checklist_completions`
2. **`src/types/database.ts`** — atualizar interface `ChecklistCompletion`
3. **`src/hooks/useChecklists.ts`** — adicionar `contestCompletion()`
4. **`src/components/checklists/ChecklistView.tsx`** — UI de contestação (botão + form inline + visual contestado)

### Detalhes técnicos

- A contestação NÃO remove a completion — ela permanece como registro, mas com `is_contested = true` e pontos zerados
- Somente admins podem contestar
- O motivo é obrigatório (campo `reason` NOT NULL via validação no frontend)
- Items contestados aparecem com visual distinto de "concluído", "não fiz" e "já pronto"
- O leaderboard é recalculado automaticamente pois os pontos são zerados na completion

