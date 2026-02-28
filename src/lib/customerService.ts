import { supabase } from '@/integrations/supabase/client';
import type { Customer, CustomerSegment } from '@/types/customer';

interface ScoreResult {
  score: number;
  segment: CustomerSegment;
  visit_frequency_days: number | null;
}

/**
 * Replica a lógica RFM do banco (recalculate_customer_score) no frontend
 * para preview/validação sem precisar chamar o banco.
 */
export function calcularScore(customer: Pick<Customer, 'total_orders' | 'total_spent' | 'last_purchase_at'>): ScoreResult {
  const totalOrders = Number(customer.total_orders) || 0;
  const totalSpent = Number(customer.total_spent) || 0;
  const lastPurchase = customer.last_purchase_at ? new Date(customer.last_purchase_at) : null;

  // Recency (0-30)
  let daysSinceLast = 999;
  let recencyScore = 0;
  if (lastPurchase) {
    daysSinceLast = (Date.now() - lastPurchase.getTime()) / 86400000;
    recencyScore = Math.max(0, 30 - daysSinceLast / 2);
  }

  // Frequency (0-30)
  const frequencyScore = Math.min(30, totalOrders * 3);

  // Monetary (0-40)
  const monetaryScore = Math.min(40, (totalSpent / 100) * 4);

  const score = Math.round(recencyScore + frequencyScore + monetaryScore);

  let segment: CustomerSegment;
  if (score >= 70) segment = 'vip';
  else if (score >= 45) segment = 'frequent';
  else if (score >= 20) segment = 'occasional';
  else if (totalOrders === 0) segment = 'new';
  else segment = 'inactive';

  const visit_frequency_days = totalOrders > 1 && lastPurchase
    ? daysSinceLast / Math.max(totalOrders - 1, 1)
    : null;

  return { score, segment, visit_frequency_days };
}

/**
 * Registra uma compra para o cliente.
 * Incrementa total_spent, total_orders e atualiza last_purchase_at.
 * O trigger trg_customer_loyalty cuida do resto (score + pontos).
 */
export async function registrarCompra(
  customerId: string,
  valor: number,
  date?: string
): Promise<void> {
  // Fetch current values
  const { data: customer, error: fetchError } = await supabase
    .from('customers')
    .select('total_spent, total_orders')
    .eq('id', customerId)
    .single();

  if (fetchError || !customer) throw new Error('Cliente não encontrado');

  const { error } = await supabase
    .from('customers')
    .update({
      total_spent: (Number(customer.total_spent) || 0) + valor,
      total_orders: (Number(customer.total_orders) || 0) + 1,
      last_purchase_at: date || new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', customerId);

  if (error) throw error;
}
