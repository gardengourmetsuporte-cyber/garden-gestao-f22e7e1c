
Objetivo
- Corrigir a regressão de horários no checklist (19:30/02:00), recuperar a visualização correta dos registros de funcionários e adicionar contador discreto de tempo restante sem quebrar o padrão visual.

Diagnóstico confirmado
- Há marcações automáticas `is_skipped=true` indevidas para abertura do dia atual (40 registros), feitas antes do horário de encerramento.
- A tela usa seleção não determinística de conclusão por item (`find`), então quando existem múltiplos registros (feito + não fiz), pode mostrar “não fiz” e esconder o registro real do funcionário.
- O auto-fechamento está permissivo para datas históricas e pode poluir o histórico ao navegar no calendário.

Plano de implementação
1) Centralizar regra de horário do checklist
- Criar utilitário de tempo do checklist (data operacional, deadline, tempo restante) com base fixa no horário operacional esperado (19:30 abertura, 02:00 fechamento).
- Substituir cálculos diretos de `new Date()/parseISO/setHours` em:
  - `src/pages/Checklists.tsx`
  - `src/components/dashboard/ChecklistDashboardWidget.tsx`

2) Blindar o auto-fechamento (não poluir histórico)
- Em `src/pages/Checklists.tsx`, executar auto-close apenas para janelas operacionais válidas:
  - `abertura`: somente para a data operacional de hoje
  - `fechamento`: somente para a data operacional de ontem
- Antes do upsert, buscar completions frescos do alvo (evitar corrida com cache antigo).
- Restringir auto-close a perfil administrativo para evitar múltiplas gravações concorrentes por usuários comuns.

3) Recuperar estado do dia atual para uso imediato
- Aplicar limpeza pontual de dados indevidos de hoje:
  - remover `is_skipped=true` de `abertura` da data operacional atual na unidade ativa.
- Rodar isso no fluxo de correção para deixar “abertura de hoje” zerado e pronto para uso.

4) Garantir que registros de funcionários apareçam corretamente
- Em `src/hooks/useChecklists.ts`, ordenar retorno de completions priorizando registros não-skipped.
- Em `src/components/checklists/ChecklistView.tsx`, trocar lookup simples por agrupamento por item:
  - escolher registro principal com prioridade para conclusão real do funcionário
  - manter skipped como fallback
- Quando houver múltiplos registros no item, exibir indicador discreto de quantidade de registros (sem poluir layout).

5) Adicionar contador discreto por módulo de checklist
- Em `src/pages/Checklists.tsx` (cards Abertura/Fechamento), incluir chip pequeno:
  - “Encerra em Xh Ym” / “Encerrado”
- Em `src/components/dashboard/ChecklistDashboardWidget.tsx`, repetir contador em versão compacta no mesmo padrão visual.
- Bônus mantém sem prazo (ou rótulo neutro “sem prazo”), sem destaque agressivo.

Arquivos previstos
- `src/pages/Checklists.tsx`
- `src/components/checklists/ChecklistView.tsx`
- `src/hooks/useChecklists.ts`
- `src/components/dashboard/ChecklistDashboardWidget.tsx`
- `src/lib/*` (novo utilitário de tempo de checklist)

Validação (fim a fim)
- Abrir checklist antes de 19:30: abertura não pode aparecer auto-completa por “não fiz”.
- Verificar ontem: itens com conclusão real de funcionário devem aparecer corretamente.
- Confirmar que o contador atualiza sem quebrar cards no mobile/PWA.
- Testar navegação entre datas para garantir que histórico antigo não seja auto-marcado indevidamente.

Detalhes técnicos
- Não será necessária mudança de schema.
- Haverá ajuste de dados (limpeza pontual) e correção de lógica no frontend.
- A lógica de tempo ficará centralizada para evitar novos desvios de horário em widgets e página principal.
