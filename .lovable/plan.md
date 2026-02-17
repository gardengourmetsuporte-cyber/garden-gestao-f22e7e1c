

# Modulo Financeiro Pessoal

## Resumo

Criar um modulo financeiro pessoal completamente independente do Garden. Vai reutilizar as mesmas tabelas do banco (`finance_transactions`, `finance_accounts`, `finance_categories`) mas com `unit_id = NULL`, separando automaticamente os dados pessoais dos dados empresariais.

## Como Funciona a Separacao

- **Financeiro Garden:** filtra por `unit_id = <unidade ativa>`
- **Financeiro Pessoal:** filtra por `unit_id IS NULL`

Nenhuma transacao pessoal aparece no Garden e vice-versa. Mesma seguranca RLS (tudo filtrado por `user_id`).

## O Que Sera Criado

### 1. Hook `usePersonalFinance.ts`
- Copia simplificada do `useFinance.ts`
- Todas as queries usam `.is('unit_id', null)` em vez de `.eq('unit_id', activeUnitId)`
- Remove dependencia de suppliers/employees (nao faz sentido no pessoal)
- Query keys separadas: `personal-finance-*`

### 2. Categorias Pessoais Padrao

**Despesas:**
- Moradia (Aluguel, Condominio, IPTU, Energia, Agua, Gas, Internet)
- Alimentacao (Supermercado, Restaurantes, Delivery, Lanches)
- Transporte (Combustivel, Uber/99, Estacionamento, Manutencao Carro, Seguro Auto)
- Saude (Plano de Saude, Farmacia, Consultas, Academia)
- Educacao (Cursos, Livros, Escola/Faculdade)
- Lazer (Streaming, Viagens, Passeios, Hobbies)
- Vestuario (Roupas, Calcados, Acessorios)
- Financeiro (Cartao de Credito, Emprestimos, Investimentos, Seguros)
- Pessoal (Cuidados Pessoais, Presentes, Assinaturas)

**Receitas:**
- Salario/Pro-labore
- Investimentos (Dividendos, Rendimentos)
- Extras (Freelance, Vendas, Outros)

### 3. Pagina `PersonalFinance.tsx`
- Reutiliza os mesmos subcomponentes: `FinanceHome`, `FinanceTransactions`, `FinanceCharts`, `FinancePlanning`, `FinanceMore`, `TransactionSheet`
- Remove os campos de fornecedor/funcionario do formulario (passa arrays vazios)
- Titulo e icone diferenciados

### 4. Rota e Navegacao
- Rota: `/personal-finance`
- Adicionado ao modulo de navegacao em `modules.ts`
- Grupo: "Pessoal" (novo grupo no menu)
- Icone: `Wallet` 
- Acessivel pelo App Launcher

## Secao Tecnica

### Arquivos a Criar
- `src/hooks/usePersonalFinance.ts` -- hook com queries `unit_id IS NULL`
- `src/pages/PersonalFinance.tsx` -- pagina que reutiliza componentes existentes

### Arquivos a Editar
- `src/types/finance.ts` -- adicionar `DEFAULT_PERSONAL_EXPENSE_CATEGORIES` e `DEFAULT_PERSONAL_INCOME_CATEGORIES`
- `src/lib/modules.ts` -- adicionar modulo `personal-finance`
- `src/App.tsx` -- adicionar rota `/personal-finance`
- `src/lib/iconMap.ts` -- garantir icone `Wallet` mapeado

### Banco de Dados
Nenhuma migracao necessaria. As tabelas `finance_*` ja suportam `unit_id NULL` e as RLS policies filtram por `user_id`, entao tudo funciona automaticamente.

### Isolamento de Dados
- O hook atual `useFinance` filtra `eq('unit_id', activeUnitId)` -- nunca ve dados com `unit_id = NULL`
- O novo hook `usePersonalFinance` filtra `.is('unit_id', null)` -- nunca ve dados do Garden
- Separacao total garantida

