

# Fix: Modo Timer não funciona nos cards de Abertura/Fechamento

## Problema
O modo timer com botão de play e PIN só está implementado na seção de checklist **bônus** (renderização flat). A seção **standard** (usada para Abertura e Fechamento) ignora completamente o `isTimerMode` — mostra o checkbox vazio normal e abre o popover padrão ao clicar.

## Causa Raiz
No `ChecklistView.tsx`, existem dois blocos de renderização para itens não concluídos:
1. **Bonus** (linhas ~710-870): Tem `handleTimerClick`, ícone de Timer animado, `TimerBadge`, `TimerStatsIndicator`
2. **Standard** (linhas ~1160-1286): Não usa nenhuma prop de timer — sempre mostra checkbox vazio e `setOpenPopover`

## Solução
Replicar a lógica de timer do bloco bonus para o bloco standard (abertura/fechamento):

1. **No item não concluído standard** (linha ~1161-1286):
   - Trocar o `onClick` de `setOpenPopover` para usar `handleTimerClick` quando `isTimerMode` estiver ativo
   - Substituir o checkbox vazio por ícone de Play/Timer quando `isTimerMode` estiver ativo e não houver timer ativo
   - Mostrar `TimerBadge` quando houver timer ativo no item
   - Mostrar `TimerStatsIndicator` com média/recorde quando houver stats disponíveis
   - Adicionar borda visual diferenciada quando timer estiver rodando

## Mudanças Técnicas

### `src/components/checklists/ChecklistView.tsx`
No bloco de renderização de itens não concluídos dentro de subcategorias (standard), na linha ~1161:

- Adicionar variáveis `activeTimer` e `itemStats` (igual ao bonus)
- Trocar o `onClick` do botão para chamar `handleTimerClick` quando timer mode ativo
- Trocar o ícone do checkbox: quando `isTimerMode` e tem timer ativo → Timer animado; quando `isTimerMode` sem timer → Play icon; senão → checkbox normal
- Adicionar `TimerBadge` e `TimerStatsIndicator` no corpo do item
- Adicionar classe de borda quando timer ativo

Nenhuma mudança de banco de dados ou edge function necessária.

