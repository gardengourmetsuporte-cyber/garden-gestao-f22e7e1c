

# Plano Completo: Sistema RBAC + Nome nas Tarefas

## Resumo Executivo

Este plano implementa todas as regras de permissão discutidas, corrige os 2 avisos de segurança (warnings), e adiciona o nome de quem completou cada tarefa no checklist.

---

## Matriz de Permissões Final

| Recurso | Admin | Funcionário |
|---------|-------|-------------|
| **ESTOQUE** | | |
| Ver itens | ✅ | ✅ |
| Entrada/saída | ✅ | ✅ |
| Criar item | ✅ | ❌ |
| Editar item | ✅ | ❌ |
| Excluir item | ✅ | ❌ |
| **CHECKLIST** | | |
| Ver e completar tarefas | ✅ | ✅ |
| Ver quem completou | ✅ | ✅ |
| Configurar setores/itens | ✅ | ❌ |
| **CONFIGURAÇÕES** | | |
| Editar perfil próprio | ✅ | ✅ |
| Ver categorias | ✅ | ❌ |
| Gerenciar categorias | ✅ | ❌ |
| Ver fornecedores | ✅ | ❌ |
| Gerenciar fornecedores | ✅ | ❌ |
| Gerenciar checklists | ✅ | ❌ |
| Gerenciar usuários | ✅ | ❌ |

---

## Alterações por Módulo

### 1. Banco de Dados (Migração SQL)

Corrigir políticas RLS para restringir escrita apenas para admins:

```sql
-- CATEGORIAS: Restringir escrita para admins (corrige warning categories_write_access)
DROP POLICY IF EXISTS "Authenticated can manage categories" ON public.categories;

CREATE POLICY "Admins can manage categories" ON public.categories
  FOR ALL USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- FORNECEDORES: Mesmo padrão
DROP POLICY IF EXISTS "Authenticated can manage suppliers" ON public.suppliers;

CREATE POLICY "Admins can manage suppliers" ON public.suppliers
  FOR ALL USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- MOVIMENTAÇÕES: Adicionar proteção DELETE (corrige warning stock_movements_no_delete)
CREATE POLICY "Admins can delete movements" ON public.stock_movements
  FOR DELETE USING (has_role(auth.uid(), 'admin'::app_role));

-- ITENS DE INVENTÁRIO: Restringir INSERT/UPDATE para admins
DROP POLICY IF EXISTS "Authenticated can insert items" ON public.inventory_items;
DROP POLICY IF EXISTS "Authenticated can update items" ON public.inventory_items;

CREATE POLICY "Admins can insert items" ON public.inventory_items
  FOR INSERT WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update items" ON public.inventory_items
  FOR UPDATE USING (has_role(auth.uid(), 'admin'::app_role));
```

---

### 2. Página de Estoque

**Arquivo:** `src/pages/Inventory.tsx`

Alterações:
- Ocultar botão "+" (adicionar item) para não-admins
- Não passar `onEdit` para o ItemCard quando não é admin (remove o lápis)

```text
Antes (linha 205-210):
<button onClick={handleAddItem} ...>
  <Plus />
</button>

Depois:
{isAdmin && (
  <button onClick={handleAddItem} ...>
    <Plus />
  </button>
)}

Antes (linha 364-369):
<ItemCard
  item={item}
  onClick={() => handleItemClick(item)}
  onEdit={() => handleEditItem(item)}
/>

Depois:
<ItemCard
  item={item}
  onClick={() => handleItemClick(item)}
  onEdit={isAdmin ? () => handleEditItem(item) : undefined}
/>
```

---

### 3. Página de Configurações

**Arquivo:** `src/pages/Settings.tsx`

Funcionário verá **apenas a aba Perfil**. Todas as outras abas serão exclusivas para admin.

```text
Antes:
┌─────────┐ ┌────────────┐ ┌─────────────┐ ┌────────────┐ ┌──────────┐
│ Perfil  │ │ Categorias │ │ Fornecedores│ │ Checklists │ │ Usuários │
└─────────┘ └────────────┘ └─────────────┘ └────────────┘ └──────────┘
   Todos       Todos          Todos        Só Admin       Só Admin

Depois:
┌─────────┐ ┌────────────┐ ┌─────────────┐ ┌────────────┐ ┌──────────┐
│ Perfil  │ │ Categorias │ │ Fornecedores│ │ Checklists │ │ Usuários │
└─────────┘ └────────────┘ └─────────────┘ └────────────┘ └──────────┘
   Todos      Só Admin       Só Admin       Só Admin       Só Admin
```

