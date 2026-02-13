
# Cards Clicaveis no Modulo Financeiro e Sistema Inteiro

## Visao Geral

Tornar todos os cards informativos do sistema clicaveis, com navegacao contextual e feedback visual (hover/active states). O foco principal e o modulo financeiro (tela Home), mas a logica sera replicada em outros modulos.

---

## 1. Finance Home - Cards Clicaveis

Cada card na tela principal do financeiro tera uma acao ao ser clicado:

| Card | Acao ao Clicar |
|------|----------------|
| **Saldo em Contas** | Abre aba "Mais" (gestao de contas) |
| **Receitas** | Navega para aba "Transacoes" com filtro de receitas |
| **Despesas** | Navega para aba "Transacoes" com filtro de despesas |
| **Pendencias** | Navega para aba "Transacoes" com filtro de pendentes |
| **Conta individual** | Abre sheet de edicao da conta (AccountManagement) |

**Arquivo editado:** `src/components/finance/FinanceHome.tsx`
- Adicionar props `onTabChange`, `onAccountClick` e callbacks de filtro
- Envolver cada card em botao/div clicavel com `cursor-pointer`, `hover:scale-[1.01]`, `active:scale-[0.98]`

**Arquivo editado:** `src/pages/Finance.tsx`
- Passar as novas props para `FinanceHome`
- Implementar logica de navegacao entre abas com filtros pre-aplicados

---

## 2. Feedback Visual nos Cards

Adicionar micro-interacoes consistentes em todos os cards clicaveis:
- `cursor-pointer` para indicar clicabilidade
- `hover:scale-[1.01]` e `active:scale-[0.98]` para feedback tatil
- `transition-all duration-200` para suavidade
- Seta discreta (ChevronRight ou ArrowUpRight) nos cards de conta

---

## 3. Replicar em Outros Modulos

### Dashboard (AdminDashboard / EmployeeDashboard)
- Ja possui cards clicaveis -- sem alteracoes necessarias

### Inventario (StatsCard)
- Ja possui `onClick` -- apenas garantir feedback visual consistente

### Perfil (Profile)
- Cards de pontos e conquistas podem navegar para leaderboard/recompensas

---

## 4. Resumo Tecnico de Alteracoes

| Arquivo | Acao | Descricao |
|---------|------|-----------|
| `src/components/finance/FinanceHome.tsx` | Editar | Adicionar onClick nos cards de saldo, receitas, despesas, pendencias e contas |
| `src/pages/Finance.tsx` | Editar | Passar callbacks de navegacao para FinanceHome |
| `src/components/finance/AccountCard.tsx` | Editar | Adicionar visual feedback (hover/active states) |

A maior parte do sistema ja possui cards clicaveis (Dashboard, Inventario). O foco principal e o modulo financeiro que ainda nao tem interatividade nos cards informativos.
