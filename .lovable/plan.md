

## Plano: Simplificar Fichas Técnicas e Preparar para Baixa Automática

### Problema Atual
O sistema de unidades tem complexidade desnecessária que confunde o usuário e quebra a integração com vendas:

1. **Campos redundantes no item de estoque**: `recipe_unit_type`, `recipe_unit_price`, `stock_unit_label`, `stock_to_recipe_factor` — o sistema de receitas já faz conversão automática (kg↔g, L↔ml)
2. **Formulário de item sobrecarregado**: "Nome personalizado da unidade", "Preço por kg" com nota sobre fichas técnicas, seção "Configurar para Compras/Pedidos"
3. **Trigger de baixa automática quebrado**: `auto_consume_stock_on_sale()` referencia `recipes.product_id` que NÃO EXISTE — o vínculo real é `tablet_products.recipe_id`

### O que muda

#### 1. Simplificar formulário de item de estoque (`ItemFormSheet.tsx`)
- **Remover** campo "Nome personalizado da unidade" (`stock_unit_label`)
- **Remover** nota sobre fichas técnicas (o tip verde)
- **Manter** seção "Configurar para Compras/Pedidos" (útil para pedidos a fornecedores)
- Formulário fica: Nome → Categoria → Fornecedor → Tipo de Controle (un/kg/g/L/ml) → Estoque/Mínimo → Preço → Compras/Pedidos

#### 2. Remover campos obsoletos de `recipe_unit_type`/`recipe_unit_price` do frontend
- **`RecipeSheet.tsx`**: Remover lógica `hasRecipeUnit` no `handleAddInventoryItem` — usar sempre `item.unit_type` e `item.unit_price` diretamente, a conversão já é feita pelo sistema de unidades compatíveis
- **`IngredientPicker.tsx`**: Remover referências a `recipe_unit_type`/`recipe_unit_price`
- **`useRecipes.ts`**: Remover select desses campos
- **`UnitManagement.tsx`**: Remover replicação desses campos

#### 3. Corrigir trigger de baixa automática (migração SQL)
O trigger atual está quebrado porque `recipes` não tem `product_id`. Corrigir para usar o caminho correto: `tablet_products.recipe_id → recipes.id → recipe_ingredients`.

```sql
CREATE OR REPLACE FUNCTION public.auto_consume_stock_on_sale()
RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  item RECORD;
  ingredient RECORD;
  sale_unit_id uuid;
BEGIN
  IF NEW.status != 'paid' THEN RETURN NEW; END IF;
  IF OLD IS NOT NULL AND OLD.status = 'paid' THEN RETURN NEW; END IF;

  sale_unit_id := NEW.unit_id;

  FOR item IN
    SELECT si.product_id, si.quantity
    FROM pos_sale_items si
    WHERE si.sale_id = NEW.id AND si.product_id IS NOT NULL
  LOOP
    FOR ingredient IN
      SELECT ri.item_id, ri.quantity as recipe_qty,
             ri.unit_type as recipe_unit, r.yield_quantity,
             inv.unit_type as inv_unit
      FROM tablet_products tp
      JOIN recipes r ON r.id = tp.recipe_id
      JOIN recipe_ingredients ri ON ri.recipe_id = r.id
      JOIN inventory_items inv ON inv.id = ri.item_id
      WHERE tp.id = item.product_id
        AND ri.source_type = 'inventory'
        AND ri.item_id IS NOT NULL
    LOOP
      -- Convert recipe unit to inventory unit for deduction
      UPDATE inventory_items
      SET current_stock = GREATEST(0,
        current_stock - (item.quantity::numeric / GREATEST(ingredient.yield_quantity, 1))
        * CASE
            WHEN ingredient.recipe_unit = ingredient.inv_unit THEN ingredient.recipe_qty
            WHEN ingredient.recipe_unit = 'g' AND ingredient.inv_unit = 'kg' THEN ingredient.recipe_qty / 1000
            WHEN ingredient.recipe_unit = 'kg' AND ingredient.inv_unit = 'g' THEN ingredient.recipe_qty * 1000
            WHEN ingredient.recipe_unit = 'ml' AND ingredient.inv_unit = 'litro' THEN ingredient.recipe_qty / 1000
            WHEN ingredient.recipe_unit = 'litro' AND ingredient.inv_unit = 'ml' THEN ingredient.recipe_qty * 1000
            ELSE ingredient.recipe_qty
          END
      ), updated_at = now()
      WHERE id = ingredient.item_id AND unit_id = sale_unit_id;
    END LOOP;
  END LOOP;

  RETURN NEW;
END;
$$;
```

#### 4. Adicionar trigger para pedidos Tablet/Delivery também
O trigger atual só cobre `pos_sales`. Criar trigger similar para `tablet_orders` quando status muda para `'delivered'` ou `'completed'`, garantindo baixa automática em todos os canais de venda.

### Arquivos alterados
- `src/components/inventory/ItemFormSheet.tsx` — simplificar formulário
- `src/components/recipes/RecipeSheet.tsx` — remover lógica `hasRecipeUnit`
- `src/components/recipes/IngredientPicker.tsx` — limpar referências
- `src/hooks/useRecipes.ts` — remover select de campos obsoletos
- `src/components/settings/UnitManagement.tsx` — limpar replicação
- **Migração SQL** — corrigir e expandir triggers de baixa automática

### Resultado
- Formulário de item simplificado e profissional
- Sistema de unidades limpo: apenas `unit_type` + `unit_price` no estoque, conversões automáticas nas receitas
- Baixa automática funcionando para POS, Tablet e Delivery

