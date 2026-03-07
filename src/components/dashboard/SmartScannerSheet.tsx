import { useState, useEffect } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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

interface EditableField {
  key: string;
  label: string;
  value: string;
  type: 'text' | 'number' | 'date';
  placeholder?: string;
}

function getEditableFields(docType: DocumentType, extractedData: Record<string, any>): EditableField[] {
  const d = extractedData;
  switch (docType) {
    case 'pix_receipt':
      return [
        { key: 'amount', label: 'Valor (R$)', value: d.amount?.toString() || '', type: 'number', placeholder: '0.00' },
        { key: 'date', label: 'Data', value: d.date || '', type: 'date' },
        { key: 'receiver_name', label: 'Recebedor', value: d.receiver_name || '', type: 'text', placeholder: 'Nome do recebedor' },
        { key: 'payer_name', label: 'Pagador', value: d.payer_name || '', type: 'text', placeholder: 'Nome do pagador' },
        { key: 'description', label: 'Descrição', value: d.description || '', type: 'text', placeholder: 'Ex: Pagamento fornecedor' },
      ];
    case 'invoice':
      return [
        { key: 'supplier_name', label: 'Fornecedor', value: d.supplier_name || '', type: 'text', placeholder: 'Nome do fornecedor' },
        { key: 'invoice_number', label: 'Nº NF', value: d.invoice_number || '', type: 'text', placeholder: '000000' },
        { key: 'total_amount', label: 'Total (R$)', value: d.total_amount?.toString() || '', type: 'number', placeholder: '0.00' },
      ];
    case 'boleto':
      return [
        { key: 'amount', label: 'Valor (R$)', value: d.amount?.toString() || '', type: 'number', placeholder: '0.00' },
        { key: 'due_date', label: 'Vencimento', value: d.due_date || '', type: 'date' },
        { key: 'beneficiary_name', label: 'Beneficiário', value: d.beneficiary_name || '', type: 'text', placeholder: 'Nome do beneficiário' },
      ];
    case 'payslip':
      return [
        { key: 'employee_name', label: 'Funcionário', value: d.employee_name || '', type: 'text', placeholder: 'Nome do funcionário' },
        { key: 'net_salary', label: 'Salário líquido (R$)', value: d.net_salary?.toString() || '', type: 'number', placeholder: '0.00' },
        { key: 'reference_month', label: 'Mês referência', value: d.reference_month?.toString() || '', type: 'number', placeholder: '1-12' },
        { key: 'reference_year', label: 'Ano referência', value: d.reference_year?.toString() || '', type: 'number', placeholder: '2026' },
      ];
    case 'generic_receipt':
      return [
        { key: 'vendor_name', label: 'Estabelecimento', value: d.vendor_name || '', type: 'text', placeholder: 'Nome do estabelecimento' },
        { key: 'amount', label: 'Valor (R$)', value: d.amount?.toString() || '', type: 'number', placeholder: '0.00' },
        { key: 'date', label: 'Data', value: d.date || '', type: 'date' },
        { key: 'description', label: 'Descrição', value: d.description || '', type: 'text', placeholder: 'Descrição da despesa' },
      ];
    default:
      return [];
  }
}

export function SmartScannerSheet({ open, onOpenChange, scanner }: Props) {
  const { isScanning, scanResult, previewUrl, isExecuting, executeActions, DOCUMENT_TYPE_LABELS, DOCUMENT_TYPE_ICONS, reset } = scanner;
  const [userInputs, setUserInputs] = useState<Record<string, any>>({});
  const [isEditing, setIsEditing] = useState(false);

  // Initialize userInputs from extracted data when scan completes
  useEffect(() => {
    if (scanResult) {
      setUserInputs({});
      setIsEditing(false);
    }
  }, [scanResult]);

  const handleFieldChange = (key: string, value: string, type: string) => {
    setUserInputs(prev => ({
      ...prev,
      [key]: type === 'number' ? (value ? parseFloat(value) : undefined) : value,
    }));
  };

  const handleConfirm = async () => {
    if (!scanResult) return;
    await executeActions(scanResult, userInputs);
    onOpenChange(false);
    reset();
    setUserInputs({});
  };

  const docType = scanResult?.document_type as DocumentType;
  const editableFields = scanResult ? getEditableFields(docType, scanResult.extracted_data) : [];
  const hasMissingFields = editableFields.some(f => !f.value);

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

            {/* Extracted data - view/edit toggle */}
            <div className="rounded-xl border border-border/60 bg-card/60 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Dados extraídos</p>
                {editableFields.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setIsEditing(!isEditing)}
                    className="flex items-center gap-1 text-xs text-primary hover:text-primary/80 transition-colors"
                  >
                    <AppIcon name={isEditing ? 'Eye' : 'Pencil'} size={12} />
                    {isEditing ? 'Visualizar' : 'Editar'}
                  </button>
                )}
              </div>

              {isEditing ? (
                <div className="space-y-3">
                  {editableFields.map((field) => {
                    const currentValue = userInputs[field.key] !== undefined
                      ? (field.type === 'number' ? userInputs[field.key]?.toString() : userInputs[field.key])
                      : field.value;
                    const isEmpty = !currentValue;

                    return (
                      <div key={field.key} className="space-y-1">
                        <Label className="text-xs text-muted-foreground">{field.label}</Label>
                        <Input
                          type={field.type === 'number' ? 'number' : field.type === 'date' ? 'date' : 'text'}
                          step={field.type === 'number' ? '0.01' : undefined}
                          value={currentValue}
                          placeholder={field.placeholder}
                          onChange={(e) => handleFieldChange(field.key, e.target.value, field.type)}
                          className={cn(
                            'h-9 text-sm',
                            isEmpty && 'border-warning/50 bg-warning/5'
                          )}
                        />
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="space-y-1.5">
                  {editableFields.map((field) => {
                    const currentValue = userInputs[field.key] !== undefined
                      ? (field.type === 'number' ? userInputs[field.key]?.toString() : userInputs[field.key])
                      : field.value;
                    const isEmpty = !currentValue;
                    const displayValue = field.type === 'number' && currentValue
                      ? new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(parseFloat(currentValue))
                      : currentValue || '—';

                    return (
                      <div key={field.key} className="flex justify-between text-sm">
                        <span className="text-muted-foreground">{field.label}</span>
                        <span className={cn(
                          'font-medium text-right max-w-[60%] truncate',
                          isEmpty ? 'text-warning italic' : 'text-foreground'
                        )}>
                          {isEmpty ? 'Não informado' : displayValue}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Missing info with quick-fill hint */}
            {scanResult.missing_info?.length > 0 && (
              <div className="rounded-xl border border-warning/30 bg-warning/5 p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-semibold text-warning uppercase tracking-wider flex items-center gap-1">
                    <AppIcon name="AlertTriangle" size={14} />
                    Informações faltantes
                  </p>
                  {!isEditing && (
                    <button
                      type="button"
                      onClick={() => setIsEditing(true)}
                      className="text-xs text-warning hover:text-warning/80 underline underline-offset-2 transition-colors"
                    >
                      Preencher agora
                    </button>
                  )}
                </div>
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
