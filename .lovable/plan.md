

## Plan: Botão "Dividir" no painel inline do admin (junto com Contestar)

### Resumo
Adicionar o botão "Dividir pontos" no mesmo painel inline que já aparece ao clicar num item completado (onde ficam "Desmarcar" e "Contestar"). O admin seleciona os participantes com checkboxes e confirma — os pontos são divididos igualmente.

### Mudanças

**1. `src/hooks/useChecklists.ts`** — Nova função `splitCompletion`
- Recebe `itemId`, `date`, `checklistType`, `userIds[]` (todos os participantes incluindo o original)
- Busca o completion original para pegar os pontos
- Calcula `pointsPerPerson = Math.floor(originalPoints / userIds.length)`
- Atualiza o registro existente com pontos divididos
- Insere novos `checklist_completions` para os demais participantes (upsert com `onConflict`)
- Invalida caches

**2. `src/components/checklists/ChecklistView.tsx`** — UI no painel inline
- Novo estado: `splittingItemId`, `splitSelectedUsers` (Set de user_ids)
- No painel admin de item completado (aparece 2x: bonus e standard, linhas ~434 e ~764), adicionar entre "Desmarcar" e "Contestar":
  - Botão "Dividir pontos" com ícone `Users` em estilo azul/primary
  - Ao clicar, expande lista de checkboxes com membros da equipe (o completador original vem pré-selecionado)
  - Preview: "X participantes → Y pts cada"
  - Botão "Confirmar divisão"
- Mostrar indicador visual quando item já tem múltiplas completions (ex: "👥 2 participantes" no card completado)

**3. `src/components/checklists/ChecklistView.tsx`** — Props
- Adicionar `onSplitCompletion` prop para receber a função do hook
- Passada pelo componente pai (Checklists page)

**4. `src/pages/Checklists.tsx`** — Conectar a prop
- Passar `splitCompletion` do hook como `onSplitCompletion` para `ChecklistView`

### Layout no painel inline

```text
┌─────────────────────────────────────┐
│ [↩️ Desmarcar item                ] │
│ ─────────────────────────────────── │
│ [👥 Dividir pontos                ] │  ← NOVO
│   ☑ João (completou)               │
│   ☐ Maria                          │
│   ☐ Pedro                          │
│   4 pts ÷ 2 = 2 pts cada           │
│   [Confirmar divisão]              │
│ ─────────────────────────────────── │
│ [⚠️ Contestar                     ] │
└─────────────────────────────────────┘
```

### Sem alterações no banco
O schema já suporta múltiplos registros por item (`item_id, completed_by, date, checklist_type` unique constraint). Cada participante terá seu próprio registro.

