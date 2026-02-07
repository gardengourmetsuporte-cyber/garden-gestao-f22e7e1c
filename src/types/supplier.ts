// Supplier Invoice Types for Bills/Boletos

export interface SupplierInvoice {
  id: string;
  user_id: string;
  supplier_id: string;
  invoice_number: string | null;
  description: string;
  amount: number;
  issue_date: string;
  due_date: string;
  is_paid: boolean;
  paid_at: string | null;
  finance_transaction_id: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  // Joined data
  supplier?: {
    id: string;
    name: string;
    phone: string | null;
  };
}
