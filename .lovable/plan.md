

## Bug: `refreshSubscription` sobrescreve o plano herdado da unidade

### Causa raiz

Existe uma condição de corrida entre dois sistemas:

1. **UnitContext** carrega a unidade ativa → chama `get_unit_plan` RPC → retorna `'business'` (plano do dono) → chama `setEffectivePlan('business')` → plano = business ✓

2. **5 segundos depois**: AuthContext chama `refreshSubscription()` → edge function `check-subscription` verifica o Stripe do **funcionário logado** (não do dono) → funcionário não tem assinatura Stripe → retorna `plan: 'free'` → `setPlan('free')` → **sobrescreve** o plano herdado ✗

3. **A cada 5 minutos**: o polling repete isso, garantindo que o plano sempre volta para `free`.

O `check-subscription` verifica a assinatura do **usuário logado**, não do dono da loja. Para funcionários (que não têm assinatura própria), isso sempre retorna `free`, desfazendo a herança configurada pelo UnitContext.

### Solução

Modificar `AuthContext.tsx` para que o `refreshSubscription` **não sobrescreva** o plano quando existe um plano efetivo definido pelo UnitContext. A lógica:

- Guardar em uma ref se o plano efetivo foi setado via `setEffectivePlan` (ou seja, pelo UnitContext)
- No `refreshSubscription`, após receber o resultado do `check-subscription`, comparar: se o plano do usuário individual é `free` mas já existe um plano efetivo da unidade, manter o plano efetivo
- Alternativa mais simples: no `refreshSubscription`, após setar o plano do Stripe, re-disparar o `get_unit_plan` para a unidade ativa

**Abordagem escolhida**: Usar uma ref `effectivePlanRef` em AuthContext. Quando `setEffectivePlan` é chamado, marca que o plano veio da unidade. No `refreshSubscription`, se o Stripe retorna `free` mas a ref indica um plano de unidade, ignorar o resultado do Stripe.

### Arquivo a modificar

| Arquivo | Mudança |
|---------|---------|
| `src/contexts/AuthContext.tsx` | Adicionar `effectivePlanRef` para rastrear plano herdado da unidade. No `refreshSubscription`, não sobrescrever quando plano efetivo existe. No `fetchUserData`, idem — o plano do perfil individual não deve sobrescrever o plano da unidade se este já foi resolvido. |

### Detalhe técnico

```
Fluxo atual (bugado):
AuthContext.fetchUserData → plan = profile.plan ('free')
UnitContext.useEffect   → setEffectivePlan('business')  ← correto
AuthContext.refreshSub  → plan = stripe result ('free')  ← sobrescreve!

Fluxo corrigido:
AuthContext.fetchUserData → plan = profile.plan ('free')
UnitContext.useEffect   → setEffectivePlan('business'), effectivePlanRef = 'business'
AuthContext.refreshSub  → stripe = 'free', mas effectivePlanRef = 'business' → mantém 'business'
```

