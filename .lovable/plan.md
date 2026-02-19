

# Resumo Pessoal Financeiro no Dashboard dos Funcionarios

## O que vai mudar

O Dashboard do funcionario vai ganhar um card de resumo financeiro pessoal (saldo do mes, despesas, pendencias) igual ao card do admin, porem mostrando os dados do modulo de Financas Pessoais (unit_id = NULL) de cada usuario.

Nao sera necessario criar tabelas novas. O modulo de Financas Pessoais ja existe e usa as mesmas tabelas (finance_accounts, finance_transactions, finance_categories) com unit_id = NULL para isolar os dados pessoais.

## Alteracoes

### 1. Criar hook `usePersonalFinanceStats`
- Novo arquivo: `src/hooks/usePersonalFinanceStats.ts`
- Busca dados de `finance_accounts` e `finance_transactions` onde `unit_id IS NULL` e `user_id = auth.uid()`
- Retorna: saldo total das contas, receitas do mes, despesas do mes, despesas pendentes
- Usa React Query com cache de 2 minutos

### 2. Atualizar `EmployeeDashboard.tsx`
- Importar o novo hook `usePersonalFinanceStats`
- Adicionar um card financeiro pessoal logo apos o card de boas-vindas (antes do card de pontos)
- O card tera o mesmo visual do card financeiro do admin (finance-hero-card) mas com a identidade visual verde-esmeralda do modulo pessoal (classe `finance-hero-card--personal`)
- Ao clicar, navega para `/personal-finance`
- Mostra: Saldo pessoal (valor grande), Despesas do mes, Pendencias

### 3. Atualizar `AdminDashboard.tsx`
- Adicionar um segundo card financeiro pessoal abaixo do card do financeiro empresarial
- Mesmo visual verde-esmeralda do modulo pessoal
- Ao clicar, navega para `/personal-finance`

## Detalhes Tecnicos

O hook `usePersonalFinanceStats` fara 3 queries em paralelo:
1. `finance_accounts` com `user_id = uid` e `unit_id IS NULL` para saldo total
2. `finance_transactions` com `type = 'income'`, `is_paid = true`, mes atual para receitas
3. `finance_transactions` com `type IN ('expense', 'credit_card')`, mes atual para despesas (pagas e pendentes separadas)

O card usara as classes CSS ja existentes `finance-hero-card` e `finance-hero-card--personal` que ja tem a identidade visual verde-esmeralda.

