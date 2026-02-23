
# Estrutura Completa SaaS - Planos, Paywall e Gerenciamento

## Resumo
Transformar o Atlas em um SaaS completo com: verificacao de assinatura via Stripe, paywall nos modulos premium, pagina de planos dentro do app, gerenciamento de assinatura (portal Stripe), e Marketing visivel mas bloqueado para usuarios FREE.

## O que muda

### 1. Edge Function: check-subscription
Nova funcao que consulta o Stripe para verificar se o usuario tem assinatura ativa. Retorna o plano (pro/business), status e data de expiracao. Chamada no login, ao abrir o app e periodicamente.

### 2. Edge Function: customer-portal
Nova funcao que cria uma sessao do Stripe Customer Portal para o usuario gerenciar sua assinatura (cancelar, trocar cartao, mudar plano).

### 3. AuthContext - Subscription State
Adicionar campos `plan`, `planStatus` e `subscriptionEnd` ao AuthContext. Apos o login e a cada 60s, chamar `check-subscription` e atualizar o estado global. Helpers: `isPro`, `isBusiness`, `isFree`.

### 4. Pagina /plans - Planos dentro do App
Nova pagina acessivel de dentro do sistema (protegida por auth) que mostra os planos Pro e Business com o mesmo visual da landing page. Se o usuario ja tem plano, destaca o atual. Botao "Gerenciar Assinatura" abre o portal Stripe.

### 5. Paywall no Marketing (e modulos premium)
- Remover Marketing do grupo `em_producao` (que e exclusivo super_admin) e mover para um grupo visivel como `premium`
- No menu do App Launcher, Marketing aparece para todos com um icone de cadeado se o usuario for FREE
- Ao clicar no Marketing sendo FREE, redireciona para /plans em vez de abrir o modulo
- Na rota /marketing, verificar o plano e mostrar tela de upgrade se FREE

### 6. Componente UpgradeWall
Componente reutilizavel que exibe uma tela bonita de "Desbloqueie este recurso" com botao para ir aos planos. Sera usado no Marketing e pode ser reaproveitado em outros modulos futuramente.

### 7. Link para Planos nas Configuracoes
Adicionar item "Meu Plano" na secao Conta das configuracoes, mostrando o plano atual e link para a pagina de planos/gerenciamento.

---

## Detalhes Tecnicos

### Novos Arquivos

**supabase/functions/check-subscription/index.ts**
- Recebe JWT do usuario, busca email, consulta Stripe customers e subscriptions
- Retorna: `{ subscribed, plan, subscription_end }`
- Atualiza `profiles.plan` e `profiles.plan_status` no banco

**supabase/functions/customer-portal/index.ts**
- Recebe JWT, busca customer no Stripe pelo email
- Cria sessao do billing portal, retorna URL

**src/pages/Plans.tsx**
- Pagina com os planos (reutiliza logica do PricingSection)
- Mostra plano atual do usuario com badge "Seu Plano"
- Botao "Gerenciar Assinatura" para quem ja e premium
- Botao "Assinar" para FREE (abre checkout Stripe)

**src/components/paywall/UpgradeWall.tsx**
- Componente fullscreen com icone de cadeado, titulo do modulo, beneficios e CTA
- Botao leva para /plans

### Arquivos Modificados

**src/contexts/AuthContext.tsx**
- Adicionar `plan`, `planStatus`, `isPro`, `isBusiness`, `isFree` ao contexto
- Ler plan do profile inicialmente (cache rapido)
- Chamar check-subscription apos login e a cada 60 segundos
- Expor funcao `refreshSubscription` para forcar re-check

**src/App.tsx**
- Adicionar rota `/plans` (protegida)

**src/components/layout/AppLayout.tsx**
- Mudar Marketing de `em_producao` para grupo visivel (ex: `gestao` ou novo grupo `marketing`)
- Remover `adminOnly` do Marketing
- Adicionar logica: se `isFree` e clica em modulo premium, navega para /plans
- Exibir icone de cadeado (Lock) ao lado de modulos bloqueados

**src/pages/Marketing.tsx**
- Antes de renderizar conteudo, verificar se `isFree`
- Se FREE, renderizar `<UpgradeWall module="Marketing" />`

**src/pages/Settings.tsx**
- Adicionar item "Meu Plano" na secao Conta com variant 'cyan'

**src/lib/modules.ts**
- Adicionar campo `requiredPlan` opcional aos modulos (ex: marketing requer 'business')

### Fluxo do Usuario

```text
Usuario FREE abre o app
  -> Ve Marketing no menu com cadeado
  -> Clica em Marketing
  -> Ve tela de UpgradeWall
  -> Clica "Ver Planos"
  -> Pagina /plans com Pro e Business
  -> Clica "Assinar Pro"
  -> Stripe Checkout (nova aba)
  -> Paga e volta
  -> check-subscription atualiza o plano
  -> Marketing desbloqueado

Usuario Premium
  -> Ve Marketing sem cadeado
  -> Acessa normalmente
  -> Em Configuracoes > Meu Plano > "Gerenciar"
  -> Abre Stripe Customer Portal
  -> Pode cancelar, trocar cartao, etc.
```

### Mapeamento de Planos x Modulos

```text
+--------------------+--------+---------+----------+
| Modulo             | Free   | Pro     | Business |
+--------------------+--------+---------+----------+
| Dashboard          | Sim    | Sim     | Sim      |
| Estoque            | Sim    | Sim     | Sim      |
| Checklists         | Sim    | Sim     | Sim      |
| Fechamento Caixa   | Sim    | Sim     | Sim      |
| Financeiro         | Sim    | Sim     | Sim      |
| Funcionarios       | Sim    | Sim     | Sim      |
| Recompensas        | Sim    | Sim     | Sim      |
| Ranking            | Sim    | Sim     | Sim      |
| Fichas Tecnicas    | Nao    | Sim     | Sim      |
| Marketing          | Nao    | Nao     | Sim      |
| Copilot IA         | Nao    | Nao     | Sim      |
| WhatsApp Bot       | Nao    | Nao     | Sim      |
| Cardapio Digital   | Nao    | Nao     | Sim      |
| Tablets (Pedidos)  | Nao    | Nao     | Sim      |
| Gamificacao        | Nao    | Nao     | Sim      |
| Financas Pessoais  | Nao    | Sim     | Sim      |
+--------------------+--------+---------+----------+
```

### Seguranca
- check-subscription usa SUPABASE_SERVICE_ROLE_KEY para atualizar profiles
- Verificacao de plano no frontend (UX) + backend (RLS futuro se necessario)
- Customer portal so funciona para usuarios com stripe_customer_id
- Stripe webhook ja atualiza plan/plan_status (existente)
