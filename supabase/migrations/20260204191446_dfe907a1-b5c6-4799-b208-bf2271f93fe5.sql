-- =============================================
-- ENUM: Tipo de transação financeira
-- =============================================
CREATE TYPE public.transaction_type AS ENUM ('income', 'expense', 'transfer', 'credit_card');

-- =============================================
-- TABELA: Contas Financeiras
-- =============================================
CREATE TABLE public.finance_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'wallet',
  balance DECIMAL(15,2) NOT NULL DEFAULT 0,
  color TEXT NOT NULL DEFAULT '#3b82f6',
  icon TEXT DEFAULT 'Wallet',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- =============================================
-- TABELA: Categorias Financeiras (com hierarquia)
-- =============================================
CREATE TABLE public.finance_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  type TEXT NOT NULL,
  icon TEXT NOT NULL DEFAULT 'Tag',
  color TEXT NOT NULL DEFAULT '#6366f1',
  parent_id UUID REFERENCES public.finance_categories(id) ON DELETE CASCADE,
  is_system BOOLEAN NOT NULL DEFAULT false,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- =============================================
-- TABELA: Transações Financeiras
-- =============================================
CREATE TABLE public.finance_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  type public.transaction_type NOT NULL,
  amount DECIMAL(15,2) NOT NULL,
  description TEXT NOT NULL,
  category_id UUID REFERENCES public.finance_categories(id) ON DELETE SET NULL,
  account_id UUID REFERENCES public.finance_accounts(id) ON DELETE SET NULL,
  to_account_id UUID REFERENCES public.finance_accounts(id) ON DELETE SET NULL,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  is_paid BOOLEAN NOT NULL DEFAULT true,
  is_fixed BOOLEAN NOT NULL DEFAULT false,
  is_recurring BOOLEAN NOT NULL DEFAULT false,
  recurring_interval TEXT,
  tags TEXT[],
  notes TEXT,
  attachment_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- =============================================
-- TABELA: Orçamento/Planejamento
-- =============================================
CREATE TABLE public.finance_budgets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  category_id UUID REFERENCES public.finance_categories(id) ON DELETE CASCADE,
  month INTEGER NOT NULL CHECK (month >= 1 AND month <= 12),
  year INTEGER NOT NULL CHECK (year >= 2000 AND year <= 2100),
  planned_amount DECIMAL(15,2) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, category_id, month, year)
);

-- =============================================
-- TABELA: Tags Personalizadas
-- =============================================
CREATE TABLE public.finance_tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  color TEXT NOT NULL DEFAULT '#6366f1',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, name)
);

-- =============================================
-- ÍNDICES para performance
-- =============================================
CREATE INDEX idx_finance_transactions_user_date ON public.finance_transactions(user_id, date DESC);
CREATE INDEX idx_finance_transactions_category ON public.finance_transactions(category_id);
CREATE INDEX idx_finance_transactions_account ON public.finance_transactions(account_id);
CREATE INDEX idx_finance_categories_user_type ON public.finance_categories(user_id, type);
CREATE INDEX idx_finance_categories_parent ON public.finance_categories(parent_id);
CREATE INDEX idx_finance_accounts_user ON public.finance_accounts(user_id);

-- =============================================
-- ENABLE RLS em todas as tabelas
-- =============================================
ALTER TABLE public.finance_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.finance_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.finance_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.finance_budgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.finance_tags ENABLE ROW LEVEL SECURITY;

-- =============================================
-- RLS POLICIES: Usuário gerencia apenas seus dados
-- =============================================

