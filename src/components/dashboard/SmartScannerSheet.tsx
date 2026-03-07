import { useState } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { AppIcon } from '@/components/ui/app-icon';
import { cn } from '@/lib/utils';
import type { useSmartScanner, DocumentType } from '@/hooks/useSmartScanner';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  scanner: ReturnType<typeof useSmartScanner>;
}

const TYPE_COLORS: Record<DocumentType, string> = {
  pix_receipt: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
  invoice: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  boleto: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
  stock_exit: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
  payslip: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
  generic_receipt: 'bg-slate-500/20 text-slate-400 border-slate-500/30',
  unknown: 'bg-red-500/20 text-red-400 border-red-500/30',
};

export function SmartScannerSheet({ open, onOpenChange, scanner }: Props) {
  const { isScanning, scanResult, previewUrl, isExecuting, executeActions, DOCUMENT_TYPE_LABELS, DOCUMENT_TYPE_ICONS, reset } = scanner;
  const [userInputs, setUserInputs] = useState<Record<string, any>>({});

  const handleConfirm = async () => {
    if (!scanResult) return;
    await executeActions(scanResult, userInputs);
    onOpenChange(false);
    reset();
    setUserInputs({});
  };

  const docType = scanResult?.document_type as DocumentType;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        className="h-auto max-h-[92vh] rounded-t-3xl overflow-y-auto pb-safe"
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        <SheetHeader className="pb-3">
          <SheetTitle className="flex items-center gap-2 text-base">
            <AppIcon name="ScanLine" size={20} className="text-primary" />
            Scanner Inteligente
          </SheetTitle>
        </SheetHeader>

        {/* Preview image */}
        {previewUrl && (
          <div className="relative w-full h-40 rounded-xl overflow-hidden mb-4 bg-muted">
            <img src={previewUrl} alt="Documento" className="w-full h-full object-contain" />
            {isScanning && (
              <div className="absolute inset-0 bg-background/60 backdrop-blur-sm flex items-center justify-center">
                <div className="flex flex-col items-center gap-2">
                  <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                  <p className="text-xs text-muted-foreground">Analisando documento...</p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Loading skeleton */}
        {isScanning && !scanResult && (
          <div className="space-y-3">
            <Skeleton className="h-8 w-40 rounded-lg" />
            <Skeleton className="h-20 w-full rounded-xl" />
            <Skeleton className="h-16 w-full rounded-xl" />
          </div>
        )}

        {/* Results */}
        {scanResult && !isScanning && (
          <div className="space-y-4">
            {/* Document type badge */}
            <div className="flex items-center gap-2">
              <Badge variant="outline" className={cn('text-xs px-3 py-1 border', TYPE_COLORS[docType] || TYPE_COLORS.unknown)}>
                <AppIcon name={DOCUMENT_TYPE_ICONS[docType] || 'HelpCircle'} size={14} className="mr-1" />
                {DOCUMENT_TYPE_LABELS[docType] || 'Desconhecido'}
              </Badge>
              <span className="text-xs text-muted-foreground">
                {Math.round((scanResult.confidence || 0) * 100)}% confiança
              </span>
            </div>

            {/* Extracted data */}
            <div className="rounded-xl border border-border/60 bg-card/60 p-4 space-y-2">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Dados extraídos</p>
              {renderExtractedData(scanResult)}
            </div>

            {/* Missing info */}
            {scanResult.missing_info?.length > 0 && (
              <div className="rounded-xl border border-warning/30 bg-warning/5 p-4 space-y-2">
                <p className="text-xs font-semibold text-warning uppercase tracking-wider flex items-center gap-1">
                  <AppIcon name="AlertTriangle" size={14} />
                  Informações faltantes
                </p>
                {scanResult.missing_info.map((info, i) => (
                  <p key={i} className="text-sm text-muted-foreground">
                    • {info.message}
                  </p>
                ))}
              </div>
            )}

            {/* Suggested actions */}
            {scanResult.suggested_actions?.length > 0 && (
              <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 space-y-2">
                <p className="text-xs font-semibold text-primary uppercase tracking-wider flex items-center gap-1">
                  <AppIcon name="Lightbulb" size={14} />
                  Sugestões
                </p>
                {scanResult.suggested_actions.map((action, i) => (
                  <p key={i} className="text-sm text-muted-foreground">
                    💡 {action.description}
                  </p>
                ))}
              </div>
            )}

            {/* Actions */}
            {docType !== 'unknown' && (
              <div className="flex gap-3 pt-2">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => onOpenChange(false)}
                  disabled={isExecuting}
                >
                  Cancelar
                </Button>
                <Button
                  className="flex-1"
                  onClick={handleConfirm}
                  disabled={isExecuting}
                >
                  {isExecuting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
                      Lançando...
                    </>
                  ) : (
                    <>
                      <AppIcon name="Check" size={16} />
                      Confirmar Lançamento
                    </>
                  )}
                </Button>
              </div>
            )}
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}

function renderExtractedData(result: ReturnType<typeof useSmartScanner>['scanResult']) {
  if (!result) return null;
  const { document_type, extracted_data: d } = result;

  const formatCurrency = (v: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v || 0);

  const rows: { label: string; value: string }[] = [];

  switch (document_type) {
    case 'pix_receipt':
      if (d.amount) rows.push({ label: 'Valor', value: formatCurrency(d.amount) });
      if (d.date) rows.push({ label: 'Data', value: d.date });
      if (d.receiver_name) rows.push({ label: 'Recebedor', value: d.receiver_name });
      if (d.payer_name) rows.push({ label: 'Pagador', value: d.payer_name });
      if (d.description) rows.push({ label: 'Descrição', value: d.description });
      break;
    case 'invoice':
      if (d.supplier_name) rows.push({ label: 'Fornecedor', value: d.supplier_name });
      if (d.invoice_number) rows.push({ label: 'Nº NF', value: d.invoice_number });
      if (d.total_amount) rows.push({ label: 'Total', value: formatCurrency(d.total_amount) });
      if (d.items?.length) rows.push({ label: 'Itens', value: `${d.items.length} produto(s)` });
      break;
    case 'boleto':
      if (d.amount) rows.push({ label: 'Valor', value: formatCurrency(d.amount) });
      if (d.due_date) rows.push({ label: 'Vencimento', value: d.due_date });
      if (d.beneficiary_name) rows.push({ label: 'Beneficiário', value: d.beneficiary_name });
      break;
    case 'stock_exit':
      if (d.items?.length) rows.push({ label: 'Itens', value: `${d.items.length} produto(s) para dar baixa` });
      break;
    case 'payslip':
      if (d.employee_name) rows.push({ label: 'Funcionário', value: d.employee_name });
      if (d.net_salary) rows.push({ label: 'Salário líquido', value: formatCurrency(d.net_salary) });
      if (d.reference_month && d.reference_year) rows.push({ label: 'Referência', value: `${d.reference_month}/${d.reference_year}` });
      break;
    case 'generic_receipt':
      if (d.vendor_name) rows.push({ label: 'Estabelecimento', value: d.vendor_name });
      if (d.amount) rows.push({ label: 'Valor', value: formatCurrency(d.amount) });
      if (d.date) rows.push({ label: 'Data', value: d.date });
      if (d.description) rows.push({ label: 'Descrição', value: d.description });
      break;
    default:
      rows.push({ label: 'Status', value: 'Documento não identificado' });
  }

  return (
    <div className="space-y-1.5">
      {rows.map((row, i) => (
        <div key={i} className="flex justify-between text-sm">
          <span className="text-muted-foreground">{row.label}</span>
          <span className="font-medium text-foreground text-right max-w-[60%] truncate">{row.value}</span>
        </div>
      ))}
    </div>
  );
}
