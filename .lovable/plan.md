
# Melhorias de Estabilidade e Profissionalizacao - Fase 2

## Problemas Identificados na Inspecao

### 1. AppLayout carrega hooks pesados em TODAS as paginas (Impacto Alto)
O `AppLayout` executa `useLeaderboard()`, `usePoints()`, `useModuleStatus()`, e `useTimeAlerts()` em toda pagina, mesmo quando o usuario esta em modulos como Financeiro ou Estoque. Isso gera 9+ queries simultaneas ao backend em cada navegacao.

**Solucao:** Mover `useLeaderboard` para dentro dos componentes que realmente precisam dele (AdminDashboard, EmployeeDashboard, Ranking). No AppLayout, manter apenas o que e usado no header/launcher (points, moduleStatus).

### 2. useBackGuard com bug de cleanup (Impacto Medio)
O hook `useBackGuard` faz `window.history.back()` no cleanup quando o sheet fecha programaticamente. Isso pode causar navegacao indesejada se multiplos sheets usarem o hook simultaneamente ou se o usuario fechar rapido.

**Solucao:** Usar um counter global ou verificar se o history state contem a tag `__backGuard` antes de chamar `back()`.

### 3. Calendario Unificado nao mostra despesas de dias normais (Impacto Medio)
O `useDashboardCalendar` so mostra dias com despesas acima de 2x a media. Dias com despesas normais (mas relevantes) ficam invisiveis. Alem disso, nao mostra receitas.

**Solucao:** Mostrar TODAS as despesas no detalhe do dia (ao clicar), mas manter os chips coloridos apenas para picos. Adicionar receitas como tipo de evento tambem.

### 4. EmployeeDashboard sem Calendario Unificado (Impacto Baixo)
O calendario so aparece no AdminDashboard. Funcionarios nao veem suas tarefas/folgas no calendario.

**Solucao:** Adicionar o `UnifiedCalendarWidget` tambem ao `EmployeeDashboard`.

### 5. CSS com 1200+ linhas sem organizacao (Impacto Baixo, Manutencao)
O arquivo `index.css` tem 1200+ linhas em um unico arquivo. Dificil de manter e pode causar conflitos.

**Solucao:** Nao dividir agora (risco de regressao), mas adicionar comentarios de secao mais claros e remover classes duplicadas/nao usadas.

### 6. Queries do useDashboardCalendar com filtros OR incorretos (Impacto Alto - Bug)
A query de marketing_posts usa `.or()` encadeado de forma que pode retornar posts fora do mes selecionado. A logica de filtro `or(scheduled_at.gte, published_at.gte)` seguida de outro `or(scheduled_at.lte, published_at.lte)` nao garante intersecao correta.

**Solucao:** Corrigir para usar um filtro combinado que busca posts onde `scheduled_at` OU `published_at` estejam dentro do range do mes.

### 7. Falta loading state no UnifiedCalendarWidget (Impacto Baixo)
O calendario nao mostra skeleton/loading enquanto os dados estao sendo carregados, causando um "salto" visual quando os chips aparecem.

**Solucao:** Adicionar skeleton state baseado nos isLoading dos hooks internos.

---

## Plano de Implementacao

### Fase 1: Corrigir bug de query do marketing no calendario
- Editar `src/hooks/useDashboardCalendar.ts`
- Substituir os `.or()` encadeados por um filtro unico que cobre ambas as datas dentro do range

### Fase 2: Remover useLeaderboard do AppLayout
- Editar `src/components/layout/AppLayout.tsx` -- remover import e uso de `useLeaderboard`
- A posicao no ranking (`myPosition`) no header do trophy pode ser obtida de forma mais leve com uma query dedicada so para o user, ou removendo o badge de posicao do header

### Fase 3: Melhorar useBackGuard
- Editar `src/hooks/useBackGuard.ts`
- Verificar `history.state.__backGuard` antes de fazer `back()` no cleanup para evitar navegacao acidental

### Fase 4: Mostrar todas despesas no detalhe do calendario
- Editar `src/hooks/useDashboardCalendar.ts`
- No detalhe do dia (ao clicar), listar todas as despesas daquele dia, nao so picos
- Manter chips coloridos apenas para picos (comportamento atual)

### Fase 5: Adicionar calendario ao EmployeeDashboard
- Editar `src/components/dashboard/EmployeeDashboard.tsx`
- Adicionar `UnifiedCalendarWidget` no topo

### Fase 6: Loading state no calendario
- Editar `src/hooks/useDashboardCalendar.ts` -- retornar `isLoading`
- Editar `src/components/dashboard/UnifiedCalendarWidget.tsx` -- mostrar skeleton durante carregamento

---

## Arquivos que serao editados

| Arquivo | Acao |
|---------|------|
| `src/hooks/useDashboardCalendar.ts` | Editar -- corrigir query marketing, retornar despesas completas, expor isLoading |
| `src/components/layout/AppLayout.tsx` | Editar -- remover useLeaderboard |
| `src/hooks/useBackGuard.ts` | Editar -- verificar history state no cleanup |
| `src/components/dashboard/EmployeeDashboard.tsx` | Editar -- adicionar calendario |
| `src/components/dashboard/UnifiedCalendarWidget.tsx` | Editar -- skeleton loading |

## Resultado Esperado

- Reducao de ~30% nas queries simultaneas ao navegar entre paginas
- Zero navegacoes acidentais ao fechar sheets
- Calendario mostrando dados financeiros completos ao detalhar o dia
- Funcionarios com acesso ao calendario unificado
- Transicao visual suave no carregamento do calendario