Mudanças no código:
- Mover as abas de Categorias e Fornecedores para dentro do bloco `{isAdmin && (...)}`
- Ajustar o grid de colunas dinamicamente

---

### 4. Checklist - Nome de Quem Completou

**Arquivo:** `src/hooks/useChecklists.ts`

Alterar a query de `fetchCompletions` para incluir o nome do usuário:

```typescript
// Antes:
.select('*')

// Depois:
.select(`
  *,
  profile:profiles!completed_by(full_name)
`)
```

**Arquivo:** `src/types/database.ts`

O tipo `ChecklistCompletion` já tem `profile?: Profile` - basta garantir o retorno.

**Arquivo:** `src/components/checklists/ChecklistView.tsx`

Adicionar props para receber os dados de completions e exibir nome + hora:

```text
Antes:
[✓] Verificar estoque de carnes

Depois:
[✓] Verificar estoque de carnes
    ↳ Feito por Bruno às 08:35
```

**Arquivo:** `src/pages/Checklists.tsx`

Passar `completions` para o ChecklistView para que ele possa exibir os nomes.

---

### 5. Limpeza de Código (Remover console.error)

Já foram removidos alguns no último diff. Faltam:

- `src/hooks/useCategories.ts` (linhas 18-19)
- `src/hooks/useSuppliers.ts` (linhas 20-22)
- `src/hooks/useChecklists.ts` (linhas 33-34 e 48-49)

---

## Arquivos a Modificar

| Arquivo | Alteração |
|---------|-----------|
| Nova migração SQL | Políticas RLS |
| `src/pages/Inventory.tsx` | Ocultar botão "+" e editar para não-admin |
| `src/pages/Settings.tsx` | Mostrar apenas aba Perfil para funcionário |
| `src/hooks/useChecklists.ts` | Buscar nome do completador + remover console.error |
| `src/components/checklists/ChecklistView.tsx` | Exibir "Feito por X às HH:MM" |
| `src/pages/Checklists.tsx` | Passar completions para ChecklistView |
| `src/hooks/useCategories.ts` | Remover console.error |
| `src/hooks/useSuppliers.ts` | Remover console.error |

---

## Visual Final

### Funcionário no Estoque:
```
┌──────────────────────────────────────┐
│  Controle de Estoque                 │
│  15 itens cadastrados                │
│                             (sem +)  │
├──────────────────────────────────────┤
│  🥩 Carnes (3)                       │
│  ├── Picanha      8.5kg   OK         │
│  ├── Costela      2.0kg   Baixo      │
│  └── Frango       0kg     Zerado     │
│                                      │
│  (clique abre entrada/saída,         │
│   sem lápis de editar)               │
└──────────────────────────────────────┘
```

### Funcionário nas Configurações:
```
┌──────────────────────────────────────┐
│  Configurações                       │
│  Gerencie seu perfil                 │
├──────────────────────────────────────┤
│  ┌─────────┐                         │
│  │ Perfil  │  (aba única)            │
│  └─────────┘                         │
├──────────────────────────────────────┤
│  Nome: Bruno Momesso                 │
│  Cargo: [________]                   │
│  [Salvar]                            │
└──────────────────────────────────────┘
```

### Checklist com Nome:
```
┌──────────────────────────────────────┐
│  [✓] Verificar estoque de carnes     │
│      ↳ Feito por Bruno às 08:35      │
├──────────────────────────────────────┤
│  [✓] Limpar bancada                  │
│      ↳ Feito por Maria às 08:42      │
├──────────────────────────────────────┤
│  [ ] Organizar geladeira             │
│      (pendente)                      │
└──────────────────────────────────────┘
```

---

## Benefícios

1. **Segurança**: Funcionários não podem alterar dados críticos
2. **Rastreabilidade**: Cada tarefa mostra quem a completou
3. **Interface Limpa**: Funcionários veem apenas o que podem usar
4. **Proteção Dupla**: RLS no banco + verificação na interface
5. **Warnings Corrigidos**: Os 2 avisos de segurança serão resolvidos

