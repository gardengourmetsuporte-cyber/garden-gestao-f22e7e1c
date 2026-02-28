

## Plano de Melhorias — Fase 3: Automações, Relatórios e Performance

### 1. Corrigir warning no console (ReceiveOrderSheet)
- O `ReceiveOrderSheet` tem o mesmo problema de ref que já corrigimos no `AIInsightsWidget` — componente funcional sem `forwardRef` dentro do `SheetContent`
- Identificar o componente problemático e envolver com `React.forwardRef`

### 2. Relatório Financeiro: Exportação de Extrato em CSV
- Adicionar botão "Exportar CSV" na tela de transações (`FinanceTransactions`)
- Gerar CSV com: data, descrição, categoria, valor, tipo, status (pago/pendente), conta
- Permitir exportar o mês selecionado completo

### 3. Automação: Lembrete de contas a vencer (Edge Function)
- Criar edge function `bill-reminders` que roda diariamente (via cron)
- Busca despesas não pagas com vencimento em 1-3 dias
- Cria notificação in-app + push para cada admin
- Diferente do daily-digest: este é específico e acionável

### 4. Fluxo de Caixa Projetado no Dashboard
- O `CashFlowProjection` já existe mas não está integrado no dashboard admin
- Adicionar como widget opcional no `WIDGET_RENDERERS` e `useDashboardWidgets`
- Acessível via dashboard para admins com acesso ao módulo financeiro

### 5. Performance: Lazy load de páginas pesadas
- Verificar se todas as pages em `App.tsx` usam `React.lazy` (algumas podem estar importadas diretamente)
- Garantir que páginas como `WhatsApp`, `Marketing`, `Recipes` são lazy-loaded
- Adicionar prefetch nas rotas mais usadas

### 6. Estoque: Histórico de preços por fornecedor
- Criar tabela `supplier_price_history` com campos: item_id, supplier_id, unit_price, recorded_at, unit_id
- Trigger que registra automaticamente quando `inventory_items.unit_price` muda
- Exibir mini-gráfico de evolução de preço no card do item

### Arquivos a criar/editar:
- `src/components/inventory/ReceiveOrderSheet.tsx` — fix forwardRef
- `src/components/finance/FinanceTransactions.tsx` — botão export CSV
- `src/lib/exportPdf.ts` — adicionar `exportTransactionsCsv()`
- `supabase/functions/bill-reminders/index.ts` — nova edge function
- `src/components/dashboard/AdminDashboard.tsx` — widget cash-flow
- `src/hooks/useDashboardWidgets.ts` — registrar widget
- `src/App.tsx` — verificar lazy imports
- Migration SQL — tabela `supplier_price_history` + trigger

