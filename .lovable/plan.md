

# Plano: Módulo Financeiro Completo (Baseado no Mobills)

## Objetivo

Criar um módulo financeiro completo exclusivo para o gestor, replicando o layout, fluxo e funcionalidades do Mobills, adaptado para gestão de restaurante/hamburgueria. O gestor poderá lançar despesas em menos de 10 segundos.

## Visão Geral do Módulo

```text
┌─────────────────────────────────────────────────────────────────────┐
│                     MÓDULO FINANCEIRO                               │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  📍 NAVEGAÇÃO INFERIOR FIXA (estilo Mobills)                        │
│  ┌─────────┬─────────┬─────────┬─────────┬─────────┐               │
│  │  🏠     │   📄    │    ➕   │   📊    │    ⚙️   │               │
│  │Principal│Transações│ ADICIONAR│Gráficos │  Mais   │               │
│  └─────────┴─────────┴─────────┴─────────┴─────────┘               │
│                                                                     │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  🏠 TELA PRINCIPAL                                                  │
│  ├─ Mês selecionável (Fevereiro 2026)                              │
│  ├─ Card de saldo total                                            │
│  ├─ Receitas (verde) vs Despesas (vermelho)                        │
│  ├─ Alertas de pendências                                          │
│  └─ Lista de contas (Carteira, Banco)                              │
│                                                                     │
│  📄 TRANSAÇÕES                                                      │
│  ├─ Lista cronológica por dia                                      │
│  ├─ Agrupamento por data                                           │
│  ├─ Ícones por categoria                                           │
│  └─ Status de pago                                                 │
│                                                                     │
│  📊 GRÁFICOS                                                        │
│  ├─ Pizza por categorias                                           │
│  ├─ Linha do tempo                                                 │
│  └─ Detalhamento por subcategoria                                  │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

## Arquivos a Criar/Modificar

| Arquivo | Tipo | Descrição |
|---------|------|-----------|
| **Migração SQL** | Banco | Criar 5 tabelas + enums + RLS |
| `src/types/finance.ts` | Novo | Tipos TypeScript do módulo |
| `src/hooks/useFinance.ts` | Novo | Hook principal com CRUD |
| `src/hooks/useFinanceStats.ts` | Novo | Hook para estatísticas e gráficos |
| `src/pages/Finance.tsx` | Novo | Container principal com tabs |
| `src/components/finance/FinanceHome.tsx` | Novo | Tela principal |
| `src/components/finance/FinanceTransactions.tsx` | Novo | Lista de transações |
| `src/components/finance/FinanceCharts.tsx` | Novo | Gráficos e análises |
| `src/components/finance/FinancePlanning.tsx` | Novo | Planejamento |
| `src/components/finance/FinanceMore.tsx` | Novo | Configurações do módulo |
| `src/components/finance/TransactionSheet.tsx` | Novo | Formulário de lançamento |
| `src/components/finance/TransactionItem.tsx` | Novo | Item de transação |
| `src/components/finance/AccountCard.tsx` | Novo | Card de conta |
| `src/components/finance/CategoryPicker.tsx` | Novo | Seletor de categoria |
| `src/components/finance/FinanceBottomNav.tsx` | Novo | Navegação inferior |
| `src/components/finance/MonthSelector.tsx` | Novo | Seletor de mês |
| `src/components/settings/FinanceCategorySettings.tsx` | Novo | Gestão de categorias |
| `src/components/settings/FinanceAccountSettings.tsx` | Novo | Gestão de contas |
| `src/components/layout/AppLayout.tsx` | Modificar | Adicionar link Financeiro |
| `src/App.tsx` | Modificar | Adicionar rota `/finance` |

## Seção Tecnica

### 1. Estrutura do Banco de Dados

```sql
-- =============================================
-- ENUMS
-- =============================================

CREATE TYPE transaction_type AS ENUM ('income', 'expense', 'transfer', 'credit_card');

