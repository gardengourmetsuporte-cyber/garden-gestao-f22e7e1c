

# Atualizar Preços do Estoque a partir da Cotação Global

## Problema
Atualmente, os preços do estoque só são atualizados quando o usuário gera pedidos. Se o usuário seleciona apenas alguns itens para pedir, os demais itens que receberam cotação ficam com preços desatualizados no sistema.

## Solução
Adicionar um botão **"Atualizar Preços no Estoque"** na tela de detalhe da pesquisa (`PriceSurveyDetail`), separado do botão de gerar pedidos. Esse botão pega o **melhor preço** de cada item respondido e atualiza `unit_price` e `supplier_id` na tabela `inventory_items`.

## Arquivos

### 1. `src/components/orders/PriceSurveyDetail.tsx`
- Adicionar botão "Atualizar Preços no Estoque" (ícone `RefreshCw`) ao lado ou acima do botão "Gerar Pedidos"
- Ao clicar, chama uma função que itera todos os `orderItems` (que já têm o melhor preço por item) e faz update em `inventory_items` com `unit_price` e `supplier_id`
- Mostrar confirmação antes (quantos itens serão atualizados)
- Toast de sucesso com quantidade de itens atualizados

### 2. `src/hooks/usePriceSurveys.ts`
- Adicionar mutation `updatePricesFromSurvey` que recebe array de `{ itemId, unitPrice, supplierId }` e faz batch update em `inventory_items` via `Promise.all`

## Fluxo do usuário
1. Abre a pesquisa de preços concluída
2. Vê a comparação de preços
3. Clica em **"Atualizar Preços no Estoque"** → todos os itens com resposta têm seus preços atualizados para o melhor preço encontrado
4. Separadamente, pode clicar em **"Gerar Pedidos"** para criar pedidos apenas dos itens que precisa comprar

## Detalhes técnicos
- O update usa `supabase.from('inventory_items').update({ unit_price, supplier_id }).eq('id', itemId)` em paralelo
- O trigger `record_price_change` já existente registra o histórico automaticamente
- O trigger `sync_recipe_costs_on_item_price_change` já recalcula custos das fichas técnicas automaticamente

