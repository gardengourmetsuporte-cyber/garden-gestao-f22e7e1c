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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CategoryPicker } from './CategoryPicker';
import { 
  TransactionType, 
  FinanceCategory, 
  FinanceAccount, 
  TransactionFormData,
  FinanceTransaction
} from '@/types/finance';
import { format, isToday, isYesterday, subDays, addMonths } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { CalendarIcon, ChevronDown, ChevronUp, Loader2, Trash2, Repeat } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getLucideIcon } from '@/lib/icons';
import { toast } from 'sonner';

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

const RECURRING_OPTIONS = [
  { value: 'weekly', label: 'Semanal' },
  { value: 'biweekly', label: 'Quinzenal' },
  { value: 'monthly', label: 'Mensal' },
  { value: 'bimonthly', label: 'Bimestral' },
  { value: 'quarterly', label: 'Trimestral' },
  { value: 'semiannual', label: 'Semestral' },
  { value: 'yearly', label: 'Anual' },
];


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
  const [isRecurring, setIsRecurring] = useState(false);
  const [recurringInterval, setRecurringInterval] = useState<string>('monthly');
  const [recurringCount, setRecurringCount] = useState<string>('12');
  const [notes, setNotes] = useState('');
  const [showCategoryPicker, setShowCategoryPicker] = useState(false);
  const [showCalendar, setShowCalendar] = useState(false);
  const [showRecurringConfig, setShowRecurringConfig] = useState(false);

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
        setIsRecurring(editingTransaction.is_recurring);
        setRecurringInterval(editingTransaction.recurring_interval || 'monthly');
        setNotes(editingTransaction.notes || '');
      } else {
        setType(defaultType);
        setAmount('');
        setDescription('');
        setCategoryId(null);
        const nonCreditCards = accounts.filter(a => a.type !== 'credit_card');
        setAccountId(nonCreditCards[0]?.id || accounts[0]?.id || null);
        setToAccountId(null);
        setDate(new Date());
        setIsPaid(true);
        setIsFixed(false);
        setIsRecurring(false);
        setRecurringInterval('monthly');
        setRecurringCount('12');
        setNotes('');
      }
    }
  }, [open, defaultType, accounts, editingTransaction]);

  const handleSave = async () => {
    if (!amount || parseFloat(amount) <= 0) return;
    if (!description.trim()) return;

    setIsLoading(true);
    
    if (isRecurring && parseInt(recurringCount) > 1) {
      // Create recurring transactions
      const count = parseInt(recurringCount);
      for (let i = 0; i < count; i++) {
        let txDate = date;
        if (recurringInterval === 'weekly') {
          txDate = new Date(date.getTime() + i * 7 * 24 * 60 * 60 * 1000);
        } else if (recurringInterval === 'biweekly') {
          txDate = new Date(date.getTime() + i * 14 * 24 * 60 * 60 * 1000);
        } else if (recurringInterval === 'monthly') {
          txDate = addMonths(date, i);
        } else if (recurringInterval === 'bimonthly') {
          txDate = addMonths(date, i * 2);
        } else if (recurringInterval === 'quarterly') {
          txDate = addMonths(date, i * 3);
        } else if (recurringInterval === 'semiannual') {
          txDate = addMonths(date, i * 6);
        } else if (recurringInterval === 'yearly') {
          txDate = addMonths(date, i * 12);
        }
        
        await onSave({
          type,
          amount: parseFloat(amount),
          description: `${description.trim()} (${i + 1}/${count})`,
          category_id: categoryId,
          account_id: accountId,
          to_account_id: type === 'transfer' ? toAccountId : null,
          date: format(txDate, 'yyyy-MM-dd'),
          is_paid: i === 0 ? isPaid : false,
          is_fixed: isFixed,
          is_recurring: true,
          recurring_interval: recurringInterval,
          notes: notes.trim() || undefined
        });
      }

      toast.success(`Criados ${count} lançamentos. Os próximos aparecem nos meses seguintes.`);
    } else {
      // Single transaction
      await onSave({
        type,
        amount: parseFloat(amount),
        description: description.trim(),
        category_id: categoryId,
        account_id: accountId,
        to_account_id: type === 'transfer' ? toAccountId : null,
        date: format(date, 'yyyy-MM-dd'),
        is_paid: type === 'credit_card' ? false : isPaid,
        is_fixed: isFixed,
        is_recurring: isRecurring,
        recurring_interval: isRecurring ? recurringInterval : undefined,
        notes: notes.trim() || undefined
      });
    }
    
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

  const CategoryIcon = selectedCategory?.icon ? getLucideIcon(selectedCategory.icon) : null;

  const getDateLabel = () => {
    if (isToday(date)) return 'Hoje';
    if (isYesterday(date)) return 'Ontem';
    return format(date, 'dd/MM/yyyy');
  };

  // Only show expense, income, transfer (no credit_card)
  const availableTypes: TransactionType[] = ['expense', 'income', 'transfer'];
  
  const typeLabels: Record<string, string> = {
    expense: 'Despesa',
    income: 'Receita',
    transfer: 'Transferência',
  };

  // Filter accounts (no credit cards)
  const availableAccounts = accounts.filter(a => a.type !== 'credit_card');

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
            <Tabs value={type} onValueChange={(v) => {
              setType(v as TransactionType);
              const nonCreditCards = accounts.filter(a => a.type !== 'credit_card');
              setAccountId(nonCreditCards[0]?.id || null);
              setIsPaid(true);
            }} className="w-full">
              <TabsList className="grid grid-cols-3 w-full">
                {availableTypes.map(t => (
                  <TabsTrigger
                    key={t}
                    value={t}
                    className={cn(
                      "text-xs",
                      type === t && t === 'income' && "data-[state=active]:bg-success data-[state=active]:text-success-foreground",
                      type === t && t === 'expense' && "data-[state=active]:bg-destructive data-[state=active]:text-destructive-foreground"
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
              <Label>{type === 'transfer' ? 'Conta de origem' : type === 'credit_card' ? 'Cartão' : 'Conta'}</Label>
              <select
                value={accountId || ''}
                onChange={(e) => setAccountId(e.target.value || null)}
                className="w-full h-12 px-3 rounded-md border bg-background"
              >
                <option value="">Selecionar {type === 'credit_card' ? 'cartão' : 'conta'}</option>
                {availableAccounts.map(acc => (
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
                  {accounts.filter(a => a.id !== accountId && a.type !== 'credit_card').map(acc => (
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

                {/* Recurring options */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Repeat className="w-4 h-4 text-muted-foreground" />
                      <Label>Repetir</Label>
                    </div>
                    <Switch checked={isRecurring} onCheckedChange={(checked) => {
                      setIsRecurring(checked);
                      if (checked) setShowRecurringConfig(true);
                    }} />
                  </div>
                  
                  {isRecurring && showRecurringConfig && (
                    <div className="bg-card border rounded-xl p-4 space-y-4">
                      <h4 className="text-sm font-medium">Como sua transação se repete?</h4>
                      
                      {/* Quantity selector with increment/decrement */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Repeat className="w-4 h-4 text-muted-foreground" />
                          <span className="text-sm">Quantidade</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => setRecurringCount(String(Math.max(2, parseInt(recurringCount) - 1)))}
                          >
                            <ChevronDown className="w-4 h-4" />
                          </Button>
                          <span className="text-lg font-semibold w-8 text-center">{recurringCount}</span>
                          <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => setRecurringCount(String(Math.min(60, parseInt(recurringCount) + 1)))}
                          >
                            <ChevronUp className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>

                      {/* Period selector */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Repeat className="w-4 h-4 text-muted-foreground" />
                          <span className="text-sm">Período</span>
                        </div>
                        <Select value={recurringInterval} onValueChange={setRecurringInterval}>
                          <SelectTrigger className="w-32">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {RECURRING_OPTIONS.map(opt => (
                              <SelectItem key={opt.value} value={opt.value}>
                                {opt.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <Button
                        type="button"
                        className="w-full"
                        onClick={() => setShowRecurringConfig(false)}
                      >
                        Pronto
                      </Button>
                    </div>
                  )}

                  {isRecurring && !showRecurringConfig && (
                    <button
                      type="button"
                      onClick={() => setShowRecurringConfig(true)}
                      className="ml-6 text-sm text-primary underline"
                    >
                      {recurringCount}x {RECURRING_OPTIONS.find(o => o.value === recurringInterval)?.label || 'Mensal'}
                    </button>
                  )}
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
