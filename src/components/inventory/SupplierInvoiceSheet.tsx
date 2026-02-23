import { useState, useEffect } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { SupplierInvoice } from '@/types/supplier';
import { format, addDays, addMonths } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { AppIcon } from '@/components/ui/app-icon';
import { cn } from '@/lib/utils';

interface Supplier {
  id: string;
  name: string;
}

interface SupplierInvoiceSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  suppliers: Supplier[];
  editingInvoice?: SupplierInvoice | null;
  defaultSupplierId?: string;
  onSave: (data: {
    supplier_id: string;
    invoice_number?: string;
    description: string;
    amount: number;
    issue_date?: string;
    due_date: string;
    notes?: string;
  }) => Promise<string | void>;
  onUpdate?: (data: Partial<SupplierInvoice> & { id: string }) => Promise<void>;
  onDelete?: (id: string) => Promise<void>;
}

const QUICK_DUE_OPTIONS = [
  { label: '7 dias', days: 7 },
  { label: '15 dias', days: 15 },
  { label: '30 dias', days: 30 },
  { label: '45 dias', days: 45 },
  { label: '60 dias', days: 60 },
];

export function SupplierInvoiceSheet({
  open,
  onOpenChange,
  suppliers,
  editingInvoice,
  defaultSupplierId,
  onSave,
  onUpdate,
  onDelete,
}: SupplierInvoiceSheetProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [supplierId, setSupplierId] = useState(defaultSupplierId || '');
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [issueDate, setIssueDate] = useState<Date>(new Date());
  const [dueDate, setDueDate] = useState<Date>(addDays(new Date(), 30));
  const [notes, setNotes] = useState('');
  const [showIssueCalendar, setShowIssueCalendar] = useState(false);
  const [showDueCalendar, setShowDueCalendar] = useState(false);

  useEffect(() => {
    if (open) {
      if (editingInvoice) {
        setSupplierId(editingInvoice.supplier_id);
        setInvoiceNumber(editingInvoice.invoice_number || '');
        setDescription(editingInvoice.description);
        setAmount(String(editingInvoice.amount));
        setIssueDate(new Date(editingInvoice.issue_date));
        setDueDate(new Date(editingInvoice.due_date));
        setNotes(editingInvoice.notes || '');
      } else {
        setSupplierId(defaultSupplierId || '');
        setInvoiceNumber('');
        setDescription('');
        setAmount('');
        setIssueDate(new Date());
        setDueDate(addDays(new Date(), 30));
        setNotes('');
      }
    }
  }, [open, editingInvoice, defaultSupplierId]);

  const handleSave = async () => {
    if (!supplierId || !description.trim() || !amount) return;

    setIsLoading(true);
    try {
      if (editingInvoice && onUpdate) {
        await onUpdate({
          id: editingInvoice.id,
          supplier_id: supplierId,
          invoice_number: invoiceNumber || undefined,
          description: description.trim(),
          amount: parseFloat(amount),
          issue_date: format(issueDate, 'yyyy-MM-dd'),
          due_date: format(dueDate, 'yyyy-MM-dd'),
          notes: notes.trim() || undefined,
        });
      } else {
        await onSave({
          supplier_id: supplierId,
          invoice_number: invoiceNumber || undefined,
          description: description.trim(),
          amount: parseFloat(amount),
          issue_date: format(issueDate, 'yyyy-MM-dd'),
          due_date: format(dueDate, 'yyyy-MM-dd'),
          notes: notes.trim() || undefined,
        });
      }
      onOpenChange(false);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!editingInvoice || !onDelete) return;
    setIsLoading(true);
    await onDelete(editingInvoice.id);
    setIsLoading(false);
    onOpenChange(false);
  };

  const setQuickDue = (days: number) => {
    setDueDate(addDays(issueDate, days));
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="h-[85vh] rounded-t-2xl overflow-y-auto">
        <SheetHeader className="pb-4">
          <SheetTitle>
            {editingInvoice ? 'Editar Boleto' : 'Cadastrar Boleto'}
          </SheetTitle>
        </SheetHeader>

        <div className="space-y-5">
          {/* Supplier */}
          <div className="space-y-2">
            <Label>Fornecedor *</Label>
            <Select value={supplierId} onValueChange={setSupplierId}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione o fornecedor" />
              </SelectTrigger>
              <SelectContent>
                {suppliers.map(s => (
                  <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Amount */}
          <div className="space-y-2">
            <Label>Valor *</Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">R$</span>
              <Input
                type="number"
                inputMode="decimal"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0,00"
                className="pl-10 text-xl h-12 font-semibold"
              />
            </div>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label>Descrição *</Label>
            <Input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Ex: Mercadoria ref. NF 12345"
            />
          </div>

          {/* Invoice Number */}
          <div className="space-y-2">
            <Label>Número do Boleto</Label>
            <Input
              value={invoiceNumber}
              onChange={(e) => setInvoiceNumber(e.target.value)}
              placeholder="Ex: 001234567890"
            />
          </div>

          {/* Issue Date */}
          <div className="space-y-2">
            <Label>Data de Emissão</Label>
            <Popover open={showIssueCalendar} onOpenChange={setShowIssueCalendar}>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-full justify-start">
                  <AppIcon name="CalendarMonth" size={16} className="mr-2" />
                  {format(issueDate, "dd/MM/yyyy", { locale: ptBR })}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={issueDate}
                  onSelect={(d) => {
                    if (d) setIssueDate(d);
                    setShowIssueCalendar(false);
                  }}
                  locale={ptBR}
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Due Date */}
          <div className="space-y-2">
            <Label>Data de Vencimento *</Label>
            <div className="flex gap-2 flex-wrap mb-2">
              {QUICK_DUE_OPTIONS.map(opt => (
                <Button
                  key={opt.days}
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setQuickDue(opt.days)}
                >
                  {opt.label}
                </Button>
              ))}
            </div>
            <Popover open={showDueCalendar} onOpenChange={setShowDueCalendar}>
              <PopoverTrigger asChild>
                <Button 
                  variant="outline" 
                  className={cn(
                    "w-full justify-start",
                    dueDate < new Date() && "border-destructive text-destructive"
                  )}
                >
                  <AppIcon name="CalendarMonth" size={16} className="mr-2" />
                  {format(dueDate, "dd/MM/yyyy", { locale: ptBR })}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={dueDate}
                  onSelect={(d) => {
                    if (d) setDueDate(d);
                    setShowDueCalendar(false);
                  }}
                  locale={ptBR}
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label>Observações</Label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Anotações adicionais..."
              rows={2}
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4 pb-8">
            {editingInvoice && onDelete && (
              <Button 
                variant="destructive" 
                onClick={handleDelete}
                disabled={isLoading}
                className="w-14"
              >
                <AppIcon name="Delete" size={20} />
              </Button>
            )}
            <Button
              onClick={handleSave}
              disabled={isLoading || !supplierId || !description.trim() || !amount}
              className="flex-1 h-12"
            >
              {isLoading ? <AppIcon name="Progress_activity" size={20} className="animate-spin" /> : 'Salvar'}
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
