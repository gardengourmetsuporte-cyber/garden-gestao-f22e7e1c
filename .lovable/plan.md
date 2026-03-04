
Objetivo: corrigir de forma definitiva o “Erro ao resetar tarefa” no checklist (modo timer), eliminando estados inconsistentes e evitando regressão.

1) Causa raiz identificada
- Há duas implementações do card de item concluído dentro de `ChecklistView.tsx` (blocos duplicados para contextos visuais diferentes).
- Um bloco já foi ajustado para reset sequencial com `try/catch`, mas o outro ainda está no fluxo antigo com `Promise.all` (reset + desmarcar em paralelo), gerando corrida e falha intermitente.
- Além disso, o reset usa `onToggleItem(...)` que cai na regra de “5 minutos” em `useChecklistCompletions.ts`; isso bloqueia desmarcar mesmo quando o usuário tocou explicitamente em “Resetar tarefa”.
- O toast genérico “Erro ao resetar tarefa” mascara o erro real e passa sensação de “bug sem solução”.

2) Plano de implementação
- Padronizar o fluxo de reset em TODOS os blocos duplicados de `ChecklistView.tsx`:
  - fechar popover
  - marcar otimista
  - `await onCancelTimer(item.id, { includeFinished: true })`
  - `await onToggleItem(..., preserveTimerOnUncheck=true, bypassGrace=true)` (novo parâmetro)
  - `try/catch` com rollback visual e erro claro.
- Remover qualquer `Promise.all` em ações críticas de reset/continuar para evitar corrida.
- Em `useChecklistCompletions.ts`, adicionar flag explícita para “reset manual”:
  - manter regra dos 5 min para desmarque normal
  - ignorar regra dos 5 min quando a ação vier do botão “Resetar tarefa”.
- Melhorar mensagens:
  - erro de permissão/regra -> mensagem específica
  - erro inesperado -> toast genérico + log estruturado.
- Garantir invalidação de cache consistente no fim do reset:
  - `checklist-completions`
  - `checklist-active-timers`
  - `checklist-time-stats`
  para UI refletir imediatamente o estado real.

3) Arquivos que serão alterados
- `src/components/checklists/ChecklistView.tsx`
  - unificar handler de reset e handler de continuar nos dois blocos.
- `src/pages/Checklists.tsx`
  - repassar novo parâmetro do reset para o hook de completions.
- `src/hooks/checklists/useChecklistCompletions.ts`
  - adicionar parâmetro de bypass da janela de 5 minutos para reset explícito.
- (Opcional, se necessário) `src/hooks/checklists/useChecklistTimer.ts`
  - apenas ajuste fino de mensagens/retornos para manter semântica alinhada.

4) Resultado esperado
- “Resetar tarefa” volta a funcionar de primeira, sem depender de tempo de conclusão.
- Sem dessintonia entre card/timer/completion.
- Sem erro intermitente por corrida de promises.
- UX previsível: botão mostra exatamente o estado real.

5) Validação (fim a fim)
- Cenários:
  - tarefa concluída há menos de 5 min -> reset funciona
  - tarefa concluída há mais de 5 min -> reset também funciona (quando acionado pelo botão de reset)
  - “Continuar” mantém timer conforme esperado
  - reset em checklist com e sem timer ativo
  - teste em mobile (onde você está vendo o problema) e desktop.
- Critério de aceite:
  - nenhum toast “Erro ao resetar tarefa” em fluxo normal de reset
  - card volta para estado não concluído imediatamente
  - timer/estatísticas não “ressuscitam” após refetch.
