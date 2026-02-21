

# Desfazer / Refazer Lancamentos Financeiros

## O que sera feito

Adicionar botoes de **Desfazer** e **Refazer** no modulo financeiro (empresarial e pessoal), funcionando como no Photoshop: cada acao (criar, editar, excluir transacao) pode ser revertida ou reaplicada.

---

## Como funciona

### Pilha de acoes (Undo Stack / Redo Stack)

Cada operacao no financeiro gera um registro na pilha de undo:

- **Criar transacao**: salva o ID criado. Desfazer = deletar. Refazer = reinserir.
- **Excluir transacao**: salva os dados completos da transacao. Desfazer = reinserir. Refazer = deletar novamente.
- **Editar transacao**: salva os dados anteriores (before) e novos (after). Desfazer = restaurar before. Refazer = aplicar after.
- **Marcar como pago/nao pago**: salva o estado anterior. Desfazer = reverter estado.

A pilha e mantida **em memoria** (estado React, sem banco), com limite de 20 acoes para nao consumir muita RAM.

### Interface

- Dois botoes pequenos no **header da pagina financeira** (ao lado do titulo): seta para esquerda (desfazer) e seta para direita (refazer)
- Botoes ficam desabilitados (cinza) quando nao ha acoes para desfazer/refazer
- Ao desfazer, aparece um toast discreto: "Lancamento desfeito" com opcao de refazer inline
- A pilha de redo e limpa quando o usuario faz uma nova acao (comportamento padrao de undo/redo)

---

## Arquivos afetados

### Novo
- `src/hooks/useUndoRedo.ts` -- hook generico que gerencia as pilhas de undo/redo com tipos de acao

### Editados
- `src/hooks/useFinanceCore.ts` -- integrar o hook de undo/redo nas mutacoes (addTransaction, updateTransaction, deleteTransaction, togglePaid). Cada mutacao registra a acao na pilha antes de executar.
- `src/pages/Finance.tsx` -- adicionar botoes de desfazer/refazer no header
- `src/pages/PersonalFinance.tsx` -- mesmo tratamento para financas pessoais

---

## Detalhes tecnicos

### Hook useUndoRedo

```text
Tipos de acao:
- { type: 'create', transactionId: string, data: TransactionFormData }
- { type: 'delete', transactionId: string, snapshot: FinanceTransaction }
- { type: 'update', transactionId: string, before: Partial<TransactionFormData>, after: Partial<TransactionFormData> }
- { type: 'toggle_paid', transactionId: string, wasPaid: boolean }

Interface retornada:
- pushAction(action) -- registra nova acao
- undo() -- desfaz a ultima acao
- redo() -- refaz a acao desfeita
- canUndo: boolean
- canRedo: boolean
```

### Integracao com useFinanceCore

O hook `useFinanceCore` recebera as funcoes do `useUndoRedo` e passara a retornar:
- `undo()`, `redo()`, `canUndo`, `canRedo`

Cada mutacao existente sera envolvida para registrar a acao na pilha antes de executar no banco.

Para o **undo de create**: busca o ID da transacao criada e faz delete.
Para o **undo de delete**: reinsere a transacao com os dados do snapshot.
Para o **undo de update**: aplica os dados "before" via update.

### Botoes no header

```text
[<-] [->]  Financeiro
 ^    ^
 |    refazer (disabled se redoStack vazio)
 desfazer (disabled se undoStack vazio)
```

Icones: `Undo2` e `Redo2` do Lucide, tamanho 20px, posicionados a esquerda do titulo.

---

## Limitacoes conhecidas

- O undo/redo e por sessao: recarregar a pagina limpa o historico (comportamento esperado, igual Photoshop)
- Transferencias contam como uma unica acao (desfazer reverte ambos os lados)
- Limite de 20 acoes na pilha para performance
- Nao se aplica a contas ou categorias, apenas transacoes
