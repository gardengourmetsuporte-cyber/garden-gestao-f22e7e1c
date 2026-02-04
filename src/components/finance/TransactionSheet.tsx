import { useState, useEffect } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CategoryPicker } from './CategoryPicker';
import { 
  TransactionType, 
  FinanceCategory, 
  FinanceAccount, 
  TransactionFormData,
  FinanceTransaction
} from '@/types/finance';
import { format, isToday, isYesterday, subDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { CalendarIcon, ChevronDown, Loader2, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getLucideIcon } from '@/lib/icons';

interface TransactionSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultType: TransactionType;
  categories: FinanceCategory[];
  accounts: FinanceAccount[];
  onSave: (data: TransactionFormData) => Promise<void>;
  onDelete?: (id: string) => Promise<void>;
  editingTransaction?: FinanceTransaction | null;
}

export function TransactionSheet({
  open,
  onOpenChange,
  defaultType,
  categories,
  accounts,
  onSave,
  onDelete,
  editingTransaction
}: TransactionSheetProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [type, setType] = useState<TransactionType>(defaultType);
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [accountId, setAccountId] = useState<string | null>(null);
  const [toAccountId, setToAccountId] = useState<string | null>(null);
  const [date, setDate] = useState<Date>(new Date());
  const [isPaid, setIsPaid] = useState(true);
  const [isFixed, setIsFixed] = useState(false);
  const [notes, setNotes] = useState('');
  const [showCategoryPicker, setShowCategoryPicker] = useState(false);
  const [showCalendar, setShowCalendar] = useState(false);

  // Reset form when opened
  useEffect(() => {
    if (open) {
      if (editingTransaction) {
        setType(editingTransaction.type);
        setAmount(String(editingTransaction.amount));
        setDescription(editingTransaction.description);
        setCategoryId(editingTransaction.category_id);
        setAccountId(editingTransaction.account_id);
        setToAccountId(editingTransaction.to_account_id);
        setDate(new Date(editingTransaction.date));
        setIsPaid(editingTransaction.is_paid);
        setIsFixed(editingTransaction.is_fixed);
        setNotes(editingTransaction.notes || '');
      } else {
        setType(defaultType);
        setAmount('');
        setDescription('');
        setCategoryId(null);
        setAccountId(accounts[0]?.id || null);
        setToAccountId(null);
        setDate(new Date());
        setIsPaid(true);
        setIsFixed(false);
        setNotes('');
      }
    }
  }, [open, defaultType, accounts, editingTransaction]);

  const handleSave = async () => {
    if (!amount || parseFloat(amount) <= 0) return;
    if (!description.trim()) return;

    setIsLoading(true);
    await onSave({
      type,
      amount: parseFloat(amount),
      description: description.trim(),
      category_id: categoryId,
      account_id: accountId,
      to_account_id: type === 'transfer' ? toAccountId : null,
      date: format(date, 'yyyy-MM-dd'),
      is_paid: isPaid,
      is_fixed: isFixed,
      is_recurring: false,
      notes: notes.trim() || undefined
    });
    setIsLoading(false);
    onOpenChange(false);
  };

  const handleDelete = async () => {
    if (!editingTransaction || !onDelete) return;
    setIsLoading(true);
    await onDelete(editingTransaction.id);
    setIsLoading(false);
    onOpenChange(false);
  };

  const selectedCategory = categories.flatMap(c => [c, ...(c.subcategories || [])]).find(c => c.id === categoryId);
  const selectedAccount = accounts.find(a => a.id === accountId);
  const selectedToAccount = accounts.find(a => a.id === toAccountId);

  const CategoryIcon = selectedCategory?.icon ? getLucideIcon(selectedCategory.icon) : null;

  const getDateLabel = () => {
    if (isToday(date)) return 'Hoje';
    if (isYesterday(date)) return 'Ontem';
    return format(date, 'dd/MM/yyyy');
  };

  const typeLabels: Record<TransactionType, string> = {
    expense: 'Despesa',
    income: 'Receita',
    transfer: 'Transf.',
    credit_card: 'Cartão'
  };

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent side="bottom" className="h-[90vh] rounded-t-2xl overflow-y-auto">
          <SheetHeader className="pb-4">
            <SheetTitle>
              {editingTransaction ? 'Editar Transação' : 'Nova Transação'}
            </SheetTitle>
          </SheetHeader>

          <div className="space-y-6">
            {/* Type selector */}
            <Tabs value={type} onValueChange={(v) => setType(v as TransactionType)} className="w-full">
              <TabsList className="grid grid-cols-4 w-full">
                {(['expense', 'income', 'transfer', 'credit_card'] as TransactionType[]).map(t => (
                  <TabsTrigger
                    key={t}
                    value={t}
                    className={cn(
                      "text-xs",
                      type === t && t === 'income' && "data-[state=active]:bg-success data-[state=active]:text-success-foreground",
                      type === t && t === 'expense' && "data-[state=active]:bg-destructive data-[state=active]:text-destructive-foreground",
                      type === t && t === 'credit_card' && "data-[state=active]:bg-purple-500 data-[state=active]:text-white"
                    )}
                  >
                    {typeLabels[t]}
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>

            {/* Amount */}
            <div className="space-y-2">
              <Label>Valor</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">R$</span>
                <Input
                  type="number"
                  inputMode="decimal"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0,00"
                  className="pl-10 text-2xl h-14 font-semibold"
                />
              </div>
            </div>

            {/* Paid toggle and Date */}
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Switch checked={isPaid} onCheckedChange={setIsPaid} />
                <Label>Pago</Label>
              </div>
              <div className="flex-1 flex justify-end gap-2">
                <Button
                  variant={isToday(date) ? "default" : "outline"}
                  size="sm"
                  onClick={() => setDate(new Date())}
                >
                  Hoje
                </Button>
                <Button
                  variant={isYesterday(date) ? "default" : "outline"}
                  size="sm"
                  onClick={() => setDate(subDays(new Date(), 1))}
                >
                  Ontem
                </Button>
                <Popover open={showCalendar} onOpenChange={setShowCalendar}>
                  <PopoverTrigger asChild>
                    <Button variant="outline" size="sm">
                      <CalendarIcon className="w-4 h-4 mr-1" />
                      {!isToday(date) && !isYesterday(date) ? getDateLabel() : 'Outros'}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="end">
                    <Calendar
                      mode="single"
                      selected={date}
                      onSelect={(d) => {
                        if (d) setDate(d);
                        setShowCalendar(false);
                      }}
                      locale={ptBR}
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            {/* Category */}
            {type !== 'transfer' && (
              <div className="space-y-2">
                <Label>Categoria</Label>
                <Button
                  variant="outline"
                  className="w-full justify-between h-12"
                  onClick={() => setShowCategoryPicker(true)}
                >
                  <div className="flex items-center gap-2">
                    {CategoryIcon && (
                      <CategoryIcon className="w-4 h-4" style={{ color: selectedCategory?.color }} />
                    )}
                    <span>{selectedCategory?.name || 'Selecionar categoria'}</span>
                  </div>
                  <ChevronDown className="w-4 h-4 text-muted-foreground" />
                </Button>
              </div>
            )}

            {/* Account */}
            <div className="space-y-2">
              <Label>{type === 'transfer' ? 'Conta de origem' : 'Conta'}</Label>
              <select
                value={accountId || ''}
                onChange={(e) => setAccountId(e.target.value || null)}
                className="w-full h-12 px-3 rounded-md border bg-background"
              >
                <option value="">Selecionar conta</option>
                {accounts.map(acc => (
                  <option key={acc.id} value={acc.id}>{acc.name}</option>
                ))}
              </select>
            </div>

            {/* To Account (for transfers) */}
            {type === 'transfer' && (
              <div className="space-y-2">
                <Label>Conta de destino</Label>
                <select
                  value={toAccountId || ''}
                  onChange={(e) => setToAccountId(e.target.value || null)}
                  className="w-full h-12 px-3 rounded-md border bg-background"
                >
                  <option value="">Selecionar conta</option>
                  {accounts.filter(a => a.id !== accountId).map(acc => (
                    <option key={acc.id} value={acc.id}>{acc.name}</option>
                  ))}
                </select>
              </div>
            )}

            {/* Description */}
            <div className="space-y-2">
              <Label>Descrição</Label>
              <Input
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Ex: Compra de carnes"
                className="h-12"
              />
            </div>

            {/* Advanced options */}
            <div className="space-y-4 pt-4 border-t">
              <div className="flex items-center justify-between">
                <Label>Despesa fixa</Label>
                <Switch checked={isFixed} onCheckedChange={setIsFixed} />
              </div>

              <div className="space-y-2">
                <Label>Observações</Label>
                <Textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Anotações adicionais..."
                  rows={2}
                />
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-4 pb-8">
              {editingTransaction && onDelete && (
                <Button 
                  variant="destructive" 
                  onClick={handleDelete}
                  disabled={isLoading}
                  className="w-14"
                >
                  <Trash2 className="w-5 h-5" />
                </Button>
              )}
              <Button
                onClick={handleSave}
                disabled={isLoading || !amount || parseFloat(amount) <= 0 || !description.trim()}
                className="flex-1 h-12"
              >
                {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Salvar'}
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>

      <CategoryPicker
        open={showCategoryPicker}
        onOpenChange={setShowCategoryPicker}
        categories={categories}
        type={type === 'income' ? 'income' : 'expense'}
        selectedId={categoryId}
        onSelect={(cat) => setCategoryId(cat.id)}
      />
    </>
  );
}
