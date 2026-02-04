-- =============================================
-- TABELA: Faturas de Cartão de Crédito
-- =============================================

CREATE TABLE public.credit_card_invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  account_id UUID NOT NULL REFERENCES public.finance_accounts(id) ON DELETE CASCADE,
  due_date DATE NOT NULL,
  close_date DATE NOT NULL,
  total_amount DECIMAL(15,2) NOT NULL DEFAULT 0,
  is_paid BOOLEAN NOT NULL DEFAULT false,
  paid_at TIMESTAMPTZ,
  paid_from_account_id UUID REFERENCES public.finance_accounts(id),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(account_id, due_date)
);

-- =============================================
-- Adicionar referência de fatura nas transações
-- =============================================

ALTER TABLE public.finance_transactions
ADD COLUMN credit_card_invoice_id UUID REFERENCES public.credit_card_invoices(id) ON DELETE SET NULL;

ALTER TABLE public.finance_transactions
ADD COLUMN installment_number INTEGER;

ALTER TABLE public.finance_transactions
ADD COLUMN total_installments INTEGER;

ALTER TABLE public.finance_transactions
ADD COLUMN installment_group_id UUID;

-- =============================================
-- RLS POLICIES
-- =============================================

ALTER TABLE public.credit_card_invoices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own invoices" ON public.credit_card_invoices
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- =============================================
-- TRIGGER para atualizar updated_at
-- =============================================

CREATE TRIGGER update_credit_card_invoices_updated_at
  BEFORE UPDATE ON public.credit_card_invoices
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =============================================
-- FUNÇÃO: Atualizar total da fatura
-- =============================================

CREATE OR REPLACE FUNCTION public.update_invoice_total()
RETURNS TRIGGER AS $$
BEGIN
  -- Atualizar o total da fatura quando transações são adicionadas/removidas
  IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
    IF NEW.credit_card_invoice_id IS NOT NULL THEN
      UPDATE public.credit_card_invoices 
      SET total_amount = (
        SELECT COALESCE(SUM(amount), 0) 
        FROM public.finance_transactions 
        WHERE credit_card_invoice_id = NEW.credit_card_invoice_id
      ),
      updated_at = now()
      WHERE id = NEW.credit_card_invoice_id;
    END IF;
    
    -- Se a transação foi movida de outra fatura
    IF TG_OP = 'UPDATE' AND OLD.credit_card_invoice_id IS NOT NULL AND OLD.credit_card_invoice_id != NEW.credit_card_invoice_id THEN
      UPDATE public.credit_card_invoices 
      SET total_amount = (
        SELECT COALESCE(SUM(amount), 0) 
        FROM public.finance_transactions 
        WHERE credit_card_invoice_id = OLD.credit_card_invoice_id
      ),
      updated_at = now()
      WHERE id = OLD.credit_card_invoice_id;
    END IF;
    
    RETURN NEW;
  END IF;
  
  IF TG_OP = 'DELETE' THEN
    IF OLD.credit_card_invoice_id IS NOT NULL THEN
      UPDATE public.credit_card_invoices 
      SET total_amount = (
        SELECT COALESCE(SUM(amount), 0) 
        FROM public.finance_transactions 
        WHERE credit_card_invoice_id = OLD.credit_card_invoice_id
      ),
      updated_at = now()
      WHERE id = OLD.credit_card_invoice_id;
    END IF;
    RETURN OLD;
  END IF;
  
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER trigger_update_invoice_total
  AFTER INSERT OR UPDATE OR DELETE ON public.finance_transactions
  FOR EACH ROW EXECUTE FUNCTION public.update_invoice_total();

-- =============================================
-- ÍNDICES
-- =============================================

CREATE INDEX idx_credit_card_invoices_user ON public.credit_card_invoices(user_id);
CREATE INDEX idx_credit_card_invoices_account ON public.credit_card_invoices(account_id);
CREATE INDEX idx_finance_transactions_invoice ON public.finance_transactions(credit_card_invoice_id);