-- =============================================
-- TABELA: Contas Financeiras
-- =============================================

CREATE TABLE finance_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'wallet', -- 'wallet', 'bank', 'credit_card'
  balance DECIMAL(15,2) NOT NULL DEFAULT 0,
  color TEXT NOT NULL DEFAULT '#3b82f6',
  icon TEXT DEFAULT 'Wallet',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- =============================================
-- TABELA: Categorias Financeiras
-- =============================================

CREATE TABLE finance_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT NOT NULL, -- 'income' ou 'expense'
  icon TEXT NOT NULL DEFAULT 'Tag',
  color TEXT NOT NULL DEFAULT '#6366f1',
  parent_id UUID REFERENCES finance_categories(id) ON DELETE CASCADE,
  is_system BOOLEAN NOT NULL DEFAULT false, -- categorias padrão
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- =============================================
-- TABELA: Transações
-- =============================================

CREATE TABLE finance_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type transaction_type NOT NULL,
  amount DECIMAL(15,2) NOT NULL,
  description TEXT NOT NULL,
  category_id UUID REFERENCES finance_categories(id),
  account_id UUID REFERENCES finance_accounts(id),
  to_account_id UUID REFERENCES finance_accounts(id), -- para transferências
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  is_paid BOOLEAN NOT NULL DEFAULT true,
  is_fixed BOOLEAN NOT NULL DEFAULT false, -- despesa fixa
  is_recurring BOOLEAN NOT NULL DEFAULT false,
  recurring_interval TEXT, -- 'monthly', 'weekly', etc
  tags TEXT[],
  notes TEXT,
  attachment_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- =============================================
-- TABELA: Orçamento/Planejamento
-- =============================================

CREATE TABLE finance_budgets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  category_id UUID REFERENCES finance_categories(id),
  month INTEGER NOT NULL, -- 1-12
  year INTEGER NOT NULL,
  planned_amount DECIMAL(15,2) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, category_id, month, year)
);

-- =============================================
-- TABELA: Tags Personalizadas
-- =============================================

CREATE TABLE finance_tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  color TEXT NOT NULL DEFAULT '#6366f1',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, name)
);

-- =============================================
-- ÍNDICES
-- =============================================

CREATE INDEX idx_finance_transactions_user_date 
  ON finance_transactions(user_id, date DESC);
CREATE INDEX idx_finance_transactions_category 
  ON finance_transactions(category_id);
CREATE INDEX idx_finance_transactions_account 
  ON finance_transactions(account_id);
CREATE INDEX idx_finance_categories_user_type 
  ON finance_categories(user_id, type);

-- =============================================
-- RLS POLICIES (todas as tabelas)
-- =============================================

-- Admins podem gerenciar suas próprias finanças
ALTER TABLE finance_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE finance_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE finance_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE finance_budgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE finance_tags ENABLE ROW LEVEL SECURITY;

-- Políticas: usuário vê/edita apenas seus dados
CREATE POLICY "Users manage own accounts" ON finance_accounts
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users manage own categories" ON finance_categories
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users manage own transactions" ON finance_transactions
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users manage own budgets" ON finance_budgets
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users manage own tags" ON finance_tags
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- =============================================
-- TRIGGERS
-- =============================================

CREATE TRIGGER update_finance_accounts_updated_at
  BEFORE UPDATE ON finance_accounts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_finance_categories_updated_at
  BEFORE UPDATE ON finance_categories
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_finance_transactions_updated_at
  BEFORE UPDATE ON finance_transactions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_finance_budgets_updated_at
  BEFORE UPDATE ON finance_budgets
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =============================================
-- FUNÇÃO: Atualizar saldo da conta
-- =============================================

