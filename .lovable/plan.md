

## Problema

Os ícones na tela de histórico de movimentações estão quebrados, mostrando texto "IRCLEDOWN" / "IRCLEUP" em vez dos ícones corretos. A causa é que o componente `MovementHistoryNew.tsx` usa nomes de ícone `ArrowCircleDown` e `ArrowCircleUp`, mas o mapa de ícones (`iconMap.ts`) registra apenas `ArrowDownCircle` e `ArrowUpCircle`.

## Correção

**Arquivo:** `src/components/inventory/MovementHistoryNew.tsx`

Trocar os nomes dos ícones nas linhas 99 e 139:
- `ArrowCircleDown` → `ArrowDownCircle`  
- `ArrowCircleUp` → `ArrowUpCircle`
- `Progress_activity` → `progress_activity` (Material Symbol direto, já funciona mas padronizar)
- `Delete` → `Trash2` (usar o alias correto do mapa)

São correções de 4 strings — sem mudança estrutural.

