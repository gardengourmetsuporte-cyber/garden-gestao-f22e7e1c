

## Redesign Completo do Dashboard Administrativo

### Conceito

Substituir o layout de accordion por um dashboard moderno estilo **Bento Grid** -- cards de tamanhos variados organizados em seções lógicas, sempre visíveis (sem expandir/colapsar). Layout inspirado em dashboards SaaS modernos (Linear, Vercel, Notion). O gestor vê tudo de relance.

### Estrutura visual

```text
┌─────────────────────────────────────────┐
│  Bom dia, João 👋                       │
│  Sexta, 28 de fevereiro                 │
├─────────────────────────────────────────┤
│                                         │
│  ┌─────────────────────────────────┐    │
│  │  💰 SALDO          R$ 14.949   │    │  ← Hero card (full width, gradient)
│  │  Pendências: R$ 2.300          │    │
│  └─────────────────────────────────┘    │
│                                         │
│  ┌──────────┐ ┌──────────┐              │
│  │ Pedidos  │ │ Contas   │              │  ← KPI cards (grid 2 cols)
│  │    3     │ │    5     │              │
│  └──────────┘ └──────────┘              │
│  ┌──────────┐ ┌──────────┐              │
│  │ Resgates │ │ Estoque  │              │
│  │    1     │ │    4     │              │
│  └──────────┘ └──────────┘              │
│                                         │
│  ┌─────────────────────────────────┐    │
│  │  📋 Checklists (Abertura/Fech.) │    │  ← Full width widget
│  └─────────────────────────────────┘    │
│                                         │
│  ┌─────────────────────────────────┐    │
│  │  📊 Despesas do mês (donut)    │    │  ← Full width
│  └─────────────────────────────────┘    │
│                                         │
│  ┌─────────────────────────────────┐    │
│  │  ⚠️ Contas a vencer            │    │
│  └─────────────────────────────────┘    │
│                                         │
│  ┌─────────────────────────────────┐    │
│  │  💡 Insights da IA             │    │
│  └─────────────────────────────────┘    │
│                                         │
│  ┌─────────────────────────────────┐    │
│  │  📅 Agenda / Calendário        │    │
│  └─────────────────────────────────┘    │
│                                         │
│  ┌─────────────────────────────────┐    │
│  │  🏆 Ranking                    │    │
│  └─────────────────────────────────┘    │
│                                         │
│  ⚙️ Gerenciar tela inicial              │
└─────────────────────────────────────────┘
```

No desktop (lg+), os KPI cards ficam em grid de 4 colunas, e widgets maiores ficam lado a lado em 2 colunas.

### Ordem lógica para o gestor

1. **Saudação + data** (contexto)
2. **Setup onboarding** (só durante configuração inicial)
3. **Hero financeiro** -- saldo é o dado mais importante
4. **KPI cards** -- indicadores rápidos: pedidos pendentes, contas a vencer, resgates, estoque crítico
5. **Checklists** -- operação diária
6. **Gráfico de despesas** -- visão financeira detalhada
7. **Contas a vencer** -- alertas financeiros
8. **Insights IA** -- sugestões inteligentes
9. **Agenda/Calendário** -- próximos compromissos
10. **Pedidos pendentes** -- detalhes dos pedidos
11. **Sugestão de compras** -- reposição automática
12. **Ranking/Leaderboard** -- gamificação
13. **Fluxo de caixa projetado** -- (oculto por padrão)

### Mudanças técnicas

**1. `src/components/dashboard/AdminDashboard.tsx`** -- Reescrever completamente
- Remover import do `DashboardAccordion`
- Renderizar widgets diretamente em seções, cada uma condicional ao `isVisible(key)` e `hasAccess(module)`
- Hero financeiro como card gradient full-width
- KPI grid com 4 mini-cards (pedidos, contas, resgates, estoque)
- Widgets subsequentes como cards independentes com header compacto
- Manter lazy loading nos widgets pesados
- Manter botão "Gerenciar tela inicial" + DashboardWidgetManager

**2. `src/components/dashboard/DashboardKPIGrid.tsx`** -- Novo componente
- Grid de 2x2 (mobile) / 4 cols (desktop) com mini-cards animados
- Cada card: ícone colorido, label, valor numérico grande, tap navega para a seção
- Cores: pedidos=orange, contas=amber, resgates=rose, estoque=red

**3. `src/components/dashboard/DashboardSection.tsx`** -- Novo componente wrapper
- Componente reutilizável que envolve cada widget
- Props: `title`, `icon`, `iconColor`, `children`, `onNavigate?`
- Renderiza header compacto + conteúdo sempre visível
- Sem accordion, sem expand/collapse

**4. `src/index.css`** -- Limpar estilos do accordion
- Remover todas as classes `.dash-accordion-*`
- Adicionar novas classes para o bento grid: `.dash-section`, `.dash-kpi-card`, `.dash-hero`

**5. `src/hooks/useDashboardWidgets.ts`** -- Simplificar
- Remover campo `defaultOpen` (não precisa mais)
- Manter visibilidade e reordenação

**6. Deletar `src/components/dashboard/DashboardAccordion.tsx`**
- Não é mais necessário

### O que permanece intacto

- Todos os widgets internos (FinanceChartWidget, ChecklistDashboardWidget, BillsDueWidget, etc.) continuam como estão
- DashboardWidgetManager com drag-and-drop para reordenar/ocultar
- SetupChecklistWidget
- LazySection para lazy loading
- useDashboardStats e useDashboardWidgets (lógica core)
- EmployeeDashboard (não afetado)

