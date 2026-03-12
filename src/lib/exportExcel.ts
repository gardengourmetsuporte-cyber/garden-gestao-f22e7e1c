/**
 * Excel export utilities using xlsx library
 */
import * as XLSX from 'xlsx';
import { formatCurrency } from '@/lib/format';

interface ExcelTransaction {
  date: string;
  description: string;
  category?: string;
  amount: number;
  type: string;
  is_paid: boolean;
  account?: string;
}

export function exportTransactionsExcel(transactions: ExcelTransaction[], monthLabel: string) {
  const data = transactions.map(t => ({
    'Data': t.date,
    'Descrição': t.description,
    'Categoria': t.category || '',
    'Tipo': t.type === 'income' ? 'Receita' : t.type === 'expense' ? 'Despesa' : t.type === 'transfer' ? 'Transferência' : t.type,
    'Valor': t.amount,
    'Status': t.is_paid ? 'Pago' : 'Pendente',
    'Conta': t.account || '',
  }));

  const ws = XLSX.utils.json_to_sheet(data);

  // Auto-width columns
  const colWidths = Object.keys(data[0] || {}).map(key => ({
    wch: Math.max(key.length, ...data.map(r => String((r as any)[key] || '').length)) + 2,
  }));
  ws['!cols'] = colWidths;

  // Format currency column
  const range = XLSX.utils.decode_range(ws['!ref'] || 'A1');
  for (let r = range.s.r + 1; r <= range.e.r; r++) {
    const cell = ws[XLSX.utils.encode_cell({ r, c: 4 })]; // Valor column
    if (cell) cell.z = '#,##0.00';
  }

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Extrato');
  XLSX.writeFile(wb, `extrato-${monthLabel.replace(/\s/g, '-').toLowerCase()}.xlsx`);
}

interface CashClosingExcelRow {
  date: string;
  unit_name: string;
  cash_amount: number;
  debit_amount: number;
  credit_amount: number;
  pix_amount: number;
  delivery_amount: number;
  meal_voucher_amount: number;
  total_amount: number | null;
  cash_difference: number | null;
  notes?: string | null;
}

export function exportCashClosingsExcel(closings: CashClosingExcelRow[], periodLabel: string) {
  const data = closings.map(c => {
    const total = c.total_amount ?? (
      c.cash_amount + c.debit_amount + c.credit_amount +
      c.pix_amount + c.delivery_amount + c.meal_voucher_amount
    );
    return {
      'Data': c.date,
      'Unidade': c.unit_name,
      'Dinheiro': c.cash_amount,
      'Débito': c.debit_amount,
      'Crédito': c.credit_amount,
      'Pix': c.pix_amount,
      'Delivery': c.delivery_amount,
      'Vale Alimentação': c.meal_voucher_amount,
      'Total': total,
      'Diferença': c.cash_difference ?? 0,
      'Observações': c.notes || '',
    };
  });

  const ws = XLSX.utils.json_to_sheet(data);

  const colWidths = Object.keys(data[0] || {}).map(key => ({
    wch: Math.max(key.length + 2, 14),
  }));
  ws['!cols'] = colWidths;

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Fechamentos');
  XLSX.writeFile(wb, `fechamentos-${periodLabel.replace(/\s/g, '-').toLowerCase()}.xlsx`);
}

interface InventoryExcelRow {
  name: string;
  category?: string;
  current_stock: number;
  min_stock: number;
  unit_type: string;
  unit_price: number;
  supplier?: string;
}

export function exportInventoryExcel(items: InventoryExcelRow[]) {
  const data = items.map(i => ({
    'Item': i.name,
    'Categoria': i.category || '',
    'Estoque Atual': i.current_stock,
    'Estoque Mínimo': i.min_stock,
    'Unidade': i.unit_type,
    'Preço Unit.': i.unit_price,
    'Fornecedor': i.supplier || '',
  }));

  const ws = XLSX.utils.json_to_sheet(data);
  const colWidths = Object.keys(data[0] || {}).map(key => ({
    wch: Math.max(key.length + 2, 14),
  }));
  ws['!cols'] = colWidths;

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Estoque');
  XLSX.writeFile(wb, `estoque-${new Date().toISOString().slice(0, 10)}.xlsx`);
}
