

## Plano: Adicionar aba "Equipe" ao seletor de visualização do Dashboard

### O que muda

Adicionar um terceiro modo de visualização **"Equipe"** ao seletor já existente (Operacional / Financeiro / Equipe). Quando selecionado, o dashboard mostra widgets focados na performance e status da equipe.

### Widgets da aba Equipe

1. **Team KPI Bar** — Barra horizontal compacta com métricas rápidas: total de funcionários ativos, checklists completados hoje, taxa de aproveitamento (% checklists feitos vs total), pendências do dia
2. **Performance Ranking** — Reusa dados do `EmployeePerformance` / `useTeamAchievements`: ranking com score, barras de progresso, avatar ranked
3. **Gráfico de Aproveitamento** — Recharts `BarChart` mostrando % de conclusão de checklists por funcionário (completados / total disponível)
4. **Gráfico de Rendimento** — Recharts `LineChart` ou `AreaChart` com evolução de pontos ganhos nos últimos 7-14 dias por membro
5. **Pendências** — Lista de itens de checklist não concluídos hoje agrupados por funcionário
6. **Leaderboard** — Reusa o widget existente `LazyLeaderboard`

### Alterações técnicas

**Arquivos modificados:**
- `src/components/dashboard/AdminDashboard.tsx` — Expandir `DashboardView` para `'operational' | 'financial' | 'team'`, adicionar botão "Equipe" no seletor, criar set `TEAM_WIDGETS`, renderizar widgets da aba equipe

**Arquivos criados:**
- `src/components/dashboard/TeamDashboardView.tsx` — Componente que orquestra os widgets da aba equipe
- `src/hooks/useTeamDashboard.ts` — Hook que busca dados agregados: employees ativos, completions do dia, taxa de aproveitamento, pendências por membro, evolução de pontos (últimos 14 dias)
- `src/components/dashboard/TeamUtilizationChart.tsx` — Gráfico de barras de aproveitamento por funcionário (Recharts)
- `src/components/dashboard/TeamTrendChart.tsx` — Gráfico de linha de rendimento ao longo do tempo
- `src/components/dashboard/TeamPendingItems.tsx` — Lista de pendências de checklist não concluídas

### Dados utilizados (tabelas existentes)
- `employees` — lista de funcionários ativos
- `checklist_completions` — completions do dia e histórico
- `checklist_items` — total de itens para calcular taxa de aproveitamento
- `bonus_points` — pontos bônus
- Função `get_leaderboard_data` — reusa para ranking

### Fluxo no Dashboard
```text
[Operacional] [Financeiro] [Equipe]
                              ↓
                    ┌─────────────────┐
                    │  Team KPI Bar   │
                    ├────────┬────────┤
                    │Aproveit│Rendim. │
                    │(BarCht)│(LineCh)│
                    ├────────┴────────┤
                    │  Performance    │
                    │  Ranking        │
                    ├─────────────────┤
                    │  Pendências     │
                    │  do dia         │
                    └─────────────────┘
```

