import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useUnit } from '@/contexts/UnitContext';
import { useAuth } from '@/contexts/AuthContext';

export interface SaleReportRow {
  id: string;
  sale_number: number;
  created_at: string;
  customer_name: string | null;
  source: string;
  subtotal: number;
  discount: number;
  total: number;
  status: string;
  items: { product_name: string; quantity: number; unit_price: number; total_price: number }[];
  payments: { method: string; amount: number }[];
}

export interface SalesReportSummary {
  totalSales: number;
  totalRevenue: number;
  totalDiscount: number;
  avgTicket: number;
  bySource: Record<string, { count: number; total: number }>;
  byPaymentMethod: Record<string, number>;
}

interface UseReportSalesOptions {
  startDate: string;
  endDate: string;
  source?: string;
  status?: string;
}

export function useReportSales({ startDate, endDate, source, status }: UseReportSalesOptions) {
  const { activeUnitId } = useUnit();
  const { user } = useAuth();

  return useQuery({
    queryKey: ['report-sales', activeUnitId, startDate, endDate, source, status],
    queryFn: async () => {
      let query = supabase
        .from('pos_sales')
        .select(`
          id, sale_number, created_at, customer_name, source, subtotal, discount, total, status,
          pos_sale_items (product_name, quantity, unit_price, total_price),
          pos_sale_payments (method, amount)
        `)
        .eq('unit_id', activeUnitId!)
        .gte('created_at', `${startDate}T00:00:00`)
        .lte('created_at', `${endDate}T23:59:59`)
        .order('created_at', { ascending: false });

      if (source && source !== 'all') {
        query = query.eq('source', source);
      }
      if (status && status !== 'all') {
        query = query.eq('status', status);
      }

      const { data, error } = await query;
      if (error) throw error;

      const sales: SaleReportRow[] = (data || []).map((s: any) => ({
        id: s.id,
        sale_number: s.sale_number,
        created_at: s.created_at,
        customer_name: s.customer_name,
        source: s.source,
        subtotal: s.subtotal,
        discount: s.discount,
        total: s.total,
        status: s.status,
        items: s.pos_sale_items || [],
        payments: s.pos_sale_payments || [],
      }));

      // Build summary
      const paidSales = sales.filter(s => s.status === 'paid');
      const totalRevenue = paidSales.reduce((s, r) => s + r.total, 0);
      const totalDiscount = paidSales.reduce((s, r) => s + r.discount, 0);

      const bySource: Record<string, { count: number; total: number }> = {};
      const byPaymentMethod: Record<string, number> = {};

      for (const sale of paidSales) {
        if (!bySource[sale.source]) bySource[sale.source] = { count: 0, total: 0 };
        bySource[sale.source].count++;
        bySource[sale.source].total += sale.total;

        for (const p of sale.payments) {
          byPaymentMethod[p.method] = (byPaymentMethod[p.method] || 0) + p.amount;
        }
      }

      const summary: SalesReportSummary = {
        totalSales: paidSales.length,
        totalRevenue,
        totalDiscount,
        avgTicket: paidSales.length > 0 ? totalRevenue / paidSales.length : 0,
        bySource,
        byPaymentMethod,
      };

      return { sales, summary };
    },
    enabled: !!user && !!activeUnitId,
  });
}
