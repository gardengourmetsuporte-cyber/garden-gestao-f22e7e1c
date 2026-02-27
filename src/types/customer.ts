export interface Customer {
  id: string;
  unit_id: string;
  name: string;
  phone: string | null;
  email: string | null;
  origin: 'manual' | 'pdv' | 'mesa' | 'ifood' | 'whatsapp' | 'csv';
  notes: string | null;
  total_spent: number;
  total_orders: number;
  last_purchase_at: string | null;
  birthday: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}
