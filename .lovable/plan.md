

# Substituir Sistema de "Novas Transações" por Snackbar de Navegação

## Análise da Situação Atual

O sistema atual usa um conjunto de IDs "vistos" persistido em localStorage (`_seenIds`) para destacar transações criadas nas últimas 48h com um brilho neon ciano. Isso inclui ~80 linhas de lógica de módulo (`_initSeen`, `_persistSeen`, `markSeenGlobal`, `isSeenGlobal`), throttle de localStorage, e um `forceUpdate` para re-render. O usuário reporta que isso atrapalha mais do que ajuda.

## Proposta: Snackbar/Toast Flutuante

Minha recomendação é um **Snackbar flutuante temporário** (estilo "1 transação criada — Ver") que aparece por ~5 segundos após criar/salvar uma transação. Ao clicar "Ver", navega para a aba de transações e faz scroll até a transação.

**Por que não navegar automaticamente:**
- Se o usuário acabou de fechar o caixa e 10 lançamentos entram, ser jogado para a aba de transações 10 vezes seria irritante
- O usuário pode estar no meio de outra tarefa (gráficos, planejamento)
- O snackbar dá **controle ao usuário**: ele vê que algo aconteceu e decide se quer ir ver

**Por que não um balãozinho persistente:**
- Um badge/bolha permanente cria ansiedade visual ("notificação não lida")
- O snackbar some sozinho se o usuário não se importa

## Implementação

### Tarefa 1: Remover todo o sistema de "seen IDs"
- Remover do `FinanceTransactions.tsx`: constantes `FINANCE_SEEN_KEY`, `_seenIds`, `_seenInitialised`, `_initSeen`, `_persistSeen`, `markSeenGlobal`, `isSeenGlobal`, `markSeen`, `isNewTransaction`, `forceUpdate`
- Remover prop `isNew` do `TransactionItem` render
- Remover de `TransactionItem.tsx`: prop `isNew`, lógica de brilho neon condicional

### Tarefa 2: Snackbar "Ver transação" após salvar
- Em `Finance.tsx` e `PersonalFinance.tsx`, após `addTransaction` ou `updateTransaction` retornar com sucesso:
  - Usar `toast()` do Sonner com ação "Ver" que seta `activeTab = 'transactions'`
  - O toast já existe para confirmação ("Transação salva!"), basta adicionar o botão de ação

### Tarefa 3: Scroll automático para transação recente (opcional mas valioso)
- Após navegar via toast, passar o ID da transação recém-criada como state
- Em `FinanceTransactions`, fazer `scrollIntoView` no elemento com aquele ID

## Arquivos Afetados

```text
src/components/finance/FinanceTransactions.tsx  — remover ~80 linhas do sistema seen
src/components/finance/TransactionItem.tsx      — remover prop isNew e estilo neon
src/pages/Finance.tsx                           — toast com ação "Ver"
src/pages/PersonalFinance.tsx                   — toast com ação "Ver"
```

Nenhuma alteração de banco. Resultado: código mais simples, sem localStorage desnecessário, e UX controlada pelo usuário.

