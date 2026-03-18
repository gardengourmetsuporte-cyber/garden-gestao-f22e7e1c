

## Plano: Transformar Produção e Bônus em Subgrupos Colapsáveis

### Problema Atual
- O card de Produção funciona como uma "aba separada" (`checklistType='production'`) — ao clicar, muda o tipo e mostra uma lista flat isolada
- As tarefas Bônus também são uma lista flat, sem organização por setores
- O usuário quer que Produção seja um **subgrupo colapsável** dentro do Bônus, e poder criar outros subgrupos

### Solução
Usar os **setores com `scope='bonus'`** como subgrupos visuais dentro da view do Bônus, com headers colapsáveis. A "Produção" será um subgrupo especial (virtual) que agrupa todos os itens com `linked_inventory_item_id`.

### Mudanças

**1. `src/components/checklists/ChecklistView.tsx`**
- Quando `isBonus`, em vez de renderizar uma lista flat, renderizar os **setores bonus** como subgrupos colapsáveis (similar aos setores de abertura/fechamento, mas com visual mais compacto)
- Adicionar um subgrupo virtual "Produção" no final que agrupa itens de produção (com `linked_inventory_item_id`) de qualquer setor
- Remover a lógica separada de `isProduction` — os itens de produção aparecem inline dentro do Bônus
- Cada subgrupo terá: header com ícone + nome + progresso + chevron para expandir/colapsar

**2. `src/pages/Checklists.tsx`**
- Remover o `ChecklistProductionSubCard` e a lógica de `checklistType === 'production'`
- Ao clicar no card Bônus, simplesmente mostra o Bônus com todos os subgrupos (incluindo Produção)
- Simplificar: não precisa mais do estado `'production'` como checklistType

**3. `src/components/checklists/ChecklistTypeCards.tsx`**
- Remover o componente `ChecklistProductionSubCard` (não é mais necessário como card separado)
- Atualizar `ChecklistBonusCard` para remover `productionSlot`
- Opcionalmente, mostrar o progresso combinado (bonus + produção) no card do Bônus

### Visual dos Subgrupos dentro do Bônus

```text
┌─────────────────────────────────┐
│  ▼ Produção          2/3  67%  │
│    ☑ Molde de catupiry    ⚡10  │
│    ☐ Massa de pizza       ⚡10  │
│    ☑ Recheio especial     ⚡5   │
├─────────────────────────────────┤
│  ▼ Limpeza Extra     0/2   0%  │
│    ☐ Limpar vitrine       ⚡3   │
│    ☐ Organizar estoque    ⚡3   │
└─────────────────────────────────┘
```

Cada subgrupo = um setor com `scope='bonus'`. Produção = subgrupo virtual com itens que têm `linked_inventory_item_id`. O fluxo de completar/desfazer produção continua igual (popover → sheet de quantidade → entrada no estoque).

### Arquivos Afetados
- `src/components/checklists/ChecklistView.tsx` — Renderizar bonus como subgrupos colapsáveis
- `src/pages/Checklists.tsx` — Remover lógica de production como tipo separado
- `src/components/checklists/ChecklistTypeCards.tsx` — Simplificar BonusCard, remover ProductionSubCard

