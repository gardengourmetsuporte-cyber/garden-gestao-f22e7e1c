

## Redesenho do Sistema de Unidades para Fichas Técnicas

### Problema Atual
O cadastro de itens tem **3 camadas de unidades** confusas:
1. **Unidade de Estoque** (unidade, kg, litro) + nome customizado + preço
2. **Unidade para Fichas Técnicas** (com fator de conversão e preço separado)
3. **Unidade de Compras** (com fator de conversão para estoque)

Isso gera campos demais e confusão para o usuário entender como o custo é calculado.

### Nova Abordagem: Sistema Unificado de Unidades

**Princípio**: Cada item tem **UMA unidade base** e **UM preço**. As conversões nas receitas são automáticas e transparentes.

```text
ANTES (3 camadas):
┌─────────────┐    ┌──────────────┐    ┌─────────────┐
│ Und. Compra  │ →  │ Und. Estoque │ →  │ Und. Receita │
│ (caixa)      │    │ (pacote)     │    │ (unidade)    │
│ R$ 60        │    │ R$ 11        │    │ R$ 1,83      │
└─────────────┘    └──────────────┘    └─────────────┘

DEPOIS (1 camada + conversões automáticas):
┌──────────────────────────────────────────────┐
│ Item: Hambúrguer 150g                         │
│ Unidade: unidade  |  Preço: R$ 1,83           │
│ Compro por: caixa (1 caixa = 30 unidades)     │ ← opcional
└──────────────────────────────────────────────┘

Na receita: usa "unidade", "kg", "g", etc → conversão automática
```

### Mudanças Planejadas

**1. Simplificar o formulário de item (`ItemFormSheetNew.tsx`)**
- Expandir "Tipo de Controle" para 5 opções: **unidade, kg, g, litro, ml**
- Remover seção "Configurar para Fichas Técnicas" inteira
- Manter seção "Configurar para Compras" (útil, mas isolada)
- O preço é sempre por unidade base escolhida
- Remover campos: `recipe_unit_type`, `recipe_unit_price`, `stock_unit_label`, `stock_to_recipe_factor`

**2. Atualizar types e banco de dados**
- Expandir enum `unit_type` do estoque para incluir `g` e `ml`
- Marcar colunas `recipe_unit_type` e `recipe_unit_price` como deprecated (não remover para não quebrar dados existentes)
- Atualizar trigger `sync_recipe_costs_on_item_price_change` para usar apenas `unit_type` e `unit_price`

**3. Simplificar `IngredientRow.tsx`**
- Usar sempre `item.unit_type` e `item.unit_price` (ignorar recipe_unit_*)
- Manter seletor de unidade compatível (kg↔g, litro↔ml)
- Conversão automática e transparente no cálculo de custo

**4. Atualizar `RecipeSheet.tsx`**
- `handleAddInventoryItem` usa `item.unit_type` e `item.unit_price` diretamente
- Remover referências a `recipe_unit_type`/`recipe_unit_price`

**5. Atualizar `useRecipes.ts`**
- Query não precisa mais buscar `recipe_unit_type`/`recipe_unit_price`
- `updateItemUnit` atualiza `unit_type` diretamente (não mais `recipe_unit_type`)
- `updateItemPrice` atualiza `unit_price` diretamente

**6. Migração de dados existentes**
- SQL migration para mover dados de `recipe_unit_type`/`recipe_unit_price` para `unit_type`/`unit_price` onde fizer sentido
- Adicionar `g` e `ml` ao enum de unit_type do inventário

### Resultado Final
- Cadastro de item: escolhe unidade (un/kg/g/L/ml) + preço = pronto
- Na ficha técnica: adiciona ingrediente, escolhe quantidade na unidade compatível
- Conversão automática e invisível (ex: preço por kg, usa 200g na receita → calcula automaticamente)

