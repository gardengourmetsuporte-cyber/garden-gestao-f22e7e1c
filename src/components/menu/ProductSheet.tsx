import { useState, useEffect } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Trash2, Plus, Star, X } from 'lucide-react';
import type { MenuProduct, MenuGroup } from '@/hooks/useMenuAdmin';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product: Partial<MenuProduct> | null;
  groups: MenuGroup[];
  onSave: (prod: Partial<MenuProduct> & { name: string; price: number }) => void;
  onDelete?: (id: string) => void;
}

interface CustomPrice {
  label: string;
  code: string;
  price: number;
}

export function ProductSheet({ open, onOpenChange, product, groups, onSave, onDelete }: Props) {
  const [form, setForm] = useState<Partial<MenuProduct>>({});
  const [priceType, setPriceType] = useState<'fixed' | 'custom'>('fixed');
  const [customPrices, setCustomPrices] = useState<CustomPrice[]>([]);

  useEffect(() => {
    if (product) {
      setForm(product);
      setPriceType((product.price_type as any) || 'fixed');
      setCustomPrices((product.custom_prices as CustomPrice[]) || []);
    }
  }, [product]);

  const handleSave = () => {
    if (!form.name) return;
    onSave({
      ...form,
      name: form.name,
      price: form.price || 0,
      price_type: priceType,
      custom_prices: priceType === 'custom' ? customPrices : null,
    } as any);
    onOpenChange(false);
  };

  const addCustomPrice = () => {
    setCustomPrices([...customPrices, { label: '', code: '', price: 0 }]);
  };

  const removeCustomPrice = (idx: number) => {
    setCustomPrices(customPrices.filter((_, i) => i !== idx));
  };

  const updateCustomPrice = (idx: number, key: keyof CustomPrice, value: string | number) => {
    setCustomPrices(customPrices.map((cp, i) => i === idx ? { ...cp, [key]: value } : cp));
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="h-[85vh] rounded-t-2xl overflow-y-auto">
        <SheetHeader>
          <SheetTitle>{form.id ? 'Editar Produto' : 'Novo Produto'}</SheetTitle>
        </SheetHeader>

        <div className="mt-4 space-y-4 pb-8">
          <div>
            <Label>Nome *</Label>
            <Input value={form.name || ''} onChange={e => setForm({ ...form, name: e.target.value })} />
          </div>

          <div>
            <Label>Descrição</Label>
            <Textarea value={form.description || ''} onChange={e => setForm({ ...form, description: e.target.value })} rows={3} />
          </div>

          <div>
            <Label>Grupo</Label>
            <Select value={form.group_id || 'none'} onValueChange={v => setForm({ ...form, group_id: v === 'none' ? null : v })}>
              <SelectTrigger><SelectValue placeholder="Selecionar grupo" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Sem grupo</SelectItem>
                {groups.map(g => (
                  <SelectItem key={g.id} value={g.id}>{g.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Código PDV</Label>
            <Input value={form.codigo_pdv || ''} onChange={e => setForm({ ...form, codigo_pdv: e.target.value })} placeholder="Ex: 001" />
          </div>

          {/* Price Type */}
          <div className="space-y-3">
            <Label>Tipo de Preço</Label>
            <div className="flex gap-2">
              <Button
                type="button" size="sm"
                variant={priceType === 'fixed' ? 'default' : 'outline'}
                onClick={() => setPriceType('fixed')}
              >Único</Button>
              <Button
                type="button" size="sm"
                variant={priceType === 'custom' ? 'default' : 'outline'}
                onClick={() => setPriceType('custom')}
              >Personalizado</Button>
            </div>

            {priceType === 'fixed' ? (
              <div>
                <Label>Preço *</Label>
                <Input
                  type="number" step="0.01"
                  value={form.price || ''}
                  onChange={e => setForm({ ...form, price: parseFloat(e.target.value) || 0 })}
                />
              </div>
            ) : (
              <div className="space-y-2">
                {customPrices.map((cp, idx) => (
                  <div key={idx} className="flex gap-2 items-center">
                    <Input className="flex-1" placeholder="Tamanho/tipo" value={cp.label} onChange={e => updateCustomPrice(idx, 'label', e.target.value)} />
                    <Input className="w-20" placeholder="Cód." value={cp.code} onChange={e => updateCustomPrice(idx, 'code', e.target.value)} />
                    <Input className="w-24" type="number" step="0.01" placeholder="Preço" value={cp.price || ''} onChange={e => updateCustomPrice(idx, 'price', parseFloat(e.target.value) || 0)} />
                    <button onClick={() => removeCustomPrice(idx)} className="p-1"><X className="w-4 h-4 text-destructive" /></button>
                  </div>
                ))}
                <Button type="button" size="sm" variant="outline" onClick={addCustomPrice}>
                  <Plus className="w-3.5 h-3.5 mr-1" /> Adicionar variação
                </Button>
              </div>
            )}
          </div>

          {/* Availability */}
          <div className="space-y-2">
            <Label>Disponibilidade</Label>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Tablet (Mesa)</span>
              <Switch
                checked={(form.availability as any)?.tablet ?? true}
                onCheckedChange={v => setForm({ ...form, availability: { ...(form.availability as any), tablet: v } })}
              />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Delivery</span>
              <Switch
                checked={(form.availability as any)?.delivery ?? true}
                onCheckedChange={v => setForm({ ...form, availability: { ...(form.availability as any), delivery: v } })}
              />
            </div>
          </div>

          {/* Toggles */}
          <div className="flex items-center justify-between">
            <Label className="flex items-center gap-2">
              <Star className="w-4 h-4 text-warning" /> Destaque
            </Label>
            <Switch checked={form.is_highlighted ?? false} onCheckedChange={v => setForm({ ...form, is_highlighted: v })} />
          </div>

          <div className="flex items-center justify-between">
            <Label>Produto para maiores de 18</Label>
            <Switch checked={form.is_18_plus ?? false} onCheckedChange={v => setForm({ ...form, is_18_plus: v })} />
          </div>

          <div className="flex items-center justify-between">
            <Label>Ativo</Label>
            <Switch checked={form.is_active ?? true} onCheckedChange={v => setForm({ ...form, is_active: v })} />
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-4">
            <Button onClick={handleSave} className="flex-1" disabled={!form.name}>
              Salvar
            </Button>
            {form.id && onDelete && (
              <Button variant="destructive" onClick={() => { onDelete(form.id!); onOpenChange(false); }}>
                <Trash2 className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
