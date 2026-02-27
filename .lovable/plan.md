

## Bug: Plano da conta não é herdado por funcionários

### Causa raiz

O `plan` é lido do **perfil individual do usuário** (`profiles.plan`). Maria tem `plan: 'free'` no perfil dela porque quem assina é o dono da conta. O sistema nunca consulta o plano do dono da unidade — cada usuário carrega seu próprio `profiles.plan`, resultando em módulos bloqueados para todos os funcionários.

### Fluxo atual (quebrado)

```text
Maria loga → AuthContext lê profiles.plan = 'free' → módulos PRO/BUSINESS bloqueados
```

### Fluxo correto

```text
Maria loga → Sistema identifica unidade ativa → Busca o plano do DONO da unidade → Usa esse plano
```

### Solução

**1. Criar função no banco para resolver o plano efetivo da unidade**

Nova migration SQL com uma função `get_unit_plan(p_unit_id UUID)` que:
- Busca o `created_by` da tabela `units`
- Retorna o `plan` do perfil do criador da unidade
- É `SECURITY DEFINER` para evitar problemas de RLS

**2. Modificar `AuthContext.tsx`**

Após carregar o perfil do usuário, **não usar** `profile.plan` diretamente. Em vez disso:
- Adicionar um efeito que, quando `activeUnitId` mudar, chama a função `get_unit_plan` via RPC
- Setar o `plan` com o resultado (plano do dono da unidade)
- Para o próprio dono, o resultado será idêntico ao atual

Isso requer que o AuthContext receba o `activeUnitId` do UnitContext. Como AuthContext é pai do UnitContext, vamos:
- Mover a lógica de resolução do plano para um **novo hook `useUnitPlan`** usado dentro do `UnitProvider` ou no `AppLayout`
- Ou inverter: ler o plano efetivo dentro do `UnitContext` e expô-lo de lá

**Abordagem escolhida**: Criar um hook `useEffectivePlan` que sobrescreve o plano no AuthContext quando o activeUnitId muda.

**3. Modificar `check-subscription` edge function**

A edge function continua sincronizando o plano do **assinante** no perfil dele. Não precisa mudar — o problema é só no frontend que precisa resolver o plano da unidade, não do usuário logado.

**4. Atualizar os consumidores do plano**

Os locais que usam `plan` do AuthContext (AppLayout, MoreDrawer, BottomTabBar, Settings, UpgradeWall) já receberão o valor correto automaticamente se o AuthContext expor o plano efetivo.

### Arquivos a modificar

| Arquivo | Mudança |
|---------|---------|
| **Nova migration SQL** | Função `get_unit_plan(UUID)` |
| `src/contexts/AuthContext.tsx` | Aceitar override de plano via setter, expor `setEffectivePlan` |
| `src/contexts/UnitContext.tsx` | Chamar `get_unit_plan` quando `activeUnitId` mudar e setar no AuthContext |
| `src/components/layout/MoreDrawer.tsx` | Ajustar exibição do badge "FREE" para usar plano efetivo (já usa `plan` do auth, resolve automaticamente) |

### Detalhes técnicos

**SQL Function:**
```sql
CREATE OR REPLACE FUNCTION public.get_unit_plan(p_unit_id UUID)
RETURNS TEXT
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(p.plan, 'free')
  FROM units u
  JOIN profiles p ON p.user_id = u.created_by
  WHERE u.id = p_unit_id
$$;
```

**AuthContext**: Adicionar `setEffectivePlan` para que o UnitContext possa sobrescrever o plano quando a unidade ativa mudar.

**UnitContext**: Após resolver a unidade ativa, chamar `supabase.rpc('get_unit_plan', { p_unit_id })` e atualizar o plano no AuthContext.

