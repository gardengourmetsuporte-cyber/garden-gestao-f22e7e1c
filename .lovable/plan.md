

# Plano: Ocultar Pedidos para Funcionários + Bloquear Tarefas Completadas

## Resumo

Este plano resolve dois problemas identificados:

1. **Funcionários vendo Pedidos**: A aba "Pedidos" no estoque será ocultada para funcionários
2. **Bloqueio de tarefas completadas**: Após um funcionário marcar uma tarefa, apenas o admin poderá desmarcá-la

---

## Problema 1: Funcionários Vendo Pedidos

### O que acontece hoje
Na página de Estoque, funcionários conseguem ver a aba "Pedidos" com todas as informações de compras.

### Solução
Ocultar a aba "Pedidos" para funcionários, mostrando apenas "Itens" e "Histórico".

**Arquivo:** `src/pages/Inventory.tsx`

```
Antes:
┌────────┐ ┌──────────┐ ┌───────────┐
│  Itens │ │ Pedidos  │ │ Histórico │
└────────┘ └──────────┘ └───────────┘
   Todos      Todos         Todos

Depois:
┌────────┐ ┌──────────┐ ┌───────────┐
│  Itens │ │ Pedidos  │ │ Histórico │
└────────┘ └──────────┘ └───────────┘
   Todos    Só Admin       Todos
```

**Alteração no código:**
- Envolver o botão "Pedidos" em `{isAdmin && (...)}`
- Garantir que a view 'orders' só seja acessível por admin

---

## Problema 2: Bloquear Tarefas Completadas

### O que acontece hoje
Qualquer funcionário pode desmarcar uma tarefa que outro funcionário completou, permitindo que alguém "roube" crédito de tarefas feitas por outros.

### Solução
Depois que um funcionário marca uma tarefa como concluída:
- **Outro funcionário NÃO pode desmarcar** (o clique é bloqueado)
- **Apenas o admin pode desmarcar** qualquer tarefa

### Implementação

#### 1. Banco de Dados (RLS)
Atualizar política de DELETE em `checklist_completions`:

```sql
-- Remover política antiga de delete para admins
DROP POLICY IF EXISTS "Admins can delete completions" ON public.checklist_completions;

-- Nova política: só pode deletar se for admin OU se foi você quem completou
CREATE POLICY "User or admin can delete completions" ON public.checklist_completions
  FOR DELETE USING (
    has_role(auth.uid(), 'admin'::app_role) 
    OR completed_by = auth.uid()
  );
```

#### 2. Interface (ChecklistView)
Modificar o botão de cada tarefa para:
- Se **não completada**: qualquer um pode clicar
- Se **completada pelo próprio usuário**: pode desmarcar
- Se **completada por outro usuário**: 
  - **Admin**: pode desmarcar
  - **Funcionário**: clique desabilitado + visual indicando bloqueio

**Arquivo:** `src/components/checklists/ChecklistView.tsx`

```
Antes:
[✓] Limpar bancada
    ↳ Feito por Bruno às 08:35
    (qualquer um clica e desmarca)

Depois:
[✓] Limpar bancada  🔒
    ↳ Feito por Bruno às 08:35
    (se você é Maria, não pode desmarcar)
    (se você é Admin, pode desmarcar)
```

#### 3. Hook (useChecklists)
Adicionar verificação antes de deletar completion:

```typescript
// Em toggleCompletion
if (existing) {
  // Verifica se pode deletar
  const canDelete = isAdmin || existing.completed_by === user?.id;
  if (!canDelete) {
    throw new Error('Apenas o administrador pode desmarcar tarefas de outros usuários');
  }
  // ... continua com delete
}
```

---

## Arquivos a Modificar

| Arquivo | Alteração |
|---------|-----------|
| Nova migração SQL | Atualizar política DELETE em checklist_completions |
| `src/pages/Inventory.tsx` | Ocultar aba Pedidos para não-admin |
| `src/components/checklists/ChecklistView.tsx` | Bloquear clique em tarefas de outros |
| `src/hooks/useChecklists.ts` | Verificar permissão antes de desmarcar |
| `src/pages/Checklists.tsx` | Passar `isAdmin` e `userId` para ChecklistView |

---

## Visual Final

### Estoque para Funcionário:
```
┌──────────────────────────────────────┐
│  Controle de Estoque                 │
├──────────────────────────────────────┤
│  ┌────────┐  ┌───────────┐           │
│  │ Itens  │  │ Histórico │           │
│  └────────┘  └───────────┘           │
│  (sem aba Pedidos!)                  │
└──────────────────────────────────────┘
```

### Checklist para Funcionário Maria:
```
┌──────────────────────────────────────┐
│  [✓] Verificar estoque de carnes  🔒 │
│      ↳ Feito por Bruno às 08:35      │
│      (Maria não pode desmarcar)      │
├──────────────────────────────────────┤
│  [✓] Limpar bancada                  │
│      ↳ Feito por Maria às 08:42      │
│      (Maria PODE desmarcar)          │
├──────────────────────────────────────┤
│  [ ] Organizar geladeira             │
│      (Maria pode marcar)             │
└──────────────────────────────────────┘
```

### Checklist para Admin:
```
┌──────────────────────────────────────┐
│  [✓] Verificar estoque de carnes     │
│      ↳ Feito por Bruno às 08:35      │
│      (Admin PODE desmarcar)          │
├──────────────────────────────────────┤
│  [✓] Limpar bancada                  │
│      ↳ Feito por Maria às 08:42      │
│      (Admin PODE desmarcar)          │
└──────────────────────────────────────┘
```

---

## Benefícios

1. **Segurança**: Funcionários não acessam informações de compras/fornecedores
2. **Integridade**: Ninguém pode "roubar" crédito de tarefas feitas por outros
3. **Rastreabilidade**: O nome de quem completou permanece protegido
4. **Flexibilidade**: Admin mantém controle total para corrigir erros

---

## Detalhes Técnicos

### Migração SQL
```sql
-- Atualizar política de delete em completions
DROP POLICY IF EXISTS "Admins can delete completions" ON public.checklist_completions;

CREATE POLICY "User or admin can delete completions" ON public.checklist_completions
  FOR DELETE USING (
    has_role(auth.uid(), 'admin'::app_role) 
    OR completed_by = auth.uid()
  );
```

### ChecklistView - Props Adicionais
```typescript
interface ChecklistViewProps {
  // ... existing props
  currentUserId?: string;
  isAdmin: boolean;
}
```

### Lógica de Bloqueio
```typescript
// Para cada item completado:
const canToggle = !completed || isAdmin || completion?.completed_by === currentUserId;
const isLockedByOther = completed && !isAdmin && completion?.completed_by !== currentUserId;
```

