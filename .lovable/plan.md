
# Fase 1 — Polimento Visual, UX e Consistencia

## Visao Geral

Aplicar melhorias sistematicas em 4 frentes: animacoes/loading, responsividade mobile, fluxos/usabilidade e consistencia do design system. Foco em impacto maximo com mudancas cirurgicas.

---

## 1. Skeleton Loaders Padronizados

**Problema:** Varios modulos usam `<Skeleton>` de forma inconsistente. O Dashboard mostra apenas "Carregando..." com animate-pulse em texto. Algumas paginas nao tem loading state nenhum (Employees, Chat).

**Solucao:** Criar um componente `PageSkeleton` reutilizavel com variantes por tipo de pagina (lista, grid, dashboard), e aplicar em todas as paginas que ainda usam texto simples ou nao tem loading.

**Arquivos:**
- Criar `src/components/ui/page-skeleton.tsx` — componente com variantes: `list`, `grid`, `dashboard`, `detail`
- Editar `src/pages/DashboardNew.tsx` — substituir "Carregando..." por skeleton de dashboard
- Editar `src/pages/Employees.tsx` — adicionar loading state com skeleton
- Editar `src/pages/Chat.tsx` — adicionar loading skeleton
- Editar `src/pages/Rewards.tsx` — adicionar loading skeleton
- Editar `src/pages/Marketing.tsx` — adicionar loading skeleton

---

## 2. Transicoes de Pagina

**Problema:** Ao navegar entre paginas, o conteudo aparece abruptamente. Ja existe `animate-page-enter` definido no CSS mas nao e usado sistematicamente.

**Solucao:** Aplicar `animate-page-enter` no wrapper de conteudo de todas as paginas via AppLayout.

**Arquivos:**
- Editar `src/components/layout/AppLayout.tsx` — envolver `{children}` com classe `animate-page-enter` usando key baseada no pathname para re-triggerar a animacao a cada navegacao

---

## 3. Botoes com Loading State Inline

**Problema:** Apenas o Auth tem spinner inline nos botoes. Outros modulos (TransactionSheet, ItemFormSheet, etc.) nao mostram feedback visual ao submeter.

**Solucao:** Criar um componente `LoadingButton` que estende `Button` com prop `loading`, mostrando spinner + texto "Aguarde..." automaticamente.

**Arquivos:**
- Criar `src/components/ui/loading-button.tsx`
- Aplicar nos sheets principais: `TransactionSheet`, `ItemFormSheetNew`, `EmployeeSheet`, `RecipeSheet`, `PostSheet`

---

## 4. Empty States Aprimorados

**Problema:** Alguns modulos usam o componente `EmptyState` (Inventario, Receitas, Recompensas), mas outros usam classes CSS cruas (`empty-state`, `empty-state-icon`) com markup manual e inconsistente (TabletAdmin, WhatsApp, MenuAdmin).

**Solucao:** Migrar todos os empty states manuais para usar o componente `EmptyState` padronizado, e adicionar subtitulos mais descritivos.

**Arquivos:**
- Editar `src/pages/TabletAdmin.tsx` — usar componente `EmptyState`
- Editar `src/components/whatsapp/ConversationList.tsx` — usar componente `EmptyState`
- Editar `src/components/menu/MenuGroupContent.tsx` — usar componente `EmptyState`
- Editar `src/components/menu/OptionGroupList.tsx` — usar componente `EmptyState`

---

## 5. Touch Targets e Responsividade Mobile

**Problema:** Ja existe a classe `.touch-target` (min 48px) definida no design system mas nao e aplicada consistentemente. Botoes do header mobile (ranking, chat, bell) tem apenas `p-2` (~36px efetivo).

**Solucao:** Auditar e ajustar touch targets nos pontos criticos:
- Botoes do header mobile no AppLayout
- Itens de lista interativos
- Tabs e filtros

**Arquivos:**
- Editar `src/components/layout/AppLayout.tsx` — aumentar padding dos botoes do header para min 44px
- Editar `src/components/ui/animated-tabs.tsx` — garantir min-height 44px nos tabs

---

## 6. Consistencia Tipografica e Espacamento

**Problema:** Headers de pagina usam inconsistentemente `page-title` vs `text-lg font-bold` vs `text-xl font-bold`. Espacamentos de conteudo variam entre `px-4 py-4` e `p-4`.

**Solucao:** Padronizar todas as paginas para seguir a estrutura:
```text
<AppLayout>
  <div className="min-h-screen bg-background pb-24">
    <header className="page-header-bar">
      <div className="page-header-content">
        <h1 className="page-title">Titulo</h1>
      </div>
    </header>
    <div className="px-4 py-4 lg:px-6 space-y-4">
      {conteudo}
    </div>
  </div>
</AppLayout>
```

**Arquivos a revisar/ajustar:**
- `src/pages/Rewards.tsx`
- `src/pages/Orders.tsx`
- `src/pages/Marketing.tsx`
- `src/pages/Ranking.tsx`

---

## 7. Feedback Haptico Global

**Problema:** Apenas o drag-and-drop de financas tem vibrate. Outros pontos de interacao (FAB, tabs, botoes criticos) nao tem.

**Solucao:** Adicionar `navigator.vibrate(10)` em:
- Clique no FAB (launcher)
- Troca de tabs no AnimatedTabs
- Toggle de checkbox em checklists

**Arquivos:**
- Editar `src/components/layout/AppLayout.tsx` — vibrate no FAB
- Editar `src/components/ui/animated-tabs.tsx` — vibrate na troca de tab

---

## Prioridade de Implementacao

1. Transicoes de pagina (item 2) — impacto global imediato
2. PageSkeleton + aplicacao (item 1) — melhora percepcao de velocidade
3. LoadingButton (item 3) — feedback em acoes criticas
4. Empty states padronizados (item 4) — consistencia visual
5. Touch targets (item 5) — usabilidade mobile
6. Consistencia tipografica (item 6) — polimento fino
7. Feedback haptico (item 7) — toque final premium

---

## Detalhes Tecnicos

### PageSkeleton (novo componente)
```tsx
// Variantes: 'list' | 'grid' | 'dashboard' | 'detail'
// Aceita titulo opcional para skeleton do header
<PageSkeleton variant="list" rows={5} />
<PageSkeleton variant="grid" cols={2} rows={3} />
<PageSkeleton variant="dashboard" />
```

### Transicao de pagina via AppLayout
Envolver children com um div que usa `key={location.pathname}` para re-montar e re-triggerar `animate-page-enter` a cada navegacao.

### LoadingButton
Estende Button com `loading?: boolean` e `loadingText?: string`. Quando loading=true, desabilita o botao e mostra spinner inline.

### Estimativa: ~15-20 arquivos modificados/criados
