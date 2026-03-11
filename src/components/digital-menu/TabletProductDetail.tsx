import { useState, useEffect } from 'react';
import { AppIcon } from '@/components/ui/app-icon';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { DMProduct, DMOptionGroup, CartItem } from '@/hooks/useDigitalMenu';
import { formatCurrency as formatPrice } from '@/lib/format';
import { cn } from '@/lib/utils';

interface Props {
  product: DMProduct | null;
  optionGroups: DMOptionGroup[];
  open: boolean;
  onClose: () => void;
  onAddToCart: (item: CartItem) => void;
}

export function TabletProductDetail({ product, optionGroups, open, onClose, onAddToCart }: Props) {
  const [quantity, setQuantity] = useState(1);
  const [notes, setNotes] = useState('');
  const [selectedOptions, setSelectedOptions] = useState<Record<string, string[]>>({});
  const [showNotes, setShowNotes] = useState(false);
  const [activeGroupIdx, setActiveGroupIdx] = useState(0);

  useEffect(() => {
    if (open) {
      setQuantity(1);
      setNotes('');
      setSelectedOptions({});
      setShowNotes(false);
      setActiveGroupIdx(0);
    }
  }, [open, product?.id]);

  if (!product || !open) return null;

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

  const selectedOptionsList = Object.entries(selectedOptions).flatMap(([groupId, optionIds]) => {
    const group = optionGroups.find(og => og.id === groupId);
    return optionIds.map(optId => {
      const opt = group?.options.find(o => o.id === optId);
      return opt ? { groupId, optionId: opt.id, name: opt.name, price: opt.price } : null;
    }).filter(Boolean) as CartItem['selectedOptions'];
  });

  const optionsTotal = selectedOptionsList.reduce((s, o) => s + o.price, 0);
  const itemTotal = (product.price + optionsTotal) * quantity;

  const handleAdd = () => {
    onAddToCart({ product, quantity, notes, selectedOptions: selectedOptionsList });
    onClose();
  };

  const isValid = optionGroups.every(og => {
    const selected = (selectedOptions[og.id] || []).length;
    return selected >= og.min_selections;
  });

  const hasOptionGroups = optionGroups.length > 0;
  const activeGroup = hasOptionGroups ? optionGroups[activeGroupIdx] : null;

  const canSkipGroup = (og: DMOptionGroup) => og.min_selections === 0;

  const handleNextGroup = () => {
    if (activeGroupIdx < optionGroups.length - 1) {
      setActiveGroupIdx(activeGroupIdx + 1);
    }
  };

  const handlePrevGroup = () => {
    if (activeGroupIdx > 0) {
      setActiveGroupIdx(activeGroupIdx - 1);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-card rounded-3xl shadow-2xl w-[92vw] max-w-[1100px] h-[80vh] max-h-[700px] flex overflow-hidden border border-border/20 animate-in zoom-in-95 duration-300">

        {/* ─── Left Panel: Product Info ─── */}
        <div className="w-[38%] flex flex-col bg-secondary/20 relative">
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 left-4 z-10 w-10 h-10 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center shadow-lg hover:scale-105 active:scale-95 transition-transform"
          >
            <AppIcon name="X" size={20} />
          </button>

          {/* Product image */}
          <div className="flex-1 flex items-center justify-center p-8 pt-16">
            {product.image_url ? (
              <div className="w-full max-w-[280px] aspect-square rounded-2xl overflow-hidden shadow-xl border border-border/10">
                <img src={product.image_url} alt={product.name} className="w-full h-full object-cover" />
              </div>
            ) : (
              <div className="w-full max-w-[280px] aspect-square rounded-2xl bg-secondary/60 flex items-center justify-center">
                <AppIcon name="UtensilsCrossed" size={64} className="text-muted-foreground/20" />
              </div>
            )}
          </div>

          {/* Product info */}
          <div className="px-6 pb-6 space-y-2">
            <h2 className="text-xl font-bold text-foreground leading-tight">{product.name}</h2>
            {product.description && (
              <p className="text-sm text-muted-foreground leading-relaxed line-clamp-3">{product.description}</p>
            )}

            {/* Option groups navigation dots */}
            {hasOptionGroups && (
              <div className="flex items-center gap-3 pt-3">
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Opcionais</span>
                <div className="flex items-center gap-1.5">
                  {optionGroups.map((og, idx) => {
                    const selectedCount = (selectedOptions[og.id] || []).length;
                    const isComplete = selectedCount >= og.min_selections && selectedCount > 0;
                    const isCurrent = idx === activeGroupIdx;
                    return (
                      <button
                        key={og.id}
                        onClick={() => setActiveGroupIdx(idx)}
                        className={cn(
                          'w-2.5 h-2.5 rounded-full transition-all',
                          isCurrent
                            ? 'bg-primary scale-125'
                            : isComplete
                              ? 'bg-primary/50'
                              : 'bg-muted-foreground/20'
                        )}
                      />
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Bottom bar: Quantity + Subtotal */}
          <div className="px-6 py-4 border-t border-border/15 bg-card/60 backdrop-blur-sm">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-muted-foreground">Subtotal</span>
              <span className="text-xl font-bold text-primary">{formatPrice(itemTotal)}</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center bg-secondary rounded-xl">
                <button
                  onClick={() => setQuantity(q => Math.max(1, q - 1))}
                  className="w-10 h-10 flex items-center justify-center text-foreground active:scale-90 transition-transform"
                >
                  <AppIcon name="Minus" size={16} />
                </button>
                <span className="w-7 text-center font-bold text-foreground">{quantity}</span>
                <button
                  onClick={() => setQuantity(q => q + 1)}
                  className="w-10 h-10 flex items-center justify-center text-foreground active:scale-90 transition-transform"
                >
                  <AppIcon name="Plus" size={16} />
                </button>
              </div>
              <Button
                className="flex-1 h-11 text-sm font-bold rounded-xl"
                onClick={handleAdd}
                disabled={!isValid}
              >
                Adicionar ao pedido
              </Button>
            </div>
          </div>
        </div>

        {/* ─── Right Panel: Options ─── */}
        <div className="flex-1 flex flex-col">
          {hasOptionGroups && activeGroup ? (
            <>
              {/* Group header */}
              <div className="px-8 pt-6 pb-4 border-b border-border/15 shrink-0">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-foreground">{activeGroup.title}</h3>
                    <p className="text-xs text-muted-foreground mt-1">
                      {activeGroup.max_selections === 1
                        ? 'Escolha 1 opção'
                        : `Até ${activeGroup.max_selections} opções`}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {activeGroup.min_selections > 0 && (
                      <span className="px-2.5 py-1 rounded-lg bg-destructive/10 text-destructive text-[10px] font-bold">
                        Obrigatório
                      </span>
                    )}
                    <span className="text-sm font-semibold text-muted-foreground">
                      {(selectedOptions[activeGroup.id] || []).length}/{activeGroup.max_selections}
                    </span>
                  </div>
                </div>
              </div>

              {/* Options list */}
              <div className="flex-1 overflow-y-auto px-8 py-4">
                <div className="space-y-2">
                  {activeGroup.options.map(opt => {
                    const isChecked = (selectedOptions[activeGroup.id] || []).includes(opt.id);
                    const isRadio = activeGroup.max_selections === 1;
                    return (
                      <button
                        key={opt.id}
                        onClick={() => toggleOption(activeGroup.id, opt.id, activeGroup.max_selections)}
                        className={cn(
                          'w-full flex items-center gap-4 p-4 rounded-2xl transition-all active:scale-[0.99]',
                          isChecked
                            ? 'bg-primary/8 border-2 border-primary/30'
                            : 'bg-secondary/30 border-2 border-transparent hover:bg-secondary/50'
                        )}
                      >
                        {/* Checkbox / Radio */}
                        <div
                          className={cn(
                            'w-6 h-6 flex items-center justify-center shrink-0 transition-colors',
                            isRadio ? 'rounded-full border-2' : 'rounded-lg border-2',
                            isChecked
                              ? 'bg-primary border-primary text-primary-foreground'
                              : 'border-muted-foreground/30'
                          )}
                        >
                          {isChecked && <AppIcon name="Check" size={14} />}
                        </div>

                        {/* Option image */}
                        {opt.image_url && (
                          <img src={opt.image_url} alt={opt.name} className="w-12 h-12 rounded-xl object-cover shrink-0" />
                        )}

                        {/* Option name */}
                        <span className="flex-1 text-sm font-semibold text-foreground text-left">{opt.name}</span>

                        {/* Price */}
                        {opt.price > 0 && (
                          <span className="text-sm font-semibold text-muted-foreground shrink-0">
                            + {formatPrice(opt.price)}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Navigation footer */}
              <div className="px-8 py-4 border-t border-border/15 shrink-0 flex items-center gap-3">
                {activeGroupIdx > 0 && (
                  <Button variant="outline" onClick={handlePrevGroup} className="h-11 rounded-xl px-5">
                    <AppIcon name="ChevronLeft" size={16} className="mr-1" />
                    Anterior
                  </Button>
                )}
                <div className="flex-1" />
                {activeGroupIdx < optionGroups.length - 1 ? (
                  <Button
                    onClick={handleNextGroup}
                    variant={canSkipGroup(activeGroup) ? 'secondary' : 'default'}
                    className="h-11 rounded-xl px-6"
                  >
                    {canSkipGroup(activeGroup) && (selectedOptions[activeGroup.id] || []).length === 0
                      ? 'Pular'
                      : 'Próximo'}
                    <AppIcon name="ChevronRight" size={16} className="ml-1" />
                  </Button>
                ) : null}
              </div>
            </>
          ) : (
            /* No option groups: Notes area */
            <div className="flex-1 flex flex-col items-center justify-center px-8 gap-6">
              <div className="text-center space-y-2">
                <AppIcon name="ChefHat" size={48} className="text-muted-foreground/20 mx-auto" />
                <p className="text-sm text-muted-foreground">
                  Sem opcionais para este item
                </p>
              </div>

              <div className="w-full max-w-sm space-y-3">
                <button
                  onClick={() => setShowNotes(!showNotes)}
                  className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mx-auto"
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
                    rows={3}
                    className="resize-none text-sm"
                    autoFocus={false}
                  />
                )}
              </div>
            </div>
          )}

          {/* Notes toggle inside option groups - after last group */}
          {hasOptionGroups && activeGroupIdx === optionGroups.length - 1 && (
            <div className="px-8 pb-4">
              <button
                onClick={() => setShowNotes(!showNotes)}
                className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                <AppIcon name="MessageSquare" size={14} />
                {showNotes ? 'Ocultar observações' : 'Alguma observação?'}
              </button>
              {showNotes && (
                <Textarea
                  placeholder="Ex: sem cebola, bem passado..."
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  rows={2}
                  className="resize-none text-sm mt-2"
                  autoFocus={false}
                />
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
