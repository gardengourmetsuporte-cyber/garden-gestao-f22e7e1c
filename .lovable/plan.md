

## Correções Pendentes nos Fluxos de Entrada de Usuários

Confirmei que os 4 problemas identificados na auditoria anterior **ainda não foram corrigidos**:

---

### Bug 1: Login com token redireciona para `/` ao invés de `/invite`
**Arquivo:** `src/pages/Auth.tsx`, linha 173-174

O redirect pós-login ignora o `tokenFromUrl`. Funcionário com conta existente que clica "Já tem conta?" vai para `/auth?token=xxx`, faz login, e é jogado para `/` — nunca aceita o convite.

**Correção:** Se `tokenFromUrl` existir, redirecionar para `/invite?token=${tokenFromUrl}`.

---

### Bug 2: Cadastro aberto sem restrição
**Arquivo:** `src/pages/Auth.tsx`, linha 178

`canSignUp = true` permite qualquer pessoa criar conta em `/auth` sem plano ou convite.

**Correção:** `const canSignUp = !!(planFromUrl || tokenFromUrl)`. Acesso direto a `/auth` mostra só login.

---

### Bug 3: OnboardingWizard é código morto
**Arquivo:** `src/App.tsx`, linhas 78, 162-166

O `auto_provision_unit` roda antes da rota `/onboarding` renderizar, então o wizard nunca é exibido. Se fosse, criaria dados incompletos.

**Correção:** Remover a rota `/onboarding` e o import do `Onboarding`.

---

### Bug 4: Auto-provision cria unidade para funcionários convidados
**Arquivo:** `src/contexts/UnitContext.tsx`, linhas 77-97

Quando um funcionário convidado confirma email e é logado, o `UnitContext` detecta 0 unidades e chama `auto_provision_unit` antes da página `/invite` aceitar o convite. Resultado: funcionário fica com uma "Minha Empresa" fantasma.

**Correção:** Antes de chamar `auto_provision_unit`, verificar se o usuário tem convites pendentes na tabela `invites`. Se tiver, não provisionar — aguardar o aceite do convite.

---

### Resumo de arquivos alterados

| Arquivo | Alteração |
|---|---|
| `src/pages/Auth.tsx` | Redirect com token + restringir `canSignUp` |
| `src/App.tsx` | Remover rota `/onboarding` e import |
| `src/contexts/UnitContext.tsx` | Checar convites pendentes antes de auto-provision |
| `src/pages/Onboarding.tsx` | Pode ser deletado (código morto) |

