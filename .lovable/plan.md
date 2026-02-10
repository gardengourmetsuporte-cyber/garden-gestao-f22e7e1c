
# Padronizacao Total do Design System: "Dark Command Center"

Refatoracao completa do design visual de TODOS os modulos para um estilo unico e consistente, com transicoes gestuais entre telas, eliminacao de cards quadrados, e aplicacao uniforme do estilo neon. Zero alteracoes em logica de negocio.

---

## Diagnostico: Inconsistencias Atuais

Cada modulo usa um estilo diferente:

| Modulo | Estilo atual | Problema |
|---|---|---|
| Finance Home | `card-command` com neon | Correto, referencia |
| Dashboard Admin | `card-gradient` com gradientes solidos | Diferente do financeiro |
| Inventory | `page-header` + `card-interactive` basico | Sem neon, sem glow |
| Checklists | `card-interactive` com gradientes amber/indigo | Estilo proprio, cores diferentes |
| Recipes | `Card` (shadcn padrao) com `card-unified` | Estilo generico de ERP |
| CashClosing | `Card` (shadcn padrao) + botao voltar manual | Layout diferente de todos |
| Agenda | `bg-card border` inline | Sem classes do design system |
| Employees | `page-header-unified` (classe que nao existe no CSS) | Header quebrado |
| Rewards | `card-gradient` com gradientes amber | Estilo proprio |
| Settings | `TabsTrigger` com `bg-secondary` | Tabs quadradas, sem neon |
| Auth | `card-base` basico | Sem glow no login |

---

## Solucao: Componentes Unificados + Gestos

### Fase 1: Design System Expandido (CSS)

**Arquivo: `src/index.css`**

Novos utilitarios unificados para padronizar TODOS os modulos:

- `.page-container` -- container padrao de pagina com padding e pb-24
- `.page-header-bar` -- header sticky padrao com glassmorphism e glow inferior (substitui variantes inconsistentes como `page-header`, `page-header-unified`, headers inline)
- `.stat-command` -- stat card com borda neon colorida (substitui `stat-card` basico e `card-gradient`)
- `.stat-command-{variant}` -- variantes de cor (cyan, green, red, amber, purple)
- `.list-command` -- item de lista com borda lateral neon e hover glow
- `.tab-command` -- aba/segmento com estilo neon ativo (substitui tabs quadradas)
- `.empty-state` -- estado vazio padronizado com icone grande e texto
- `.swipe-container` -- container que habilita transicao gestual entre telas

Animacoes novas:
- `pageSlideIn` / `pageSlideOut` -- transicao de entrada/saida ao navegar
- `tabSlideLeft` / `tabSlideRight` -- transicao ao trocar abas com gesto de arrastar

### Fase 2: Componente de Navegacao Gestual

**Novo arquivo: `src/components/ui/swipeable-tabs.tsx`**

Componente reutilizavel que permite arrastar o dedo para trocar entre abas/views:
- Recebe array de tabs com labels e conteudo
- Touch gesture detection para swipe horizontal
- Transicao animada com spring physics
- Indicador de aba ativa com dot neon
- Reutilizavel em: Inventory (Itens/Historico/Pedidos), Checklists (Abertura/Fechamento), Employees (Funcionarios/Folgas), Recipes (Produtos/Bases), Finance (tabs), Settings (tabs)

### Fase 3: Padronizar Admin Dashboard

**Arquivo: `src/components/dashboard/AdminDashboard.tsx`**

- Card de boas-vindas: trocar `card-gradient` para `card-command` com borda neon cyan (igual ao financeiro)
- MetricCard: trocar gradientes solidos por `stat-command-{variant}` com bordas neon e fundo escuro em vez de gradiente colorido
  - Saldo: borda neon verde (positivo) ou vermelha (negativo)
  - Pedidos: borda neon amber
  - Fichas: borda neon purple
  - Estoque: borda neon red
