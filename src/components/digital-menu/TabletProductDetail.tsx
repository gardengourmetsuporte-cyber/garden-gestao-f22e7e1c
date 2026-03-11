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

type Step = 'options' | 'quantity';

export function TabletProductDetail({ product, optionGroups, open, onClose, onAddToCart }: Props) {
  const [quantity, setQuantity] = useState(1);
  const [notes, setNotes] = useState('');
  const [selectedOptions, setSelectedOptions] = useState<Record<string, string[]>>({});
  const [showNotes, setShowNotes] = useState(false);
  const [activeGroupIdx, setActiveGroupIdx] = useState(0);
  const [step, setStep] = useState<Step>('options');

  useEffect(() => {
    if (open) {
      setQuantity(1);
      setNotes('');
      setSelectedOptions({});
      setShowNotes(false);
      setActiveGroupIdx(0);
      setStep(optionGroups.length > 0 ? 'options' : 'quantity');
    }
  }, [open, product?.id]);

  if (!product || !open) return null;

  const hasOptionGroups = optionGroups.length > 0;
  const activeGroup = hasOptionGroups ? optionGroups[activeGroupIdx] : null;
  const totalSteps = optionGroups.length + 1; // options steps + quantity step
  const currentStepNum = step === 'quantity' ? totalSteps : activeGroupIdx + 1;

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

  const canSkipGroup = (og: DMOptionGroup) => og.min_selections === 0;

  const handleNextGroup = () => {
    if (activeGroupIdx < optionGroups.length - 1) {
      setActiveGroupIdx(activeGroupIdx + 1);
    } else {
      setStep('quantity');
    }
  };

  const handlePrevGroup = () => {
    if (activeGroupIdx > 0) {
      setActiveGroupIdx(activeGroupIdx - 1);
    }
  };

  const handleBackFromQuantity = () => {
    if (hasOptionGroups) {
      setStep('options');
      setActiveGroupIdx(optionGroups.length - 1);
    }
  };

  // Left panel step summary items
  const stepItems = [
    ...optionGroups.map((og, idx) => {
      const count = (selectedOptions[og.id] || []).length;
      const isDone = count >= og.min_selections && (count > 0 || og.min_selections === 0);
      const isCurrent = step === 'options' && idx === activeGroupIdx;
      return { label: og.title, isDone: step === 'quantity' || (isDone && idx < activeGroupIdx), isCurrent, num: idx + 1 };
    }),
    { label: 'Quantidade e Opcionais', isDone: false, isCurrent: step === 'quantity', num: totalSteps },
  ];

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
          <div className="shrink-0 flex items-center justify-center px-6 pt-16 pb-4">
            {product.image_url ? (
              <div className="w-full max-w-[200px] aspect-square rounded-2xl overflow-hidden shadow-xl border border-border/10">
                <img src={product.image_url} alt={product.name} className="w-full h-full object-cover" />
              </div>
            ) : (
              <div className="w-full max-w-[200px] aspect-square rounded-2xl bg-secondary/60 flex items-center justify-center">
                <AppIcon name="UtensilsCrossed" size={56} className="text-muted-foreground/20" />
              </div>
            )}
          </div>

          {/* Product info */}
          <div className="px-6 pb-3 space-y-1">
            <h2 className="text-lg font-bold text-foreground leading-tight">{product.name}</h2>
            {product.description && (
              <p className="text-xs text-muted-foreground leading-relaxed line-clamp-3">{product.description}</p>
            )}
          </div>

          {/* Step indicators */}
          {totalSteps > 1 && (
            <div className="flex-1 overflow-y-auto px-5 py-2">
              <div className="space-y-1">
                {stepItems.map((si, idx) => (
                  <div
                    key={idx}
                    className={cn(
                      'flex items-center gap-2.5 px-3 py-2 rounded-xl transition-all text-left',
                      si.isCurrent && 'bg-primary/10'
                    )}
                  >
                    <div className={cn(
                      'w-6 h-6 rounded-full flex items-center justify-center shrink-0 text-[11px] font-bold transition-colors',
                      si.isDone
                        ? 'bg-primary text-primary-foreground'
                        : si.isCurrent
                          ? 'bg-primary/20 text-primary border border-primary/40'
                          : 'bg-muted-foreground/10 text-muted-foreground'
                    )}>
                      {si.isDone ? <AppIcon name="Check" size={12} /> : si.num}
                    </div>
                    <span className={cn(
                      'text-xs leading-tight',
                      si.isCurrent ? 'text-foreground font-semibold' : 'text-muted-foreground'
                    )}>
                      {si.label}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Subtotal */}
          <div className="px-6 py-4 border-t border-border/15 bg-card/60 backdrop-blur-sm shrink-0">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-muted-foreground">Subtotal</span>
              <span className="text-xl font-bold text-primary">{formatPrice(itemTotal)}</span>
            </div>
          </div>
        </div>

        {/* ─── Right Panel ─── */}
        <div className="flex-1 flex flex-col">
          {step === 'options' && activeGroup ? (
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
                        <div className={cn(
                          'w-6 h-6 flex items-center justify-center shrink-0 transition-colors',
                          isRadio ? 'rounded-full border-2' : 'rounded-lg border-2',
                          isChecked
                            ? 'bg-primary border-primary text-primary-foreground'
                            : 'border-muted-foreground/30'
                        )}>
                          {isChecked && <AppIcon name="Check" size={14} />}
                        </div>
                        {opt.image_url && (
                          <img src={opt.image_url} alt={opt.name} className="w-12 h-12 rounded-xl object-cover shrink-0" />
                        )}
                        <span className="flex-1 text-sm font-semibold text-foreground text-left">{opt.name}</span>
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
                <Button
                  onClick={handleNextGroup}
                  variant={canSkipGroup(activeGroup) && (selectedOptions[activeGroup.id] || []).length === 0 ? 'secondary' : 'default'}
                  className="h-11 rounded-xl px-6"
                >
                  {canSkipGroup(activeGroup) && (selectedOptions[activeGroup.id] || []).length === 0
                    ? 'Pular'
                    : 'Próximo'}
                  <AppIcon name="ChevronRight" size={16} className="ml-1" />
                </Button>
              </div>
            </>
          ) : (
            /* ─── Quantity Step ─── */
            <div className="flex-1 flex flex-col">
              <div className="flex-1 flex flex-col items-center justify-center px-8 gap-8">
                <div className="text-center space-y-1">
                  <h3 className="text-xl font-bold text-foreground">
                    Escolha a quantidade de
                  </h3>
                  <p className="text-lg text-muted-foreground font-medium">{product.name}</p>
                </div>

                {/* Large quantity selector */}
                <div className="flex items-center gap-5">
                  <button
                    onClick={() => setQuantity(q => Math.max(1, q - 1))}
                    disabled={quantity <= 1}
                    className={cn(
                      'w-14 h-14 rounded-full flex items-center justify-center transition-all active:scale-90',
                      quantity <= 1
                        ? 'bg-muted-foreground/10 text-muted-foreground/30'
                        : 'bg-secondary text-foreground hover:bg-secondary/80'
                    )}
                  >
                    <AppIcon name="Minus" size={22} />
                  </button>
                  <span className="text-5xl font-bold text-foreground w-20 text-center tabular-nums">{quantity}</span>
                  <button
                    onClick={() => setQuantity(q => q + 1)}
                    className="w-14 h-14 rounded-full bg-foreground text-background flex items-center justify-center transition-all active:scale-90 hover:opacity-90 shadow-lg"
                  >
                    <AppIcon name="Plus" size={22} />
                  </button>
                </div>

                {/* Notes */}
                <div className="w-full max-w-sm space-y-2">
                  <button
                    onClick={() => setShowNotes(!showNotes)}
                    className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors mx-auto"
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
                      className="resize-none text-sm"
                      autoFocus={false}
                    />
                  )}
                </div>
              </div>

              {/* Bottom action */}
              <div className="px-8 py-5 border-t border-border/15 shrink-0 flex items-center gap-3">
                {hasOptionGroups && (
                  <Button variant="outline" onClick={handleBackFromQuantity} className="h-12 rounded-xl px-5">
                    <AppIcon name="ChevronLeft" size={16} className="mr-1" />
                    Voltar
                  </Button>
                )}
                <Button
                  className="flex-1 h-12 text-base font-bold rounded-xl gap-2"
                  onClick={handleAdd}
                  disabled={!isValid}
                >
                  Adicionar ao pedido
                  <span className="opacity-80">{formatPrice(itemTotal)}</span>
                  <AppIcon name="ArrowRight" size={18} />
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
