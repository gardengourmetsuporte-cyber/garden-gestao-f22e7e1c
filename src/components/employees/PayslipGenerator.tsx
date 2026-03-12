import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface PayslipData {
  employeeName: string;
  cpf?: string;
  role?: string;
  admissionDate?: string;
  referenceMonth: number;
  referenceYear: number;
  baseSalary: number;
  regularHours?: number;
  overtimeHours?: number;
  overtimeBonus?: number;
  nightHours?: number;
  nightBonus?: number;
  mealAllowance?: number;
  transportAllowance?: number;
  otherEarnings?: number;
  otherEarningsDescription?: string;
  totalEarnings: number;
  inssDeduction?: number;
  irrfDeduction?: number;
  advanceDeduction?: number;
  otherDeductions?: number;
  otherDeductionsDescription?: string;
  totalDeductions: number;
  netSalary: number;
  fgtsAmount?: number;
  companyName: string;
  companyCnpj?: string;
}

export function generatePayslipHTML(data: PayslipData): string {
  const monthNames = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
  const monthLabel = `${monthNames[data.referenceMonth - 1]} / ${data.referenceYear}`;
  const fmt = (v: number) => v.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  return `<!DOCTYPE html>
<html><head><meta charset="UTF-8"><style>
  body { font-family: Arial, sans-serif; font-size: 11px; margin: 20px; color: #333; }
  .header { text-align: center; border-bottom: 2px solid #333; padding-bottom: 10px; margin-bottom: 15px; }
  .header h1 { font-size: 16px; margin: 0; }
  .header p { margin: 2px 0; color: #666; }
  .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 5px; margin-bottom: 15px; padding: 8px; background: #f5f5f5; border-radius: 4px; }
  .info-grid span { font-size: 10px; }
  .info-grid strong { font-size: 11px; }
  table { width: 100%; border-collapse: collapse; margin-bottom: 15px; }
  th { background: #333; color: white; padding: 6px 8px; text-align: left; font-size: 10px; }
  td { padding: 5px 8px; border-bottom: 1px solid #eee; }
  .right { text-align: right; }
  .total-row { font-weight: bold; background: #f0f0f0; }
  .net-row { font-size: 14px; font-weight: bold; background: #e8f5e9; }
  .footer { margin-top: 30px; text-align: center; font-size: 9px; color: #999; }
  .signatures { display: flex; justify-content: space-between; margin-top: 50px; }
  .sig-line { width: 200px; border-top: 1px solid #333; padding-top: 5px; text-align: center; font-size: 10px; }
</style></head><body>
  <div class="header">
    <h1>HOLERITE - RECIBO DE PAGAMENTO</h1>
    <p>${data.companyName}${data.companyCnpj ? ` | CNPJ: ${data.companyCnpj}` : ''}</p>
    <p>Competência: ${monthLabel}</p>
  </div>

  <div class="info-grid">
    <div><span>Funcionário:</span><br><strong>${data.employeeName}</strong></div>
    <div><span>Cargo:</span><br><strong>${data.role || '—'}</strong></div>
    <div><span>CPF:</span><br><strong>${data.cpf || '—'}</strong></div>
    <div><span>Admissão:</span><br><strong>${data.admissionDate ? format(new Date(data.admissionDate), 'dd/MM/yyyy') : '—'}</strong></div>
  </div>

  <table>
    <tr><th colspan="2">PROVENTOS</th><th class="right">VALOR (R$)</th></tr>
    <tr><td colspan="2">Salário Base${data.regularHours ? ` (${data.regularHours}h)` : ''}</td><td class="right">${fmt(data.baseSalary)}</td></tr>
    ${data.overtimeHours ? `<tr><td colspan="2">Horas Extras (${data.overtimeHours}h)</td><td class="right">${fmt(data.overtimeBonus || 0)}</td></tr>` : ''}
    ${data.nightHours ? `<tr><td colspan="2">Adicional Noturno (${data.nightHours}h)</td><td class="right">${fmt(data.nightBonus || 0)}</td></tr>` : ''}
    ${data.mealAllowance ? `<tr><td colspan="2">Vale Refeição</td><td class="right">${fmt(data.mealAllowance)}</td></tr>` : ''}
    ${data.transportAllowance ? `<tr><td colspan="2">Vale Transporte</td><td class="right">${fmt(data.transportAllowance)}</td></tr>` : ''}
    ${data.otherEarnings ? `<tr><td colspan="2">${data.otherEarningsDescription || 'Outros Proventos'}</td><td class="right">${fmt(data.otherEarnings)}</td></tr>` : ''}
    <tr class="total-row"><td colspan="2">TOTAL PROVENTOS</td><td class="right">${fmt(data.totalEarnings)}</td></tr>
  </table>

  <table>
    <tr><th colspan="2">DESCONTOS</th><th class="right">VALOR (R$)</th></tr>
    ${data.inssDeduction ? `<tr><td colspan="2">INSS</td><td class="right">${fmt(data.inssDeduction)}</td></tr>` : ''}
    ${data.irrfDeduction ? `<tr><td colspan="2">IRRF</td><td class="right">${fmt(data.irrfDeduction)}</td></tr>` : ''}
    ${data.advanceDeduction ? `<tr><td colspan="2">Adiantamento</td><td class="right">${fmt(data.advanceDeduction)}</td></tr>` : ''}
    ${data.otherDeductions ? `<tr><td colspan="2">${data.otherDeductionsDescription || 'Outros Descontos'}</td><td class="right">${fmt(data.otherDeductions)}</td></tr>` : ''}
    <tr class="total-row"><td colspan="2">TOTAL DESCONTOS</td><td class="right">${fmt(data.totalDeductions)}</td></tr>
  </table>

  <table>
    <tr class="net-row"><td>VALOR LÍQUIDO</td><td class="right">R$ ${fmt(data.netSalary)}</td></tr>
  </table>

  ${data.fgtsAmount ? `<p style="font-size:10px;color:#666;">Base FGTS: R$ ${fmt(data.baseSalary)} | FGTS (8%): R$ ${fmt(data.fgtsAmount)}</p>` : ''}

  <div class="signatures">
    <div class="sig-line">Empregador</div>
    <div class="sig-line">Funcionário</div>
  </div>

  <div class="footer">
    Documento gerado em ${format(new Date(), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
  </div>
</body></html>`;
}

export function downloadPayslipPDF(data: PayslipData) {
  const html = generatePayslipHTML(data);
  const printWindow = window.open('', '_blank');
  if (!printWindow) return;
  printWindow.document.write(html);
  printWindow.document.close();
  setTimeout(() => printWindow.print(), 500);
}
