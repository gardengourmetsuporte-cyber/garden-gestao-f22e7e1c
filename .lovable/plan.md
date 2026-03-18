

## Plano: Corrigir Fluxo de Produção no Checklist

### Problemas Identificados

1. **Não pergunta "quem fez"**: O `handleComplete` intercepta itens de produção antes do popover de seleção de funcionário, pulando direto para o `ProductionCompletionSheet`
2. **Sem opção de desfazer**: Ao desmarcar um item de produção, o sistema remove a completion mas **não reverte** a entrada de estoque (`stock_movements`) nem a ordem de produção (`production_orders`)

### Mudanças

**1. `src/components/checklists/ChecklistView.tsx` — Manter fluxo padrão para produção**
- O `handleComplete` NÃO deve interceptar itens de produção antes do popover — deve deixar o popover normal abrir (com "Quem realizou?" para admin, ou "Concluí agora" para não-admin)
- Mover a lógica de detecção de produção para DEPOIS da seleção do usuário, dentro do `executeComplete`
- Ou seja: o fluxo será: **Popover → Seleciona quem fez → Detecta produção → Abre ProductionCompletionSheet → Confirma quantidade → Completa item**

**2. `src/components/checklists/ChecklistView.tsx` — Adicionar opção de desfazer**
- Quando um item de produção já está completo e o usuário clica para desmarcar, mostrar um AlertDialog de confirmação avisando que a entrada de estoque será revertida
- Ao confirmar o desfazer: deletar o `stock_movement` correspondente (filtrado por `notes LIKE '%Produção via checklist%'` + `item_id` + data) e a `production_order` correspondente

**3. `src/hooks/checklists/useChecklistCompletions.ts` — Reverter estoque ao desmarcar produção**
- Adicionar parâmetro opcional `linkedInventoryItemId` ao `toggleCompletion`
- Quando estiver desmarcando (existingCompletions > 0) e o item tem `linkedInventoryItemId`, deletar o `stock_movement` de entrada mais recente com notes contendo "Produção via checklist" para esse item de inventário
- Deletar a `production_order` correspondente

### Fluxo Resultante
```text
Marcar item de produção:
  Clica → Popover (quem fez?) → Seleciona → ProductionCompletionSheet (quantidade) → Confirma → ✅

Desmarcar item de produção:
  Clica → AlertDialog ("Reverter produção e estoque?") → Confirma → Remove completion + stock_movement + production_order → ⬜
```

