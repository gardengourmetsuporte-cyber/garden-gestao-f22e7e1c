import { useState, useCallback, useRef, useEffect } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AppIcon } from '@/components/ui/app-icon';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { FinanceCategory, FinanceAccount, TransactionFormData, TransactionType } from '@/types/finance';
import { format } from 'date-fns';
import { useFinanceCategorize } from '@/hooks/useFinanceCategorize';

interface ExtractedData {
  amount: number;
  date: string;
  description: string;
  transfer_type?: string;
  bank_info?: string;
  suggested_type: 'expense' | 'income';
  suggested_category_name: string;
}

interface ReceiptOCRSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  categories: FinanceCategory[];
  accounts: FinanceAccount[];
  onSave: (data: TransactionFormData) => Promise<void>;
  initialImage?: string | null;
}

export function ReceiptOCRSheet({ open, onOpenChange, categories, accounts, onSave, initialImage }: ReceiptOCRSheetProps) {
  const [step, setStep] = useState<'capture' | 'confirm'>('capture');
  const [loading, setLoading] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [extracted, setExtracted] = useState<ExtractedData | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { categorize } = useFinanceCategorize();
  const [aiSuggestion, setAiSuggestion] = useState<string | null>(null);

  // Editable fields
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState('');
  const [type, setType] = useState<TransactionType>('expense');
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [accountId, setAccountId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Handle initialImage from share target
  useEffect(() => {
    if (open && initialImage) {
      setImagePreview(initialImage);
      processImage(initialImage);
    }
  }, [open, initialImage]);

  // Reset on close
  useEffect(() => {
    if (!open) {
      setStep('capture');
      setLoading(false);
      setImagePreview(null);
      setExtracted(null);
      setAmount('');
      setDescription('');
      setDate('');
      setType('expense');
      setCategoryId(null);
      setAccountId(null);
    }
  }, [open]);

  const matchCategory = useCallback((suggestedName: string, txType: TransactionType): string | null => {
    if (!suggestedName) return null;
    const normalized = suggestedName.toLowerCase().trim();

    // Flatten all categories (parents + subcategories)
    const allCats = categories.flatMap(c => {
      const subs = c.subcategories || [];
      return [c, ...subs];
    }).filter(c => c.type === (txType === 'income' ? 'income' : 'expense'));

    // Exact match first
    const exact = allCats.find(c => c.name.toLowerCase() === normalized);
    if (exact) return exact.id;

    // Partial match
    const partial = allCats.find(c =>
      c.name.toLowerCase().includes(normalized) || normalized.includes(c.name.toLowerCase())
    );
    if (partial) return partial.id;

    return null;
  }, [categories]);

  const getDefaultAccount = useCallback((): string | null => {
    const nonCard = accounts.filter(a => a.type !== 'credit_card' && a.is_active);
    return nonCard.length > 0 ? nonCard[0].id : (accounts[0]?.id ?? null);
  }, [accounts]);

  const processImage = async (base64: string) => {
    setLoading(true);
    setStep('confirm');
    setAiSuggestion(null);
    try {
      const { data, error } = await supabase.functions.invoke('receipt-ocr', {
        body: { image_base64: base64 },
      });

      if (error) throw new Error(error.message || 'Erro ao processar');
      if (data?.error) throw new Error(data.error);

      const ext = data as ExtractedData;
      setExtracted(ext);
      setAmount(String(ext.amount || ''));
      setDescription(ext.description || '');
      setDate(ext.date || format(new Date(), 'yyyy-MM-dd'));
      setType(ext.suggested_type || 'expense');
      setAccountId(getDefaultAccount());

      // Use AI categorization for exact ID matching
      const descToMatch = ext.description || ext.suggested_category_name || '';
      if (descToMatch) {
        try {
          const aiResults = await categorize([descToMatch], { categories });
          const ai = aiResults[0];
          if (ai && ai.category_id && ai.confidence >= 0.6) {
            setCategoryId(ai.category_id);
            if (ai.question) setAiSuggestion(ai.question);
          } else {
            // Fallback to simple matching
            setCategoryId(matchCategory(ext.suggested_category_name, ext.suggested_type || 'expense'));
            if (ai?.question) setAiSuggestion(ai.question);
          }
        } catch {
          // Fallback to simple matching if AI fails
          setCategoryId(matchCategory(ext.suggested_category_name, ext.suggested_type || 'expense'));
        }
      } else {
        setCategoryId(null);
      }
    } catch (err: any) {
      toast.error(err.message || 'Erro ao analisar comprovante');
      setStep('capture');
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Convert to base64
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = reader.result as string;
      setImagePreview(base64);
      processImage(base64);
    };
    reader.readAsDataURL(file);
  };

  const handleSave = async () => {
    if (!amount || Number(amount) <= 0) {
      toast.error('Informe um valor válido');
      return;
    }

    setSaving(true);
    try {
      await onSave({
        type,
        amount: Number(amount),
        description: description || 'Comprovante',
        category_id: categoryId,
        account_id: accountId,
        date: date || format(new Date(), 'yyyy-MM-dd'),
        is_paid: true,
        is_fixed: false,
        is_recurring: false,
      });
      toast.success('Transação lançada!');
      onOpenChange(false);
    } catch {
      toast.error('Erro ao salvar transação');
    } finally {
      setSaving(false);
    }
  };

  const flatCategories = categories.flatMap(c => {
    const subs = c.subcategories || [];
    return [c, ...subs.map(s => ({ ...s, name: `  ${s.name}` }))];
  }).filter(c => c.type === (type === 'income' ? 'income' : 'expense'));

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="rounded-t-3xl max-h-[92vh] overflow-y-auto">
        <SheetHeader className="pb-2">
          <SheetTitle className="flex items-center gap-2 text-base">
            <AppIcon name="Camera" size={20} className="text-primary" />
            Lançar por comprovante
          </SheetTitle>
        </SheetHeader>

        {step === 'capture' && !loading && (
          <div className="flex flex-col items-center gap-4 py-8">
            <div className="w-20 h-20 rounded-2xl bg-primary/10 flex items-center justify-center">
              <AppIcon name="Receipt" size={36} className="text-primary" />
            </div>
            <p className="text-sm text-muted-foreground text-center max-w-[260px]">
              Tire uma foto ou escolha da galeria um comprovante de pagamento (Pix, boleto, transferência)
            </p>
            <div className="flex gap-3">
              <Button
                variant="outline"
                className="gap-2"
                onClick={() => {
                  if (fileInputRef.current) {
                    fileInputRef.current.setAttribute('capture', 'environment');
                    fileInputRef.current.click();
                  }
                }}
              >
                <AppIcon name="Camera" size={18} />
                Câmera
              </Button>
              <Button
                variant="outline"
                className="gap-2"
                onClick={() => {
                  if (fileInputRef.current) {
                    fileInputRef.current.removeAttribute('capture');
                    fileInputRef.current.click();
                  }
                }}
              >
                <AppIcon name="Image" size={18} />
                Galeria
              </Button>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileChange}
            />
          </div>
        )}

        {loading && (
          <div className="flex flex-col items-center gap-4 py-12">
            <div className="relative">
              {imagePreview && (
                <img src={imagePreview} alt="Comprovante" className="w-32 h-40 object-cover rounded-xl opacity-60" />
              )}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-10 h-10 border-3 border-primary border-t-transparent rounded-full animate-spin" />
              </div>
            </div>
            <p className="text-sm text-muted-foreground animate-pulse">Analisando comprovante...</p>
          </div>
        )}

        {step === 'confirm' && !loading && (
          <div className="space-y-4 py-2">
            {/* Image thumbnail */}
            {imagePreview && (
              <div className="flex justify-center">
                <img src={imagePreview} alt="Comprovante" className="w-24 h-32 object-cover rounded-xl border border-border/40" />
              </div>
            )}

            {/* Transfer type badge */}
            {extracted?.transfer_type && (
              <div className="flex justify-center">
                <span className="px-3 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary capitalize">
                  {extracted.transfer_type}
                </span>
              </div>
            )}

            {/* Amount */}
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Valor</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">R$</span>
                <Input
                  type="number"
                  step="0.01"
                  value={amount}
                  onChange={e => setAmount(e.target.value)}
                  className="pl-10 text-lg font-bold"
                  inputMode="decimal"
                />
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Descrição</label>
              <Input value={description} onChange={e => setDescription(e.target.value)} />
            </div>

            {/* Date */}
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Data</label>
              <Input type="date" value={date} onChange={e => setDate(e.target.value)} />
            </div>

            {/* Type toggle */}
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Tipo</label>
              <div className="flex gap-2">
                <button
                  onClick={() => { setType('expense'); setCategoryId(null); }}
                  className={cn(
                    "flex-1 py-2.5 rounded-xl text-sm font-medium transition-all",
                    type === 'expense'
                      ? "bg-destructive/15 text-destructive border border-destructive/30"
                      : "bg-secondary/50 text-muted-foreground"
                  )}
                >
                  Despesa
                </button>
                <button
                  onClick={() => { setType('income'); setCategoryId(null); }}
                  className={cn(
                    "flex-1 py-2.5 rounded-xl text-sm font-medium transition-all",
                    type === 'income'
                      ? "bg-emerald-500/15 text-emerald-500 border border-emerald-500/30"
                      : "bg-secondary/50 text-muted-foreground"
                  )}
                >
                  Receita
                </button>
              </div>
            </div>

            {/* Category */}
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Categoria</label>
              <Select value={categoryId || ''} onValueChange={v => setCategoryId(v || null)}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecionar categoria" />
                </SelectTrigger>
                <SelectContent>
                  {flatCategories.map(c => (
                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {aiSuggestion && (
                <p className="text-xs text-amber-600 mt-1 flex items-center gap-1">
                  <AppIcon name="HelpCircle" size={12} />
                  {aiSuggestion}
                </p>
              )}
              {extracted?.suggested_category_name && !categoryId && !aiSuggestion && (
                <p className="text-xs text-muted-foreground mt-1">
                  Sugestão IA: <span className="text-primary">{extracted.suggested_category_name}</span>
                </p>
              )}
            </div>

            {/* Account */}
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Conta</label>
              <Select value={accountId || ''} onValueChange={v => setAccountId(v || null)}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecionar conta" />
                </SelectTrigger>
                <SelectContent>
                  {accounts.filter(a => a.is_active && a.type !== 'credit_card').map(a => (
                    <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Paid badge */}
            <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
              <AppIcon name="CheckCircle" size={16} className="text-emerald-500" />
              <span className="text-sm text-emerald-500 font-medium">Pago</span>
            </div>

            {/* Save button */}
            <Button
              onClick={handleSave}
              disabled={saving || !amount || Number(amount) <= 0}
              className="w-full h-12 text-base font-semibold gap-2"
            >
              {saving ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <AppIcon name="Check" size={20} />
              )}
              Lançar transação
            </Button>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
