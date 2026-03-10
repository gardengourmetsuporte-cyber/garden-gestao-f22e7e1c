

## Plano: Importação sempre como pago + opção de compensar saldo

### Mudança de conceito

Todas as transações importadas entram como `is_paid = true` (para aparecer nos graficos). A escolha do usuario passa a ser:

- **Compensar saldo**: Antes de importar, o sistema salva o saldo atual de cada conta. Depois da importação (que altera os saldos via trigger), calcula a diferença e cria uma transação de "Ajuste de importação" em cada conta afetada para restaurar o saldo ao valor original.
- **Não compensar**: Importa normalmente e deixa os saldos mudarem conforme o historico importado.

### Arquivos alterados

#### 1. Edge Function: `supabase/functions/import-finance-csv/index.ts`
- Remover modo `historical` / `full_migration`
- Novo parâmetro: `compensateBalance: boolean`
- Sempre inserir com `is_paid: false`, depois UPDATE batch para `is_paid: true` (trigger aplica saldos)
- Se `compensateBalance = true`:
  1. Antes do insert: salvar saldo atual de cada `finance_account` da unidade
  2. Após o UPDATE `is_paid = true`: consultar saldo novo de cada conta
  3. Para cada conta com diferença: inserir transação de ajuste (`type: income` se saldo diminuiu, `type: expense` se aumentou) com `is_paid: true`, descrição "[Ajuste de importação]", amount = |diferença|
- Retorna: `{ imported, skipped, unmatchedCategories, unmatchedAccounts, adjustments: { accountName, oldBalance, newBalance, adjustmentAmount }[] }`

#### 2. Componente: `src/components/finance/FinanceImportSheet.tsx`
- Substituir RadioGroup de modo por nova escolha:
  - **💰 Manter saldos atuais** — "Os saldos das contas permanecem como estão. Um ajuste de caixa será criado automaticamente para compensar."
  - **📊 Recalcular saldos** — "Os saldos das contas serão alterados conforme o histórico importado."
- Mostrar no resultado os ajustes criados (conta, valor anterior, ajuste)

