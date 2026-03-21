

# Avaliação IA da Agenda — Diagnóstico com Pontos Fortes, Fracos e Dicas

## O que muda

Adicionar uma seção de **diagnóstico da agenda** no Sheet de sugestões da IA, logo acima da lista de sugestões de prioridade. A IA já recebe todas as tarefas — basta pedir que ela retorne também uma avaliação estruturada.

### 1. Edge Function `agenda-ai-prioritize`
Expandir o tool schema para incluir um campo `evaluation` com:
- `strengths` (array de strings) — pontos fortes da agenda
- `weaknesses` (array de strings) — pontos fracos
- `tips` (array de strings) — dicas práticas
- `score` (number 1-10) — nota geral da organização

Isso é adicionado ao schema existente do `reprioritize_tasks`, sem criar nova função.

### 2. Componente `AgendaAIPanel.tsx`
- Novo state `evaluation` para armazenar a avaliação
- No Sheet, antes da lista de sugestões, renderizar cards visuais:
  - **Nota geral** — círculo com score colorido (verde/amarelo/vermelho)
  - **Pontos fortes** (ícone ✅ verde) — lista compacta
  - **Pontos fracos** (ícone ⚠️ vermelho) — lista compacta
  - **Dicas** (ícone 💡 primário) — lista compacta
- Separador visual entre avaliação e sugestões de prioridade

## Arquivos a editar

1. **`supabase/functions/agenda-ai-prioritize/index.ts`** — adicionar `evaluation` ao schema do tool e ao prompt
2. **`src/components/agenda/AgendaAIPanel.tsx`** — novo state, renderizar seção de avaliação no Sheet

