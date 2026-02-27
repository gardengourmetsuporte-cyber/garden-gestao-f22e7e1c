import { useState, useEffect } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import type { GamificationPrize } from '@/hooks/useGamification';

interface PrizeSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  prize?: GamificationPrize | null;
  onSave: (data: Partial<GamificationPrize>) => void;
  saving?: boolean;
  /** Total weight of all OTHER prizes (excluding current) for % calculation */
  otherPrizesTotalWeight?: number;
}

const defaultColors = ['#6366f1', '#f43f5e', '#22c55e', '#f59e0b', '#06b6d4', '#8b5cf6', '#ec4899', '#64748b'];
const defaultIcons = ['🎁', '🍟', '🧀', '🥓', '💸', '😅', '🎉', '⭐', '🍔', '🥤'];

export function PrizeSheet({ open, onOpenChange, prize, onSave, saving, otherPrizesTotalWeight = 0 }: PrizeSheetProps) {
  const [name, setName] = useState('');
  const [type, setType] = useState('item');
  const [probability, setProbability] = useState('10');
  const [estimatedCost, setEstimatedCost] = useState('0');
  const [icon, setIcon] = useState('🎁');
  const [color, setColor] = useState('#6366f1');

  useEffect(() => {
    if (prize) {
      setName(prize.name);
      setType(prize.type);
      setProbability(String(prize.probability));
      setEstimatedCost(String(prize.estimated_cost));
      setIcon(prize.icon);
      setColor(prize.color);
    } else {
      setName('');
      setType('item');
      setProbability('10');
      setEstimatedCost('0');
      setIcon('🎁');
      setColor('#6366f1');
    }
  }, [prize, open]);

  const currentWeight = Number(probability) || 0;
  const totalWeight = otherPrizesTotalWeight + currentWeight;
  const realPercent = totalWeight > 0 ? ((currentWeight / totalWeight) * 100).toFixed(1) : '0.0';

  const handleSubmit = () => {
    if (!name.trim()) return;
    onSave({
      ...(prize?.id ? { id: prize.id } : {}),
      name: name.trim(),
      type,
      probability: Number(probability) || 10,
      estimated_cost: Number(estimatedCost) || 0,
      icon,
      color,
    });
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="rounded-t-2xl max-h-[85vh] overflow-y-auto">
        <SheetHeader>
          <SheetTitle>{prize ? 'Editar Prêmio' : 'Novo Prêmio'}</SheetTitle>
        </SheetHeader>

        <div className="space-y-4 mt-4">
          <div>
            <Label>Nome</Label>
            <Input value={name} onChange={e => setName(e.target.value)} placeholder="Ex: Item pequeno grátis" />
          </div>

          <div>
            <Label>Tipo</Label>
            <Select value={type} onValueChange={setType}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="item">🎁 Item</SelectItem>
                <SelectItem value="discount">💸 Desconto</SelectItem>
                <SelectItem value="empty">😅 Sem prêmio</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Probabilidade (peso)</Label>
              <Input type="number" value={probability} onChange={e => setProbability(e.target.value)} min="1" />
              <p className="text-xs text-muted-foreground mt-1">
                Chance real: <span className="font-semibold text-primary">{realPercent}%</span>
              </p>
            </div>
            <div>
              <Label>Custo estimado (R$)</Label>
              <Input type="number" value={estimatedCost} onChange={e => setEstimatedCost(e.target.value)} min="0" step="0.01" />
            </div>
          </div>

          <div>
            <Label>Ícone</Label>
            <div className="flex flex-wrap gap-2 mt-1">
              {defaultIcons.map(ic => (
                <button
                  key={ic}
                  onClick={() => setIcon(ic)}
                  className={`w-10 h-10 rounded-lg text-xl flex items-center justify-center border-2 transition-all ${
                    icon === ic ? 'border-primary bg-primary/10 scale-110' : 'border-border/30 hover:border-border'
                  }`}
                >
                  {ic}
                </button>
              ))}
            </div>
          </div>

          <div>
            <Label>Cor do segmento</Label>
            <div className="flex flex-wrap gap-2 mt-1">
              {defaultColors.map(c => (
                <button
                  key={c}
                  onClick={() => setColor(c)}
                  className={`w-8 h-8 rounded-full border-2 transition-all ${
                    color === c ? 'border-foreground scale-110' : 'border-transparent'
                  }`}
                  style={{ background: c }}
                />
              ))}
            </div>
          </div>

          <Button onClick={handleSubmit} disabled={saving || !name.trim()} className="w-full mt-2">
            {saving ? 'Salvando...' : prize ? 'Salvar alterações' : 'Criar prêmio'}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
