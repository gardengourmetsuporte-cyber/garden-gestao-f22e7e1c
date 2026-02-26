

## Diagnóstico: 3 bugs encontrados

### Bug 1: Ícone "Gem" não existe no ICON_MAP
O `AppIcon` usa Material Symbols e precisa de um mapeamento em `src/lib/iconMap.ts`. O nome "Gem" não está mapeado, então o ícone renderiza como texto quebrado ao invés do diamante.

**Fix**: Adicionar `Gem: 'diamond'` ao `ICON_MAP`.

### Bug 2: Query de role falha com múltiplas roles
O `AuthContext` usa `.maybeSingle()` para buscar a role do usuário. Se o usuário tem 2 rows (ex: `admin` + `funcionario`), `.maybeSingle()` retorna erro → role cai para `'funcionario'` → `isAdmin = false` → módulos admin-only ficam escondidos, Configurações some, grupo Premium some.

**Fix**: Mudar query de `.maybeSingle()` para `.order('role').limit(1).maybeSingle()` ou buscar todas as roles e escolher a de maior hierarquia (`super_admin > admin > funcionario`).

### Bug 3: Todo novo usuário recebe role `funcionario`
O trigger `handle_new_user` sempre insere `'funcionario'` em `user_roles`. Quando o `auto_provision_unit` cria a loja, o usuário vira `owner` em `user_units` mas continua `funcionario` em `user_roles`.

**Fix**: Alterar `auto_provision_unit` para também fazer `UPDATE user_roles SET role = 'admin' WHERE user_id = p_user_id`. Isso garante que o primeiro usuário (dono da empresa) seja admin automaticamente.

---

### Alterações

#### 1. `src/lib/iconMap.ts`
- Adicionar `Gem: 'diamond'` ao mapeamento

#### 2. `src/contexts/AuthContext.tsx`
- Mudar query de role de `.maybeSingle()` para buscar todas as roles e selecionar a de maior prioridade (`super_admin > admin > funcionario`)
- Isso resolve o caso de múltiplas roles no banco

#### 3. Migration SQL
- Alterar `auto_provision_unit` para atualizar `user_roles` de `funcionario` → `admin` quando o usuário cria sua primeira unidade
- Limpar roles duplicadas existentes: remover `funcionario` onde o mesmo user já tem `admin`
- Garantir que todo owner de unidade tenha role `admin` em `user_roles`