CREATE OR REPLACE FUNCTION update_account_balance_on_transaction()
RETURNS TRIGGER AS $$
BEGIN
  -- Para novas transações
  IF TG_OP = 'INSERT' THEN
    IF NEW.type = 'income' AND NEW.is_paid THEN
      UPDATE finance_accounts SET balance = balance + NEW.amount WHERE id = NEW.account_id;
    ELSIF NEW.type IN ('expense', 'credit_card') AND NEW.is_paid THEN
      UPDATE finance_accounts SET balance = balance - NEW.amount WHERE id = NEW.account_id;
    ELSIF NEW.type = 'transfer' AND NEW.is_paid THEN
      UPDATE finance_accounts SET balance = balance - NEW.amount WHERE id = NEW.account_id;
      UPDATE finance_accounts SET balance = balance + NEW.amount WHERE id = NEW.to_account_id;
    END IF;
  END IF;
  
  -- Para exclusões
  IF TG_OP = 'DELETE' THEN
    IF OLD.type = 'income' AND OLD.is_paid THEN
      UPDATE finance_accounts SET balance = balance - OLD.amount WHERE id = OLD.account_id;
    ELSIF OLD.type IN ('expense', 'credit_card') AND OLD.is_paid THEN
      UPDATE finance_accounts SET balance = balance + OLD.amount WHERE id = OLD.account_id;
    ELSIF OLD.type = 'transfer' AND OLD.is_paid THEN
      UPDATE finance_accounts SET balance = balance + OLD.amount WHERE id = OLD.account_id;
      UPDATE finance_accounts SET balance = balance - OLD.amount WHERE id = OLD.to_account_id;
    END IF;
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trigger_update_balance
  AFTER INSERT OR DELETE ON finance_transactions
  FOR EACH ROW EXECUTE FUNCTION update_account_balance_on_transaction();
```

### 2. Categorias Padrão (Restaurante)

As categorias serão criadas automaticamente no primeiro acesso:

**Despesas:**
- Matéria-prima (Carnes, Frios, Bebidas, Panificação, Hortifruti, Mercado)
- Despesas Administrativas (Energia, Água, Aluguel, Limpeza)
- Folha de Pagamento
- Pró-labore
- Taxas Operacionais (App Delivery, PDV, Tarifa Bancária)
- Impostos
- Financiamentos
- Investimentos

**Receitas:**
- Vendas Balcão
- Vendas Delivery
- Outros

### 3. Tipos TypeScript

```typescript
// src/types/finance.ts

export type TransactionType = 'income' | 'expense' | 'transfer' | 'credit_card';
export type AccountType = 'wallet' | 'bank' | 'credit_card';

