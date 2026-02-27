

## Plano: Toggle ativo/inativo no deadline + restaurar relógio nos cards

### Problema 1: Falta toggle de ativar/desativar
O popover de deadline só permite configurar horário ou remover. O usuário quer um switch simples para ativar/desativar o limite e encerramento automático sem precisar remover a configuração.

### Problema 2: Relógio de tempo restante não aparece nos cards
`getDeadlineInfo` retorna `null` quando não existe setting salvo (opt-in). Se o usuário nunca configurou, o countdown não aparece. Antes existia um comportamento padrão que mostrava o tempo.

---

### Alterações

#### 1. `src/lib/checklistTiming.ts` — Adicionar campo `is_active` ao `DeadlineSetting`
- Adicionar `is_active: boolean` à interface `DeadlineSetting`
- Em `getSettingForType`, retornar `null` se `is_active === false`

#### 2. `src/hooks/useChecklistDeadlines.ts` — Persistir `is_active`
- Incluir `is_active` no upsert da mutation

#### 3. `src/components/checklists/DeadlineSettingPopover.tsx` — Adicionar toggle ativo/inativo
- Adicionar estado `isActive` inicializado a partir de `currentSetting?.is_active ?? true`
- Adicionar Switch "Ativo" no topo do popover, antes dos seletores de hora/minuto
- Quando desativado, mostrar os campos de hora/minuto com opacidade reduzida (desabilitados visualmente)
- Incluir `is_active` no objeto enviado ao `onSave`
- Substituir botão "Remover" pelo toggle — salvar sempre com `is_active: true/false`

#### 4. `src/pages/Checklists.tsx` — Garantir que countdown aparece nos cards
- A lógica já funciona corretamente: se existe setting ativo, o countdown aparece. Com o toggle, o usuário controla isso diretamente.
- Manter o `DeadlineSettingPopover` visível também fora do `settingsMode` (como ícone de relógio no card) para que o admin possa ativar/desativar rapidamente — OU manter só no settingsMode como está, mas garantir que quando ativo o relógio de countdown aparece.

#### 5. Migração de banco — Adicionar coluna `is_active`
```sql
ALTER TABLE checklist_deadline_settings 
ADD COLUMN IF NOT EXISTS is_active boolean NOT NULL DEFAULT true;
```

