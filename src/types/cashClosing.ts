// Types for Cash Closing Module

export type CashClosingStatus = 'pending' | 'approved' | 'divergent';

export interface ExpenseItem {
  description: string;
  amount: number;
}

export interface CashClosing {
  id: string;
  date: string;
  user_id: string;
  unit_name: string;
  
  // Payment amounts
  cash_amount: number;
  debit_amount: number;
  credit_amount: number;
  pix_amount: number;
  delivery_amount: number;
  total_amount: number;
  
  // Cash difference
  cash_difference: number;
  
  // Receipt
  receipt_url: string;
  
  // Expenses
  expenses: ExpenseItem[];
  
  // Status
  status: CashClosingStatus;
  notes: string | null;
  
  // Validation
  validated_by: string | null;
  validated_at: string | null;
  validation_notes: string | null;
  
  // Financial integration
  financial_integrated: boolean;
  
  created_at: string;
  updated_at: string;
  
  // Joined data
  profile?: {
    full_name: string;
    avatar_url: string | null;
  };
  validator_profile?: {
    full_name: string;
  };
}

export interface CashClosingFormData {
  date: string;
  unit_name: string;
  cash_amount: number;
  debit_amount: number;
  credit_amount: number;
  pix_amount: number;
  delivery_amount: number;
  cash_difference: number;
  receipt_url?: string;
  notes?: string;
  expenses?: ExpenseItem[];
}

export const PAYMENT_METHODS = [
  { key: 'cash_amount', label: 'Dinheiro', icon: 'Banknote', color: '#22c55e' },
  { key: 'debit_amount', label: 'Débito', icon: 'CreditCard', color: '#3b82f6' },
  { key: 'credit_amount', label: 'Crédito', icon: 'CreditCard', color: '#8b5cf6' },
  { key: 'pix_amount', label: 'Pix', icon: 'Smartphone', color: '#06b6d4' },
  { key: 'delivery_amount', label: 'iFood/Delivery', icon: 'Truck', color: '#f97316' },
] as const;