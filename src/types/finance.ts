// Types for the Financial Module (Mobills-style)

export type TransactionType = 'income' | 'expense' | 'transfer' | 'credit_card';
export type AccountType = 'wallet' | 'bank' | 'credit_card';
export type CategoryType = 'income' | 'expense';

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
  type: CategoryType;
  icon: string;
  color: string;
  parent_id: string | null;
  is_system: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
  // Joined data
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
  supplier_id: string | null;
  employee_id: string | null;
  date: string;
  is_paid: boolean;
  is_fixed: boolean;
  is_recurring: boolean;
  recurring_interval: string | null;
  tags: string[] | null;
  notes: string | null;
  attachment_url: string | null;
  created_at: string;
  updated_at: string;
  sort_order: number;
  // Credit card fields
  credit_card_invoice_id: string | null;
  installment_number: number | null;
  total_installments: number | null;
  installment_group_id: string | null;
  // Joined data
  category?: FinanceCategory;
  account?: FinanceAccount;
  to_account?: FinanceAccount;
  supplier?: { id: string; name: string };
  employee?: { id: string; full_name: string };
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
  // Joined data
  category?: FinanceCategory;
}

export interface FinanceTag {
  id: string;
  user_id: string;
  name: string;
  color: string;
  created_at: string;
}

// Stats and analytics
export interface MonthlyStats {
  totalIncome: number;
  totalExpense: number;
  balance: number;
  pendingExpenses: number;
  pendingIncome: number;
}

export interface CategoryStats {
  category: FinanceCategory;
  amount: number;
  percentage: number;
  transactionCount: number;
}


// Default categories for restaurant
export const DEFAULT_EXPENSE_CATEGORIES = [
  { name: 'Matéria-prima', icon: 'ShoppingBasket', color: '#ef4444', subcategories: ['Carnes', 'Frios e Embutidos', 'Bebidas', 'Panificação', 'Hortifruti', 'Mercado', 'Embalagens'] },
  { name: 'Despesas Administrativas', icon: 'Building2', color: '#f97316', subcategories: ['Energia', 'Água', 'Aluguel', 'Limpeza', 'Internet', 'Telefone'] },
  { name: 'Folha de Pagamento', icon: 'Users', color: '#eab308', subcategories: ['Salários', 'FGTS', 'INSS', '13º', 'Férias'] },
  { name: 'Pró-labore', icon: 'Briefcase', color: '#84cc16', subcategories: [] },
  { name: 'Taxas Operacionais', icon: 'Receipt', color: '#22c55e', subcategories: ['App Delivery', 'PDV', 'Tarifa Bancária', 'Maquininha'] },
  { name: 'Impostos', icon: 'FileText', color: '#14b8a6', subcategories: ['DAS', 'IPTU', 'Alvará', 'Outros'] },
  { name: 'Financiamentos', icon: 'Landmark', color: '#06b6d4', subcategories: [] },
  { name: 'Investimentos', icon: 'TrendingUp', color: '#8b5cf6', subcategories: ['Equipamentos', 'Marketing', 'Reformas'] },
];

export const DEFAULT_INCOME_CATEGORIES = [
  { name: 'Vendas Balcão', icon: 'Store', color: '#22c55e', subcategories: ['Dinheiro', 'Cartão Débito', 'Cartão Crédito', 'Pix'] },
  { name: 'Vendas Delivery', icon: 'Truck', color: '#10b981', subcategories: ['iFood', 'Rappi', 'Próprio'] },
  { name: 'Outros', icon: 'Plus', color: '#059669', subcategories: [] },
];

export type FinanceTab = 'home' | 'transactions' | 'charts' | 'planning' | 'more' | 'cards';

// Credit card invoices
export interface CreditCardInvoice {
  id: string;
  user_id: string;
  account_id: string;
  due_date: string;
  close_date: string;
  total_amount: number;
  is_paid: boolean;
  paid_at: string | null;
  paid_from_account_id: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  // Joined data
  account?: FinanceAccount;
  transactions?: FinanceTransaction[];
}

// Extended transaction with installment info
export interface TransactionFormData {
  type: TransactionType;
  amount: number;
  description: string;
  category_id: string | null;
  account_id: string | null;
  to_account_id?: string | null;
  date: string;
  is_paid: boolean;
  is_fixed: boolean;
  is_recurring: boolean;
  recurring_interval?: string | null;
  recurring_count?: number;
  tags?: string[];
  notes?: string;
  attachment_url?: string;
  supplier_id?: string | null;
  employee_id?: string | null;
  // Credit card specific
  credit_card_invoice_id?: string | null;
  installment_number?: number | null;
  total_installments?: number | null;
  installment_group_id?: string | null;
}
