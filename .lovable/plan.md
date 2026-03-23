

# Gerar Pedidos a partir da Pesquisa Global

## O que será feito

Adicionar um botão "Gerar Pedidos" na tela de detalhe da Pesquisa Global (`PriceSurveyDetail.tsx`) que:

1. Para cada item com respostas, seleciona o fornecedor com **menor preço**
2. Calcula a **quantidade sugerida** baseada no estoque mínimo: `max(0, min_stock - current_stock)`
3. Agrupa os itens por fornecedor vencedor
4. Abre um **Sheet de revisão** onde o usuário pode editar quantidades antes de confirmar
5. Ao confirmar, cria pedidos rascunho (draft) no Centro de Pedidos, um por fornecedor

## Fluxo do Usuário

```text
Pesquisa Global (detalhe)
  → Botão "Gerar Pedidos" (aparece quando há respostas)
  → Sheet com lista editável agrupada por fornecedor
    - Cada item mostra: nome, estoque atual, mínimo, qtd sugerida (editável)
    - Pode remover itens que não quer pedir
    - Mostra preço unitário do fornecedor vencedor
  → "Confirmar" → cria pedidos draft → toast sucesso
```

## Arquivos

### 1. Novo: `src/components/orders/GenerateOrdersFromSurveySheet.tsx`
- Sheet/bottom-sheet com a lista de itens agrupada por fornecedor
- Cada fornecedor é uma seção com seus itens
- Campos editáveis de quantidade (Input number)
- Botão remover item
- Totais por fornecedor
- Botão "Gerar X Pedidos"
- Usa `useOrders().createOrder` para criar os pedidos

### 2. Editar: `src/components/orders/PriceSurveyDetail.tsx`
- Adicionar botão "Gerar Pedidos" abaixo da tabela de comparação
- State para controlar abertura do sheet
- Passar dados necessários (itens com melhor preço, inventário com min_stock/current_stock) para o sheet

### 3. Editar: `src/hooks/usePriceSurveys.ts`
- No `fetchSurveyDetail`, incluir `min_stock, current_stock, supplier_id` no select de `inventory_items` (já traz `id, name, unit_type`)

## Lógica de seleção

- Para cada item respondido, pegar o fornecedor com menor `unit_price` (onde `has_item = true`)
- Quantidade sugerida = `max(0, min_stock - current_stock)`, mínimo 1 se o item tem déficit
- O usuário pode alterar antes de enviar

