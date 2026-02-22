
# Calendario Unificado no Dashboard

## Resumo

Criar um widget de calendario mensal no Dashboard que consolida visualmente todos os eventos do sistema: tarefas da Agenda, transacoes financeiras relevantes (dias de pico de gastos), posts de marketing agendados, e escalas de trabalho. O usuario consegue ver a programacao completa do mes em um unico lugar.

---

## Como vai funcionar

O calendario fica no Dashboard entre o bloco de Checklist/Agenda e o Leaderboard. Cada dia mostra pequenos chips coloridos indicando o tipo de evento:

- **Azul** -- Tarefas da Agenda pendentes
- **Verde** -- Tarefas concluidas
- **Vermelho/Laranja** -- Dias com despesas financeiras significativas (ex: folha de pagamento, impostos)
- **Roxo** -- Posts de marketing agendados/publicados
- **Amarelo** -- Escalas de trabalho / folgas programadas

Ao clicar em um dia, um painel inline expande abaixo do calendario mostrando os detalhes daquele dia, agrupados por tipo.

---

## Fontes de dados

| Fonte | Hook existente | Dados usados |
|-------|---------------|-------------|
| Agenda | `useAgenda` | Tarefas com `due_date` |
| Financeiro | Query direta `finance_transactions` | Despesas pagas agrupadas por dia (top dias de gasto) |
| Marketing | `useMarketing` | Posts com `scheduled_at` ou `published_at` |
| Escalas | `useSchedule` | Folgas programadas (`day_off`) |

---

## Plano de implementacao

### 1. Criar hook `useDashboardCalendar`

Um hook dedicado que busca e consolida dados de multiplas fontes para o mes selecionado:

- Reutiliza dados de `useAgenda` (ja carregado no dashboard)
- Faz query leve para transacoes financeiras do mes (apenas `date`, `amount`, `type`, agrupando por dia)
- Busca posts de marketing do mes
- Busca escalas do mes

Retorna um `Map<string, CalendarDayEvents>` onde cada dia contem arrays de eventos tipados.

**Arquivo:** `src/hooks/useDashboardCalendar.ts`

### 2. Criar componente `UnifiedCalendarWidget`

Estrutura visual inspirada no `MarketingCalendarGrid`:

- Navegacao de mes (setas esquerda/direita + botao "Hoje")
- Grid 7 colunas com headers dos dias da semana
- Cada celula mostra o numero do dia + chips coloridos por tipo de evento
- Destaque no dia atual
- Ao clicar, expande um painel inline (como no `AgendaCalendarView`) com detalhes

O painel de detalhes agrupa por secao:
- **Tarefas** -- titulo, horario, categoria (clicavel para abrir TaskSheet)
- **Financeiro** -- total de despesas do dia, principais categorias
- **Marketing** -- posts agendados com status
- **Escalas** -- quem esta de folga

**Arquivo:** `src/components/dashboard/UnifiedCalendarWidget.tsx`

### 3. Criar tipo `CalendarEvent`

Tipo union para representar eventos de diferentes fontes com cores e icones padronizados.

**Arquivo:** `src/types/calendar.ts`

### 4. Integrar no AdminDashboard

Adicionar o widget entre o bloco operacional (Checklist + Agenda) e o Leaderboard, ocupando `col-span-2`.

**Arquivo editado:** `src/components/dashboard/AdminDashboard.tsx`

---

## Detalhes tecnicos

### Otimizacao de queries

As queries financeiras e de marketing para o calendario serao independentes com `staleTime: 5min` para nao sobrecarregar o dashboard. A query de transacoes busca apenas `date` e `amount` (sem dados pesados como `description` ou `notes`).

### Thresholds financeiros

Para marcar dias com "pico de gasto", o sistema calcula a media diaria de despesas do mes e destaca dias que excedem 2x a media. Isso faz com que dias como 5 (folha) e 20 (impostos/vale) aparecam automaticamente sem precisar de configuracao manual.

### Responsividade

O calendario usa o mesmo grid compacto do marketing (`min-h-[4.5rem]` por celula) com chips de 14px de altura para manter legibilidade em telas mobile.

---

## Arquivos

| Arquivo | Acao |
|---------|------|
| `src/types/calendar.ts` | Criar -- tipos CalendarEvent e CalendarDayEvents |
| `src/hooks/useDashboardCalendar.ts` | Criar -- hook que consolida dados de multiplas fontes |
| `src/components/dashboard/UnifiedCalendarWidget.tsx` | Criar -- componente visual do calendario |
| `src/components/dashboard/AdminDashboard.tsx` | Editar -- adicionar o widget no grid |
