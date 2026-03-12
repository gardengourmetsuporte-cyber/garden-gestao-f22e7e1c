import { useState, useEffect, useCallback } from 'react';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { AppIcon } from '@/components/ui/app-icon';
import { cn } from '@/lib/utils';
import { formatCurrency } from '@/lib/format';
import { supabase } from '@/integrations/supabase/client';
import type { POSProduct, CartItemOption } from '@/hooks/pos/types';

interface OptionGroup {
  id: string;
  title: string;
  min_selections: number;
  max_selections: number;
  options: { id: string; name: string; price: number; image_url: string | null; sort_order: number }[];
}

interface Props {
  product: POSProduct | null;
  open: boolean;
  onClose: () => void;
  onAdd: (product: POSProduct, quantity: number, notes: string, options: CartItemOption[]) => void;
}

export function PDVProductDetailSheet({ product, open, onClose, onAdd }: Props) {
  const [quantity, setQuantity] = useState(1);
  const [notes, setNotes] = useState('');
  const [showNotes, setShowNotes] = useState(false);
  const [selectedOptions, setSelectedOptions] = useState<Record<string, string[]>>({});
  const [optionGroups, setOptionGroups] = useState<OptionGroup[]>([]);
  const [loadingOptions, setLoadingOptions] = useState(false);

  // Reset state on open
  useEffect(() => {
    if (open && product) {
      setQuantity(1);
      setNotes('');
      setShowNotes(false);
      setSelectedOptions({});
      setOptionGroups([]);
      loadOptionGroups(product.id);
    }
  }, [open, product?.id]);

  const loadOptionGroups = useCallback(async (productId: string) => {
    setLoadingOptions(true);
    try {
      // Get linked option group IDs
      const { data: links } = await supabase
        .from('menu_product_option_groups')
        .select('option_group_id')
        .eq('product_id', productId);

      if (!links || links.length === 0) {
        setLoadingOptions(false);
        return;
      }

      const ogIds = links.map(l => l.option_group_id);

      // Fetch option groups and options in parallel
      const [ogRes, optRes] = await Promise.all([
        supabase
          .from('menu_option_groups')
          .select('id, title, min_selections, max_selections')
          .in('id', ogIds)
          .eq('is_active', true)
          .order('sort_order'),
        supabase
          .from('menu_options')
          .select('id, option_group_id, name, price, image_url, sort_order')
          .in('option_group_id', ogIds)
          .eq('is_active', true)
          .order('sort_order'),
      ]);

      const groups = (ogRes.data || []).map(og => ({
        ...og,
        options: (optRes.data || []).filter(o => o.option_group_id === og.id),
      }));

      setOptionGroups(groups);
    } catch (err) {
      console.error('Error loading option groups:', err);
    }
    setLoadingOptions(false);
  }, []);

  if (!product) return null;

  const toggleOption = (groupId: string, optionId: string, maxSelections: number) => {
    setSelectedOptions(prev => {
      const current = prev[groupId] || [];
      if (maxSelections === 1) {
        return { ...prev, [groupId]: current.includes(optionId) ? [] : [optionId] };
      }
      if (current.includes(optionId)) {
        return { ...prev, [groupId]: current.filter(id => id !== optionId) };
      }
      if (current.length >= maxSelections) {
        return { ...prev, [groupId]: [...current.slice(1), optionId] };
      }
      return { ...prev, [groupId]: [...current, optionId] };
    });
  };

  const selectedOptionsList: CartItemOption[] = Object.entries(selectedOptions).flatMap(([groupId, optionIds]) => {
    const group = optionGroups.find(og => og.id === groupId);
    return optionIds
      .map(optId => {
        const opt = group?.options.find(o => o.id === optId);
        return opt ? { groupId, optionId: opt.id, name: opt.name, price: opt.price } : null;
      })
      .filter(Boolean) as CartItemOption[];
  });

  const optionsTotal = selectedOptionsList.reduce((s, o) => s + o.price, 0);
  const itemTotal = (product.price + optionsTotal) * quantity;

  const isValid = optionGroups.every(og => {
    const selected = (selectedOptions[og.id] || []).length;
    return selected >= og.min_selections;
  });

  const handleAdd = () => {
    onAdd(product, quantity, notes, selectedOptionsList);
    onClose();
  };

  return (
    <Sheet open={open} onOpenChange={v => !v && onClose()}>
      <SheetContent side="bottom" className="rounded-t-3xl max-h-[85dvh] overflow-hidden p-0 flex flex-col">
        {/* Header with image */}
        {product.image_url ? (
          <div className="w-full h-48 relative overflow-hidden shrink-0">
            <img src={product.image_url} alt={product.name} className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-transparent to-transparent" />
            <button
              onClick={onClose}
              className="absolute top-3 right-3 w-8 h-8 rounded-full bg-background/60 backdrop-blur-xl flex items-center justify-center"
            >
              <AppIcon name="X" size={18} className="text-foreground" />
            </button>
          </div>
        ) : (
          <div className="w-full h-4 shrink-0" />
        )}

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto px-4 pb-4">
          <div className="space-y-4 pt-3">
            {/* Title + Price */}
            <div>
              <h2 className="text-lg font-bold text-foreground leading-tight">{product.name}</h2>
              {product.codigo_pdv && (
                <span className="text-xs text-muted-foreground">#{product.codigo_pdv}</span>
              )}
              <p className="text-lg font-bold text-primary mt-1">{formatCurrency(product.price)}</p>
            </div>

            {/* Option groups */}
            {loadingOptions && (
              <div className="py-4 text-center text-sm text-muted-foreground">Carregando opcionais...</div>
            )}
            {optionGroups.map(og => {
              const isRadio = og.max_selections === 1;
              const selectedCount = (selectedOptions[og.id] || []).length;
              return (
                <div key={og.id} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold text-sm text-foreground">{og.title}</h3>
                    <div className="flex items-center gap-1.5">
                      {og.min_selections > 0 && (
                        <span className="px-2 py-0.5 rounded-md bg-destructive/12 text-destructive text-[10px] font-bold">
                          Obrigatório
                        </span>
                      )}
                      <span className="text-[11px] text-muted-foreground">
                        {selectedCount}/{og.max_selections}
                      </span>
                    </div>
                  </div>
                  <div className="space-y-1">
                    {og.options.map(opt => {
                      const isChecked = (selectedOptions[og.id] || []).includes(opt.id);
                      return (
                        <button
                          key={opt.id}
                          onClick={() => toggleOption(og.id, opt.id, og.max_selections)}
                          className={cn(
                            'w-full flex items-center gap-3 p-3 rounded-xl transition-all active:scale-[0.98] text-left',
                            isChecked
                              ? 'bg-primary/8 border border-primary/30'
                              : 'bg-secondary/40 border border-transparent'
                          )}
                        >
                          <div
                            className={cn(
                              'w-5 h-5 flex items-center justify-center shrink-0 transition-colors',
                              isRadio ? 'rounded-full border-2' : 'rounded-md border-2',
                              isChecked
                                ? 'bg-primary border-primary text-primary-foreground'
                                : 'border-muted-foreground/30'
                            )}
                          >
                            {isChecked && <AppIcon name="Check" size={12} />}
                          </div>
                          <div className="flex-1 min-w-0 flex items-center gap-2">
                            {opt.image_url && (
                              <img src={opt.image_url} alt={opt.name} className="w-8 h-8 rounded-lg object-cover shrink-0" />
                            )}
                            <span className="text-sm text-foreground">{opt.name}</span>
                          </div>
                          {opt.price > 0 && (
                            <span className="text-xs text-muted-foreground shrink-0">+ {formatCurrency(opt.price)}</span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}

            {/* Notes toggle */}
            <button
              onClick={() => setShowNotes(!showNotes)}
              className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <AppIcon name="MessageSquare" size={16} />
              {showNotes ? 'Ocultar observações' : 'Adicionar observação'}
              <AppIcon name={showNotes ? 'ChevronUp' : 'ChevronDown'} size={14} />
            </button>
            {showNotes && (
              <Textarea
                placeholder="Ex: sem cebola, bem passado..."
                value={notes}
                onChange={e => setNotes(e.target.value)}
                rows={2}
                className="resize-none text-sm"
              />
            )}
          </div>
        </div>

        {/* Fixed bottom action bar */}
        <div className="shrink-0 px-4 py-3 border-t border-border/30 bg-card/90 backdrop-blur-xl">
          <div className="flex items-center gap-3">
            <div className="flex items-center bg-secondary rounded-xl">
              <button
                onClick={() => setQuantity(q => Math.max(1, q - 1))}
                className="w-11 h-11 flex items-center justify-center text-foreground active:scale-90 transition-transform"
              >
                <AppIcon name="Minus" size={18} />
              </button>
              <span className="w-8 text-center font-bold text-foreground text-lg">{quantity}</span>
              <button
                onClick={() => setQuantity(q => q + 1)}
                className="w-11 h-11 flex items-center justify-center text-foreground active:scale-90 transition-transform"
              >
                <AppIcon name="Plus" size={18} />
              </button>
            </div>
            <Button
              className="flex-1 h-12 text-base font-bold rounded-xl"
              onClick={handleAdd}
              disabled={!isValid}
            >
              Adicionar {formatCurrency(itemTotal)}
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
