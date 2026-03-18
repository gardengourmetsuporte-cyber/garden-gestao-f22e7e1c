

## Plano: Botão "Adicionar como Assinatura/Conta Fixa" na edição de transação

### O que muda

Ao editar uma transação no módulo financeiro, aparecerá um botão extra que permite enviar os dados dessa transação para o módulo de Assinaturas, abrindo o formulário pré-preenchido para revisão antes de salvar.

### Implementação

**1. `src/components/finance/TransactionSheet.tsx`**
- Adicionar prop `onAddToSubscriptions?: (data: { name, price, category, type }) => void`
- Quando `editingTransaction` existe e é do tipo `expense`, mostrar um botão (ícone `Link2` ou `Repeat`) abaixo das observações com texto "Adicionar como assinatura/conta"
- Ao clicar, chama `onAddToSubscriptions` passando `description`, `amount`, e fecha o sheet

**2. `src/pages/Finance.tsx`**
- Importar `useNavigate` (ou `useSearchParams`)
- Criar handler `handleAddToSubscriptions` que recebe os dados da transação e navega para `/subscriptions?prefill=...` (via query params ou state)
- Passar esse handler como prop `onAddToSubscriptions` ao `TransactionSheet`

**3. `src/pages/Subscriptions.tsx`**
- Ler query params ou `location.state` no mount
- Se houver dados de prefill vindos do financeiro, abrir o `SubscriptionSheet` automaticamente com `prefillData` preenchido (nome, valor, tipo inferido)

### UX
- O botão só aparece ao **editar** transações de **despesa**
- Ao clicar, fecha o sheet financeiro e redireciona para `/subscriptions` com o formulário já aberto e pré-preenchido
- O usuário pode editar tudo antes de confirmar

