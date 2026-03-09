

## Plano: Automatizar aceite de pedidos e migrar gestão para o PDV

### Problema
A tela "Central de Pedidos" (aba `?tab=pedidos` no CardapioHub) é redundante. Pedidos deveriam ser aceitos automaticamente, e o gerenciamento de status deve acontecer no **PDV** (PendingOrdersSheet), **KDS** e **Entregas**.

### Mudanças

**1. Auto-aceitar pedidos no banco de dados**
- Criar migration com trigger que seta `status = 'preparing'` automaticamente quando um novo pedido é inserido na tabela `tablet_orders` (em vez de ficar como `pending`/`awaiting_confirmation`).
- Pedidos já nascem como "Preparando", eliminando a necessidade de aceite manual.

**2. Adicionar botões de status no detalhe do pedido no PDV (`PendingOrdersSheet.tsx`)**
- No footer do `OrderDetailSheet`, além de "Adicionar itens", "Cobrar" e "Despachar", adicionar botões contextuais baseados no status atual:
  - **Preparando** → botão "Marcar como Pronto"
  - **Pronto** → botão "Entregue" (mesa/balcão) ou "Despachar" (delivery)
  - **Cancelar** → botão secundário disponível enquanto não entregue
- Lógica de update de status via Supabase direto no componente.

**3. Remover a aba "Pedidos" do CardapioHub**
- Remover o bloco `if (isPedidos)` do `CardapioHub.tsx` e a referência ao `UnifiedOrdersPanel`.
- Remover a aba "Pedidos" da navegação/tabs do hub do cardápio.
- O componente `UnifiedOrdersPanel.tsx` pode ser mantido por ora (dead code cleanup futuro).

### Arquivos afetados
- **Nova migration SQL** — trigger de auto-aceite
- `src/components/pdv/PendingOrdersSheet.tsx` — botões de status contextual no detalhe
- `src/pages/CardapioHub.tsx` — remover view de pedidos

