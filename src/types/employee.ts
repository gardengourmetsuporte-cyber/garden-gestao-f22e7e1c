// Employee and Payroll Types

export type PaymentType = 'salary' | 'vale' | 'bonus' | 'discount' | 'other';

export interface Employee {
  id: string;
  user_id: string | null;
  full_name: string;
  cpf: string | null;
  role: string | null;
  department: string | null;
  admission_date: string | null;
  base_salary: number;
  is_active: boolean;
  notes: string | null;
  created_at: string;
  updated_at: string;
  // Joined data
  profile?: {
    avatar_url: string | null;
  };
}

export interface EmployeePayment {
  id: string;
  employee_id: string;
  type: PaymentType;
  reference_month: number;
  reference_year: number;
  amount: number;
  payment_date: string;
  is_paid: boolean;
  paid_at: string | null;
  receipt_url: string | null;
  notes: string | null;
  finance_transaction_id: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  // Joined data
  employee?: Employee;
}

export const PAYMENT_TYPE_LABELS: Record<PaymentType, string> = {
  salary: 'Salário',
  vale: 'Vale',
  bonus: 'Bônus',
  discount: 'Desconto',
  other: 'Outro',
};

export const PAYMENT_TYPE_COLORS: Record<PaymentType, string> = {
  salary: '#22c55e',
  vale: '#3b82f6',
  bonus: '#8b5cf6',
  discount: '#ef4444',
  other: '#6b7280',
};

export const MONTHS = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];
