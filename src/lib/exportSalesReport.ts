import * as XLSX from 'xlsx';
import type { SaleReportRow, SalesReportSummary } from '@/hooks/useReportSales';

const METHOD_LABELS: Record<string, string> = {
  cash: 'Dinheiro', debit: 'Débito', credit: 'Crédito',
  pix: 'Pix', meal_voucher: 'Vale Refeição', delivery: 'Delivery',
};

const SOURCE_LABELS: Record<string, string> = {
  counter: 'Balcão', delivery: 'Delivery', tablet: 'Tablet', whatsapp: 'WhatsApp',
};

export function exportSalesExcel(sales: SaleReportRow[], summary: SalesReportSummary, periodLabel: string) {
  const wb = XLSX.utils.book_new();

  // Sheet 1: Summary
  const summaryData = [
    { 'Métrica': 'Total de Vendas', 'Valor': summary.totalSales },
    { 'Métrica': 'Receita Total', 'Valor': summary.totalRevenue },
    { 'Métrica': 'Ticket Médio', 'Valor': summary.avgTicket },
    { 'Métrica': 'Descontos', 'Valor': summary.totalDiscount },
  ];

  // Add source breakdown
  for (const [src, data] of Object.entries(summary.bySource)) {
    summaryData.push({ 'Métrica': `Vendas ${SOURCE_LABELS[src] || src}`, 'Valor': data.count });
    summaryData.push({ 'Métrica': `Total ${SOURCE_LABELS[src] || src}`, 'Valor': data.total });
  }

  // Add payment breakdown
  for (const [method, total] of Object.entries(summary.byPaymentMethod)) {
    summaryData.push({ 'Métrica': `Pgto ${METHOD_LABELS[method] || method}`, 'Valor': total });
  }

  const wsSummary = XLSX.utils.json_to_sheet(summaryData);
  wsSummary['!cols'] = [{ wch: 25 }, { wch: 18 }];
  XLSX.utils.book_append_sheet(wb, wsSummary, 'Resumo');

  // Sheet 2: Details
  const detailData = sales.map(s => ({
    'Nº': s.sale_number,
    'Data': new Date(s.created_at).toLocaleString('pt-BR'),
    'Cliente': s.customer_name || '-',
    'Origem': SOURCE_LABELS[s.source] || s.source,
    'Subtotal': s.subtotal,
    'Desconto': s.discount,
    'Total': s.total,
    'Status': s.status === 'paid' ? 'Pago' : s.status === 'cancelled' ? 'Cancelado' : s.status,
    'Itens': s.items.map(i => `${i.quantity}x ${i.product_name}`).join(', '),
    'Pagamento': s.payments.map(p => `${METHOD_LABELS[p.method] || p.method}: R$${p.amount.toFixed(2)}`).join(', '),
  }));

  const wsDetail = XLSX.utils.json_to_sheet(detailData);
  wsDetail['!cols'] = [
    { wch: 8 }, { wch: 18 }, { wch: 20 }, { wch: 12 },
    { wch: 12 }, { wch: 12 }, { wch: 12 }, { wch: 12 },
    { wch: 40 }, { wch: 30 },
  ];
  XLSX.utils.book_append_sheet(wb, wsDetail, 'Detalhado');

  XLSX.writeFile(wb, `vendas-${periodLabel.replace(/\s/g, '-').toLowerCase()}.xlsx`);
}
