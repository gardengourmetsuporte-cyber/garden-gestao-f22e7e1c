

## Redesign da Tela de Serviço — Visão Operacional Moderna

### Problema
A tela de Serviço atual é uma lista simples de cards empilhados (KPIs horizontais + pedidos + gráfico + entregas). Não transmite a "situação da operação" de forma visual e imediata.

### Nova Arquitetura Visual

```text
┌─────────────────────────────────────┐
│  STATUS GERAL DA OPERAÇÃO (Hero)    │
│  ┌──────┐ ┌──────┐ ┌──────┐        │
│  │ 🟢   │ │ 🟡   │ │ 🔴   │        │
│  │Salão │ │Cozin.│ │Deliv.│        │
│  │Tranq.│ │Moder.│ │Atenc.│        │
│  └──────┘ └──────┘ └──────┘        │
│  "Operação moderada — 21 pedidos"   │
└─────────────────────────────────────┘
┌──────────┐ ┌──────────┐
│ R$ 421   │ │ 21 ped.  │
│ Vendas   │ │ Ativos   │
└──────────┘ └──────────┘
┌──────────┐ ┌──────────┐
│ 3 entreg │ │ 2 hub    │
│ Em rota  │ │ Platafor │
└──────────┘ └──────────┘
┌─────────────────────────────────────┐
│  PIPELINE DE PEDIDOS (Kanban horiz) │
│  Pendente → Preparando → Pronto    │
│  [cards]    [cards]      [cards]    │
└─────────────────────────────────────┘
┌─────────────────────────────────────┐
│  VENDAS POR HORA (gráfico compacto) │
└─────────────────────────────────────┘
┌─────────────────────────────────────┐
│  ENTREGAS & HUB (mantido/polido)    │
└─────────────────────────────────────┘
```

### Componentes a Criar/Alterar

1. **`ServiceDashboardView.tsx`** — Reestruturar layout completo com os novos blocos

2. **Novo: `ServiceOperationStatus.tsx`** — Card hero que calcula o "pulso" da operação:
   - Analisa pedidos ativos, tempo médio de espera, entregas pendentes
   - Classifica em 3 níveis: Tranquilo (verde), Moderado (amarelo), Intenso (vermelho)
   - Mostra 3 indicadores visuais: Salão, Cozinha, Delivery — cada um com seu semáforo
   - Frase resumo gerada automaticamente ("Operação tranquila", "Cozinha sob pressão — 5 pedidos acima de 30min")

3. **Novo: `ServiceOrderPipeline.tsx`** — Substitui o `ServiceActiveOrders` com visão Kanban horizontal:
   - 3 colunas com scroll horizontal: Pendente | Preparando | Pronto
   - Cada card mostra: mesa/número, tempo (com cor), valor
   - Contador por coluna
   - Cards com borda colorida por status (vermelho se > 30min)

4. **KPIs** — Grid 2x2 ao invés de scroll horizontal, cards mais visuais com ícones grandes

5. **`ServiceHourlySales.tsx`** — Mantido, apenas ajuste de espaçamento

6. **`ServiceDeliveryStatus.tsx`** — Mantido com polish visual

### Lógica do "Pulso" (ServiceOperationStatus)

```typescript
// Salão: baseado em pedidos mesa/qrcode ativos e tempo médio
// Cozinha: baseado em pedidos "preparing" e quantos > 15min
// Delivery: baseado em entregas "out" e pedidos hub ativos

type Pulse = 'calm' | 'moderate' | 'intense';

// calm: < 5 pedidos, tempo médio < 10min
// moderate: 5-15 pedidos ou tempo médio 10-25min
// intense: > 15 pedidos ou qualquer > 30min
```

### Arquivos Afetados
- `src/components/dashboard/ServiceDashboardView.tsx` — reescrita
- `src/components/dashboard/ServiceOperationStatus.tsx` — novo
- `src/components/dashboard/ServiceOrderPipeline.tsx` — novo
- `src/components/dashboard/ServiceActiveOrders.tsx` — removido (substituído pelo Pipeline)
- `src/components/dashboard/ServiceHourlySales.tsx` — ajuste menor
- `src/components/dashboard/ServiceDeliveryStatus.tsx` — polish
- `src/hooks/useServiceDashboard.ts` — adicionar cálculo de pulso e agrupamento por status

