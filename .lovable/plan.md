

## Auditoria: Bugs e Problemas Encontrados

Revisei todos os arquivos das telas de Servico, Equipe, Financeiro e o Dashboard principal. Aqui estao os problemas identificados:

### 1. Bug: `now` nao esta no array de dependencias do `useMemo` (useServiceDashboard.ts)

Nas linhas 142, 152-158 e 175-181, `now` e criado fora do `useMemo` mas usado dentro dele sem estar nas dependencias. Isso faz com que `minutesAgo` fique congelado e nao atualize. Correcao: mover `new Date()` para dentro dos useMemo ou usar `refetchInterval` para forcar recalculo.

### 2. Bug: `awarded_points !== false` esta errado (useTeamDashboard.ts, linha 110)

A condicao `c.awarded_points !== false` compara um campo numerico/null com `false`, o que e sempre `true`. Deveria ser `c.awarded_points !== 0` ou `c.points_awarded > 0`.

### 3. Icone "Target" com nome Lucide em vez de Material Symbols (SalesGoalWidget.tsx, linha 48)

`AppIcon name="Target"` usa nome Lucide. O AppIcon funciona com Material Symbols Rounded. O correto seria `flag_circle` ou `target` (minusculo, se mapeado no ICON_MAP). Precisa verificar se "Target" esta no ICON_MAP, senao mostra texto "Target" em vez de icone.

### 4. Icone "Settings" com nome Lucide (AdminDashboard.tsx, linha 278)

`AppIcon name="Settings"` — precisa verificar se esta no ICON_MAP. O Material Symbols usa `settings` (minusculo).

### 5. Icone "GripVertical" com nome Lucide (DashboardWidgetManager.tsx, linha 83)

`AppIcon name="GripVertical"` — nome Lucide. Deveria ser `drag_indicator` ou verificar o ICON_MAP.

### 6. Widget Manager mostra lista vazia na aba "Servico"

`VIEW_WIDGETS.service` e `new Set([])` — vazio. Quando o usuario abre "Gerenciar tela inicial" na aba Servico, ve uma lista vazia sem nenhuma opcao.

### 7. Imports nao utilizados (AdminDashboard.tsx)

- `DashboardKPIGrid` (linha 12) — importado mas nunca usado
- `AIInsightsWidget` (linha 16) — lazy importado mas nunca renderizado
- `PendingOrdersWidget` (linha 17) — lazy importado mas nunca renderizado
- `LazyChecklist` (linha 27) — lazy importado mas nunca renderizado
- `LazyAutoOrder` (linha 30) — lazy importado mas nunca renderizado
- `LazyCashFlow` (linha 31) — lazy importado mas nunca renderizado

### 8. Linha em branco extra (AdminDashboard.tsx, linhas 75-76 e 186-187)

Duas linhas em branco consecutivas apos o state e dentro do return, nao e um bug funcional mas e inconsistencia de formatacao.

---

### Plano de Correcoes

**Arquivo: `src/hooks/useServiceDashboard.ts`**
- Mover `new Date()` para dentro dos callbacks `useMemo` de `orders` e `hubActive`

**Arquivo: `src/hooks/useTeamDashboard.ts`**
- Corrigir `c.awarded_points !== false` para `c.points_awarded > 0`

**Arquivo: `src/components/dashboard/SalesGoalWidget.tsx`**
- Trocar `AppIcon name="Target"` para `name="flag_circle"` (ou verificar ICON_MAP)

**Arquivo: `src/components/dashboard/AdminDashboard.tsx`**
- Trocar `AppIcon name="Settings"` para `name="settings"` (Material Symbols)
- Remover imports nao utilizados (`DashboardKPIGrid`, `AIInsightsWidget`, `PendingOrdersWidget`, `LazyChecklist`, `LazyAutoOrder`, `LazyCashFlow`)
- Limpar linhas em branco extras

**Arquivo: `src/components/dashboard/DashboardWidgetManager.tsx`**
- Trocar `AppIcon name="GripVertical"` para `name="drag_indicator"`
- Esconder o botao "Gerenciar tela inicial" ou mostrar mensagem quando a view nao tem widgets configuraveis (service)

