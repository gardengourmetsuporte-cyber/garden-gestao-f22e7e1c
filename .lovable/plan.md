
# Refatoracao Completa de Estabilidade e Profissionalizacao

## Resumo

O aplicativo tem uma base logica solida, mas sofre de travamentos, elementos fora de posicao e instabilidade visual. Esta refatoracao foca em resolver as causas-raiz desses problemas usando padroes modernos de desenvolvimento React.

---

## Problemas Identificados

1. **Sem Error Boundaries** -- qualquer erro de render derruba a tela inteira (tela branca)
2. **`key={location.pathname}` no `<main>`** -- forca remontagem completa de toda a pagina em cada navegacao, causando flicker e perda de estado
3. **AppLayout carrega hooks pesados em todas as paginas** -- `useLeaderboard`, `usePoints`, `useModuleStatus`, `useTimeAlerts` rodam em toda pagina, mesmo quando nao sao necessarios
4. **Popovers dentro de Sheets/Drawers** -- o calendario no TransactionSheet e no CashClosingForm usa Portals que abrem fora do contexto visual do Drawer no mobile, causando layout quebrado e travamentos
5. **`usePoints` busca ate 10.000 registros sem paginacao** -- pode travar a interface em contas com historico longo
6. **Sem protecao global contra erros asincronos** -- promises rejeitadas sem handler podem causar comportamento imprevisivel
7. **CSS com 1200+ linhas em um unico arquivo** -- dificil manutenção, possivel conflito de estilos

---

## Plano de Implementacao

### Fase 1: Error Boundaries (Prioridade Critica)

Criar um componente `ErrorBoundary` global que captura erros de renderizacao e exibe uma tela de recuperacao em vez de tela branca.

- Criar `src/components/ErrorBoundary.tsx` com class component React
- Envolver cada `<Route>` no `App.tsx` com o ErrorBoundary
- Adicionar handler global de `unhandledrejection` no `App.tsx`

### Fase 2: Remover `key={location.pathname}` do AppLayout

O `key={location.pathname}` na tag `<main>` forca remontagem completa do DOM a cada navegacao. Isso causa:
- Flash visual desnecessario
- Perda de scroll position
- Re-inicializacao de todos os hooks filhos

Substituir por transicao CSS suave sem forcar remontagem.

### Fase 3: Substituir Popovers por inline panels dentro de Sheets

Os Popovers do calendario dentro de TransactionSheet e CashClosingForm usam Portals que conflitam com o Drawer do mobile. Substituir por:
- Calendario inline (toggle visibilidade) em vez de Popover
- Mesmo padrao ja usado no ChecklistView com sucesso

Arquivos afetados:
- `src/components/finance/TransactionSheet.tsx` -- calendario de data
- `src/components/cashClosing/CashClosingForm.tsx` -- calendario de data operacional

### Fase 4: Lazy-load de hooks pesados no AppLayout

Mover `useLeaderboard`, `useModuleStatus` e `useTimeAlerts` para serem carregados condicionalmente:
- `useLeaderboard` -- so carregar se o usuario estiver no dashboard ou launcher aberto
- `useModuleStatus` -- manter mas aumentar `staleTime` para 5 minutos
- `useTimeAlerts` -- manter (leve)

### Fase 5: Paginacao no usePoints

Limitar as queries de `checklist_completions` e `reward_redemptions` com filtros de data (ultimos 12 meses) em vez de `limit(10000)`, reduzindo drasticamente o volume de dados transferidos.

### Fase 6: Protecao contra navegacao acidental (padronizar)

Criar um hook reutilizavel `useBackGuard` para proteger Sheets abertas contra o gesto de voltar, em vez de repetir a logica inline. Aplicar em todos os Sheets principais.

---

## Detalhes Tecnicos

### ErrorBoundary

```text
App
 +-- ErrorBoundary (por rota)
      +-- ProtectedRoute
           +-- Page Component
```

### Popovers para Inline

```text
Antes:  Popover > Portal > PopoverContent (fora do Drawer)
Depois: div condicional inline (dentro do Drawer, sem Portal)
```

### Hook useBackGuard

```text
useBackGuard(isOpen, onClose)
  - pushState ao abrir
  - popstate listener fecha o sheet
  - cleanup ao desmontar
```

---

## Arquivos que serao criados/editados

| Arquivo | Acao |
|---------|------|
| `src/components/ErrorBoundary.tsx` | Criar |
| `src/hooks/useBackGuard.ts` | Criar |
| `src/App.tsx` | Editar -- adicionar ErrorBoundary + handler global |
| `src/components/layout/AppLayout.tsx` | Editar -- remover key, lazy hooks |
| `src/components/finance/TransactionSheet.tsx` | Editar -- inline calendar, usar useBackGuard |
| `src/components/cashClosing/CashClosingForm.tsx` | Editar -- inline calendar |
| `src/hooks/usePoints.ts` | Editar -- adicionar filtro de data |
| `src/hooks/useModuleStatus.ts` | Editar -- aumentar staleTime |

---

## Resultado Esperado

- Zero telas brancas -- erros sao capturados e mostram opcao de recuperacao
- Navegacao fluida sem flicker entre paginas
- Sheets/formularios nao travam ao abrir calendarios
- Carregamento inicial mais rapido com menos queries simultaneas
- Gesto de voltar protegido de forma consistente em todos os sheets
