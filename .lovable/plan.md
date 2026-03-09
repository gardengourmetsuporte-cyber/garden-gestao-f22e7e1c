

# Solução: Sistema de Conversão Multi-Unidade para Itens de Estoque

## O Problema

O Brioche precisa operar em 3 contextos diferentes:
- **Estoque**: controlado por **pacote** (cada pacote = 6 unidades)
- **Ficha Técnica**: usa **unidade** individual (1 pão por lanche)
- **Pedido/Compra**: pede por **caixa** (cada caixa = 8 pacotes = 48 unidades)

Hoje o sistema só suporta 2 níveis (estoque + receita). Falta o nível de compra e falta o conceito de "fator de conversão" customizado (ex: 1 pacote = 6 un).

## Solução Proposta

Adicionar campos de **unidade de compra** e **fatores de conversão** no item de estoque, criando 3 camadas:

```text
COMPRA (caixa)          → fator: 48 unidades por caixa
  └─ ESTOQUE (pacote)   → fator: 6 unidades por pacote  
      └─ RECEITA (unidade) → já existe (recipe_unit_type)
```

## Mudanças no Banco de Dados

Nova migration adicionando 4 campos à tabela `inventory_items`:

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `stock_unit_label` | text | Nome customizado da unidade de estoque (ex: "pacote", "saco", "bandeja") |
| `stock_to_recipe_factor` | numeric | Quantas unidades de receita tem em 1 unidade de estoque (ex: 6) |
| `purchase_unit_label` | text | Nome da unidade de compra (ex: "caixa", "fardo") |
| `purchase_to_stock_factor` | numeric | Quantas unidades de estoque tem em 1 unidade de compra (ex: 8) |

## Mudanças na Interface

### 1. Formulário do Item (`ItemFormSheetNew.tsx`)
- Adicionar campo **"Nome da unidade de estoque"** (input texto, ex: "pacote") -- opcional, aparece quando unit_type = unidade
- Adicionar seção **"Configurar para Compras"** (collapsible, similar ao de receitas):
  - Campo "Unidade de compra" (input texto: "caixa", "fardo", etc.)
  - Campo "Qtd de [pacotes] por [caixa]" (numérico, ex: 8)
- Na seção de receitas existente, adicionar campo **"Qtd por [pacote]"** (ex: 6 unidades por pacote)

### 2. Cálculos Automáticos
- **Receita**: O custo unitário na ficha técnica será calculado como `preço_pacote / stock_to_recipe_factor`
- **Compras/Cotações**: Quantidade sugerida convertida para unidade de compra usando `purchase_to_stock_factor`
- **Movimentação**: Continua operando na unidade de estoque (pacote), sem mudanças

### 3. Tipos TypeScript (`database.ts`, `inventory.ts`)
- Atualizar `InventoryItem` com os 4 novos campos

### 4. Hooks Afetados
- `useInventoryDB.ts`: salvar/carregar novos campos
- `useRecipes.ts`: usar `stock_to_recipe_factor` no cálculo de custo quando disponível
- `useStockPrediction.ts`: exibir unidade correta nas previsões
- Cotações/Pedidos: converter para unidade de compra na exibição

## Exemplo Prático (Brioche)

| Configuração | Valor |
|---|---|
| unit_type | unidade |
| stock_unit_label | pacote |
| stock_to_recipe_factor | 6 |
| purchase_unit_label | caixa |
| purchase_to_stock_factor | 8 |
| unit_price | R$ 15,00 (por pacote) |
| recipe_unit_price | R$ 2,50 (= 15/6, por unidade) |

- Estoque: "14 pacotes" 
- Ficha técnica: custo de R$ 2,50/unidade
- Pedido: "2 caixas" (= 16 pacotes)

## Arquivos Modificados

1. **Migration SQL** -- adicionar 4 colunas
2. **`src/types/database.ts`** -- atualizar InventoryItem
3. **`src/components/inventory/ItemFormSheetNew.tsx`** -- nova UI de conversão
4. **`src/hooks/useInventoryDB.ts`** -- salvar novos campos
5. **`src/hooks/useRecipes.ts`** -- usar fator de conversão no custo
6. **`src/types/recipe.ts`** -- atualizar cálculo de custo com fator

