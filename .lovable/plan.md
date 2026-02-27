

## Diagnóstico: Por que o fluxo de compra não funciona

O fluxo Stripe → Cadastro → Ativação tem 3 problemas:

### Bug 1: `paymentSuccess` nunca é usado
A variável `paymentSuccess` é declarada na linha 153 de `Auth.tsx` mas nunca utilizada. Quando o usuário chega em `/auth?plan=pro&payment=success` após pagar no Stripe:
- Vê o formulário de **login** (não de cadastro)
- Nenhuma mensagem de sucesso do pagamento
- Sem orientação sobre o próximo passo

### Bug 2: Formulário não abre em modo cadastro após pagamento
Quando `plan` + `payment=success` estão na URL, o formulário deveria automaticamente abrir no modo "Criar Conta" para que o cliente que acabou de pagar saiba que precisa criar a conta.

### Bug 3: Stripe usa USD ao invés de BRL
O checkout no Stripe não força a moeda para BRL, fazendo o preço aparecer em dólares.

---

### Alterações

#### 1. `src/pages/Auth.tsx`
- Quando `paymentSuccess === 'success'` e `planFromUrl` existe, auto-switch para modo cadastro (`isLogin = false`)
- Exibir banner de sucesso no topo: "Pagamento confirmado! Crie sua conta para ativar o plano Pro"
- Usar o `paymentSuccess` para orientar o usuário

#### 2. `supabase/functions/stripe-checkout/index.ts`
- Adicionar `currency: 'brl'` na criação da session do Stripe para forçar cobrança em Reais
- Corrigir para que o preço sempre apareça em BRL

#### 3. Fluxo pós-cadastro (já funciona)
- Após cadastro → confirmação email → login, o `check-subscription` (que roda 5s após login) já busca o Stripe customer pelo email e sincroniza o plano automaticamente. Essa parte não precisa de alteração.

