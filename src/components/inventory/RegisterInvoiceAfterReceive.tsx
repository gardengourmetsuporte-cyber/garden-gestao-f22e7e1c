import { useState } from 'react';
import { FileText, Camera, Calendar } from 'lucide-react';
import { Order } from '@/types/database';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { toast } from 'sonner';
import { format, addDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface RegisterInvoiceAfterReceiveProps {
  order: Order | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onRegisterInvoice: (data: {
    supplierId: string;
    amount: number;
    dueDate: string;
    description: string;
    invoiceNumber?: string;
  }) => Promise<void>;
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
  const [dueDate, setDueDate] = useState(format(addDays(new Date(), 30), 'yyyy-MM-dd'));
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!order?.supplier_id || !amount || !dueDate) {
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
        supplierId: order.supplier_id,
        amount: parsedAmount,
        dueDate,
        description: `Pedido para ${order.supplier?.name}`,
        invoiceNumber: invoiceNumber || undefined,
      });
      onOpenChange(false);
      // Reset form
      setAmount('');
      setDueDate(format(addDays(new Date(), 30), 'yyyy-MM-dd'));
      setInvoiceNumber('');
    } catch (error) {
      console.error('Error registering invoice:', error);
      toast.error('Erro ao cadastrar boleto');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSkip = () => {
    onSkip();
    onOpenChange(false);
    setAmount('');
    setDueDate(format(addDays(new Date(), 30), 'yyyy-MM-dd'));
    setInvoiceNumber('');
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="rounded-t-3xl px-4 pb-8 max-h-[85vh] overflow-y-auto">
        <SheetHeader className="pb-4">
          <SheetTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-primary" />
            Cadastrar Despesa - {order?.supplier?.name}
          </SheetTitle>
        </SheetHeader>

        <div className="space-y-6">
          <div className="p-4 rounded-xl bg-success/10 border border-success/30">
            <p className="text-success font-medium">✓ Pedido recebido com sucesso!</p>
            <p className="text-sm text-muted-foreground mt-1">
              Deseja cadastrar o boleto/fatura deste fornecedor?
            </p>
          </div>

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
            <Label htmlFor="dueDate" className="text-foreground flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              Data de Vencimento
            </Label>
            <Input
              id="dueDate"
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="h-12"
            />
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
              disabled={isSubmitting || !amount}
              className="w-full h-12 gap-2"
            >
              <FileText className="w-4 h-4" />
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

          <p className="text-xs text-muted-foreground text-center">
            O boleto ficará como provisão no financeiro até ser pago
          </p>
        </div>
      </SheetContent>
    </Sheet>
  );
}
