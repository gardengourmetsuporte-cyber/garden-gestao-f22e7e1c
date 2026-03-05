

# Auditoria Completa: Fluxos de Entrada e Correspondência de Plano

## Contexto
O sistema tem 3 caminhos de entrada de usuários e precisa garantir que cada um resulte no role correto, banco isolado (unit) e plano herdado adequado.

---

## Fluxos de Entrada Identificados

### Fluxo 1: Cadastro Orgânico (Landing → Planos → Auth)
**Caminho:** `/landing` → `/plans` → `/auth?plan=pro|business`

**O que acontece hoje:**
1. Usuário escolhe plano → redireciona para Stripe Checkout → volta para `/auth?plan=X&payment=success`
2. Cria conta via `signUp` → confirma email → faz login
3. `UnitContext` detecta que não tem `user_units` → chama `auto_provision_unit`
4. A função SQL cria: unit + `user_units(role='owner')` + contas financeiras + categorias + estoque + checklists + métodos de pagamento
5. Trigger `auto_assign_owner_role` promove o usuário para role global `admin` em `user_roles`
6. `check-subscription` sincroniza o plano do Stripe no `profiles.plan`
7. `get_unit_plan` resolve o plano pela coluna `profiles.plan` do `created_by` da unit

**Pontos a verificar/corrigir:**
- O plano do Stripe só é sincronizado **após** o login (10s delay). Durante esse gap, o usuário entra como `free` e o `auto_provision_unit` roda sem problema, mas pode exibir paywall momentâneo
- Se o pagamento Stripe falhar ou o webhook atrasar, o usuário ficará como `free` com acesso restrito mesmo tendo pago
- A role `funcionario` padrão é atribuída momentaneamente antes do trigger `auto_assign_owner_role` rodar — isso é correto pois o AuthContext resolve a role mais alta

### Fluxo 2: Cadastro por Convite (Funcionário)
**Caminho:** Admin gera link → `/invite?token=X`

**O que acontece hoje:**
1. Funcionário acessa link → página `Invite.tsx` carrega convite via `get_invite_by_token`
2. Cria conta com `signUp` → confirma email → volta ao link
3. `acceptInviteForUser` insere `user_units(role=invite.role)` (member ou admin)
4. **Não** roda `auto_provision_unit` (pois agora tem `user_units`)
5. **Não** cria role global em `user_roles` → role padrão é `funcionario`

**Pontos a verificar/corrigir:**
- **BUG POTENCIAL:** Quando o convite é `role='admin'` (Gerente), o sistema insere `user_units.role='admin'` mas **não cria** entry em `user_roles` com role `admin`. O `AuthContext` resolve role global como `funcionario` pois não há registro em `user_roles`. Isso significa que gerentes convidados **não têm acesso admin** até que alguém manualmente altere a role global
- **Plano:** O funcionário herda o plano via `get_unit_plan` que consulta `profiles.plan` do `created_by` da unit. Isso está correto
- **Isolamento:** O funcionário é vinculado apenas à unit do convite. Correto

### Fluxo 3: Login de Usuário Existente com Convite Pendente
**Caminho:** Usuário logado acessa `/invite?token=X`

**O que acontece hoje:**
1. `useEffect` detecta `user && invite` → chama `acceptInviteForUser` automaticamente
2. Valida email match → insere `user_units` → marca convite como aceito
3. **Problema:** Seta `is_default: true` na nova unit, potencialmente tirando a unit padrão anterior do usuário

---

## Matriz de Verificação

```text
┌─────────────────┬──────────────┬──────────────────┬───────────────────┬───────────────┐
│ Fluxo           │ user_roles   │ user_units.role  │ Unit isolada?     │ Plano         │
├─────────────────┼──────────────┼──────────────────┼───────────────────┼───────────────┤
│ Orgânico (owner)│ admin ✅     │ owner ✅         │ Nova unit ✅      │ Stripe sync ✅│
│ Convite member  │ (nenhum) ✅  │ member ✅        │ Unit do admin ✅  │ Herdado ✅    │
│ Convite admin   │ (nenhum) ⚠️  │ admin ⚠️         │ Unit do admin ✅  │ Herdado ✅    │
│ Existente+conv. │ mantém ✅    │ role convite ✅  │ Adicionado ✅     │ Herdado ✅    │
└─────────────────┴──────────────┴──────────────────┴───────────────────┴───────────────┘
```

---

## Problemas Encontrados

### 1. Convite com role "admin" não promove role global
**Severidade:** Alta
**Impacto:** Gerentes convidados entram como `funcionario` no AuthContext, sem acesso a funcionalidades admin (dashboard admin, gestão de equipe, configurações avançadas)

**Correção:** No `Invite.tsx`, ao aceitar convite com `role='admin'`, inserir também em `user_roles` com role `admin`. Ou criar um trigger SQL similar ao `auto_assign_owner_role` que promova quando `user_units.role = 'admin'`.

### 2. Convite seta is_default=true incondicionalmente
**Severidade:** Baixa
**Impacto:** Se um usuário que já tem uma loja própria aceita convite de outra, a nova unit vira default, mudando o contexto inesperadamente.

**Correção:** No `acceptInviteForUser`, verificar se já existe `user_units` e, se sim, não forçar `is_default: true`.

### 3. Gap de plano no cadastro orgânico
**Severidade:** Baixa
**Impacto:** Nos primeiros ~10s após login, o plano pode aparecer como `free` até o `check-subscription` rodar. Mitigado pelo cache e pelo `resolveInheritedUnitPlan`.

---

## Plano de Implementação

### Tarefa 1: Corrigir promoção de role para convites admin
- Criar trigger SQL `auto_assign_admin_on_unit_join` em `user_units` que, ao inserir com `role = 'admin'`, também insira `user_roles(role='admin')`
- Isso unifica a lógica com o trigger existente `auto_assign_owner_role` que já faz isso para owners

### Tarefa 2: Corrigir is_default no aceite de convite
- Em `Invite.tsx` → `acceptInviteForUser`, verificar se o usuário já tem units antes de setar `is_default: true`
- Se já tem units, inserir com `is_default: false`

### Tarefa 3: Validação de dados existentes
- Query no banco para encontrar usuários com `user_units.role = 'admin'` que **não** possuem `user_roles.role = 'admin'`, e corrigir

### Tarefa 4: Teste end-to-end dos 3 fluxos
- Testar cadastro orgânico, convite como member, convite como admin

---

## Detalhes Técnicos

**Trigger SQL proposto (Tarefa 1):**
Expandir o trigger existente `auto_assign_owner_role` para também cobrir `role = 'admin'`:

```sql
CREATE OR REPLACE FUNCTION public.auto_assign_owner_role()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.role IN ('owner', 'admin') THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.user_id, 'admin')
    ON CONFLICT (user_id, role) DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$;
```

**Invite.tsx (Tarefa 2):**
Antes do insert em `user_units`, checar se já existem registros e ajustar `is_default` conforme.

