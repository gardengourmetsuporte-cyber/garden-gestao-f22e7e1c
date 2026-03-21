

# Ajuste da visualização de opções do checklist + nova opção "Já estava pronto"

## O que muda

### 1. Layout das opções (visual)
Reorganizar o popover de ações do item para ser mais compacto e limpo:
- Reduzir padding dos botões de `p-3` para `p-2.5`
- Reduzir ícones de `w-10 h-10` para `w-8 h-8`
- Tipografia mais enxuta para caber melhor no mobile (428px viewport)
- Separadores mais sutis

### 2. Nova opção: "Já estava pronto"
Adicionar um terceiro botão entre "Quem realizou / Concluí agora" e "Não concluído":
- **Label**: "Já estava pronto"
- **Descrição**: "Sobrou do dia anterior"
- **Visual**: Ícone de check com cor `amber/warning` (diferente do verde de "concluído agora")
- **Comportamento**: Marca como concluído COM pontos (não é skip), mas salva com um campo indicador `completion_note = 'already_ready'` para diferenciar nos relatórios
- **Pontos**: Concede metade dos pontos configurados (ou pontos completos — a definir), pois a tarefa não foi executada, apenas verificada

### 3. Indicador visual no item concluído
Quando um item foi marcado como "já estava pronto", exibir badge `"já pronto"` em amarelo/amber no lugar de `"pronto"` em verde, para que o gestor saiba que não foi feito naquele turno.

## Arquivos a editar

1. **`src/components/checklists/ChecklistView.tsx`**:
   - Ajustar padding/tamanhos nos 4 blocos de popover (admin standard, non-admin standard, admin bonus, non-admin bonus)
   - Adicionar botão "Já estava pronto" com `handleComplete(itemId, configuredPoints, configuredPoints, userId, el, false, true)` — passando novo parâmetro `isAlreadyReady`
   - Atualizar badges de status para mostrar "já pronto" em amber quando aplicável

2. **`src/hooks/checklists/useChecklistCompletions.ts`**:
   - Aceitar novo parâmetro `isAlreadyReady` no `toggleCompletion`
   - Salvar `completion_note: 'already_ready'` no registro

3. **`src/hooks/checklists/useChecklistPage.ts`**:
   - Propagar o parâmetro `isAlreadyReady` de `handleToggleItem` para `toggleCompletion`

4. **Migração SQL**: Adicionar coluna `completion_note` (text, nullable) à tabela `checklist_completions` se não existir

## Detalhes técnicos

- A coluna `completion_note` é nullable text, permitindo valores como `'already_ready'` sem breaking changes
- O item "já estava pronto" NÃO é `is_skipped` — conta como concluído e dá pontos (metade)
- A lógica de produção (`linked_inventory_item_id`) é pulada para itens "já estava pronto" pois não houve produção nova

