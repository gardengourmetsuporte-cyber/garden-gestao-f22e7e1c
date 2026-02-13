
# Sistema de Urgencia Temporal com Notificacoes Automaticas

## Visao Geral

Implementar um sistema inteligente que escala a urgencia visual (cores) e dispara notificacoes push automaticamente conforme o horario do dia avanca, criando pressao positiva para completar tarefas operacionais dentro do prazo.

## Regras de Escalacao por Modulo

### Financeiro (`/finance`)
| Horario | Nivel | Cor | Notificacao |
|---------|-------|-----|-------------|
| Inicio do dia | `attention` (laranja) | Amber/Laranja | Nao |
| >= 16:00 | `warning` (laranja pulsante) | Amber pulsante | Sim - "Contas do dia ainda em aberto" |
| >= 18:00 | `critical` (vermelho) | Vermelho + pulse | Sim - "Urgente: tempo acabando para pagamentos" |

### Checklist Abertura (`/checklists`)
| Horario | Nivel | Cor | Notificacao |
|---------|-------|-----|-------------|
| Inicio do dia | `attention` (laranja) | Amber | Nao |
| >= 12:00 | `warning` | Amber pulsante | Sim - "Checklist de abertura incompleto" |
| >= 14:00 | `critical` (vermelho) | Vermelho + pulse | Sim - "Checklist atrasado!" |

### Checklist Fechamento (`/checklists`)
| Horario | Nivel | Cor | Notificacao |
|---------|-------|-----|-------------|
| A partir das 14:00 | `attention` | Amber | Nao |
| >= 18:30 | `warning` | Amber pulsante | Sim |
| >= 21:00 | `critical` | Vermelho | Sim |

### Fechamento de Caixa (`/cash-closing`)
| Horario | Nivel | Cor | Notificacao |
|---------|-------|-----|-------------|
| Pendente | `attention` | Amber | Nao |
| >= 22:00 | `critical` | Vermelho | Sim |

## Icone de Relogio nas Tarefas da Agenda

O icone de relogio (`CalendarDays`) ao lado da data/hora da tarefa mudara de cor conforme a proximidade do vencimento:
- **Verde**: faltam mais de 2 horas
- **Laranja**: faltam menos de 2 horas
- **Vermelho pulsante**: vencida ou faltam menos de 30 minutos

---

## Detalhes Tecnicos

### 1. Hook `useTimeBasedUrgency` (novo arquivo)

Cria um hook reativo que recalcula a cada 60 segundos usando `setInterval`. Retorna o nivel de urgencia para cada modulo com base no horario atual.

```text
src/hooks/useTimeBasedUrgency.ts
- useState para hora atual
- setInterval de 60s para atualizar
- Funcao pura que recebe hora e retorna StatusLevel por modulo
- Exporta funcao getTaskUrgencyColor(dueDate, dueTime) para tarefas
```

### 2. Modificar `useModuleStatus.ts`

Integrar o resultado do `useTimeBasedUrgency` para escalar o nivel dos modulos. A logica sera: se ha pendencias E o horario exige escalacao, o nivel sobe de `attention` para `warning` ou `critical`.

Adicionar nivel `warning` ao tipo `StatusLevel`:
```typescript
export type StatusLevel = 'ok' | 'attention' | 'warning' | 'critical';
```

Incluir a hora atual na queryKey para forcar recalculo quando o intervalo muda:
```typescript
queryKey: ['module-status', userId, unitId, urgencyBucket],
```

### 3. Modificar `AppLayout.tsx`

Adicionar estilo visual para o novo nivel `warning` (laranja pulsante) no indicador de status da sidebar, diferenciando de `attention` (laranja estatico) e `critical` (vermelho pulsante).

### 4. Modificar `TaskItem.tsx`

O icone `CalendarDays` ao lado da data recebera cor dinamica:
- Comparar `due_date` + `due_time` com a hora atual
- Verde se faltam >2h, laranja se <2h, vermelho se <30min ou vencida

### 5. Sistema de Notificacoes Push Temporais (frontend)

Criar um hook `useTimeAlerts` que roda no `AppLayout`:
- Verifica a cada 5 minutos se atingiu um horario-gatilho
- Usa `localStorage` para controlar notificacoes ja disparadas naquele dia (evitar repeticao)
- Insere registros na tabela `notifications` quando um gatilho e ativado
- As notificacoes push ja sao disparadas automaticamente pelo trigger existente `send_push_on_notification`

Chave de controle no localStorage:
```text
time_alerts_fired_{YYYY-MM-DD} = ["finance_16", "checklist_ab_12", ...]
```

### 6. Arquivos a Criar
- `src/hooks/useTimeBasedUrgency.ts` - Hook de urgencia temporal
- `src/hooks/useTimeAlerts.ts` - Disparador de notificacoes baseadas em horario

### 7. Arquivos a Modificar
- `src/hooks/useModuleStatus.ts` - Integrar escalacao temporal
- `src/components/layout/AppLayout.tsx` - Visual do nivel `warning`
- `src/components/agenda/TaskItem.tsx` - Cor dinamica do relogio
- `src/index.css` - Classe de animacao para warning pulsante

### Fluxo de Dados

```text
setInterval(60s) --> useTimeBasedUrgency --> urgencyBucket (hora arredondada)
                                              |
                                              v
                                    useModuleStatus (recalcula status)
                                              |
                                              v
                                    AppLayout sidebar (cor do indicador)

setInterval(5min) --> useTimeAlerts --> verifica gatilhos
                                          |
                                          v
                                    Insere notification no DB
                                          |
                                          v
                                    Trigger send_push_on_notification (push automatico)
```
