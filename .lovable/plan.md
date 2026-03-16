

## Plano: Atualização automática de preços + Valor no rascunho + Explicação do Contestar

### O que será feito

**1. Adicionar coluna `unit_price` na tabela `order_items`**
- Atualmente `order_items` não possui preço unitário. Será adicionada a coluna `unit_price numeric default 0`.
- Quando os pedidos forem gerados pela cotação (`resolveQuotation`), o preço vencedor será salvo em cada `order_item`.

**2. Atualizar preços do estoque automaticamente ao gerar pedidos**
- Ao resolver a cotação, para cada item vencedor, o `unit_price` do `inventory_items` será atualizado com o preço da cotação vencedora.
- Isso já dispara o trigger existente `record_price_change` que registra o histórico de preços (`supplier_price_history`).

**3. Exibir valor no rascunho do pedido**
- A listagem de rascunhos e a tela de detalhes do pedido passarão a exibir o preço unitário e total de cada item.

---

### Como funciona o "Contestar"

O botão **Contestar** serve para quando você discorda dos preços enviados por um fornecedor e quer pedir que ele revise. O fluxo é:

1. Você clica em **Contestar** ao lado do fornecedor na tela de comparação
2. O status do fornecedor muda para **"Contestada"** e a cotação inteira fica com status **"Contestada"**
3. O fornecedor, ao acessar o link público novamente, vê que precisa **revisar os preços** — os itens contestados ficam destacados em laranja
4. Ele pode enviar novos preços (round 2, 3, etc.)
5. Quando o fornecedor reenvia, o status volta para **"Respondeu"** e você pode comparar novamente
6. Você pode contestar quantas vezes quiser antes de resolver a cotação

Atualmente a contestação é aplicada ao fornecedor inteiro. Seria possível no futuro selecionar itens específicos para contestar.

---

### Alterações técnicas

**Migração SQL:**
- `ALTER TABLE order_items ADD COLUMN unit_price numeric DEFAULT 0`

**`src/hooks/useQuotations.ts` — `resolveQuotation`:**
- Ao montar os winners, buscar o `unit_price` do preço vencedor
- Ao inserir `order_items`, incluir o `unit_price`
- Após gerar pedidos, atualizar `inventory_items.unit_price` para cada item vencedor

**UI dos pedidos (rascunhos):**
- Exibir preço unitário e total (`qty × unit_price`) na listagem de itens do pedido

