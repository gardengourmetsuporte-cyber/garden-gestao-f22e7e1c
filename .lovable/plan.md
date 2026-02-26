

## Plano: Remover Títulos de Módulo e Reformar Headers de Todas as Páginas

### Problema
Cada página tem um `<header className="page-header-bar">` com um `<h1 className="page-title">` que repete o nome do módulo (ex: "Estoque", "Agenda", "Financeiro"). Isso é redundante — o usuário já sabe onde está pela navegação inferior e pelo sidebar.

### Abordagem
Remover o bloco de título (`h1.page-title`) de todas as páginas. Páginas que têm **ações** no header (botões de adicionar, configurações, filtros) mantêm a barra de header mas sem o título — apenas com as ações alinhadas à direita. Páginas sem ações perdem o header completamente e o conteúdo sobe direto.

### Páginas Afetadas (19 arquivos)

**Grupo A — Header removido por completo** (só tinham título, sem ações):
1. `src/pages/Orders.tsx` — só título "Pedidos"
2. `src/pages/Rewards.tsx` — só título "Recompensas"
3. `src/pages/Ranking.tsx` — só título "Ranking"
4. `src/pages/CashClosing.tsx` — só título "Fechamento de Caixa"
5. `src/pages/Finance.tsx` — só título "Financeiro"
6. `src/pages/PersonalFinance.tsx` — só título "Finanças Pessoais"
7. `src/pages/MenuAdmin.tsx` — só título "Cardápio"
8. `src/pages/TabletAdmin.tsx` — só título "Pedidos Tablet"
9. `src/pages/WhatsApp.tsx` — título + tabs (tabs descem pro conteúdo)
10. `src/pages/Employees.tsx` — só título
11. `src/pages/Gamification.tsx` — título inline (sem page-header-bar)

**Grupo B — Header mantido mas sem título** (têm ações/botões no header):
1. `src/pages/Inventory.tsx` — botão "+" de adicionar item
2. `src/pages/Checklists.tsx` — botão de settings
3. `src/pages/Agenda.tsx` — contadores + dropdown de ações
4. `src/pages/Alerts.tsx` — ações no header
5. `src/pages/Marketing.tsx` — ações no header
6. `src/pages/Recipes.tsx` — botão de adicionar
7. `src/pages/Settings.tsx` — botão de voltar (quando em sub-seção)

### Detalhes Técnicos

**1. Grupo A — Remoção completa do bloco `<header>`**
- Deletar todo o `<header className="page-header-bar">...</header>`
- O conteúdo (`<div className="px-4 py-4 ...">`) fica direto abaixo do `<div className="min-h-screen">`

**2. Grupo B — Header slim (só ações)**
- Remover `<h1 className="page-title">...</h1>` e qualquer wrapper de título
- Manter apenas os botões de ação
- Ajustar layout para `justify-end` (ações alinhadas à direita)
- Para Agenda: manter os contadores pendentes/concluídos como chips discretos ao lado das ações

**3. CSS cleanup (`src/index.css`)**
- Manter as classes `.page-header-bar` e `.page-header-content` (ainda usadas no Grupo B)
- Remover `.page-title` se não for mais usada em nenhum lugar

**4. Settings com sub-seção**
- Quando dentro de uma sub-seção, manter o header com botão de voltar + nome da sub-seção (necessário para navegação)

### Resultado Visual
- Conteúdo sobe ~60px no mobile, aproveitando melhor a tela
- Páginas ficam mais limpas e modernas — o conteúdo fala por si
- Ações permanecem acessíveis no topo quando necessário