- QuickAccessCard: trocar `card-interactive` basico para `card-command-info` com icones w-6 h-6 e glow hover
- AlertItem: adicionar borda lateral colorida por severidade
- Leaderboard: usar `list-command` nos itens e borda lateral dourada para top 3

### Fase 4: Padronizar Inventory

**Arquivo: `src/pages/Inventory.tsx`**

- Header: trocar `page-header` para `page-header-bar`
- StatsCard: trocar para `stat-command-{variant}` padrao
- View toggle: trocar `view-toggle-group` para `tab-command` com swipe gestual (SwipeableTabs)
- Item cards: adicionar borda lateral colorida pela cor da categoria
- Alert: usar `card-command-warning` em vez de `alert-card`

**Arquivo: `src/components/inventory/StatsCard.tsx`**

- Aplicar `stat-command-{variant}` com borda neon

**Arquivo: `src/components/inventory/ItemCardNew.tsx`**

- Adicionar `list-command` com borda lateral da cor da categoria
- Icone em container com glow sutil

### Fase 5: Padronizar Checklists

**Arquivo: `src/pages/Checklists.tsx`**

- Header: trocar para `page-header-bar`
- Tipo selector (Abertura/Fechamento): substituir por SwipeableTabs gestual com icones neon
  - Abertura: borda neon amber
  - Fechamento: borda neon indigo/purple
- Remover gradientes amber/indigo dos cards e usar `card-command-warning` / `card-command-info`

**Arquivo: `src/components/checklists/ChecklistView.tsx`**

- Setores: usar `card-command` com borda da cor do setor
- Progress bars: adicionar glow na cor do setor
- Items: usar `list-command` com checkbox neon

### Fase 6: Padronizar Recipes

**Arquivo: `src/pages/Recipes.tsx`**

- Remover `Card`/`CardContent` shadcn e usar `stat-command`
- Header: usar `page-header-bar`
- Tabs: substituir `TabsList`/`TabsTrigger` por SwipeableTabs gestual
- Stats: trocar Card shadcn por `stat-command` com bordas neon
- Categorias collapsiveis: usar `card-command` como trigger
- Botao Nova Ficha: integrar no header com glow

### Fase 7: Padronizar Cash Closing

**Arquivo: `src/pages/CashClosing.tsx`**

- Header: trocar layout inline com botao voltar para `page-header-bar` padrao
- Remover `Card`/`CardContent` shadcn e usar `card-command-{variant}`
  - Status enviado: `card-command-warning`
  - Status aprovado: `card-command-success`
  - Status divergencia: `card-command-danger`
- FAB: aplicar estilo `fab-neon-border` igual ao financeiro

### Fase 8: Padronizar Agenda

**Arquivo: `src/pages/Agenda.tsx`**

- Header: usar `page-header-bar`
- View toggle (Lista/Calendario): trocar inline por SwipeableTabs gestual
- Collapsible sections (Pendentes/Concluidos): trocar `bg-card border` para `card-command-info` e `card-command-success`
- Botao + : aplicar glow neon

### Fase 9: Padronizar Employees

**Arquivo: `src/pages/Employees.tsx`**

- Header: trocar `page-header-unified` inexistente para `page-header-bar`
- Tabs: substituir `TabsList`/`TabsTrigger` shadcn por SwipeableTabs gestual
- Layout consistente com padding padronizado

### Fase 10: Padronizar Rewards

**Arquivo: `src/pages/Rewards.tsx`**

- Points card: trocar `card-gradient` com gradiente amber para `card-command` com borda neon amber/dourada
- Header: usar `page-header-bar`
- Product cards: usar `card-command` com borda sutil
- Redemption items: usar `list-command`

### Fase 11: Padronizar Settings

**Arquivo: `src/pages/Settings.tsx`**

- Header: usar `page-header-bar`
- Tabs: substituir grid de TabsTrigger por SwipeableTabs gestual ou lista vertical com `list-command`
  - Cada item com icone neon e seta
  - Ao clicar, abre a secao correspondente
