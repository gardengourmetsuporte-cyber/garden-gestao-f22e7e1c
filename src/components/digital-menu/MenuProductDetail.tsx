import { useState } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { AppIcon } from '@/components/ui/app-icon';
import { DMProduct, DMOptionGroup, CartItem } from '@/hooks/useDigitalMenu';

interface Props {
  product: DMProduct | null;
  optionGroups: DMOptionGroup[];
  open: boolean;
  onClose: () => void;
  onAddToCart: (item: CartItem) => void;
}

function formatPrice(value: number) {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

export function MenuProductDetail({ product, optionGroups, open, onClose, onAddToCart }: Props) {
  const [quantity, setQuantity] = useState(1);
  const [notes, setNotes] = useState('');
  const [selectedOptions, setSelectedOptions] = useState<Record<string, string[]>>({});

  if (!product) return null;

  const toggleOption = (groupId: string, optionId: string, maxSelections: number) => {
    setSelectedOptions(prev => {
      const current = prev[groupId] || [];
      if (current.includes(optionId)) {
        return { ...prev, [groupId]: current.filter(id => id !== optionId) };
      }
      if (current.length >= maxSelections) {
        return { ...prev, [groupId]: [...current.slice(1), optionId] };
      }
      return { ...prev, [groupId]: [...current, optionId] };
    });
  };

  const allOptions = optionGroups.flatMap(og => og.options.map(o => ({ ...o, groupTitle: og.title })));
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
    onAddToCart({
      product,
      quantity,
      notes,
      selectedOptions: selectedOptionsList,
    });
    // Reset
    setQuantity(1);
    setNotes('');
    setSelectedOptions({});
    onClose();
  };

  // Validate required option groups
  const isValid = optionGroups.every(og => {
    const selected = (selectedOptions[og.id] || []).length;
    return selected >= og.min_selections;
  });

  return (
    <Sheet open={open} onOpenChange={v => !v && onClose()}>
      <SheetContent side="bottom" className="rounded-t-3xl max-h-[90dvh] overflow-y-auto p-0">
        {/* Image */}
        {product.image_url && (
          <div className="w-full aspect-video relative overflow-hidden">
            <img src={product.image_url} alt={product.name} className="w-full h-full object-cover" />
          </div>
        )}

        <div className="px-4 pt-4 pb-6 space-y-4">
          <SheetHeader className="text-left">
            <SheetTitle className="text-xl">{product.name}</SheetTitle>
          </SheetHeader>

          {product.description && (
            <p className="text-sm text-muted-foreground">{product.description}</p>
          )}

          <p className="text-lg font-bold text-primary">{formatPrice(product.price)}</p>

          {/* Option groups */}
          {optionGroups.map(og => (
            <div key={og.id} className="space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-sm text-foreground">{og.title}</h3>
                <span className="text-xs text-muted-foreground">
                  {og.min_selections > 0 ? `Obrigatório (${og.min_selections}-${og.max_selections})` : `Até ${og.max_selections}`}
                </span>
              </div>
              <div className="space-y-1.5">
                {og.options.map(opt => {
                  const isChecked = (selectedOptions[og.id] || []).includes(opt.id);
                  return (
                    <label
                      key={opt.id}
                      className="flex items-center gap-3 p-3 rounded-xl bg-secondary/50 cursor-pointer active:scale-[0.98] transition-transform"
                    >
                      <Checkbox
                        checked={isChecked}
                        onCheckedChange={() => toggleOption(og.id, opt.id, og.max_selections)}
                      />
                      <span className="flex-1 text-sm text-foreground">{opt.name}</span>
                      {opt.price > 0 && (
                        <span className="text-xs text-muted-foreground">+ {formatPrice(opt.price)}</span>
                      )}
                    </label>
                  );
                })}
              </div>
            </div>
          ))}

          {/* Notes */}
          <div>
            <label className="text-sm text-muted-foreground mb-1 block">Observações</label>
            <Textarea
              placeholder="Ex: sem cebola, bem passado..."
              value={notes}
              onChange={e => setNotes(e.target.value)}
              rows={2}
              className="resize-none"
            />
          </div>

          {/* Quantity + Add */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 bg-secondary rounded-xl">
              <button
                onClick={() => setQuantity(q => Math.max(1, q - 1))}
                className="w-10 h-10 flex items-center justify-center text-foreground"
              >
                <AppIcon name="Minus" size={18} />
              </button>
              <span className="w-8 text-center font-bold text-foreground">{quantity}</span>
              <button
                onClick={() => setQuantity(q => q + 1)}
                className="w-10 h-10 flex items-center justify-center text-foreground"
              >
                <AppIcon name="Plus" size={18} />
              </button>
            </div>
            <Button
              className="flex-1 h-12 text-base"
              onClick={handleAdd}
              disabled={!isValid}
            >
              Adicionar {formatPrice(itemTotal)}
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
