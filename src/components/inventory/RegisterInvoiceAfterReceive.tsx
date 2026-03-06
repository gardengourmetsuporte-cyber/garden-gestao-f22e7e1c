import { useState, useRef } from 'react';
import { AppIcon } from '@/components/ui/app-icon';
import { Order } from '@/types/database';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { toast } from 'sonner';
import { format, addDays, parse } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { useSmartReceiving } from '@/hooks/useSmartReceiving';

interface RegisterInvoiceAfterReceiveProps {
  order: Order | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onRegisterInvoice: (data: {
    orderId: string;
    supplierId: string;
    amount: number;
    dueDate: string;
    description: string;
    invoiceNumber?: string;
  }) => Promise<string | void>;
  onSkip: () => void;
}

export function RegisterInvoiceAfterReceive({
  order,
  open,
  onOpenChange,
  onRegisterInvoice,
  onSkip,
}: RegisterInvoiceAfterReceiveProps) {
  const [amount, setAmount] = useState('');
  const [dueDate, setDueDate] = useState<Date>(addDays(new Date(), 30));
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showDueCalendar, setShowDueCalendar] = useState(false);

  // Photo capture states
  const [boletoPreview, setBoletoPreview] = useState<string | null>(null);
  const [isProcessingOcr, setIsProcessingOcr] = useState(false);
  const boletoInputRef = useRef<HTMLInputElement>(null);
  const invoiceInputRef = useRef<HTMLInputElement>(null);

  const { processImage, uploadImage } = useSmartReceiving();

  // Convert file to base64
  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  // Process boleto photo with receipt-ocr
  const handleBoletoCapture = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Show preview
    const preview = URL.createObjectURL(file);
    setBoletoPreview(preview);
    setIsProcessingOcr(true);

    try {
      const base64 = await fileToBase64(file);

      const { data, error } = await supabase.functions.invoke('receipt-ocr', {
        body: { image_base64: base64 },
      });

      if (error) throw error;

      // Auto-fill fields from OCR
      if (data?.amount) {
        setAmount(String(data.amount).replace('.', ','));
      }
      if (data?.date) {
        try {
          const parsed = parse(data.date, 'yyyy-MM-dd', new Date());
          if (!isNaN(parsed.getTime())) setDueDate(parsed);
        } catch {}
      }
      if (data?.description) {
        setInvoiceNumber(data.description);
      }

      toast.success('Dados extraídos do boleto!');
    } catch (err) {
      console.error('Boleto OCR error:', err);
      toast.error('Não foi possível ler o boleto. Preencha manualmente.');
    } finally {
      setIsProcessingOcr(false);
      if (boletoInputRef.current) boletoInputRef.current.value = '';
    }
  };

  // Process invoice photo with smart-receiving-ocr (for stock entry)
  const handleInvoiceCapture = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsProcessingOcr(true);
    try {
      // Use smart receiving OCR to process the invoice for stock items
      const result = await processImage(file, []);

      // Auto-fill amount from total
      if (result.total_amount) {
        setAmount(String(result.total_amount).replace('.', ','));
      }
      if (result.invoice_number) {
        setInvoiceNumber(result.invoice_number);
      }
      if (result.boleto_due_date) {
        try {
          const parsed = parse(result.boleto_due_date, 'yyyy-MM-dd', new Date());
          if (!isNaN(parsed.getTime())) setDueDate(parsed);
        } catch {}
      }

      toast.success(`Nota lida! ${result.items?.length || 0} itens encontrados.`);
    } catch (err) {
      console.error('Invoice OCR error:', err);
      toast.error('Não foi possível ler a nota. Preencha manualmente.');
    } finally {
      setIsProcessingOcr(false);
      if (invoiceInputRef.current) invoiceInputRef.current.value = '';
    }
  };

  const handleSubmit = async () => {
    if (!order?.id || !order?.supplier_id || !amount) {
      toast.error('Preencha o valor e a data de vencimento');
      return;
    }

    const parsedAmount = parseFloat(amount.replace(',', '.'));
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      toast.error('Digite um valor válido');
      return;
    }

    setIsSubmitting(true);
    try {
      await onRegisterInvoice({
        orderId: order.id,
        supplierId: order.supplier_id,
        amount: parsedAmount,
        dueDate: format(dueDate, 'yyyy-MM-dd'),
        description: `Pedido para ${order.supplier?.name}`,
        invoiceNumber: invoiceNumber || undefined,
      });
      onOpenChange(false);
      resetForm();
    } catch (error) {
      console.error('Error registering invoice:', error);
      toast.error('Erro ao cadastrar boleto');
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setAmount('');
    setDueDate(addDays(new Date(), 30));
    setInvoiceNumber('');
    setBoletoPreview(null);
  };

  const handleSkip = () => {
    onSkip();
    onOpenChange(false);
    resetForm();
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="rounded-t-3xl px-4 pb-[env(safe-area-inset-bottom,16px)] overflow-y-auto">
        <SheetHeader className="pb-4">
          <SheetTitle className="flex items-center gap-2">
            <AppIcon name="Description" size={20} className="text-primary" />
            Cadastrar Despesa - {order?.supplier?.name}
          </SheetTitle>
        </SheetHeader>

        <div className="space-y-5">
          <div className="p-4 rounded-xl bg-success/10 border border-success/30">
            <p className="text-success font-medium">✓ Pedido recebido com sucesso!</p>
            <p className="text-sm text-muted-foreground mt-1">
              Deseja cadastrar o boleto/fatura deste fornecedor?
            </p>
          </div>

          {/* Photo capture buttons */}
          <div className="grid grid-cols-2 gap-3">
            <input
              ref={invoiceInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              className="hidden"
              onChange={handleInvoiceCapture}
            />
            <Button
              variant="outline"
              className="h-14 flex-col gap-1 text-xs"
              onClick={() => invoiceInputRef.current?.click()}
              disabled={isProcessingOcr}
            >
              <AppIcon name="Receipt" size={20} className="text-primary" />
              Foto da Nota
            </Button>

            <input
              ref={boletoInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              className="hidden"
              onChange={handleBoletoCapture}
            />
            <Button
              variant="outline"
              className="h-14 flex-col gap-1 text-xs"
              onClick={() => boletoInputRef.current?.click()}
              disabled={isProcessingOcr}
            >
              <AppIcon name="Photo_Camera" size={20} className="text-primary" />
              Foto do Boleto
            </Button>
          </div>

          {/* Processing indicator */}
          {isProcessingOcr && (
            <div className="flex items-center gap-2 p-3 rounded-xl bg-primary/10 border border-primary/20">
              <div className="h-4 w-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              <span className="text-sm text-primary font-medium">Lendo documento com IA...</span>
            </div>
          )}

          {/* Boleto preview */}
          {boletoPreview && (
            <div className="relative rounded-xl overflow-hidden border border-border">
              <img src={boletoPreview} alt="Boleto" className="w-full h-24 object-cover" />
              <button
                onClick={() => setBoletoPreview(null)}
                className="absolute top-1 right-1 bg-background/80 backdrop-blur rounded-full p-1"
              >
                <AppIcon name="Close" size={16} />
              </button>
            </div>
          )}

          {/* Supplier Info */}
          <div className="p-3 rounded-xl bg-secondary/50">
            <p className="text-sm text-muted-foreground">Fornecedor</p>
            <p className="font-semibold text-foreground">{order?.supplier?.name}</p>
          </div>

          {/* Amount */}
          <div className="space-y-2">
            <Label htmlFor="amount" className="text-foreground">Valor Total (R$)</Label>
            <Input
              id="amount"
              type="text"
              inputMode="decimal"
              placeholder="0,00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="h-12 text-lg font-semibold"
            />
          </div>

          {/* Due Date */}
          <div className="space-y-2">
            <Label className="text-foreground flex items-center gap-2">
              <AppIcon name="Calendar" size={16} />
              Data de Vencimento
            </Label>
            <Popover open={showDueCalendar} onOpenChange={setShowDueCalendar} modal={true}>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-full h-12 justify-start">
                  <AppIcon name="Calendar" size={16} className="mr-2" />
                  {format(dueDate, "dd/MM/yyyy", { locale: ptBR })}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0 z-[9999]" align="center" side="top">
                <Calendar
                  mode="single"
                  selected={dueDate}
                  defaultMonth={new Date()}
                  onSelect={(d) => {
                    if (d) setDueDate(d);
                    setShowDueCalendar(false);
                  }}
                  locale={ptBR}
                  className={cn("p-3 pointer-events-auto")}
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Invoice Number (optional) */}
          <div className="space-y-2">
            <Label htmlFor="invoiceNumber" className="text-foreground">
              Número da Nota/Boleto (opcional)
            </Label>
            <Input
              id="invoiceNumber"
              type="text"
              placeholder="Ex: NF-12345"
              value={invoiceNumber}
              onChange={(e) => setInvoiceNumber(e.target.value)}
              className="h-12"
            />
          </div>

          {/* Actions */}
          <div className="flex flex-col gap-3">
            <Button
              onClick={handleSubmit}
              disabled={isSubmitting || !amount || isProcessingOcr}
              className="w-full h-12 gap-2"
            >
              <AppIcon name="Description" size={16} />
              {isSubmitting ? 'Cadastrando...' : 'Cadastrar Boleto'}
            </Button>
            
            <Button
              variant="ghost"
              onClick={handleSkip}
              className="w-full h-10 text-muted-foreground"
            >
              Pular por agora
            </Button>
          </div>

          <p className="text-xs text-muted-foreground text-center pb-2">
            O boleto ficará como provisão no financeiro até ser pago
          </p>
        </div>
      </SheetContent>
    </Sheet>
  );
}
