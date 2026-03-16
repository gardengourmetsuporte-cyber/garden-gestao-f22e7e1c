

## Diagnóstico dos Problemas

### Problema 1: Maria vê a Dashboard do dono (AdminDashboard)
Maria foi adicionada com role `admin` (Gerente) na unidade, o que faz `isAdmin = true` no `AuthContext`. Isso renderiza `AdminDashboard` em vez de `EmployeeDashboard`. Isso é esperado para gerentes — eles precisam ver o painel operacional. O problema real é que ela vê **conteúdo financeiro** que não deveria.

### Problema 2: Módulo financeiro aparece sem permissão
Quando Maria foi transferida/adicionada à unidade Porto Ferreira via edge function `admin-manage-user` (ação `transfer_to_unit`), o registro em `user_units` foi criado **sem `access_level_id`**. Na lógica de `useAccessLevels`, quando `access_level_id` é `null`, o sistema interpreta como **acesso total** — retorna `null` e `hasAccess()` retorna `true` para tudo.

### Problema 3: Novas contas sem acesso padrão
O mesmo ocorre com qualquer usuário adicionado fora do fluxo de convite por link — o `access_level_id` fica vazio.

---

## Plano de Correção

### 1. Edge Function: Atribuir nível de acesso padrão ao transferir/adicionar
**Arquivo:** `supabase/functions/admin-manage-user/index.ts`

Na ação `transfer_to_unit`, após inserir o `user_units`, buscar o nível de acesso padrão (`is_default = true`) da unidade destino e atribuí-lo ao novo registro. Se o usuário tiver role `owner`, atribuir o nível "Acesso Completo" em vez do padrão.

### 2. Dashboard: Filtrar abas por permissão de módulo
**Arquivo:** `src/components/dashboard/AdminDashboard.tsx`

- Filtrar os `VIEW_TABS` com base em `hasAccess`: se o usuário não tem acesso a `finance`, ocultar a aba "Financeiro". Se não tem acesso a módulos de equipe, ocultar "Equipe".
- Se a view salva no localStorage não for acessível, fazer fallback para a primeira aba permitida (sempre "Operacional").

### 3. Dashboard operacional: Ocultar widgets financeiros quando sem acesso
Os widgets `DashboardHeroFinance`, `BillsDueWidget`, `SalesGoalWidget`, analytics, heatmap, etc. já checam `hasAccess('finance')` em alguns casos, mas não todos. Garantir que **todos** os widgets financeiros respeitem `hasAccess('finance')`.

### 4. Fallback de acesso padrão para registros existentes sem access_level
**Arquivo:** `src/hooks/useAccessLevels.ts` (função `fetchUserModules`)

Alterar a lógica: quando `access_level_id` é `null`, em vez de retornar `null` (acesso total), buscar o nível de acesso padrão (`is_default = true`) da unidade. Se existir, usar seus módulos. Se não existir nenhum nível padrão, aí sim retornar `null` (acesso total — mantém compatibilidade para donos sem nível configurado).

**Exceção importante:** Usuários com role `owner` na unidade continuam com acesso total independente do nível de acesso atribuído.

### 5. Migração SQL: Preencher access_level_id em registros existentes vazios
Criar migração que atualiza todos os `user_units` com `access_level_id IS NULL` e `role = 'member'` para usar o nível padrão da unidade correspondente.

---

## Resumo de Arquivos

| Arquivo | Ação |
|---|---|
| `supabase/functions/admin-manage-user/index.ts` | Atribuir access_level padrão em transfer_to_unit |
| `src/hooks/useAccessLevels.ts` | Fallback para nível padrão quando access_level_id é null (exceto owners) |
| `src/components/dashboard/AdminDashboard.tsx` | Filtrar abas e widgets por permissão |
| Migração SQL | Preencher access_level_id em registros existentes |

