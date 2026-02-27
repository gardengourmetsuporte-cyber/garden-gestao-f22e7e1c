

## Plano: Configuração de horário limite por card de checklist

### Contexto
Os horários limite estão hardcoded em `checklistTiming.ts` (Abertura: 19:30, Fechamento: 02:00, Bônus: sem limite). O usuário quer poder configurar esses horários diretamente na página de checklists, com um ícone de relógio visível em cada card quando o modo configuração está ativo.

### Alterações

#### 1. Nova tabela `checklist_deadline_settings`
Migração para criar tabela que armazena os horários limite por unidade:
```sql
CREATE TABLE checklist_deadline_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  unit_id uuid NOT NULL REFERENCES units(id) ON DELETE CASCADE,
  checklist_type text NOT NULL, -- 'abertura', 'fechamento', 'bonus'
  deadline_hour int NOT NULL DEFAULT 19,
  deadline_minute int NOT NULL DEFAULT 30,
  is_next_day boolean NOT NULL DEFAULT false, -- true para fechamento (02:00 do dia seguinte)
  updated_at timestamptz DEFAULT now(),
  UNIQUE(unit_id, checklist_type)
);
```
Com RLS policies para leitura por membros da unidade e escrita por admins. Valores default: abertura=19:30, fechamento=02:00 (next_day=true), bonus=null.

#### 2. `src/lib/checklistTiming.ts` — Tornar dinâmico
- Exportar nova função `getChecklistDeadlineCustom(dateStr, type, settings)` que aceita os horários configurados ao invés dos hardcoded
- Manter as funções originais como fallback quando `settings` é `null`

#### 3. `src/hooks/useChecklistDeadlines.ts` — Novo hook
- Query na tabela `checklist_deadline_settings` filtrada por `activeUnitId`
- Função `updateDeadline(type, hour, minute, isNextDay)` para salvar
- Retorna os settings ou defaults hardcoded se não houver registro

#### 4. `src/pages/Checklists.tsx` — Ícone de relógio nos cards
- No modo configuração (`settingsMode === true`), exibir um ícone de relógio (`Schedule`) no canto superior direito de cada card (Abertura, Fechamento, Bônus)
- Ao clicar no ícone, abrir um mini-sheet/popover inline com:
  - Seletor de hora (0-23) e minuto (0, 15, 30, 45)
  - Toggle "Dia seguinte" (para fechamento)
  - Botão salvar
- Integrar o hook `useChecklistDeadlines` para carregar/salvar
- Passar os settings customizados para `getDeadlineInfo` no cálculo de countdown e auto-close

#### 5. Integração com dashboard e auto-close
- `ChecklistDashboardWidget.tsx` também consumirá o hook para usar os horários corretos
- A lógica de auto-close em `Checklists.tsx` usará os horários configurados

