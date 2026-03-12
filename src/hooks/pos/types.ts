export interface POSProduct {
  id: string;
  name: string;
  price: number;
  image_url: string | null;
  category: string;
  codigo_pdv: string | null;
  is_active: boolean;
}

export interface CartItem {
  id: string;
  product: POSProduct;
  quantity: number;
  unit_price: number;
  discount: number;
  notes: string;
}

export interface PendingOrder {
  id: string;
  source: string;
  customer_name: string | null;
  customer_phone: string | null;
  customer_address: string | null;
  table_number: number | null;
  order_number: number | null;
  total: number;
  status: string;
  created_at: string;
  items: { name: string; quantity: number; unit_price: number }[];
}

export interface PaymentLine {
  method: string;
  amount: number;
  change_amount: number;
}
