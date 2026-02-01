

# Correção das Vulnerabilidades de Segurança

Vou corrigir os problemas de segurança que estão bloqueando a publicação do seu aplicativo.

---

## Problemas Identificados

| Problema | Nível | Tabela |
|----------|-------|--------|
| Dados de fornecedores acessíveis sem login | Erro | `suppliers` |
| Política de SELECT dos perfis precisa ajuste | Aviso | `profiles` |

---

## Solução

### 1. Corrigir política da tabela `suppliers`

A tabela de fornecedores tem uma política que usa `true` na condição SELECT, permitindo acesso público. Vou alterar para exigir autenticação:

```sql
-- Remover política antiga
DROP POLICY IF EXISTS "Authenticated can view suppliers" ON public.suppliers;

-- Criar nova política que exige autenticação
CREATE POLICY "Authenticated can view suppliers" ON public.suppliers
  FOR SELECT TO authenticated
  USING (is_authenticated());
```

### 2. Verificar política da tabela `profiles`

A migração anterior pode não ter sido aplicada corretamente. Vou garantir que a política SELECT esteja configurada:

```sql
-- Garantir que a política existe
DROP POLICY IF EXISTS "Authenticated can view profiles" ON public.profiles;
CREATE POLICY "Authenticated can view profiles" ON public.profiles
  FOR SELECT TO authenticated
  USING (is_authenticated());
```

---

## Resultado Esperado

Após as correções:
- Apenas usuários logados poderão ver fornecedores e perfis
- Os erros de segurança serão resolvidos
- A publicação será desbloqueada

---

## Detalhes Técnicos

As políticas RLS (Row Level Security) serão atualizadas para usar `is_authenticated()` em vez de `true`, garantindo que apenas usuários autenticados tenham acesso de leitura aos dados sensíveis.