export interface FinanceAccount {
  id: string;
  user_id: string;
  name: string;
  type: AccountType;
  balance: number;
  color: string;
  icon: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface FinanceCategory {
  id: string;
  user_id: string;
  name: string;
  type: 'income' | 'expense';
  icon: string;
  color: string;
  parent_id: string | null;
  is_system: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
  subcategories?: FinanceCategory[];
}

export interface FinanceTransaction {
  id: string;
  user_id: string;
  type: TransactionType;
  amount: number;
  description: string;
  category_id: string | null;
  account_id: string | null;
  to_account_id: string | null;
  date: string;
  is_paid: boolean;
  is_fixed: boolean;
  is_recurring: boolean;
  recurring_interval: string | null;
  tags: string[];
  notes: string | null;
  attachment_url: string | null;
  created_at: string;
  updated_at: string;
  // Joined
  category?: FinanceCategory;
  account?: FinanceAccount;
  to_account?: FinanceAccount;
}

export interface FinanceBudget {
  id: string;
  user_id: string;
  category_id: string | null;
  month: number;
  year: number;
  planned_amount: number;
  created_at: string;
  updated_at: string;
  category?: FinanceCategory;
}

export interface MonthlyStats {
  month: number;
  year: number;
  totalIncome: number;
  totalExpense: number;
  balance: number;
  byCategory: { category: FinanceCategory; amount: number; percentage: number }[];
}
```

### 4. Hook Principal (useFinance)

```typescript
// src/hooks/useFinance.ts

export function useFinance(selectedMonth: Date) {
  const { user } = useAuth();
  
  // Estados
  const [accounts, setAccounts] = useState<FinanceAccount[]>([]);
  const [categories, setCategories] = useState<FinanceCategory[]>([]);
  const [transactions, setTransactions] = useState<FinanceTransaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Buscar dados do mês selecionado
  async function fetchMonthData() {
    const startDate = startOfMonth(selectedMonth);
    const endDate = endOfMonth(selectedMonth);
    
    // Buscar transações do mês
    const { data } = await supabase
      .from('finance_transactions')
      .select(`
        *,
        category:finance_categories(*),
        account:finance_accounts(*),
        to_account:finance_accounts(*)
      `)
      .gte('date', format(startDate, 'yyyy-MM-dd'))
      .lte('date', format(endDate, 'yyyy-MM-dd'))
      .order('date', { ascending: false });
      
    setTransactions(data || []);
  }

  // CRUD de transações
  async function addTransaction(data: Omit<FinanceTransaction, 'id' | 'user_id' | 'created_at' | 'updated_at'>) {
    await supabase.from('finance_transactions').insert({
      ...data,
      user_id: user.id,
    });
    await fetchMonthData();
    await fetchAccounts(); // Atualizar saldos
  }

  // Estatísticas do mês
  const monthStats = useMemo(() => {
    const income = transactions
      .filter(t => t.type === 'income' && t.is_paid)
      .reduce((sum, t) => sum + t.amount, 0);
      
    const expense = transactions
      .filter(t => t.type !== 'income' && t.type !== 'transfer' && t.is_paid)
      .reduce((sum, t) => sum + t.amount, 0);
      
    return { income, expense, balance: income - expense };
  }, [transactions]);

  // Transações por data (para lista agrupada)
  const transactionsByDate = useMemo(() => {
    const grouped: Record<string, FinanceTransaction[]> = {};
    transactions.forEach(t => {
      const dateKey = t.date;
      if (!grouped[dateKey]) grouped[dateKey] = [];
      grouped[dateKey].push(t);
    });
    return grouped;
  }, [transactions]);

  return {
    accounts,
    categories,
    transactions,
    transactionsByDate,
    monthStats,
    isLoading,
    addTransaction,
    updateTransaction,
    deleteTransaction,
    addAccount,
    updateAccount,
    deleteAccount,
    refetch: fetchMonthData,
  };
}
```

### 5. Tela de Lançamento (TransactionSheet)

Design igual ao Mobills - formulário rápido:

```text
┌─────────────────────────────────────────────────────────────┐
│                    NOVA DESPESA                    [X]      │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  [  Despesa  ] [ Receita ] [ Transf. ] [ Cartão ]          │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  R$                                        0,00     │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  ☑ Pago                           📅 Hoje | Ontem | ...    │
│                                                             │
│  📁 Categoria                                       ▼      │
│  💳 Conta                                           ▼      │
│  📝 Descrição                                              │
│                                                             │
│  ── Opções Avançadas ──                                    │
│  ☐ Despesa fixa                                            │
│  ☐ Repetir                                                 │
│  📎 Anexar comprovante                                     │
│  🏷 Tags                                                   │
│                                                             │
│            [ SALVAR LANÇAMENTO ]                           │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 6. Tela de Gráficos

```text
┌─────────────────────────────────────────────────────────────┐
│  📊 Análise de Gastos                                       │
│                                                             │
│  [Categorias] [Linha do Tempo] [Barras]                    │
│                                                             │
│         ┌─────────────────────┐                            │
│         │                     │                            │
│         │    GRÁFICO PIZZA    │                            │
│         │                     │                            │
│         │   R$ 45.320,00      │                            │
│         │   total do mês      │                            │
│         └─────────────────────┘                            │
│                                                             │
│  Matéria-prima ████████████████████ 45%  R$ 20.394         │
│  Folha Pagto   ████████████         28%  R$ 12.690         │
│  Desp. Admin   ██████               12%  R$ 5.438          │
│  Taxas Oper.   ████                  8%  R$ 3.626          │
│  Outros        ██                    7%  R$ 3.172          │
│                                                             │
└─────────────────────────────────────────────────────────────┘

Ao clicar em "Matéria-prima":

┌─────────────────────────────────────────────────────────────┐
│  ← Matéria-prima                        R$ 20.394,00       │
│                                                             │
│  Carnes       ██████████████████████  48%  R$ 9.789        │
│  Bebidas      ████████████            25%  R$ 5.099        │
│  Hortifruti   ██████                  12%  R$ 2.447        │
│  Panificação  ████                     8%  R$ 1.632        │
│  Outros       ██                       7%  R$ 1.427        │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 7. Navegação e Layout

O módulo financeiro terá seu próprio layout interno com navegação inferior fixa:

```typescript
// src/pages/Finance.tsx

export default function Finance() {
  const [activeTab, setActiveTab] = useState<'home' | 'transactions' | 'charts' | 'planning' | 'more'>('home');
  const [transactionSheetOpen, setTransactionSheetOpen] = useState(false);
  const [transactionType, setTransactionType] = useState<TransactionType>('expense');

  const handleAddTransaction = (type: TransactionType) => {
    setTransactionType(type);
    setTransactionSheetOpen(true);
  };

  return (
    <AppLayout>
      <div className="pb-20"> {/* Espaço para nav inferior */}
        {activeTab === 'home' && <FinanceHome onAddTransaction={handleAddTransaction} />}
        {activeTab === 'transactions' && <FinanceTransactions />}
        {activeTab === 'charts' && <FinanceCharts />}
        {activeTab === 'planning' && <FinancePlanning />}
        {activeTab === 'more' && <FinanceMore />}
      </div>

      {/* Bottom Navigation (estilo Mobills) */}
      <FinanceBottomNav
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onAddPress={() => handleAddTransaction('expense')}
      />

      <TransactionSheet
        open={transactionSheetOpen}
        onOpenChange={setTransactionSheetOpen}
        defaultType={transactionType}
      />
    </AppLayout>
  );
}
```

### 8. Cores e Design

| Elemento | Cor | Classe CSS |
|----------|-----|------------|
| Receita | Verde | `text-success`, `bg-success` |
| Despesa | Vermelho | `text-destructive`, `bg-destructive` |
| Transferência | Azul | `text-primary`, `bg-primary` |
| Cartão de Crédito | Roxo | `text-purple-500`, `bg-purple-500` |
| Pendente | Amarelo | `text-warning`, `bg-warning` |

### 9. Preparação para IA

O módulo será estruturado para permitir:
- Análise de gastos recorrentes
- Alertas de desvio (ex: matéria-prima acima da média)
- Sugestões de economia
- Integração futura com estoque (custo real de insumos)

Os dados serão organizados de forma a facilitar queries analíticas via Edge Function.

## Ordem de Execução

1. **Migração do banco** - Tabelas, enums, triggers, RLS
2. **Tipos TypeScript** - `src/types/finance.ts`
3. **Hooks** - `useFinance.ts` e `useFinanceStats.ts`
4. **Componentes base** - TransactionItem, AccountCard, CategoryPicker
5. **Telas** - Home, Transactions, Charts, Planning, More
6. **TransactionSheet** - Formulário de lançamento rápido
7. **Bottom Navigation** - Navegação estilo Mobills
8. **Página principal** - Finance.tsx
9. **Navegação** - Adicionar link no menu lateral (admin only)
10. **Rota** - Adicionar no App.tsx

## Resultado Esperado

- Módulo financeiro completo exclusivo para admins
- Interface idêntica ao Mobills (fluxo e layout)
- Lançamento de despesa em menos de 10 segundos
- Gráficos por categoria com drill-down
- Saldo em tempo real por conta
- Histórico completo de transações
- Mobile-first com navegação inferior
- Base preparada para IA financeira futura
- Integração futura com estoque possível