-- finance_accounts
CREATE POLICY "Users manage own accounts" ON public.finance_accounts
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- finance_categories
CREATE POLICY "Users manage own categories" ON public.finance_categories
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- finance_transactions
CREATE POLICY "Users manage own transactions" ON public.finance_transactions
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- finance_budgets
CREATE POLICY "Users manage own budgets" ON public.finance_budgets
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- finance_tags
CREATE POLICY "Users manage own tags" ON public.finance_tags
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- =============================================
-- TRIGGERS para updated_at
-- =============================================
CREATE TRIGGER update_finance_accounts_updated_at
  BEFORE UPDATE ON public.finance_accounts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_finance_categories_updated_at
  BEFORE UPDATE ON public.finance_categories
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_finance_transactions_updated_at
  BEFORE UPDATE ON public.finance_transactions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_finance_budgets_updated_at
  BEFORE UPDATE ON public.finance_budgets
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =============================================
-- FUNÇÃO: Atualizar saldo da conta automaticamente
-- =============================================
CREATE OR REPLACE FUNCTION public.update_account_balance_on_transaction()
RETURNS TRIGGER AS $$
BEGIN
  -- Para INSERT
  IF TG_OP = 'INSERT' THEN
    IF NEW.is_paid AND NEW.account_id IS NOT NULL THEN
      IF NEW.type = 'income' THEN
        UPDATE public.finance_accounts SET balance = balance + NEW.amount, updated_at = now() WHERE id = NEW.account_id;
      ELSIF NEW.type IN ('expense', 'credit_card') THEN
        UPDATE public.finance_accounts SET balance = balance - NEW.amount, updated_at = now() WHERE id = NEW.account_id;
      ELSIF NEW.type = 'transfer' THEN
        UPDATE public.finance_accounts SET balance = balance - NEW.amount, updated_at = now() WHERE id = NEW.account_id;
        IF NEW.to_account_id IS NOT NULL THEN
          UPDATE public.finance_accounts SET balance = balance + NEW.amount, updated_at = now() WHERE id = NEW.to_account_id;
        END IF;
      END IF;
    END IF;
    RETURN NEW;
  END IF;
  
  -- Para DELETE
  IF TG_OP = 'DELETE' THEN
    IF OLD.is_paid AND OLD.account_id IS NOT NULL THEN
      IF OLD.type = 'income' THEN
        UPDATE public.finance_accounts SET balance = balance - OLD.amount, updated_at = now() WHERE id = OLD.account_id;
      ELSIF OLD.type IN ('expense', 'credit_card') THEN
        UPDATE public.finance_accounts SET balance = balance + OLD.amount, updated_at = now() WHERE id = OLD.account_id;
      ELSIF OLD.type = 'transfer' THEN
        UPDATE public.finance_accounts SET balance = balance + OLD.amount, updated_at = now() WHERE id = OLD.account_id;
        IF OLD.to_account_id IS NOT NULL THEN
          UPDATE public.finance_accounts SET balance = balance - OLD.amount, updated_at = now() WHERE id = OLD.to_account_id;
        END IF;
      END IF;
    END IF;
    RETURN OLD;
  END IF;
  
  -- Para UPDATE (reverter antigo e aplicar novo)
  IF TG_OP = 'UPDATE' THEN
    -- Reverter transação antiga se estava paga
    IF OLD.is_paid AND OLD.account_id IS NOT NULL THEN
      IF OLD.type = 'income' THEN
        UPDATE public.finance_accounts SET balance = balance - OLD.amount, updated_at = now() WHERE id = OLD.account_id;
      ELSIF OLD.type IN ('expense', 'credit_card') THEN
        UPDATE public.finance_accounts SET balance = balance + OLD.amount, updated_at = now() WHERE id = OLD.account_id;
      ELSIF OLD.type = 'transfer' THEN
        UPDATE public.finance_accounts SET balance = balance + OLD.amount, updated_at = now() WHERE id = OLD.account_id;
        IF OLD.to_account_id IS NOT NULL THEN
          UPDATE public.finance_accounts SET balance = balance - OLD.amount, updated_at = now() WHERE id = OLD.to_account_id;
        END IF;
      END IF;
    END IF;
    
    -- Aplicar nova transação se está paga
    IF NEW.is_paid AND NEW.account_id IS NOT NULL THEN
      IF NEW.type = 'income' THEN
        UPDATE public.finance_accounts SET balance = balance + NEW.amount, updated_at = now() WHERE id = NEW.account_id;
      ELSIF NEW.type IN ('expense', 'credit_card') THEN
        UPDATE public.finance_accounts SET balance = balance - NEW.amount, updated_at = now() WHERE id = NEW.account_id;
      ELSIF NEW.type = 'transfer' THEN
        UPDATE public.finance_accounts SET balance = balance - NEW.amount, updated_at = now() WHERE id = NEW.account_id;
        IF NEW.to_account_id IS NOT NULL THEN
          UPDATE public.finance_accounts SET balance = balance + NEW.amount, updated_at = now() WHERE id = NEW.to_account_id;
        END IF;
      END IF;
    END IF;
    RETURN NEW;
  END IF;
  
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Trigger para atualizar saldo
CREATE TRIGGER trigger_update_account_balance
  AFTER INSERT OR UPDATE OR DELETE ON public.finance_transactions
  FOR EACH ROW EXECUTE FUNCTION public.update_account_balance_on_transaction();