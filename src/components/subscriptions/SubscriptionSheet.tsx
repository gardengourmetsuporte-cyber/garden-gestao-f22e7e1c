import { useState, useEffect, useRef } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Subscription, SubscriptionInsert, SUBSCRIPTION_CATEGORIES } from '@/hooks/useSubscriptions';
import { searchServices, KnownService } from '@/lib/knownServices';
import { ExternalLink, Link2 } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useUnit } from '@/contexts/UnitContext';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editItem?: Subscription | null;
  prefillData?: Partial<Subscription> | null;
  onSave: (data: SubscriptionInsert) => Promise<void>;
  onUpdate?: (data: Partial<Subscription> & { id: string }) => Promise<void>;
  isSaving: boolean;
}

export function SubscriptionSheet({ open, onOpenChange, editItem, prefillData, onSave, onUpdate, isSaving }: Props) {
  const { activeUnitId } = useUnit();
  const [name, setName] = useState('');
  const [category, setCategory] = useState('outros');
  const [type, setType] = useState<'assinatura' | 'conta_fixa'>('assinatura');
  const [price, setPrice] = useState('');
  const [billingCycle, setBillingCycle] = useState<'mensal' | 'anual' | 'semanal'>('mensal');
  const [nextDate, setNextDate] = useState('');
  const [managementUrl, setManagementUrl] = useState('');
  const [notes, setNotes] = useState('');
  const [linkFinance, setLinkFinance] = useState(false);
  const [financeCategoryId, setFinanceCategoryId] = useState<string>('');

  const [suggestions, setSuggestions] = useState<KnownService[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const suggestionsRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Fetch finance categories (expense type only)
  const { data: financeCategories = [] } = useQuery({
    queryKey: ['finance-categories-expense', activeUnitId],
    queryFn: async () => {
      if (!activeUnitId) return [];
      const { data, error } = await supabase
        .from('finance_categories')
        .select('id, name, icon, color, parent_id')
        .eq('unit_id', activeUnitId)
        .eq('type', 'expense')
        .order('sort_order');
      if (error) throw error;
      return data || [];
    },
    enabled: !!activeUnitId && linkFinance,
  });

  // Group categories: parent > children
  const groupedCategories = financeCategories.reduce((acc, cat) => {
    if (!cat.parent_id) {
      acc.push({ ...cat, children: financeCategories.filter(c => c.parent_id === cat.id) });
    }
    return acc;
  }, [] as Array<typeof financeCategories[0] & { children: typeof financeCategories }>);

  useEffect(() => {
    if (editItem) {
      setName(editItem.name);
      setCategory(editItem.category);
      setType(editItem.type);
      setPrice(String(editItem.price));
      setBillingCycle(editItem.billing_cycle);
      setNextDate(editItem.next_payment_date || '');
      setManagementUrl(editItem.management_url || '');
      setNotes(editItem.notes || '');
      const fcId = (editItem as any).finance_category_id;
      setLinkFinance(!!fcId);
      setFinanceCategoryId(fcId || '');
    } else if (prefillData) {
      setName(prefillData.name || '');
      setCategory(prefillData.category || 'outros');
      setType(prefillData.type || 'assinatura');
      setPrice(prefillData.price ? String(prefillData.price) : '');
      setBillingCycle(prefillData.billing_cycle || 'mensal');
      setNextDate(prefillData.next_payment_date || '');
      setManagementUrl(prefillData.management_url || '');
      setNotes(prefillData.notes || '');
      setLinkFinance(false); setFinanceCategoryId('');
    } else {
      setName(''); setCategory('outros'); setType('assinatura');
      setPrice(''); setBillingCycle('mensal'); setNextDate('');
      setManagementUrl(''); setNotes('');
      setLinkFinance(false); setFinanceCategoryId('');
    }
    setSuggestions([]);
    setShowSuggestions(false);
  }, [editItem, prefillData, open]);

  useEffect(() => {
    if (!editItem) {
      const results = searchServices(name);
      setSuggestions(results);
      setShowSuggestions(results.length > 0);
    }
  }, [name, editItem]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (suggestionsRef.current && !suggestionsRef.current.contains(e.target as Node) &&
          inputRef.current && !inputRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selectService = (service: KnownService) => {
    setName(service.name);
    setCategory(service.category);
    setType(service.type);
    setBillingCycle(service.defaultCycle);
    setManagementUrl(service.managementUrl);
    setShowSuggestions(false);
  };

  const getCategoryLabel = (value: string) => {
    return SUBSCRIPTION_CATEGORIES.find(c => c.value === value)?.label || value;
  };

  const handleSubmit = async () => {
    if (!name.trim() || !price) return;
    const data: any = {
      name: name.trim(),
      category,
      type,
      price: parseFloat(price),
      billing_cycle: billingCycle,
      next_payment_date: nextDate || null,
      status: editItem?.status || 'ativo',
      management_url: managementUrl.trim() || null,
      notes: notes.trim() || null,
      icon: null,
      color: null,
      finance_category_id: linkFinance && financeCategoryId ? financeCategoryId : null,
    };

    if (editItem && onUpdate) {
      await onUpdate({ id: editItem.id, ...data });
    } else {
      await onSave(data);
    }
    onOpenChange(false);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="max-h-[90vh] overflow-y-auto rounded-t-2xl">
        <SheetHeader>
          <SheetTitle>{editItem ? 'Editar' : 'Nova assinatura / conta'}</SheetTitle>
        </SheetHeader>
        <div className="space-y-4 mt-4 pb-6">
          {/* Nome com autocomplete */}
          <div className="relative">
            <Label>Nome *</Label>
            <Input
              ref={inputRef}
              value={name}
              onChange={(e) => setName(e.target.value)}
              onFocus={() => { if (suggestions.length > 0 && !editItem) setShowSuggestions(true); }}
              placeholder="Digite o nome do serviço..."
              autoComplete="off"
            />
            {showSuggestions && suggestions.length > 0 && (
              <div
                ref={suggestionsRef}
                className="absolute z-50 left-0 right-0 top-full mt-1 rounded-xl border border-border bg-popover shadow-lg overflow-hidden"
              >
                {suggestions.map((s) => (
                  <button
                    key={s.name}
                    type="button"
                    className="flex w-full items-center justify-between gap-2 px-4 py-3 text-left text-sm transition-colors hover:bg-accent/50 focus:bg-accent/50"
                    onClick={() => selectService(s)}
                  >
                    <span className="font-medium text-foreground truncate">{s.name}</span>
                    <Badge variant="secondary" className="text-[10px] shrink-0">
                      {getCategoryLabel(s.category)}
                    </Badge>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Tipo</Label>
              <Select value={type} onValueChange={(v) => setType(v as any)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="assinatura">Assinatura</SelectItem>
                  <SelectItem value="conta_fixa">Conta fixa</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Categoria</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {SUBSCRIPTION_CATEGORIES.map(c => (
                    <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Valor (R$) *</Label>
              <Input type="number" step="0.01" value={price} onChange={(e) => setPrice(e.target.value)} placeholder="0,00" />
            </div>
            <div>
              <Label>Frequência</Label>
              <Select value={billingCycle} onValueChange={(v) => setBillingCycle(v as any)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="semanal">Semanal</SelectItem>
                  <SelectItem value="mensal">Mensal</SelectItem>
                  <SelectItem value="anual">Anual</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label>Próximo vencimento</Label>
            <Input type="date" value={nextDate} onChange={(e) => setNextDate(e.target.value)} />
          </div>

          {/* Vincular ao financeiro */}
          <div className="rounded-2xl bg-secondary/40 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Link2 className="w-4 h-4 text-primary" />
                <div>
                  <p className="text-sm font-medium text-foreground">Vincular ao Financeiro</p>
                  <p className="text-[10px] text-muted-foreground">Lançar automaticamente no módulo financeiro</p>
                </div>
              </div>
              <Switch checked={linkFinance} onCheckedChange={setLinkFinance} />
            </div>

            {linkFinance && (
              <div>
                <Label className="text-xs">Categoria financeira</Label>
                <Select value={financeCategoryId} onValueChange={setFinanceCategoryId}>
                  <SelectTrigger><SelectValue placeholder="Selecione uma categoria..." /></SelectTrigger>
                  <SelectContent>
                    {groupedCategories.map(parent => (
                      <div key={parent.id}>
                        <SelectItem value={parent.id} className="font-semibold">
                          {parent.name}
                        </SelectItem>
                        {parent.children.map(child => (
                          <SelectItem key={child.id} value={child.id} className="pl-6">
                            {child.name}
                          </SelectItem>
                        ))}
                      </div>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          <div>
            <Label className="flex items-center gap-1.5">
              Link de gerenciamento
              {managementUrl && (
                <a href={managementUrl} target="_blank" rel="noopener noreferrer" className="text-primary hover:text-primary/80">
                  <ExternalLink className="h-3.5 w-3.5" />
                </a>
              )}
            </Label>
            <Input value={managementUrl} onChange={(e) => setManagementUrl(e.target.value)} placeholder="Preenchido automaticamente ao selecionar um serviço" />
          </div>

          <div>
            <Label>Observações</Label>
            <Input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Anotações..." />
          </div>

          <Button className="w-full" onClick={handleSubmit} disabled={isSaving || !name.trim() || !price}>
            {isSaving ? 'Salvando...' : editItem ? 'Salvar alterações' : 'Adicionar'}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
