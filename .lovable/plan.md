

## Plano: Adaptação Completa para Desktop

O sistema está construído com foco mobile-first. Vários módulos perdem funcionalidade ou aproveitam mal o espaço em telas desktop (>=1024px). Aqui está o plano de adaptação:

---

### 1. Finance — Navegação por Tabs no Desktop
**Problema:** O `FinanceBottomNav` usa `lg:hidden`, então no desktop não há como trocar entre as abas (Home, Transações, Gráficos, Mais).
**Solução:** Adicionar uma barra de tabs horizontal no topo da página Finance, visível apenas em `lg:` breakpoint. A bottom nav permanece no mobile.
- Arquivo: `src/pages/Finance.tsx` — adicionar tabs desktop inline
- Arquivo: `src/components/finance/FinanceBottomNav.tsx` — manter `lg:hidden`

### 2. Dashboard — Layout em Grid no Desktop
**Problema:** Todos os widgets ficam empilhados em coluna única mesmo em telas largas.
**Solução:** Usar `lg:grid lg:grid-cols-2` para distribuir widgets lado a lado no desktop. Widgets largos (finance hero, checklist) ocupam `lg:col-span-2`.
- Arquivo: `src/components/dashboard/AdminDashboard.tsx`

### 3. Finance Home — Grid para Cards
**Problema:** Cards de receita/despesa e contas ficam estreitos em tela larga.
**Solução:** Usar grid responsivo para distribuir cards de contas e summaries.
- Arquivo: `src/components/finance/FinanceHome.tsx`

### 4. Settings — Layout Sidebar + Content no Desktop
**Problema:** No desktop, clicar em uma seção substitui toda a tela. Perde-se o contexto do menu.
**Solução:** No desktop (`lg:`), mostrar menu lateral fixo + conteúdo à direita lado a lado.
- Arquivo: `src/pages/Settings.tsx`

### 5. Inventory — Grid de Items no Desktop
**Problema:** Items ficam em lista estreita no desktop.
**Solução:** Usar `lg:grid-cols-2` para os item cards dentro de cada categoria.
- Arquivo: `src/pages/Inventory.tsx`

### 6. Checklists — Layout mais amplo no Desktop
**Problema:** A date strip e os checklists ficam comprimidos.
**Solução:** Aplicar `max-w-4xl mx-auto` para conteúdo centralizado e melhor legibilidade.
- Arquivo: `src/pages/Checklists.tsx`

### 7. WhatsApp — Já está adaptado
O WhatsApp já tem layout split `lg:w-[340px]` + flex detail. Sem mudanças necessárias.

### 8. Employees/Recipes/Marketing — Ajustes de Grid
**Solução:** Adicionar grids responsivos onde listas são renderizadas em coluna única.
- Arquivos: `src/pages/Employees.tsx`, componentes de lista internos

---

### Resumo técnico
- Todas as mudanças usam classes Tailwind responsivas (`lg:`)
- Nenhuma alteração de lógica/dados — apenas layout
- Mobile permanece inalterado
- Estimativa: ~8-10 arquivos editados

