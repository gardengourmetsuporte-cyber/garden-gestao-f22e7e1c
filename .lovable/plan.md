

## Correções nos Fluxos de Entrada — CONCLUÍDO ✅

### Bug 1: Login com token redireciona para `/invite` ✅
Se `tokenFromUrl` existir no `/auth`, o redirect pós-login vai para `/invite?token=${tokenFromUrl}`.

### Bug 2: Cadastro restrito a plan/token ✅
`canSignUp = !!(planFromUrl || tokenFromUrl)`. Acesso direto a `/auth` mostra só login.

### Bug 3: OnboardingWizard removido ✅
Rota `/onboarding`, página e componente deletados (código morto).

### Bug 4: Auto-provision protegido contra convites pendentes ✅
Antes de `auto_provision_unit`, verifica `invites` com `accepted_at IS NULL`. Se existir convite pendente, não provisiona.
