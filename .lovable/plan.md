

# Plano de Revisão Completa do Módulo Financeiro

## Problemas Identificados

### 1. Performance e Lentidão

**1a. FinancePlanning cria segunda instância do useFinance**
Em `FinancePlanning.tsx` (linha 24), o componente importa e chama `useFinance(selectedMonth)` internamente, criando uma segunda cópia completa de contas, categorias e transações — duplicando queries e consumindo memória. Os dados já existem no componente pai (`Finance.tsx`) e devem ser passados via props.

**1b. Sugestões de transação recalculadas em cada keystroke**
O `TransactionSuggestions` recebe `allTransactions` (array potencialmente grande) e recalcula `useMemo` a cada mudança de `searchTerm`. Sem debounce, cada tecla dispara filtro e sort sobre toda a lista.

**1c. Persistência de "seen IDs" em localStorage a cada marcação**
Em `FinanceTransactions.tsx`, `_persistSeen()` serializa e salva em `localStorage` toda vez que um ID é marcado como visto — sem throttle. Em listas grandes, isso causa micro-travamentos.

### 2. Bugs Funcionais

**2a. Clique em transação nova não abre o editor**
Na `FinanceTransactions.tsx` (linhas 358-362), quando `isNewTransaction` retorna true, o `onClick` apenas chama `markSeen` e faz `return` sem abrir o editor. O usuário precisa clicar duas vezes para editar uma transação recém-criada.

**2b. Primeiro clique no campo de valor não foca corretamente**
O campo de descrição é renderizado antes do valor, mas não há auto-focus no campo de valor após selecionar uma sugestão. O usuário preenche a descrição, seleciona a sugestão (que preenche categoria/conta/fornecedor), mas o cursor não vai automaticamente para o campo de valor.

**2c. isPaid não reflete data selecionada ao abrir nova transação**
Ao abrir o TransactionSheet, `isPaid` é sempre `true` (linha 188). Se o usuário seleciona a data futura via sugestão ou via "Outros", o toggle muda, mas ao selecionar "Hoje" novamente, o toggle não retorna a `true` automaticamente (o `handleDateChange` só muda para `false`).

### 3. UX e Intuitividade

**3a. Sem feedback visual ao salvar — tela simplesmente fecha**
O `handleSave` fecha o sheet silenciosamente sem toast de confirmação. O usuário não sabe se a transação foi salva.

**3b. Campo de valor com `type="number"` é problemático no mobile**
O input usa `type="number"` que abre teclado numérico inconsistente entre dispositivos. Melhor usar `inputMode="decimal"` com `type="text"` e formatação manual de moeda.

**3c. Sugestões desaparecem muito rápido**
O `onBlur` tem delay de apenas 200ms (linha 446). Em telas touch, o evento de blur pode disparar antes do tap na sugestão ser registrado.

**3d. Sem indicação clara de campo obrigatório**
Descrição e Valor são obrigatórios mas não têm indicação visual. O botão Salvar simplesmente não funciona sem feedback.

**3e. Grid 2x2 com Fornecedor/Funcionário aparece para receitas**
Os cards de Fornecedor e Funcionário só aparecem para `expense`/`credit_card`, mas o grid fica com layout 1x2 para receitas sem preenchimento visual adequado.

### 4. Problemas de Layout

**4a. Espaçamento inferior insuficiente na lista de transações**
O `pb-24` pode não ser suficiente para cobrir o bottom nav + safe area em todos os dispositivos.

**4b. FinancePlanning sem padding inferior**
O componente `FinancePlanning` não tem `pb-24`, causando conteúdo cortado pela bottom nav.

---

## Plano de Implementação

### Tarefa 1: Eliminar useFinance duplicado em FinancePlanning
- Passar `categories`, `transactions` como props de `Finance.tsx` para `FinancePlanning`
- Remover import de `useFinance` dentro de `FinancePlanning`
- Atualizar a interface e chamadas em `Finance.tsx` e `PersonalFinance.tsx`

### Tarefa 2: Fix do duplo-clique em transações novas
- Em `FinanceTransactions.tsx`, remover o `return` após `markSeen` para que o `onTransactionClick` seja sempre chamado
- Manter o `markSeen` para remover o brilho

### Tarefa 3: Auto-focus no campo de valor após sugestão
- Adicionar ref ao input de valor
- Após selecionar sugestão, dar focus no campo de valor automaticamente
- Adicionar debounce de 300ms no cálculo de sugestões

### Tarefa 4: Toast de confirmação ao salvar/excluir
- Adicionar `toast.success('Transação salva!')` após save bem sucedido em `handleSave`
- Adicionar `toast.success('Transação excluída!')` após delete

### Tarefa 5: Melhorar input de valor com formatação monetária
- Trocar `type="number"` para `type="text"` com `inputMode="decimal"`
- Formatar exibição em tempo real (ex: "1.500,00")
- Parsing correto de volta para número no save

### Tarefa 6: Melhorar feedback de campos obrigatórios
- Adicionar destaque vermelho nos campos vazios quando o usuário tenta salvar
- Mostrar toast com mensagem clara: "Preencha a descrição e o valor"

### Tarefa 7: Throttle no localStorage de seen IDs
- Aplicar debounce/throttle de 2s no `_persistSeen()`

### Tarefa 8: Ajustes de layout e padding
- Aumentar `pb-24` para `pb-32` na lista de transações
- Adicionar `pb-32` no `FinancePlanning`
- Garantir que o `handleDateChange` também seta `isPaid = true` quando a data é hoje ou passado

### Tarefa 9: Aumentar delay do onBlur nas sugestões
- Aumentar de 200ms para 400ms para melhor compatibilidade touch

### Tarefa 10: Ajustar grid de cards para receitas
- Quando o tipo é `income`, o grid de Conta + Categoria deve usar `grid-cols-2` sem os espaços vazios dos cards de fornecedor/funcionário

---

## Resumo Técnico

```text
Arquivos afetados:
├── src/components/finance/TransactionSheet.tsx    (tarefas 3,4,5,6,9)
├── src/components/finance/FinanceTransactions.tsx  (tarefas 2,7,8)
├── src/components/finance/FinancePlanning.tsx      (tarefa 1,8)
├── src/pages/Finance.tsx                          (tarefa 1)
├── src/pages/PersonalFinance.tsx                  (tarefa 1)
```

Todas as mudanças são no frontend. Nenhuma alteração de banco de dados necessária. As correções eliminam re-renders desnecessários, melhoram feedback visual, e tornam o preenchimento mais fluido e intuitivo.

