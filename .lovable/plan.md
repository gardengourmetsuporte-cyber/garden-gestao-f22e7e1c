

## Plano: Nova aba "Serviço" no Dashboard

### Objetivo
Adicionar uma quarta aba **"Serviço"** ao seletor do dashboard, com uma visão em tempo real do operacional durante o turno: pedidos do PDV, comandas, entregas e pedidos de delivery hub (iFood etc).

### Widgets da aba Serviço

1. **KPI Bar** — 4 cards: Vendas hoje (R$), Pedidos ativos, Entregas em andamento, Pedidos delivery hub
2. **Pedidos Ativos** — Lista compacta dos pedidos `tablet_orders` com status pendente/em preparo, agrupados por fonte (balcão, mesa, delivery), com badges de tempo decorrido
3. **Delivery Hub Live** — Cards dos pedidos iFood/Rappi ativos com status e tempo desde recebimento
4. **Vendas do Turno** — Mini gráfico (BarChart) de vendas por hora do dia atual via `pos_sales`
5. **Entregas em Rota** — Resumo das entregas ativas (busca da tabela `deliveries` com status em trânsito)

### Alterações técnicas

**Arquivos criados:**
- `src/hooks/useServiceDashboard.ts` — Hook que busca: vendas do dia (`pos_sales`), pedidos ativos (`tablet_orders`), entregas em rota (`deliveries`), pedidos hub (`delivery_hub_orders`). Usa realtime para tablet_orders e delivery_hub_orders.
- `src/components/dashboard/ServiceDashboardView.tsx` — Componente principal com KPI bar + grid de widgets
- `src/components/dashboard/ServiceActiveOrders.tsx` — Lista de pedidos ativos agrupados por fonte com tempo decorrido
- `src/components/dashboard/ServiceHourlySales.tsx` — Gráfico de barras vendas/hora do dia (Recharts)
- `src/components/dashboard/ServiceDeliveryStatus.tsx` — Cards de entregas ativas e pedidos delivery hub

**Arquivo modificado:**
- `src/components/dashboard/AdminDashboard.tsx` — Expandir `DashboardView` para incluir `'service'`, adicionar botão "Serviço" no seletor com ícone `storefront`, renderizar `ServiceDashboardView` quando ativo, filtrar widgets do grid

### Dados

| Widget | Tabela | Filtro |
|--------|--------|--------|
| Vendas hoje | `pos_sales` | `unit_id`, `status=paid`, `created_at >= hoje` |
| Pedidos ativos | `tablet_orders` | `unit_id`, status in (pending, confirmed, preparing, ready) |
| Delivery hub | `delivery_hub_orders` | `unit_id`, status in (new, accepted, preparing, ready, dispatched) |
| Entregas em rota | `deliveries` | `unit_id`, status in (assigned, picked_up, in_transit) |
| Vendas/hora | `pos_sales` | agrupado por `extract(hour from created_at)` |

Realtime ativo para `tablet_orders` e `delivery_hub_orders` (já existente nos hooks atuais, será reaproveitado).

### Layout mobile (428px)

```text
[Operacional] [Financeiro] [Serviço] [Equipe]
                              ↓
┌──────────┬──────────┐
│ Vendas $ │ Pedidos  │
├──────────┼──────────┤
│ Entregas │ Hub iFood│
└──────────┴──────────┘
┌─────────────────────┐
│ Pedidos Ativos      │
│ (lista scrollável)  │
└─────────────────────┘
┌─────────────────────┐
│ Vendas por Hora     │
│ (BarChart)          │
└─────────────────────┘
┌─────────────────────┐
│ Entregas / Hub Live │
└─────────────────────┘
```

