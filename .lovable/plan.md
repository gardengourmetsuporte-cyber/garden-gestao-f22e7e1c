

# Redesign do Modulo Agenda - Task Manager Premium

## Objetivo
Reconstruir o modulo Agenda com UX de nivel profissional: drag-and-drop instantaneo sem flicker, transicoes fluidas, layout modernizado e navegacao premium.

## Problemas Atuais
- **Flicker no drag-and-drop**: Ao soltar, o item "pula" de volta por um instante porque o React Query invalida e re-busca os dados, causando um flash visual.
- **Layout basico**: Cards simples sem hierarquia visual clara.
- **Sem Optimistic UI real**: O reorder depende de `invalidateQueries` que causa round-trip ao banco.
- **Sensor de toque lento**: 250ms de delay pode parecer travado.

## Solucao

### 1. Optimistic UI com Estado Local (elimina flicker)
O padrao mais confiavel para dnd-kit + React Query e usar um **estado local sincronizado** (`tempTasks`) que absorve o reorder imediatamente, enquanto a mutacao acontece em background.

```text
Fluxo:
[Drag End] --> setTempTasks(reordered) --> mutate(reorder) --> onSettled: setTempTasks(null)
                  |                                                     |
            UI usa tempTasks                                     UI volta pro React Query
```

- `useMemo` decide: se `tempTasks` existe, renderiza ele; senao, renderiza `tasks` do React Query.
- Elimina 100% do flicker sem duplicar logica.

### 2. Layout Modernizado
- **Header compacto** com contadores animados (count-up) de tarefas pendentes/concluidas.
- **Filtro por categoria** via chips horizontais com scroll (ja existe `CategoryChips`, sera reutilizado).
- **Cards de tarefa redesenhados**: bordas laterais coloridas pela categoria, checkbox com animacao de "spring", badge de data com urgencia visual.
- **Secao "Concluidos"** com collapse animado e contador.
- **FAB (Floating Action Button)** para criar tarefas rapidamente, substituindo o botao no header.

### 3. Drag-and-Drop Ultra-Fluido
- **TouchSensor calibrado**: 200ms delay, 5px tolerancia (equilibrio entre scroll e drag).
- **Visual de arraste**: escala 1.03, sombra forte, borda ciano neon sutil (`ring-2 ring-primary/40`).
- **CSS `will-change: transform`** nos itens sortable para otimizar compositing no GPU.
- **`onDragStart`**: feedback haptico via `navigator.vibrate(10)`.
- **`onDragEnd`**: update otimista imediato no estado local.

### 4. Transicoes e Animacoes
- Tarefas concluidas: animacao de "slide-out" antes de remover da lista (300ms fade + translateX).
- Subtarefas: expand/collapse com `max-height` + `opacity` transition.
- Skeleton loaders contextuais em vez de texto "Carregando...".

### 5. Navegacao Lista/Calendario
- Tabs com indicador animado (slider underline que segue o tab ativo).
- Transicao suave entre views com fade-in.

---

## Detalhes Tecnicos

### Arquivos modificados:

**`src/hooks/useAgenda.ts`**
- Adicionar optimistic update no `reorderTasksMutation.onMutate`: usar `queryClient.setQueryData` para atualizar cache imediatamente.
- Adicionar `onError` com rollback para o snapshot anterior.
- Adicionar `onSettled` para invalidar e re-sincronizar.

**`src/pages/Agenda.tsx`**
- Introduzir `tempTasks` estado local para absorver reorder sem flicker.
- Redesenhar header com stats compactos.
- Adicionar FAB flutuante para criar tarefa.
- Melhorar transicoes entre lista e calendario.
- Usar skeleton loaders em vez de texto.
- Adicionar filtro por categoria via `CategoryChips`.
- Feedback haptico no `onDragStart`.

**`src/components/agenda/TaskItem.tsx`**
- Adicionar `will-change: transform` no estilo base.
- Melhorar visual do estado de arraste (sombra + escala + borda neon).
- Animacao de conclusao: checkbox com spring + item faz fade-out antes de sumir.
- Borda lateral colorida pela categoria.
- Badge de data com cores de urgencia mais claras.

**`src/components/agenda/AgendaCalendarView.tsx`**
- Animacao de transicao ao trocar mes.
- Melhorar visual dos indicadores de tarefa nos dias.
- Lista de tarefas do dia selecionado com animacao.

**`src/components/dashboard/AgendaDashboardWidget.tsx`**
- Aplicar mesmo padrao de optimistic UI para o drag-and-drop do widget.

### Nenhuma alteracao de banco de dados necessaria.
A estrutura de `manager_tasks` e `task_categories` ja suporta tudo. As mudancas sao 100% frontend.

