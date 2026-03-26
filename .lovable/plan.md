

# Correção: Transações Recorrentes e Sincronização em Tempo Real

## Problemas Identificados

### 1. Transação some ao adicionar repetição
Quando o usuário edita uma transação existente (não-recorrente) e ativa a repetição, o fluxo de salvamento está quebrado:
- O `handleSave` no `TransactionSheet` chama `onSave` em loop (uma vez por parcela)
- Mas `onSave` é o `handleSaveTransaction` da página, que verifica `editingTransaction` - como está editando, **todas as parcelas fazem UPDATE na mesma transação** em vez de criar novas
- Resultado: a transação original é sobrescrita com os dados da última parcela (a mais futura, fora do mês atual), e "some" da tela

### 2. Scanner não atualiza a lista na hora
O `ReceiptOCRSheet` chama `onSave` (que é `handleSaveTransaction`) corretamente, mas:
- Se a transação criada tem uma data fora do mês selecionado, ela não aparece
- Além disso, o `useSmartScanner` invalida `queryKey: ['finance']` que não bate com as chaves reais (`finance-transactions`, `personal-finance-transactions`)

## Solução

### Arquivo 1: `src/components/finance/TransactionSheet.tsx`
- Separar o fluxo de "converter transação existente em recorrente":
  - Primeiro, atualizar a transação original como parcela 1 (com `installment_group_id`, `installment_number: 1`, etc.)
  - Depois, criar as parcelas 2..N como **novas transações** chamando `onSave` sem que `editingTransaction` interfira
- Adicionar um novo callback `onCreateNew` ou usar flag para distinguir "update original" vs "create new installments"

**Abordagem concreta**: Modificar `handleSave` para que, quando estiver editando e o usuário ativar recorrência:
1. Chamar `onSave` normalmente para a parcela 1 (que fará update no original)
2. Para parcelas 2..N, chamar `onSave` passando os dados **sem** `editingTransaction` ativo — isso requer que o `TransactionSheet` receba também um `onAdd` separado ou que a página exponha `addTransaction` diretamente

**Solução mais simples**: Passar um prop `onAddNew` ao `TransactionSheet` para criar parcelas adicionais, mantendo `onSave` para o update da original.

### Arquivo 2: `src/pages/PersonalFinance.tsx` e `src/pages/Finance.tsx`
- Passar `addTransaction` como prop `onAddNew` ao `TransactionSheet`

### Arquivo 3: `src/hooks/useSmartScanner.ts`
- Corrigir as chaves de invalidação de `['finance']` para invalidar as chaves corretas:
  - `{ queryKey: ['finance-transactions'], exact: false }`
  - `{ queryKey: ['finance-accounts'], exact: false }`
  - `{ queryKey: ['personal-finance-transactions'], exact: false }`

## Fluxo Corrigido

```text
Usuário edita transação → Ativa repetição (ex: 6x mensal) → Salva
  → Parcela 1: UPDATE na transação original (adiciona group_id, installment 1/6)
  → Parcelas 2-6: INSERT de novas transações via onAddNew
  → invalidateQueries → lista atualiza com todas as parcelas visíveis
```

