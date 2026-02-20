import { useState, useEffect, useRef } from 'react';
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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { CategoryPicker } from './CategoryPicker';
import { TransactionSuggestions } from './TransactionSuggestions';
import { ListPicker } from '@/components/ui/list-picker';
import { 
  TransactionType, 
  FinanceCategory, 
  FinanceAccount, 
  TransactionFormData,
  FinanceTransaction
} from '@/types/finance';
import { format, isToday, isYesterday, isFuture, subDays, addMonths, addWeeks, startOfDay, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { AppIcon } from '@/components/ui/app-icon';
import { toast } from 'sonner';

export type RecurringEditMode = 'single' | 'pending' | 'all';

interface TransactionSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultType: TransactionType;
  categories: FinanceCategory[];
  accounts: FinanceAccount[];
  suppliers?: { id: string; name: string }[];
  employees?: { id: string; full_name: string }[];
  onAddSupplier?: (name: string) => Promise<{ id: string; name: string }>;
  onAddEmployee?: (name: string) => Promise<void>;
  onSave: (data: TransactionFormData) => Promise<void>;
  onDelete?: (id: string) => Promise<void>;
  editingTransaction?: FinanceTransaction | null;
  onUpdateRecurring?: (id: string, data: Partial<TransactionFormData>, mode: RecurringEditMode) => Promise<void>;
  onSaveAndContinue?: (data: TransactionFormData) => Promise<void>;
  onRefreshCategories?: () => Promise<void>;
  allTransactions?: FinanceTransaction[];
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
  suppliers = [],
  employees = [],
  onAddSupplier,
  onAddEmployee,
  onSave,
  onDelete,
  editingTransaction,
  onUpdateRecurring,
  onSaveAndContinue,
  onRefreshCategories,
  allTransactions = []
}: TransactionSheetProps) {
  const DRAFT_KEY = 'transaction-sheet-draft';

  const loadDraft = () => {
    try {
      const raw = sessionStorage.getItem(DRAFT_KEY);
      if (raw) return JSON.parse(raw);
    } catch {}
    return null;
  };

  const saveDraft = () => {
    if (!open || editingTransaction) return;
    const draft = {
      type, amount, description, categoryId, accountId, toAccountId,
      date: date.toISOString(), isPaid, isFixed, isRecurring,
      recurringInterval, recurringCount, notes, supplierId, employeeId,
      timestamp: Date.now(),
    };
    try { sessionStorage.setItem(DRAFT_KEY, JSON.stringify(draft)); } catch {}
  };

  const clearDraft = () => {
    try { sessionStorage.removeItem(DRAFT_KEY); } catch {}
  };

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
  const [recurringCount, setRecurringCount] = useState<string>('2');
  const [notes, setNotes] = useState('');
  const [supplierId, setSupplierId] = useState<string | null>(null);
  const [employeeId, setEmployeeId] = useState<string | null>(null);
  const [showCategoryPicker, setShowCategoryPicker] = useState(false);
  const [showCalendar, setShowCalendar] = useState(false);
  const [showRecurringConfig, setShowRecurringConfig] = useState(false);
  const [showRecurringEditDialog, setShowRecurringEditDialog] = useState(false);
  const [recurringEditMode, setRecurringEditMode] = useState<RecurringEditMode>('single');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [showAccountPicker, setShowAccountPicker] = useState(false);
  const [showToAccountPicker, setShowToAccountPicker] = useState(false);
  const [showSupplierPicker, setShowSupplierPicker] = useState(false);
  const [showEmployeePicker, setShowEmployeePicker] = useState(false);
  const descriptionInputRef = useRef<HTMLInputElement>(null);
  const draftRestoredRef = useRef(false);

  // Save draft whenever form fields change (only for new transactions)
  useEffect(() => {
    if (open && !editingTransaction && (amount || description)) {
      saveDraft();
    }
  }, [open, editingTransaction, type, amount, description, categoryId, accountId, toAccountId, date, isPaid, isFixed, isRecurring, recurringInterval, recurringCount, notes, supplierId, employeeId]);

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
        const [year, month, day] = editingTransaction.date.split('-').map(Number);
        setDate(new Date(year, month - 1, day));
        setIsPaid(editingTransaction.is_paid);
        setIsFixed(editingTransaction.is_fixed);
        setIsRecurring(editingTransaction.is_recurring);
        setRecurringInterval(editingTransaction.recurring_interval || 'monthly');
        setNotes(editingTransaction.notes || '');
        setSupplierId(editingTransaction.supplier_id || null);
        setEmployeeId(editingTransaction.employee_id || null);
        setRecurringEditMode('single');
        if (editingTransaction.total_installments) {
          setRecurringCount(String(editingTransaction.total_installments));
        } else {
          setRecurringCount('2');
        }
        setShowRecurringConfig(false);
        draftRestoredRef.current = false;
      } else {
        // New transaction — always start with a clean form
        // Draft restoration is disabled to avoid stale data between consecutive creates
        clearDraft();
        draftRestoredRef.current = false;
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
        setRecurringCount('2');
        setNotes('');
        setSupplierId(null);
        setEmployeeId(null);
        setShowRecurringConfig(false);
      }
    } else {
      // Sheet closed — reset draft flag so next open starts fresh
      draftRestoredRef.current = false;
    }
  }, [open, defaultType, accounts, editingTransaction]);

  // Auto-toggle isPaid based on date
  const handleDateChange = (newDate: Date) => {
    setDate(newDate);
    // If date is in the future, automatically set is_paid to false
    const today = startOfDay(new Date());
    const selectedDay = startOfDay(newDate);
    if (selectedDay > today) {
      setIsPaid(false);
    }
  };

  const handleSave = async () => {
    if (!amount || parseFloat(amount) <= 0) return;
    if (!description.trim()) return;
    
    // If editing a recurring transaction, show the edit mode dialog
    if (editingTransaction && editingTransaction.is_recurring && editingTransaction.installment_group_id) {
      setShowRecurringEditDialog(true);
      return;
    }

    setIsLoading(true);
    
    if (isRecurring && parseInt(recurringCount) > 1) {
      // Create recurring transactions
      const groupId = crypto.randomUUID();
      const count = parseInt(recurringCount);
      const today = startOfDay(new Date());
      
      for (let i = 0; i < count; i++) {
        let txDate = date;
        if (recurringInterval === 'weekly') {
          txDate = addWeeks(date, i);
        } else if (recurringInterval === 'biweekly') {
          txDate = addWeeks(date, i * 2);
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
        
        // Only the first transaction (if date is today or past) should be marked as paid
        const txIsPaid = (i === 0 && startOfDay(txDate) <= today) ? isPaid : false;
        
        await onSave({
          type,
          amount: parseFloat(amount),
          description: `${description.trim()} (${i + 1}/${count})`,
          category_id: categoryId,
          account_id: accountId,
          to_account_id: type === 'transfer' ? toAccountId : null,
          date: format(txDate, 'yyyy-MM-dd'),
          is_paid: txIsPaid,
          is_fixed: isFixed,
          is_recurring: true,
          recurring_interval: recurringInterval,
          notes: notes.trim() || undefined,
          supplier_id: supplierId || undefined,
          employee_id: employeeId || undefined,
          installment_number: i + 1,
          total_installments: count,
          installment_group_id: groupId
        });
      }

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
        notes: notes.trim() || undefined,
        supplier_id: supplierId || undefined,
        employee_id: employeeId || undefined,
      });
    }
    
    setIsLoading(false);
    clearDraft();
    onOpenChange(false);
  };

  const handleSaveAndContinue = async () => {
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
      notes: notes.trim() || undefined,
      supplier_id: supplierId || undefined,
      employee_id: employeeId || undefined,
    });
    
    setIsLoading(false);
    
    // Reset form for next entry
    clearDraft();
    setAmount('');
    setDescription('');
    setNotes('');
    setSupplierId(null);
    setEmployeeId(null);
    setIsRecurring(false);
    setShowRecurringConfig(false);
  };

  const handleRecurringEditConfirm = async () => {
    if (!editingTransaction) return;
    
    setShowRecurringEditDialog(false);
    setIsLoading(true);
    
    const updateData: Partial<TransactionFormData> = {
      type,
      amount: parseFloat(amount),
      description: description.trim(),
      category_id: categoryId,
      account_id: accountId,
      to_account_id: type === 'transfer' ? toAccountId : null,
      date: format(date, 'yyyy-MM-dd'),
      is_paid: isPaid,
      is_fixed: isFixed,
      notes: notes.trim() || undefined
    };
    
    if (onUpdateRecurring) {
      await onUpdateRecurring(editingTransaction.id, updateData, recurringEditMode);
    } else {
      // Fallback: just update single
      await onSave(updateData as TransactionFormData);
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

  const categoryIconName = selectedCategory?.icon || null;

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
        <SheetContent side="bottom" className="h-[90vh] rounded-t-2xl overflow-hidden flex flex-col">
          <SheetHeader className="pb-4">
            <SheetTitle>
              {editingTransaction ? 'Editar Transação' : 'Nova Transação'}
            </SheetTitle>
          </SheetHeader>

          <div className="flex-1 overflow-y-auto space-y-6 pb-4">
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

            {/* Description - first field for quick autocomplete */}
            <div className="space-y-2">
              <Label>Descrição</Label>
              <div className="relative">
                <Input
                  ref={descriptionInputRef}
                  value={description}
                  onChange={(e) => {
                    setDescription(e.target.value);
                    setShowSuggestions(e.target.value.length >= 2);
                  }}
                  onFocus={() => setShowSuggestions(description.length >= 2)}
                  onBlur={() => {
                    // Delay to allow click on suggestion
                    setTimeout(() => setShowSuggestions(false), 200);
                  }}
                  placeholder="Ex: Compra de carnes"
                  className="h-12"
                  autoComplete="off"
                />
                {showSuggestions && !editingTransaction && (
                  <TransactionSuggestions
                    searchTerm={description}
                    transactions={allTransactions}
                    categories={categories}
                    accounts={accounts}
                    onSelect={(suggestion) => {
                      setDescription(suggestion.description);
                      if (suggestion.category) {
                        setCategoryId(suggestion.category.id);
                      }
                      if (suggestion.account) {
                        setAccountId(suggestion.account.id);
                      }
                      setShowSuggestions(false);
                    }}
                  />
                )}
              </div>
            </div>

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
                  onClick={() => handleDateChange(new Date())}
                >
                  Hoje
                </Button>
                <Button
                  variant={isYesterday(date) ? "default" : "outline"}
                  size="sm"
                  onClick={() => handleDateChange(subDays(new Date(), 1))}
                >
                  Ontem
                </Button>
                <Popover open={showCalendar} onOpenChange={setShowCalendar}>
                  <PopoverTrigger asChild>
                    <Button variant="outline" size="sm">
                      <AppIcon name="Calendar" size={16} className="mr-1" />
                      {!isToday(date) && !isYesterday(date) ? getDateLabel() : 'Outros'}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="end">
                    <Calendar
                      mode="single"
                      selected={date}
                      onSelect={(d) => {
                        if (d) handleDateChange(d);
                        setShowCalendar(false);
                      }}
                      locale={ptBR}
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            {/* Visual Cards Grid - Conta, Categoria, Fornecedor, Funcionário */}
            <div className="grid grid-cols-2 gap-3">
              {/* Card Conta */}
              <button
                type="button"
                onClick={() => setShowAccountPicker(true)}
                className={cn(
                  "flex flex-col items-center justify-center gap-1.5 p-4 rounded-2xl min-h-[80px] transition-all duration-200",
                  accountId
                    ? "bg-primary/5 ring-1 ring-primary/20"
                    : "bg-secondary/50"
                )}
              >
                <AppIcon
                  name="account_balance_wallet"
                  size={22}
                  className={accountId ? "text-primary" : "text-muted-foreground"}
                />
                <span className={cn(
                  "text-sm font-medium truncate max-w-full",
                  accountId ? "text-foreground" : "text-muted-foreground"
                )}>
                  {availableAccounts.find(a => a.id === accountId)?.name || (type === 'credit_card' ? 'Cartão' : 'Conta')}
                </span>
              </button>

              {/* Card Categoria (non-transfer) or Conta Destino (transfer) */}
              {type === 'transfer' ? (
                <button
                  type="button"
                  onClick={() => setShowToAccountPicker(true)}
                  className={cn(
                    "flex flex-col items-center justify-center gap-1.5 p-4 rounded-2xl min-h-[80px] transition-all duration-200",
                    toAccountId
                      ? "bg-primary/5 ring-1 ring-primary/20"
                      : "bg-secondary/50"
                  )}
                >
                  <AppIcon
                    name="arrow_forward"
                    size={22}
                    className={toAccountId ? "text-primary" : "text-muted-foreground"}
                  />
                  <span className={cn(
                    "text-sm font-medium truncate max-w-full",
                    toAccountId ? "text-foreground" : "text-muted-foreground"
                  )}>
                    {accounts.find(a => a.id === toAccountId)?.name || 'Destino'}
                  </span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setShowCategoryPicker(true)}
                  className={cn(
                    "flex flex-col items-center justify-center gap-1.5 p-4 rounded-2xl min-h-[80px] transition-all duration-200",
                    categoryId
                      ? "bg-primary/5 ring-1 ring-primary/20"
                      : "bg-secondary/50"
                  )}
                >
                  <AppIcon
                    name={categoryIconName || 'category'}
                    size={22}
                    style={selectedCategory?.color ? { color: selectedCategory.color } : undefined}
                    className={!selectedCategory?.color ? "text-muted-foreground" : undefined}
                  />
                  <span className={cn(
                    "text-sm font-medium truncate max-w-full",
                    categoryId ? "text-foreground" : "text-muted-foreground"
                  )}>
                    {selectedCategory?.name || 'Categoria'}
                  </span>
                </button>
              )}

              {/* Card Fornecedor */}
              {(type === 'expense' || type === 'credit_card') && (
                <button
                  type="button"
                  onClick={() => setShowSupplierPicker(true)}
                  className={cn(
                    "flex flex-col items-center justify-center gap-1.5 p-4 rounded-2xl min-h-[80px] transition-all duration-200",
                    supplierId
                      ? "bg-primary/5 ring-1 ring-primary/20"
                      : "bg-secondary/50"
                  )}
                >
                  <AppIcon
                    name="local_shipping"
                    size={22}
                    className={supplierId ? "text-primary" : "text-muted-foreground"}
                  />
                  <span className={cn(
                    "text-sm font-medium truncate max-w-full",
                    supplierId ? "text-foreground" : "text-muted-foreground"
                  )}>
                    {suppliers.find(s => s.id === supplierId)?.name || 'Fornecedor'}
                  </span>
                </button>
              )}

              {/* Card Funcionário */}
              {(type === 'expense' || type === 'credit_card') && (
                <button
                  type="button"
                  onClick={() => setShowEmployeePicker(true)}
                  className={cn(
                    "flex flex-col items-center justify-center gap-1.5 p-4 rounded-2xl min-h-[80px] transition-all duration-200",
                    employeeId
                      ? "bg-primary/5 ring-1 ring-primary/20"
                      : "bg-secondary/50"
                  )}
                >
                  <AppIcon
                    name="person"
                    size={22}
                    className={employeeId ? "text-primary" : "text-muted-foreground"}
                  />
                  <span className={cn(
                    "text-sm font-medium truncate max-w-full",
                    employeeId ? "text-foreground" : "text-muted-foreground"
                  )}>
                    {employees.find(e => e.id === employeeId)?.full_name || 'Funcionário'}
                  </span>
                </button>
              )}
            </div>


            {/* Advanced options */}
              <div className="space-y-4 pt-4 border-t">
                {/* Recurring options */}
                <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                       <AppIcon name="Repeat" size={16} className="text-muted-foreground" />
                        <Label>Repetir</Label>
                      </div>
                      <Switch checked={isRecurring} onCheckedChange={(checked) => {
                        setIsRecurring(checked);
                        if (checked) setShowRecurringConfig(true);
                        else setShowRecurringConfig(false);
                      }} />
                    </div>
                  
                  {isRecurring && showRecurringConfig && (
                    <div className="bg-card border rounded-xl p-4 space-y-4">
                      <h4 className="text-sm font-medium">Como sua transação se repete?</h4>
                      
                      {/* Quantity selector with increment/decrement */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                         <AppIcon name="Repeat" size={16} className="text-muted-foreground" />
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
                            <AppIcon name="ChevronDown" size={16} />
                          </Button>
                          <span className="text-lg font-semibold w-8 text-center">{recurringCount}</span>
                          <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => setRecurringCount(String(Math.min(60, parseInt(recurringCount) + 1)))}
                          >
                            <AppIcon name="ChevronUp" size={16} />
                          </Button>
                        </div>
                      </div>

                      {/* Period selector */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                         <AppIcon name="Repeat" size={16} className="text-muted-foreground" />
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

          </div>

          {/* Sticky bottom actions */}
          <div className="shrink-0 sticky bottom-0 border-t border-border/50 pt-3 pb-[calc(env(safe-area-inset-bottom)+0.5rem)] bg-background z-20">
            {/* Save and Continue - only for new transactions */}
            {!editingTransaction && (
              <Button
                variant="ghost"
                onClick={handleSaveAndContinue}
                disabled={isLoading || !amount || parseFloat(amount) <= 0 || !description.trim()}
                className="text-primary w-full mb-2"
              >
                Salvar e continuar
              </Button>
            )}
            
            <div className="flex gap-3">
              {editingTransaction && onDelete && (
                <Button 
                  variant="destructive" 
                  onClick={handleDelete}
                  disabled={isLoading}
                  className="w-14"
                >
                  <AppIcon name="Trash2" size={20} />
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
        onRefreshCategories={onRefreshCategories}
      />

      <ListPicker
        open={showAccountPicker}
        onOpenChange={setShowAccountPicker}
        title={type === 'credit_card' ? 'Selecionar cartão' : 'Selecionar conta'}
        items={availableAccounts.map(a => ({ id: a.id, label: a.name }))}
        selectedId={accountId}
        onSelect={setAccountId}
      />

      <ListPicker
        open={showToAccountPicker}
        onOpenChange={setShowToAccountPicker}
        title="Conta de destino"
        items={accounts.filter(a => a.id !== accountId && a.type !== 'credit_card').map(a => ({ id: a.id, label: a.name }))}
        selectedId={toAccountId}
        onSelect={setToAccountId}
      />

      <ListPicker
        open={showSupplierPicker}
        onOpenChange={setShowSupplierPicker}
        title="Selecionar fornecedor"
        items={suppliers.map(s => ({ id: s.id, label: s.name }))}
        selectedId={supplierId}
        onSelect={setSupplierId}
        allowNone
        noneLabel="Nenhum"
        onCreateNew={onAddSupplier ? async (name) => {
          const result = await onAddSupplier(name);
          return result?.id || null;
        } : undefined}
        createPlaceholder="Nome do fornecedor..."
      />

      <ListPicker
        open={showEmployeePicker}
        onOpenChange={setShowEmployeePicker}
        title="Selecionar funcionário"
        items={employees.map(e => ({ id: e.id, label: e.full_name }))}
        selectedId={employeeId}
        onSelect={setEmployeeId}
        allowNone
        noneLabel="Nenhum"
        onCreateNew={onAddEmployee ? async (name) => {
          await onAddEmployee(name);
          return null; // employee doesn't return ID, picker will close
        } : undefined}
        createPlaceholder="Nome do funcionário..."
      />
      
      {/* Recurring Edit Mode Dialog */}
      <Dialog open={showRecurringEditDialog} onOpenChange={setShowRecurringEditDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-center">
              Atenção! Esta é uma transação repetida<br />
              Você deseja:
            </DialogTitle>
          </DialogHeader>
          
          <RadioGroup 
            value={recurringEditMode} 
            onValueChange={(v) => setRecurringEditMode(v as RecurringEditMode)}
            className="space-y-3 py-4"
          >
            <div className="flex items-center space-x-3">
              <RadioGroupItem value="single" id="edit-single" />
              <Label htmlFor="edit-single" className="font-normal cursor-pointer">
                Editar somente esta
              </Label>
            </div>
            <div className="flex items-center space-x-3">
              <RadioGroupItem value="pending" id="edit-pending" />
              <Label htmlFor="edit-pending" className="font-normal cursor-pointer">
                Editar todas as pendentes
              </Label>
            </div>
            <div className="flex items-center space-x-3">
              <RadioGroupItem value="all" id="edit-all" />
              <Label htmlFor="edit-all" className="font-normal cursor-pointer">
                Editar todas (incluindo efetivadas)
              </Label>
            </div>
          </RadioGroup>
          
          <DialogFooter>
            <Button 
              onClick={handleRecurringEditConfirm}
              className="w-full"
              disabled={isLoading}
            >
              {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Confirmar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
