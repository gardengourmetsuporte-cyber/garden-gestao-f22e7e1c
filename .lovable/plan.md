
# Configuracoes de Alertas Temporais por Modulo

## O que sera feito

Criar uma nova tela em Configuracoes chamada "Alertas e Sinalizacao" onde o administrador pode, para cada modulo:

1. **Ativar/desativar** a sinalizacao temporal (switch on/off)
2. **Editar os horarios** de cada gatilho (warning e critical)

Os modulos configuraveis serao:
- Financeiro (horario de aviso e critico)
- Checklist de Abertura (horario de aviso e critico)
- Checklist de Fechamento (horario de aviso e critico)
- Fechamento de Caixa (horario critico)

## Como vai funcionar

Cada modulo tera um card com:
- Nome e icone do modulo
- Switch para ativar/desativar a sinalizacao
- Campos de horario editaveis (formato HH:MM) para os niveis "Aviso" (laranja) e "Critico" (vermelho)
- Os valores padrao serao os atuais ja implementados

As configuracoes serao salvas no banco de dados por unidade, permitindo que cada filial tenha seus proprios horarios.

## Detalhes Tecnicos

### 1. Nova tabela no banco: `time_alert_settings`

```text
Colunas:
- id (uuid, PK)
- user_id (uuid, NOT NULL) -- dono da config
- unit_id (uuid, NULL) -- por unidade
- module_key (text, NOT NULL) -- 'finance', 'checklist_abertura', 'checklist_fechamento', 'cash_closing'
- enabled (boolean, DEFAULT true)
- warning_hour (numeric, NULL) -- ex: 16.0, 18.5
- critical_hour (numeric, NULL) -- ex: 18.0, 21.0
- created_at, updated_at (timestamps)
- UNIQUE(user_id, unit_id, module_key)

RLS: users manage own settings (auth.uid() = user_id)
```

### 2. Novo componente: `TimeAlertSettings`

Arquivo: `src/components/settings/TimeAlertSettings.tsx`

Interface com 4 cards (um por modulo), cada um contendo:
- Switch de ativacao
- Input de horario para nivel "Aviso" (onde aplicavel)
- Input de horario para nivel "Critico"
- Salva automaticamente ao alterar (sem botao "Salvar")

### 3. Novo hook: `useTimeAlertSettings`

Arquivo: `src/hooks/useTimeAlertSettings.ts`

- Busca as configuracoes da tabela `time_alert_settings` para o usuario e unidade ativos
- Se nao existir registro, usa os valores padrao hardcoded
- Expoe funcao `updateSetting(moduleKey, field, value)` com upsert
- Exporta os horarios efetivos para consumo por `useTimeBasedUrgency` e `useTimeAlerts`

### 4. Modificar hooks existentes

**`useTimeBasedUrgency.ts`**: Em vez de horarios hardcoded, receber as configuracoes do `useTimeAlertSettings` e usar os horarios personalizados. Se um modulo estiver desativado, retornar urgency `ok` sempre.

**`useTimeAlerts.ts`**: Filtrar os triggers com base nas configuracoes -- se o modulo estiver desativado, pular o disparo de notificacao. Usar os horarios personalizados em vez dos hardcoded.

### 5. Registrar na pagina de Configuracoes

Adicionar o item "Alertas e Sinalizacao" na secao "Sistema" do menu de configuracoes (`Settings.tsx`), com o icone `Bell` e variante `red`. Visivel apenas para administradores.

### Arquivos a criar
- `src/components/settings/TimeAlertSettings.tsx`
- `src/hooks/useTimeAlertSettings.ts`

### Arquivos a modificar
- `src/pages/Settings.tsx` -- adicionar item no menu
- `src/hooks/useTimeBasedUrgency.ts` -- consumir configuracoes dinamicas
- `src/hooks/useTimeAlerts.ts` -- consumir configuracoes dinamicas

### Migracao SQL
- Criar tabela `time_alert_settings` com RLS
