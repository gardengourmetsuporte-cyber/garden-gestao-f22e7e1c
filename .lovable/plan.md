

## Lista de Compras Rápida — Plano

### O que será feito

Adicionar um botão de "carrinho" (+) no sheet de movimentação rápida do estoque (a tela da screenshot) que permite ao usuário da cozinha adicionar o item diretamente a uma **lista de compras rápida**. Essa lista fica acessível na página de Pedidos como uma nova funcionalidade, permitindo que a equipe sinalize itens que precisam de atenção sem precisar criar um pedido formal.

### Fluxo do usuário

1. Abre o sheet de movimentação rápida de um item no estoque
2. Vê um botão de carrinho (ícone `ShoppingCart` + `Plus`) ao lado do título ou abaixo do botão confirmar
3. Ao clicar, o item é adicionado à lista de compras rápida com a quantidade sugerida (min_stock - current_stock) e um toast confirma
4. Na página de Pedidos, uma nova aba ou seção "Lista Rápida" exibe os itens adicionados pela cozinha, agrupados, com opção de converter em pedido formal para um fornecedor

### Mudanças técnicas

**1. Nova tabela `shopping_list_items`** (migration)
```sql
CREATE TABLE public.shopping_list_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id UUID REFERENCES public.inventory_items(id) ON DELETE CASCADE NOT NULL,
  quantity NUMERIC DEFAULT 1,
  notes TEXT,
  added_by UUID REFERENCES auth.users(id),
  unit_id UUID REFERENCES public.units(id),
  status TEXT DEFAULT 'pending', -- pending | ordered
  created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.shopping_list_items ENABLE ROW LEVEL SECURITY;
-- Policies: authenticated users da mesma unit podem ver/inserir/deletar
```

**2. Hook `useShoppingList.ts`**
- CRUD para `shopping_list_items` com filtro por `unit_id`
- Funções: `addToList`, `removeFromList`, `clearList`, `convertToOrder`

**3. Botão no `QuickMovementSheetNew.tsx`**
- Adicionar um botão com ícone de carrinho + plus abaixo do botão "Confirmar", estilo secundário
- Texto: "Adicionar à Lista de Compras"
- Ao clicar, insere o item na tabela `shopping_list_items` com quantidade sugerida

**4. Badge no `ItemCardNew.tsx`** (opcional)
- Indicador visual de que o item já está na lista de compras

**5. Seção na página `Orders.tsx`**
- Nova aba "Lista" nas `AnimatedTabs` com badge de contagem
- Exibe os itens pendentes da lista, com opção de remover individualmente ou converter todos em pedido para o fornecedor vinculado

### Arquivos impactados
- `supabase/migrations/` — nova migration
- `src/hooks/useShoppingList.ts` — novo hook
- `src/components/inventory/QuickMovementSheetNew.tsx` — botão de adicionar
- `src/pages/Orders.tsx` — nova aba "Lista"

