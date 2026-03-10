

## Copilot IA integrado à Agenda — Plano

### O que será feito

Adicionar um **painel inteligente do Copilot** no topo da página Agenda que analisa automaticamente as tarefas do usuário e entrega:

1. **Resumo inteligente do dia** — quantidade de tarefas para hoje, atrasadas, e próximas
2. **Reorganização por prioridade com IA** — botão que envia as tarefas pendentes para o Copilot (via `management-ai`) e recebe de volta uma lista reordenada com prioridades ajustadas baseadas em contexto (datas, atrasos, categorias)
3. **Alertas de compromissos atrasados** — cards visuais destacando tarefas vencidas com contagem de dias
4. **Acesso rápido ao Copilot** — botão que abre o chat do Copilot com contexto pré-carregado da agenda

### Componentes e arquivos

**Novo componente: `src/components/agenda/AgendaAIPanel.tsx`**
- Card no topo da Agenda com resumo: "X atrasadas · Y para hoje · Z sem data"
- Chips de alerta para tarefas vencidas (vermelho) e tarefas de hoje (âmbar)
- Botão "Organizar com IA" que chama a edge function para repriorizar
- Botão de acesso rápido ao Copilot IA (navega para `/copilot`)

**Nova edge function: `supabase/functions/agenda-ai-prioritize/index.ts`**
- Recebe lista de tarefas pendentes do usuário (título, data, prioridade atual, categoria, notas)
- Usa Lovable AI (gemini-3-flash-preview) para analisar e retornar prioridades atualizadas + sugestões
- Retorna: `{ tasks: [{ id, suggested_priority, reason }], summary: string }`

**Modificações:**
- `src/pages/Agenda.tsx` — importar e renderizar `AgendaAIPanel` acima das tabs de visualização
- `src/hooks/useAgenda.ts` — adicionar mutation `bulkUpdatePriorities` para aplicar as prioridades sugeridas pela IA

### Fluxo do usuário

1. Abre a Agenda → vê painel com resumo instantâneo (calculado localmente, sem delay)
2. Tarefas atrasadas aparecem em destaque vermelho com "há X dias"
3. Toca "Organizar com IA" → loading → IA analisa e reordena as tarefas por prioridade real
4. Toast confirma: "Prioridades atualizadas pela IA"
5. Botão do Copilot abre o chat para interação mais profunda

### Detalhes técnicos

- O resumo local (atrasadas/hoje/sem data) é calculado com `useMemo` sobre os tasks existentes — zero latência
- A edge function recebe no máximo 50 tarefas pendentes para evitar tokens excessivos
- O model retorna via tool calling (`reprioritize_tasks`) com schema tipado para garantir output estruturado
- As prioridades são aplicadas em batch via `Promise.all` de updates individuais na tabela `manager_tasks`

