

## Plano: Cancelamento de Pedido com PIN Admin no PDV

### Problema
O botão "Cancelar" no PDV apenas limpa o carrinho. O usuário quer que ele **cancele o pedido de verdade** (no banco), exigindo autenticação por PIN de admin. Também precisa de uma forma de configurar quem tem permissão de cancelamento no PDV, vinculado aos níveis de acesso.

### Mudanças

#### 1. Adicionar sub-módulo de permissão no PDV (`src/lib/modules.ts`)
- Adicionar children ao módulo `menu-admin` (ou criar módulo PDV separado):
  - `menu-admin.pdv-cancel` — "Cancelar pedidos no PDV"
- Isso permite que nos Níveis de Acesso o admin configure quem pode cancelar

#### 2. Lógica de cancelamento no hook (`src/hooks/usePOS.ts`)
- Criar função `cancelOrder(orderId: string)` que:
  - Atualiza `tablet_orders.status = 'cancelled'` para o pedido
  - Se já havia uma `pos_sales` vinculada, marca `pos_sales.status = 'cancelled'` e `cancelled_at = now()`
  - Limpa o carrinho após cancelamento
  - Exibe toast de confirmação

#### 3. Validação de PIN admin no PDV (`src/pages/PDV.tsx`)
- Ao clicar em "Cancelar":
  - Se **não tem pedido ativo** (`activeOrderId` é null): apenas limpa o carrinho (comportamento atual, sem PIN)
  - Se **tem pedido ativo**: abre o `PinDialog` existente
  - Valida o PIN contra a tabela `employees` (mesma lógica do `validatePin` dos checklists)
  - Após validação, verifica se o funcionário do PIN tem permissão `menu-admin.pdv-cancel` no seu nível de acesso
  - Se autorizado, executa o cancelamento

#### 4. Verificação de permissão
- Buscar o `access_level_id` do usuário que digitou o PIN via `user_units`
- Buscar o `modules` (JSONB) do `access_levels` correspondente
- Checar se contém `menu-admin.pdv-cancel`
- Se não tiver permissão, mostrar erro "Sem permissão para cancelar"

#### 5. UI do botão Cancelar (`src/pages/PDV.tsx`)
- Quando `activeOrderId` existe: botão vermelho "Cancelar Pedido" com ícone de X
- Quando não tem pedido ativo: manter comportamento de limpar carrinho (sem PIN)
- Adicionar estado para controlar abertura do PinDialog de cancelamento

#### Arquivos afetados
- `src/lib/modules.ts` — novo sub-módulo de permissão
- `src/hooks/usePOS.ts` — função `cancelOrder`
- `src/pages/PDV.tsx` — PinDialog + lógica de cancelamento com verificação de permissão

