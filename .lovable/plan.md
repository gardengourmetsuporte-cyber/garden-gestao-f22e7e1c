

## Plano: Corrigir transações importadas + ajuste em Janeiro/2020

### O que será feito

Adicionar uma nova action `fix_imported` na edge function `import-finance-csv` que:

1. Busca todas as transações com `[Importado]` nas notas e `is_paid = false` na unidade
2. Salva o saldo atual de cada `finance_account` da unidade
3. Faz UPDATE em batch para `is_paid = true` (trigger atualiza saldos)
4. Consulta os novos saldos e calcula a diferença
5. Cria transações de ajuste com data **2020-01-01** para cada conta afetada, restaurando o saldo original

### Arquivos alterados

#### 1. `supabase/functions/import-finance-csv/index.ts`
- Novo branch: quando `body.action === 'fix_imported'`
- Recebe apenas `unitId`
- Lógica idêntica à compensação já existente, mas operando sobre transações já inseridas

#### 2. `src/components/finance/FinanceMore.tsx`
- Adicionar botão temporário "Corrigir importação anterior" que chama a action `fix_imported`
- Mostra resultado (quantas atualizadas, ajustes criados)
- Pode ser removido depois de usado

