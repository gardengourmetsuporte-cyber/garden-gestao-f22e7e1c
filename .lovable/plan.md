

## Plano: PIN para cancelar + Histórico de cancelados + Cancelados no fechamento

### 3 funcionalidades solicitadas

**1. PIN obrigatório antes de cancelar pedido**
No `UnifiedOrdersPanel.tsx`, ao clicar em "Cancelar" na Central de Pedidos, abrir o `PinDialog` antes de executar o cancelamento. Validar o PIN com `validatePinWithPermission` usando a permissão `menu-admin.pdv-cancel`. Só prosseguir com `handleUpdateStatus('cancelled')` se autorizado.

**2. Aba/filtro de pedidos cancelados**
Atualmente o `useUnifiedOrders` busca os últimos 100 pedidos, mas não há filtro para ver apenas cancelados. Adicionar um filtro de status na `TabletOrderList` com toggle para mostrar "Cancelados" — um botão/chip no header que permite visualizar pedidos com `status = 'cancelled'` (que já estão na query, só precisam ser filtrados/exibidos).

**3. Vendas canceladas no relatório de fechamento de caixa**
No `CashClosingDetail.tsx`, adicionar uma seção que busca `pos_sales` com `status = 'cancelled'` e pedidos `tablet_orders` com `status = 'cancelled'` no mesmo período do fechamento, exibindo um resumo (quantidade + valor total cancelado).

---

### Alterações por arquivo

| Arquivo | O que muda |
|---|---|
| `src/components/orders/UnifiedOrdersPanel.tsx` | Importar `PinDialog` + `usePOS.validatePinWithPermission`. No `TabletOrderDetailSheet`, interceptar clique no botão "Cancelar" para abrir PIN antes. Adicionar state para PIN dialog. |
| `src/hooks/useUnifiedOrders.ts` | Incluir pedidos cancelados nos memos (não filtrar por status na query, já busca tudo). Adicionar contagem de `cancelledOrders` por aba para exibir. |
| `src/components/orders/UnifiedOrdersPanel.tsx` | Adicionar chip/toggle "Ver cancelados" em cada aba que mostra/oculta pedidos cancelados da lista (por padrão ocultos). |
| `src/components/cashClosing/CashClosingDetail.tsx` | Nova seção "Vendas canceladas" que consulta `pos_sales` canceladas e `tablet_orders` cancelados no intervalo de data do fechamento, mostrando cards com nome, valor e horário. |

### Fluxo do PIN no cancelamento

```text
Usuário clica "Cancelar" → PinDialog abre → Digita PIN 4 dígitos
→ validatePinWithPermission(pin, 'menu-admin.pdv-cancel')
→ Se autorizado: executa handleUpdateStatus('cancelled')
→ Se não: toast.error('Sem permissão para cancelar')
```