- Container de conteudo: `card-command` em vez de `card-base`

### Fase 12: Padronizar Auth

**Arquivo: `src/pages/Auth.tsx`**

- Card de login: trocar `card-base` para `card-command` com borda neon pulsante
- Logo container: adicionar ring neon
- Botao submit: adicionar `box-shadow` neon glow
- Orbs de fundo: cores neon mais intensas

### Fase 13: Padronizar Leaderboard e UserPointsCard

**Arquivo: `src/components/dashboard/Leaderboard.tsx`**

- Container: `card-command` em vez de `card-base`
- Itens top 3: borda lateral com glow dourado/prata/bronze
- Outros itens: `list-command` padrao

**Arquivo: `src/components/dashboard/UserPointsCard.tsx`**

- Container: `card-command-warning` (borda amber/dourada)

### Fase 14: Padronizar FinanceTransactions e FinanceCharts

**Arquivo: `src/components/finance/FinanceTransactions.tsx`**

- Summary header: trocar `bg-secondary/50 border-y` para `card-command` com borda neon
- Date headers: adicionar borda lateral sutil

**Arquivo: `src/components/finance/FinanceCharts.tsx`**

- Tabs: usar `tab-command` com neon ativo
- Category list items: usar `list-command` com borda da cor da categoria

---

## Resumo de Arquivos

| Arquivo | Mudanca |
|---|---|
| `src/index.css` | Novos utilitarios unificados + animacoes gestuais |
| `tailwind.config.ts` | Keyframes de transicao de pagina |
| `src/components/ui/swipeable-tabs.tsx` | NOVO: componente gestual reutilizavel |
| `src/components/layout/AppLayout.tsx` | Transicoes de navegacao entre paginas |
| `src/components/dashboard/AdminDashboard.tsx` | Cards neon unificados |
| `src/components/dashboard/EmployeeDashboard.tsx` | Cards neon unificados |
| `src/components/dashboard/Leaderboard.tsx` | Estilo command center |
| `src/components/dashboard/UserPointsCard.tsx` | Borda neon amber |
| `src/pages/Inventory.tsx` | Header + stats + swipeable tabs |
| `src/components/inventory/StatsCard.tsx` | Estilo stat-command |
| `src/components/inventory/ItemCardNew.tsx` | Borda lateral neon |
| `src/pages/Checklists.tsx` | Header + swipeable type selector |
| `src/components/checklists/ChecklistView.tsx` | Cards neon por setor |
| `src/pages/Recipes.tsx` | Remover Card shadcn, usar command |
| `src/pages/CashClosing.tsx` | Layout unificado + neon status |
| `src/pages/Agenda.tsx` | Header + swipeable views |
| `src/pages/Employees.tsx` | Header + swipeable tabs |
| `src/pages/Rewards.tsx` | Cards neon amber |
| `src/pages/Settings.tsx` | Lista vertical command |
| `src/pages/Auth.tsx` | Glow neon no login |
| `src/components/finance/FinanceTransactions.tsx` | Summary neon |
| `src/components/finance/FinanceCharts.tsx` | Tabs e lista neon |
| `src/components/finance/FinanceMore.tsx` | Lista command |

---

## Restricoes Mantidas

- Zero alteracoes em hooks, queries, tipos ou logica de negocio
- Todos os modulos, rotas, fluxos e dados permanecem identicos
- Apenas CSS, classes e estrutura JSX visual sao modificados
- O componente SwipeableTabs encapsula a logica gestual sem alterar o conteudo

## Implementacao

Devido ao volume (23+ arquivos), sera implementado em 3 mensagens:
1. Design system base + SwipeableTabs + Dashboard + Inventory + Checklists
2. Recipes + CashClosing + Agenda + Employees + Rewards
3. Settings + Auth + Finance (transactions/charts) + Leaderboard + polimentos finais
