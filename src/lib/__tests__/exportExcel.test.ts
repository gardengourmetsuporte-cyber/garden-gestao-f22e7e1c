import { describe, it, expect, vi } from 'vitest';
import * as XLSX from 'xlsx';
import { exportTransactionsExcel, exportCashClosingsExcel, exportInventoryExcel } from '../exportExcel';

vi.mock('xlsx', () => ({
  utils: {
    json_to_sheet: vi.fn(() => ({ '!ref': 'A1:G2' })),
    decode_range: vi.fn(() => ({ s: { r: 0, c: 0 }, e: { r: 1, c: 6 } })),
    encode_cell: vi.fn(() => 'E2'),
    book_new: vi.fn(() => ({ SheetNames: [], Sheets: {} })),
    book_append_sheet: vi.fn(),
  },
  writeFile: vi.fn(),
}));

const mockTransaction = {
  date: '2026-03-01',
  description: 'Test',
  category: 'Food',
  amount: 100,
  type: 'expense',
  is_paid: true,
  account: 'Main',
};

describe('exportTransactionsExcel', () => {
  it('calls json_to_sheet with correct columns', () => {
    exportTransactionsExcel([mockTransaction], 'Março 2026');
    const call = (XLSX.utils.json_to_sheet as any).mock.calls.at(-1)[0];
    expect(call[0]).toHaveProperty('Data', '2026-03-01');
    expect(call[0]).toHaveProperty('Tipo', 'Despesa');
    expect(call[0]).toHaveProperty('Status', 'Pago');
  });
  it('writes file with correct name', () => {
    exportTransactionsExcel([mockTransaction], 'Março 2026');
    expect(XLSX.writeFile).toHaveBeenCalledWith(expect.anything(), 'extrato-março-2026.xlsx');
  });
});

describe('exportCashClosingsExcel', () => {
  it('maps fields correctly', () => {
    const closing = {
      date: '2026-03-01', unit_name: 'Unit1',
      cash_amount: 100, debit_amount: 200, credit_amount: 300,
      pix_amount: 400, delivery_amount: 50, meal_voucher_amount: 60,
      total_amount: null, cash_difference: 10, notes: 'ok',
    };
    exportCashClosingsExcel([closing], 'Mar 2026');
    const call = (XLSX.utils.json_to_sheet as any).mock.calls.at(-1)[0];
    expect(call[0]['Total']).toBe(1110); // sum of all
    expect(call[0]['Diferença']).toBe(10);
  });
});

describe('exportInventoryExcel', () => {
  it('exports correct columns', () => {
    const item = { name: 'Rice', category: 'Grains', current_stock: 50, min_stock: 10, unit_type: 'kg', unit_price: 5.5, supplier: 'Sup1' };
    exportInventoryExcel([item]);
    const call = (XLSX.utils.json_to_sheet as any).mock.calls.at(-1)[0];
    expect(call[0]['Item']).toBe('Rice');
    expect(call[0]['Preço Unit.']).toBe(5.5);
  });
});
