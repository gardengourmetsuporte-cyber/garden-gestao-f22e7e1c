

## Plano: Filtrar lista de funcionários no checklist por unidade ativa

### Problema
Em `src/components/checklists/ChecklistView.tsx` (linhas 116-123), a query busca TODOS os perfis do banco (`profiles`) sem filtrar pela unidade ativa. Isso faz aparecer usuários de outras unidades e contas inativas.

### Alteração

#### `src/components/checklists/ChecklistView.tsx`
- O componente recebe `activeUnitId` como prop (já disponível no contexto pai via `useUnit`)
- Substituir a query direta em `profiles` por uma query em duas etapas:
  1. Buscar `user_ids` da tabela `user_units` onde `unit_id = activeUnitId`
  2. Buscar perfis apenas desses `user_ids` com `.in('user_id', userIds)`
- Adicionar `activeUnitId` como dependência do `useEffect`
- Se `activeUnitId` não existir, não buscar perfis

Isso garante que só apareçam funcionários que pertencem à unidade ativa do checklist.

