

# Auditoria Completa do Módulo Financeiro — Problemas Restantes

Após análise detalhada de todos os arquivos do módulo financeiro, identifiquei os seguintes problemas que ainda existem após as correções anteriores:

---

## Problemas Encontrados

### 1. Debounce das sugestões não está conectado
O `TransactionSheet` cria um `debouncedDescription` (linha 208-211) mas passa `description` (sem debounce) para o componente `TransactionSuggestions` (linha 500). O debounce não tem efeito algum — as sugestões ainda recalculam a cada keystroke.

### 2. PersonalFinance com padding inferior insuficiente
`PersonalFinance.tsx` linha 119 usa `pb-24` em vez de `pb-32`, podendo ter conteúdo cortado pela bottom nav.

### 3. Undo/Redo duplicado e inconsistente no PersonalFinance
O `PersonalFinance` renderiza botões de undo/redo no **header** (linhas 123-129) mas **não passa** as props `canUndo`/`canRedo`/`onUndo`/`onRedo` para `FinanceTransactions` (linhas 147-161). Isso significa que na aba de transações pessoais, os botões de undo/redo não aparecem. E no header, ficam visíveis em todas as abas (não só transações), o que é confuso.

### 4. Input de orçamento ainda usa `type="number"`
O `FinancePlanning.tsx` (linha 280) usa `type="number"` para o valor do orçamento, mas deveria usar `type="text"` com `inputMode="decimal"` e formatação monetária, igual ao TransactionSheet.

### 5. FinanceMore com padding inferior insuficiente
`FinanceMore.tsx` linha 46 usa `pb-24` em vez de `pb-32`.

### 6. FinanceCharts sem padding inferior
O `FinanceCharts` provavelmente não tem padding bottom suficiente para a bottom nav (preciso confirmar, mas dado o padrão dos outros componentes, é provável).

---

## Plano de Implementação

### Tarefa 1: Conectar debounce nas sugestões
Em `TransactionSheet.tsx`, trocar `description` por `debouncedDescription` na prop `searchTerm` do `TransactionSuggestions`.

### Tarefa 2: Corrigir padding do PersonalFinance
Trocar `pb-24` por `pb-32` na linha 119 de `PersonalFinance.tsx`.

### Tarefa 3: Corrigir undo/redo no PersonalFinance
- Remover os botões de undo/redo do header do `PersonalFinance.tsx`
- Passar `canUndo`, `canRedo`, `onUndo`, `onRedo` para `FinanceTransactions` (igual ao `Finance.tsx`)

### Tarefa 4: Melhorar input de orçamento no FinancePlanning
Trocar o input de valor do orçamento para usar `inputMode="decimal"` com formatação monetária brasileira.

### Tarefa 5: Ajustar padding inferior em FinanceMore
Trocar `pb-24` por `pb-32`.

### Tarefa 6: Verificar e ajustar padding do FinanceCharts
Garantir `pb-32` no container principal do `FinanceCharts`.

---

## Resumo Técnico

```text
Arquivos afetados:
├── src/components/finance/TransactionSheet.tsx    (tarefa 1)
├── src/pages/PersonalFinance.tsx                  (tarefas 2, 3)
├── src/components/finance/FinancePlanning.tsx      (tarefa 4)
├── src/components/finance/FinanceMore.tsx          (tarefa 5)
├── src/components/finance/FinanceCharts.tsx        (tarefa 6)
```

Todas as mudanças são no frontend. Nenhuma alteração de banco necessária.

