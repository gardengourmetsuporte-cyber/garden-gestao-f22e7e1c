

## Sistema de Lembrete de Contas — Estilo WhatsApp

### Visão Geral

Criar uma Edge Function `bill-reminders` que roda 4x ao dia (08:00, 12:00, 16:00, 20:00 BRT), verifica contas pendentes vencendo hoje ou vencidas, e envia notificações in-app + push com mensagens variadas e tom popular/amigável geradas por IA simples (templates randomizados, sem API externa).

### 1. Edge Function `bill-reminders`

**Arquivo**: `supabase/functions/bill-reminders/index.ts`

**Lógica**:
- Consulta `finance_transactions` onde `type = 'expense'`, `is_paid = false`, `date <= hoje`
- Agrupa: vencendo hoje vs. já vencidas
- Para cada admin com contas pendentes, gera mensagem com tom WhatsApp usando pool de templates:
  - `"Opa! Você tem {n} conta(s) pra pagar hoje 💰 Total: R$ {valor}. Bora resolver?"`
  - `"Ei, não esquece! {n} conta(s) vencendo hoje — R$ {valor}. Já pagou? 👀"`
  - `"Alerta de boleto! 🚨 {n} pendência(s) no valor de R$ {valor}. Melhor não atrasar!"`
  - `"Fala, chefe! Tem R$ {valor} em conta(s) esperando pagamento hoje. Bora quitar? 💪"`
  - Para vencidas: `"⚠️ Atenção! {n} conta(s) vencida(s) — R$ {valor}. Quanto antes pagar, melhor!"`
- Insere notificação na tabela `notifications` com `origin = 'financeiro'`
- Dispara push via `push-notifier`
- Controle de dedup: verifica se já enviou lembrete nas últimas 3h para o mesmo usuário (evita spam se cron disparar duas vezes)

**Config**: Adicionar `[functions.bill-reminders]` ao `config.toml`

### 2. Cron Jobs — 4 horários

**SQL (via insert tool, não migration)**:
- Criar 4 cron jobs chamando a edge function às 08:00, 12:00, 16:00 e 20:00 (horário UTC-3 = 11:00, 15:00, 19:00, 23:00 UTC)
- Habilitar extensões `pg_cron` e `pg_net` se necessário

### 3. Layout WhatsApp nas notificações

**Arquivo**: `src/components/notifications/NotificationCard.tsx`

Refinamentos no card para notificações financeiras:
- Ícone de moeda/cifrão específico para `origin === 'financeiro'`
- Destaque visual para contas vencidas (borda `destructive` sutil)
- Botão de ação rápida "Ver contas" que navega para `/finance`
- Mensagem com formatação de valor em negrito
- Timestamp com "tick" duplo estilo WhatsApp (✓✓)

### 4. Botão de teste no Dashboard

**Arquivo**: `src/components/dashboard/AdminDashboard.tsx` (ou settings)

Adicionar um botão temporário "Testar lembrete" que invoca a edge function manualmente para validar som, vibração e layout em tempo real.

### Arquivos editados/criados

| Arquivo | Ação |
|---|---|
| `supabase/functions/bill-reminders/index.ts` | Criar — edge function de lembretes |
| `supabase/config.toml` | Editar — adicionar `[functions.bill-reminders]` |
| `src/components/notifications/NotificationCard.tsx` | Editar — layout WhatsApp para financeiro |
| `src/components/dashboard/AdminDashboard.tsx` | Editar — botão de teste ao vivo |
| SQL (insert tool) | Cron jobs 4x/dia + extensões |

