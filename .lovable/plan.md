

## Auditoria Completa: Contas, Permissões e Herança de Plano

### Análise do Fluxo Atual

Auditei todo o sistema e identifiquei o seguinte fluxo e **problemas**:

```text
FLUXO DE NOVO USUÁRIO (via convite):

1. Funcionário recebe link de convite
2. Cria conta → trigger handle_new_user():
   - Cria profile (plan: NULL → free)
   - Insere user_roles: 'funcionario'
3. Aceita convite (Invite.tsx):
   - Cria user_units com role='member' + access_level_id (default 'Funcionário')
   - NÃO cria/modifica user_roles (correto)
4. Login subsequente:
   - AuthContext busca profile.plan → 'free'
   - Resolve herança via get_unit_plan RPC → pega plano do dono
   - UnitContext aplica setEffectivePlan com plano da unidade
```

### Problemas Identificados

**1. Race condition na herança de plano (CRÍTICO)**
Quando um funcionário convidado faz login pela primeira vez, o `AuthContext.fetchUserData` tenta resolver o plano herdado via `resolveInheritedUnitPlan`, mas essa função usa `user_units` que pode não existir ainda (o aceite do convite acontece depois do signup, após confirmação de email). Resultado: plano fica como `free` temporariamente.

**2. Funcionário sem `user_roles` quando aceita convite sendo já logado**
Se o usuário já existia e aceita um convite, o `Invite.tsx` NÃO verifica/garante que existe uma entrada em `user_roles`. Porém o trigger `handle_new_user` já criou `funcionario` no signup — isso está OK.

**3. Falta de `refreshSubscription` após aceite de convite**
Após `acceptInviteForUser`, só faz `refetchUnits()`. Não chama `refreshSubscription` ou `refreshUserData`, então o plano efetivo pode ficar desatualizado até o próximo poll (15min).

**4. Access Level padrão funciona corretamente** ✅
O convite busca `access_level_id` do convite ou fallback para `is_default=true` na unidade. O `auto_provision_unit` cria "Funcionário" como `is_default=true`. Está correto.

**5. Trigger `auto_assign_owner_role` funciona** ✅
Quando `user_units.role = 'owner'`, o trigger insere `admin` em `user_roles`. Está correto.

### Plano de Correção

**Arquivo: `src/pages/Invite.tsx`**
- Após aceitar convite, chamar `refreshUserData()` do AuthContext para sincronizar role + plano herdado
- Adicionar import de `useAuth` para acessar `refreshUserData` e `refreshSubscription`

**Arquivo: `src/contexts/AuthContext.tsx`**
- Na função `resolveInheritedUnitPlan`, adicionar um retry curto (1s delay) caso `user_units` esteja vazio, para cobrir a race condition do primeiro login pós-confirmação de email
- Garantir que `refreshUserData` também re-resolve o plano da unidade (limpar `effectivePlanRef` antes)

**Arquivo: `src/contexts/UnitContext.tsx`**
- No `useEffect` que resolve o plano da unidade ativa (linha 242-268), garantir que também chama `refreshSubscription` após definir o plano efetivo, para que o backend fique sincronizado

### Resumo das Mudanças

| Arquivo | Mudança | Impacto |
|---------|---------|---------|
| `Invite.tsx` | Chamar `refreshUserData()` após aceite | Plano + role sincronizam imediatamente |
| `AuthContext.tsx` | `refreshUserData` limpa `effectivePlanRef` antes de re-fetch | Evita plano stale após troca de contexto |
| `UnitContext.tsx` | Nenhuma mudança necessária | Já chama `setEffectivePlan` corretamente |

Todas as outras partes do sistema (access levels, `get_unit_plan` RPC, `handle_new_user` trigger, `auto_assign_owner_role` trigger, bloqueio de módulos no `BottomTabBar` e `App.tsx`) estão funcionando corretamente.

