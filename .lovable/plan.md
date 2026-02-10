

# Plano: Vincular Funcionarios e Fornecedores nas Transacoes + Drill-down Natural nos Graficos

## Resumo

O fluxo atual exige clicar em uma categoria e depois clicar em botoes extras ("Ver por Funcionario" / "Ver por Fornecedor"). A proposta e tornar isso natural: ao clicar em "Salarios" no grafico, o sistema mostra automaticamente o detalhamento por funcionario. Para isso funcionar, precisamos que as transacoes tenham vinculo direto com funcionarios e fornecedores.

## O que muda

### 1. Banco de dados
- Adicionar coluna `employee_id` (uuid, nullable, FK para `employees`) na tabela `finance_transactions`
- Isso permite vincular qualquer transacao diretamente a um funcionario, similar ao que ja existe com `supplier_id`

### 2. Formulario de Transacao (TransactionSheet)
- Adicionar campo **"Fornecedor"** (select) -- visivel apenas para despesas
- Adicionar campo **"Funcionario"** (select) -- visivel apenas para despesas
- Ambos sao opcionais e aparecem na secao de opcoes avancadas
- Os fornecedores vem do cadastro existente (`useSuppliers`)
- Os funcionarios vem do cadastro existente (`employees`)
- O `TransactionSheet` recebe as listas de fornecedores e funcionarios como props

### 3. Graficos com drill-down automatico
- Remover os botoes "Ver por Funcionario" e "Ver por Fornecedor"
- Ao clicar em uma categoria (ex: "Folha de Pagamento"), o sistema:
  - Mostra subcategorias (como ja faz)
  - Detecta automaticamente se ha transacoes com `employee_id` ou `supplier_id` vinculados
  - Se houver, exibe o detalhamento por entidade diretamente (sem botao extra)
- Ao clicar em "Materia-prima", mostra direto o detalhamento por fornecedor
- Ao clicar em "Salarios", mostra direto o detalhamento por funcionario

### 4. Integracao com modulo de Funcionarios
- O modulo de funcionarios ja cria transacoes financeiras ao confirmar pagamentos (via `finance_transaction_id` na tabela `employee_payments`)
- Atualizar essa logica para tambem preencher o `employee_id` na transacao criada, garantindo que pagamentos feitos pelo modulo de funcionarios ja aparecam corretamente nos graficos

## Detalhes Tecnicos

### Migracao SQL
```sql
ALTER TABLE public.finance_transactions
ADD COLUMN employee_id uuid REFERENCES public.employees(id) ON DELETE SET NULL;
```

### Arquivos modificados
- **`src/components/finance/TransactionSheet.tsx`** -- adicionar selects de fornecedor e funcionario
- **`src/types/finance.ts`** -- adicionar `employee_id` ao tipo `FinanceTransaction` e `TransactionFormData`
- **`src/hooks/useFinance.ts`** -- incluir join com `employees` na query e salvar `employee_id`/`supplier_id`
- **`src/hooks/useFinanceStats.ts`** -- simplificar `getEmployeeStats` para usar `employee_id` direto da transacao (sem query extra)
- **`src/components/finance/FinanceCharts.tsx`** -- remover botoes de entidade, implementar deteccao automatica no drill-down
- **`src/pages/Finance.tsx`** -- passar listas de fornecedores e funcionarios para o `TransactionSheet`
- **`src/hooks/useEmployees.ts`** (ou equivalente) -- garantir que ao confirmar pagamento, o `employee_id` seja salvo na transacao financeira

### Fluxo do drill-down simplificado
```text
Grafico de Pizza (categorias)
  |
  +-- Clica em "Folha de Pagamento"
  |     |
  |     +-- Mostra subcategorias (Salarios, FGTS, etc.)
  |     |     |
  |     |     +-- Clica em "Salarios"
  |     |           |
  |     |           +-- Detecta employee_id nas transacoes
  |     |           +-- Mostra detalhamento por funcionario automaticamente
  |
  +-- Clica em "Materia-prima"
        |
        +-- Mostra subcategorias (Carnes, Bebidas, etc.)
              |
              +-- Clica em "Carnes"
                    |
                    +-- Detecta supplier_id nas transacoes
                    +-- Mostra detalhamento por fornecedor automaticamente
```

