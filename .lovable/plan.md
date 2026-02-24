

# Auditoria de Estabilidade e Polimento do Sistema Atlas

## Resumo

Vou fazer uma varredura completa no sistema para corrigir bugs, inconsistencias e problemas de UX que fazem o app parecer amador. O foco sera em **eliminar erros silenciosos, melhorar feedback ao usuario, corrigir cache desatualizado e garantir que a interface funcione de forma fluida**.

---

## Problemas Identificados

### 1. Cache de autenticacao desatualizado (causa de varios bugs)
Quando a role de um usuario muda (ex: funcionario -> admin), o cache local (`garden_auth_cache`) continua com a role antiga. O usuario precisa fazer logout/login manual. Isso causa:
- Configuracoes nao aparecerem
- Dashboard mostrando visao errada
- Modulos ficarem invisíveis

**Correcao**: Invalidar o cache automaticamente quando `fetchUserData` retorna dados diferentes do cache. Adicionar um listener de `visibilitychange` para re-validar dados quando o usuario volta ao app.

### 2. Erros silenciosos em 74 pontos do codigo
Ha 74 blocos `catch {}` vazios espalhados pelo sistema. Quando algo falha, o usuario nao ve nenhum feedback — o app simplesmente nao faz nada. Exemplos criticos:
- `AccessLevelSettings.tsx` linha 113: salvar nivel de acesso falha silenciosamente
- `useManagementAI.ts` linha 119: IA falha sem aviso
- `UnitContext.tsx` linha 124: falha ao buscar unidades sem feedback

**Correcao**: Adicionar `toast.error()` nos catches criticos que afetam operacoes do usuario. Manter `catch {}` apenas em operacoes cosmeticas (vibrate, localStorage).

### 3. Flash de conteudo na tela de login
A tela de Auth mostra um spinner com texto "Carregando..." que pode exibir caracteres estranhos enquanto as fontes nao carregaram. O background com gradientes e animacoes complexas pode causar jank visual na renderizacao inicial.

**Correcao**: Simplificar o loader para usar apenas o spinner sem texto ate o primeiro render completo. Adicionar `font-display: swap` se nao estiver configurado.

### 4. Navegacao inconsistente para usuarios com nivel de acesso
O filtro de navegacao (`filteredNavItems`) tem logica complexa com multiplas condicoes que podem conflitar. Quando `accessLoading` e true, so mostra dashboard e settings, mas isso pode causar um "flash" onde modulos somem e reaparecem.

**Correcao**: Manter os itens visiveis do ultimo render durante o loading, usando um ref para cache.

### 5. Falta de ErrorBoundary por pagina
Ha apenas um ErrorBoundary global que envolve todas as rotas. Se uma pagina especifica der erro, o usuario ve a tela de erro genérica e perde todo o contexto.

**Correcao**: Envolver cada `ProtectedRoute` com seu proprio ErrorBoundary para isolar falhas por pagina.

### 6. Queries sem tratamento de erro
Varios hooks usam `useQuery` sem `onError` ou verificacao de `error` no retorno. Quando uma query falha, o componente fica em estado de loading infinito ou mostra dados vazios sem explicacao.

**Correcao**: Adicionar um wrapper padrao de query com toast de erro e retry visual.

---

## Plano de Implementacao

### Fase 1 — Cache e Autenticacao (alta prioridade)
1. **AuthContext.tsx**: Adicionar `visibilitychange` listener para re-fetch silencioso quando usuario volta ao app
2. **AuthContext.tsx**: Comparar dados retornados com cache e invalidar se diferente
3. **AuthContext.tsx**: Limpar cache no `fetchUserData` antes de setar novos dados

### Fase 2 — Feedback de Erros (alta prioridade)
4. **AccessLevelSettings.tsx**: Adicionar `toast.error` no catch do `handleSave`
5. **UnitContext.tsx**: Adicionar toast quando falha ao carregar unidades
6. **useUsers.ts**: Adicionar toast quando falha ao buscar usuarios
7. **useManagementAI.ts**: Adicionar toast na falha de inicializacao da IA

### Fase 3 — ErrorBoundary por Rota
8. **App.tsx**: Criar componente `RouteErrorBoundary` que envolve cada `ProtectedRoute` individualmente, com mensagem de "voltar ao inicio"

### Fase 4 — UX e Polimento
9. **Auth.tsx**: Remover texto "Carregando..." do spinner inicial, deixar so o icone girando
10. **AppLayout.tsx**: Cachear `filteredNavItems` para evitar flash durante `accessLoading`
11. **PageLoader.tsx**: Remover texto "Carregando..." (evita FOUT)

### Fase 5 — Resiliencia Global
12. **App.tsx**: Melhorar o `UnhandledRejectionGuard` para incluir detalhes uteis no log
13. **QueryClient**: Adicionar `onError` global no `defaultOptions.mutations` para toasts automaticos

---

## Detalhes Tecnicos

### Arquivos que serao modificados:
- `src/contexts/AuthContext.tsx` — cache inteligente + visibilitychange
- `src/contexts/UnitContext.tsx` — feedback de erro
- `src/components/settings/AccessLevelSettings.tsx` — toast de erro
- `src/hooks/useUsers.ts` — toast de erro
- `src/hooks/useManagementAI.ts` — toast de erro
- `src/App.tsx` — ErrorBoundary por rota + QueryClient global error
- `src/pages/Auth.tsx` — loader simplificado
- `src/components/layout/AppLayout.tsx` — cache de nav items
- `src/components/PageLoader.tsx` — remover texto

### Nenhuma mudanca no banco de dados sera necessaria.

