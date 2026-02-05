import { useState, useRef } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { 
  Banknote, 
  CreditCard, 
  Smartphone, 
  Truck, 
  Upload, 
  Camera,
  AlertCircle,
  CheckCircle2,
  Loader2,
  Plus,
  Trash2,
  Receipt
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useCashClosing } from '@/hooks/useCashClosing';
import { PAYMENT_METHODS } from '@/types/cashClosing';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

interface Props {
  onSuccess: () => void;
}

interface ExpenseItem {
  description: string;
  amount: number;
}

export function CashClosingForm({ onSuccess }: Props) {
  const { profile } = useAuth();
  const { uploadReceipt, createClosing, checkChecklistCompleted } = useCashClosing();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const today = format(new Date(), 'yyyy-MM-dd');
  
  const [cashAmount, setCashAmount] = useState(0);
  const [debitAmount, setDebitAmount] = useState(0);
  const [creditAmount, setCreditAmount] = useState(0);
  const [pixAmount, setPixAmount] = useState(0);
  const [deliveryAmount, setDeliveryAmount] = useState(0);
  const [cashDifference, setCashDifference] = useState(0);
  const [notes, setNotes] = useState('');
  
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [receiptPreview, setReceiptPreview] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [checklistStatus, setChecklistStatus] = useState<'checking' | 'completed' | 'incomplete' | null>(null);
  const [expenses, setExpenses] = useState<ExpenseItem[]>([]);
  const [newExpense, setNewExpense] = useState<ExpenseItem>({ description: '', amount: 0 });

  const totalExpenses = expenses.reduce((sum, exp) => sum + exp.amount, 0);
  
  const totalPayments = cashAmount + debitAmount + creditAmount + pixAmount + deliveryAmount;
  const total = totalPayments - totalExpenses;

  const paymentValues: Record<string, { value: number; setter: (v: number) => void }> = {
    cash_amount: { value: cashAmount, setter: setCashAmount },
    debit_amount: { value: debitAmount, setter: setDebitAmount },
    credit_amount: { value: creditAmount, setter: setCreditAmount },
    pix_amount: { value: pixAmount, setter: setPixAmount },
    delivery_amount: { value: deliveryAmount, setter: setDeliveryAmount },
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setReceiptFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setReceiptPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleValueChange = (key: string, value: string) => {
    const numValue = value === '' ? 0 : parseFloat(value) || 0;
    paymentValues[key]?.setter(numValue);
  };

  const addExpense = () => {
    if (!newExpense.description.trim()) {
      toast.error('Informe a descrição do gasto');
      return;
    }
    if (newExpense.amount <= 0) {
      toast.error('Informe o valor do gasto');
      return;
    }
    setExpenses(prev => [...prev, { ...newExpense }]);
    setNewExpense({ description: '', amount: 0 });
  };

  const removeExpense = (index: number) => {
    setExpenses(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    // Check checklist first
    setChecklistStatus('checking');
    const checklistOk = await checkChecklistCompleted(today);
    
    if (!checklistOk) {
      setChecklistStatus('incomplete');
      toast.error('Complete o checklist de fechamento antes de enviar!');
      return;
    }
    setChecklistStatus('completed');

    if (totalPayments <= 0) {
      toast.error('Informe pelo menos um valor de pagamento');
      return;
    }

    setIsSubmitting(true);

    try {
      // Upload receipt if provided
      let receiptUrl = '';
      if (receiptFile) {
        const uploadedUrl = await uploadReceipt(receiptFile);
        if (uploadedUrl) {
          receiptUrl = uploadedUrl;
        }
      }

      // Create closing
      const success = await createClosing({
        date: today,
        unit_name: 'Principal',
        cash_amount: cashAmount,
        debit_amount: debitAmount,
        credit_amount: creditAmount,
        pix_amount: pixAmount,
        delivery_amount: deliveryAmount,
        cash_difference: cashDifference,
        receipt_url: receiptUrl,
        notes: notes,
        expenses: expenses,
      });

      if (success) {
        onSuccess();
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const getIcon = (iconName: string) => {
    switch (iconName) {
      case 'Banknote': return Banknote;
      case 'CreditCard': return CreditCard;
      case 'Smartphone': return Smartphone;
      case 'Truck': return Truck;
      default: return Banknote;
    }
  };

  return (
    <div className="space-y-4 pb-6">
      {/* Header Info */}
      <Card className="card-unified">
        <CardContent className="p-4">
          <div className="flex justify-between items-center text-sm">
            <div>
              <span className="text-muted-foreground">Data:</span>
              <span className="ml-2 font-medium">
                {format(new Date(today), "dd 'de' MMMM", { locale: ptBR })}
              </span>
            </div>
            <div>
              <span className="text-muted-foreground">Responsável:</span>
              <span className="ml-2 font-medium">{profile?.full_name || 'Usuário'}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Payment Values */}
      <Card className="card-unified">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Valores por Meio de Pagamento</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {PAYMENT_METHODS.map(method => {
            const Icon = getIcon(method.icon);
            const { value } = paymentValues[method.key];
            return (
              <div key={method.key} className="flex items-center gap-3">
                <div 
                  className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                  style={{ backgroundColor: `${method.color}20` }}
                >
                  <Icon className="w-5 h-5" style={{ color: method.color }} />
                </div>
                <Label className="flex-1 text-sm font-medium">{method.label}</Label>
                <div className="relative w-32">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">R$</span>
                  <Input
                    type="number"
                    inputMode="decimal"
                    step="0.01"
                    min="0"
                    className="pl-10 text-right h-11"
                    value={value || ''}
                    onChange={(e) => handleValueChange(method.key, e.target.value)}
                    placeholder="0,00"
                  />
                </div>
              </div>
            );
          })}

          {/* Total */}
          <div className="border-t pt-3 mt-3">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-lg">Total Recebido</span>
              <span className="text-2xl font-bold text-primary">
                R$ {totalPayments.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Expenses Section */}
      <Card className="card-unified">
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <Receipt className="w-4 h-4" />
            Gastos do Dia (opcional)
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {/* Existing expenses */}
          {expenses.map((expense, index) => (
            <div key={index} className="flex items-center gap-2 p-2 bg-muted/50 rounded-lg">
              <span className="flex-1 text-sm">{expense.description}</span>
              <span className="font-medium text-destructive">
                - R$ {expense.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </span>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-muted-foreground hover:text-destructive"
                onClick={() => removeExpense(index)}
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          ))}

          {/* Add new expense */}
          <div className="flex gap-2">
            <Input
              placeholder="Descrição (ex: Geladeira)"
              value={newExpense.description}
              onChange={(e) => setNewExpense(prev => ({ ...prev, description: e.target.value }))}
              className="flex-1"
            />
            <div className="relative w-28">
              <span className="absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">R$</span>
              <Input
                type="number"
                inputMode="decimal"
                step="0.01"
                min="0"
                className="pl-8 text-right"
                value={newExpense.amount || ''}
                onChange={(e) => setNewExpense(prev => ({ ...prev, amount: parseFloat(e.target.value) || 0 }))}
                placeholder="0,00"
              />
            </div>
            <Button
              variant="secondary"
              size="icon"
              onClick={addExpense}
              className="shrink-0"
            >
              <Plus className="w-4 h-4" />
            </Button>
          </div>

          {expenses.length > 0 && (
            <div className="border-t pt-2 mt-2 flex justify-between text-sm">
              <span className="text-muted-foreground">Total de gastos:</span>
              <span className="font-medium text-destructive">
                - R$ {totalExpenses.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Net Total */}
      {expenses.length > 0 && (
        <Card className="card-unified bg-primary/5">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <span className="font-semibold">Líquido (Recebido - Gastos)</span>
              <span className="text-xl font-bold text-primary">
                R$ {total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Cash Difference (optional) */}
      <Card className="card-unified">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <Label className="flex-1 text-sm">Diferença de Caixa (se houver)</Label>
            <div className="relative w-32">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">R$</span>
              <Input
                type="number"
                inputMode="decimal"
                step="0.01"
                className="pl-10 text-right h-11"
                value={cashDifference || ''}
                onChange={(e) => setCashDifference(parseFloat(e.target.value) || 0)}
                placeholder="0,00"
              />
            </div>
          </div>
          {cashDifference !== 0 && (
            <p className="text-xs text-amber-600 mt-2 flex items-center gap-1">
              <AlertCircle className="w-3 h-3" />
              {cashDifference > 0 ? 'Sobra' : 'Falta'} no caixa será registrada
            </p>
          )}
        </CardContent>
      </Card>

      {/* Receipt Upload */}
      <Card className="card-unified">
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <Upload className="w-4 h-4" />
            Comprovante do PDV (Colibri) - opcional
          </CardTitle>
        </CardHeader>
        <CardContent>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,.pdf"
            capture="environment"
            className="hidden"
            onChange={handleFileChange}
          />
          
          {receiptPreview ? (
            <div className="relative">
              <img 
                src={receiptPreview} 
                alt="Comprovante" 
                className="w-full h-48 object-cover rounded-xl"
              />
              <Button
                variant="secondary"
                size="sm"
                className="absolute bottom-2 right-2"
                onClick={() => fileInputRef.current?.click()}
              >
                Trocar
              </Button>
            </div>
          ) : (
            <Button
              variant="outline"
              className="w-full h-32 border-dashed flex flex-col gap-2"
              onClick={() => fileInputRef.current?.click()}
            >
              <Camera className="w-8 h-8 text-muted-foreground" />
              <span className="text-muted-foreground">Tirar foto ou anexar arquivo</span>
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Notes */}
      <Card className="card-unified">
        <CardContent className="p-4">
          <Label className="text-sm mb-2 block">Observações (opcional)</Label>
          <Textarea
            placeholder="Alguma observação sobre o fechamento..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={2}
          />
        </CardContent>
      </Card>

      {/* Checklist Alert */}
      {checklistStatus === 'incomplete' && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Complete o checklist de fechamento antes de enviar o caixa!
          </AlertDescription>
        </Alert>
      )}

      {/* Submit Button */}
      <Button
        className="w-full h-14 text-lg font-semibold"
        onClick={handleSubmit}
        disabled={isSubmitting}
      >
        {isSubmitting ? (
          <>
            <Loader2 className="w-5 h-5 mr-2 animate-spin" />
            Enviando...
          </>
        ) : (
          <>
            <CheckCircle2 className="w-5 h-5 mr-2" />
            Enviar Fechamento
          </>
        )}
      </Button>
    </div>
  );
}