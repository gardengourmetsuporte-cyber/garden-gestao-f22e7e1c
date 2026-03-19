

## Plano: Sistema Profissional de Conversão de Unidades no Cadastro de Estoque

### Problema Atual
O sistema tem dois campos de unidade no item de estoque:
1. **Unidade de controle** (`unit_type`) — kg, g, L, ml, un
2. **Unidade de compra** (`purchase_unit_label` + `purchase_to_stock_factor`) — campo de texto livre (ex: "caixa") + fator de conversão

Falta uma camada clara de **3 níveis de unidade** que é o padrão profissional de sistemas de food service, necessário para a baixa automática funcionar corretamente.

### Modelo Proposto: 3 Níveis de Unidade

```text
┌──────────────────────────────────────────────────┐
│  UNIDADE DE COMPRA (como você compra)            │
│  Ex: Caixa com 24un, Saco de 5kg, Galão de 5L   │
│  Campos: purchase_unit_label + purchase_qty      │
├──────────────────────────────────────────────────┤
│  UNIDADE DE ESTOQUE (como você controla)         │
│  Ex: unidade, kg, litro                          │
│  Campo: unit_type + unit_price (preço/unidade)   │
├──────────────────────────────────────────────────┤
│  UNIDADE DE RECEITA (como a ficha técnica usa)   │
│  Ex: g, ml (subdivisões do estoque)              │
│  Conversão automática: kg↔g, litro↔ml            │
└──────────────────────────────────────────────────┘
```

A conversão entre receita↔estoque já existe no código (`UNIT_CONVERSIONS` em `types/recipe.ts`). O que precisa melhorar é a **UX do cadastro** para tornar isso claro e profissional.

### Alterações

#### 1. Redesign do `ItemFormSheet.tsx` — Cadastro mais guiado
- Reorganizar o formulário em seções visuais claras:
  - **Identificação**: Nome, Categoria, Fornecedor
  - **Controle de Estoque**: Unidade de controle (chips), estoque atual, mínimo, preço por unidade
  - **Conversão de Compra**: Sempre visível (não mais collapsible escondido). Layout visual tipo card com preview da conversão: "1 caixa = 24 unidades → R$ X por caixa"
- Adicionar preview em tempo real da conversão (ex: "Ao usar 200g na receita, serão debitados 0.2 kg do estoque")
- Manter os mesmos campos do banco (`purchase_unit_label`, `purchase_to_stock_factor`)

#### 2. Melhorar `IngredientRow.tsx` — Feedback visual de conversão
- Exibir nota de conversão mais clara quando a unidade da receita difere da unidade de estoque
- Ex: "200g = 0.2 kg no estoque" com ícone de seta

#### 3. Nenhuma migração necessária
- Os campos no banco já suportam o modelo de 3 níveis
- `unit_type` + `unit_price` = estoque
- `purchase_unit_label` + `purchase_to_stock_factor` = compra
- Receita já usa conversão automática via `calculateIngredientCost()`
- Triggers `auto_consume_stock_on_sale` e `auto_consume_stock_on_order` já fazem a conversão kg↔g e litro↔ml

### Detalhes Técnicos

**Arquivos a editar:**
- `src/components/inventory/ItemFormSheet.tsx` — Redesign completo do layout com seções visuais, preview de conversão sempre visível, exemplos contextuais
- `src/components/recipes/IngredientRow.tsx` — Melhorar nota de conversão com feedback visual "X na receita = Y no estoque"

