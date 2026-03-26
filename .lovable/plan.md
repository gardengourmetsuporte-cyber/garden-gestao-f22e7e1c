

# Trial de 14 Dias para Novos Usuários

## O que será feito

1. Adicionar coluna `trial_ends_at` na tabela `profiles` para rastrear quando o trial expira
2. Alterar a função `handle_new_user` para que novos usuários recebam `plan = 'business'`, `plan_status = 'trialing'` e `trial_ends_at = now() + 14 days`
3. Atualizar `check-subscription` para verificar o trial: se `trial_ends_at` existe e não expirou, retornar plano business/trialing; se expirou, reverter para free
4. Criar um banner `TrialBanner` que mostra o countdown dos dias restantes do trial
5. Integrar o banner no layout do dashboard

## Arquivos

### 1. Migração SQL
- `ALTER TABLE profiles ADD COLUMN trial_ends_at timestamptz DEFAULT NULL`
- Atualizar `handle_new_user` para setar `plan='business'`, `plan_status='trialing'`, `trial_ends_at = now() + interval '14 days'` no INSERT de profiles

### 2. Editar: `supabase/functions/check-subscription/index.ts`
- Antes de verificar Stripe, checar se `trial_ends_at` existe no profile
- Se `trial_ends_at > now()` → retornar `{ subscribed: true, plan: 'business', trial: true, trial_ends_at }`
- Se `trial_ends_at <= now()` → atualizar profile para `plan='free'`, `plan_status='expired'` e continuar fluxo normal

### 3. Novo: `src/components/layout/TrialBanner.tsx`
- Lê `planStatus` e `subscriptionEnd`/`trialEndsAt` do AuthContext
- Mostra banner com countdown: "Seu período de teste expira em X dias"
- Link para página de planos
- Cores amber/warning, dismissível por sessão

### 4. Editar: `src/contexts/AuthContext.tsx`
- Adicionar `trialEndsAt: string | null` ao contexto
- Popular a partir do retorno de `check-subscription` ou do profile

### 5. Editar: `src/components/layout/AppLayout.tsx` ou `AdminDashboard.tsx`
- Renderizar `<TrialBanner />` quando `planStatus === 'trialing'`

## Fluxo do novo usuário

```text
Signup → handle_new_user trigger
  → profile criado com plan='business', plan_status='trialing', trial_ends_at=+14d
  → auto_provision_unit cria a loja
  → Usuário entra com acesso completo (business)
  → Banner mostra "X dias restantes"
  → Após 14 dias, check-subscription detecta expiração → plan='free'
```

