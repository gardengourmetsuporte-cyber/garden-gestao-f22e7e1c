import { useState, useEffect } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Plus, Trash2, X } from 'lucide-react';
import type { MenuOptionGroup, MenuOption } from '@/hooks/useMenuAdmin';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  optionGroup: Partial<MenuOptionGroup> | null;
  onSave: (og: Partial<MenuOptionGroup> & { title: string }, options: Omit<MenuOption, 'id' | 'option_group_id'>[]) => void;
  onDelete?: (id: string) => void;
}

interface OptionForm {
  name: string;
  price: number;
  codigo_pdv: string;
  is_active: boolean;
  availability: { tablet: boolean; delivery: boolean };
}

export function OptionGroupSheet({ open, onOpenChange, optionGroup, onSave, onDelete }: Props) {
  const [form, setForm] = useState<Partial<MenuOptionGroup>>({});
  const [options, setOptions] = useState<OptionForm[]>([]);

  useEffect(() => {
    if (optionGroup) {
      setForm(optionGroup);
      setOptions(
        (optionGroup.options || []).map(o => ({
          name: o.name, price: o.price, codigo_pdv: o.codigo_pdv || '',
          is_active: o.is_active, availability: o.availability as any,
        }))
      );
    }
  }, [optionGroup]);

  const handleSave = () => {
    if (!form.title) return;
    onSave(form as any, options as any);
    onOpenChange(false);
  };

  const addOption = () => {
    setOptions([...options, { name: '', price: 0, codigo_pdv: '', is_active: true, availability: { tablet: true, delivery: true } }]);
  };

  const removeOption = (idx: number) => {
    setOptions(options.filter((_, i) => i !== idx));
  };

  const updateOption = (idx: number, updates: Partial<OptionForm>) => {
    setOptions(options.map((o, i) => i === idx ? { ...o, ...updates } : o));
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="h-[85vh] rounded-t-2xl overflow-y-auto">
        <SheetHeader>
          <SheetTitle>{form.id ? 'Editar Grupo de Opcionais' : 'Novo Grupo de Opcionais'}</SheetTitle>
        </SheetHeader>

        <div className="mt-4 space-y-4 pb-8">
          <div>
            <Label>Título / Pergunta *</Label>
            <Input value={form.title || ''} onChange={e => setForm({ ...form, title: e.target.value })} placeholder='Ex: "Acompanha salada?"' />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Mín. seleções</Label>
              <Input type="number" value={form.min_selections ?? 0} onChange={e => setForm({ ...form, min_selections: parseInt(e.target.value) || 0 })} />
            </div>
            <div>
              <Label>Máx. seleções</Label>
              <Input type="number" value={form.max_selections ?? 1} onChange={e => setForm({ ...form, max_selections: parseInt(e.target.value) || 1 })} />
            </div>
          </div>

          <div className="flex items-center justify-between">
            <Label>Disponível no Tablet (Mesa)</Label>
            <Switch
              checked={(form.availability as any)?.tablet ?? true}
              onCheckedChange={v => setForm({ ...form, availability: { ...(form.availability as any), tablet: v } })}
            />
          </div>
          <div className="flex items-center justify-between">
            <Label>Disponível no Delivery</Label>
            <Switch
              checked={(form.availability as any)?.delivery ?? true}
              onCheckedChange={v => setForm({ ...form, availability: { ...(form.availability as any), delivery: v } })}
            />
          </div>
          <div className="flex items-center justify-between">
            <Label>Permitir repetir opção</Label>
            <Switch checked={form.allow_repeat ?? false} onCheckedChange={v => setForm({ ...form, allow_repeat: v })} />
          </div>

          {/* Options */}
          <div>
            <Label className="mb-2 block">Opções</Label>
            <div className="space-y-2">
              {options.map((opt, idx) => (
                <div key={idx} className="bg-secondary/30 rounded-xl p-3 space-y-2">
                  <div className="flex gap-2 items-center">
                    <Input className="flex-1" placeholder="Nome da opção" value={opt.name} onChange={e => updateOption(idx, { name: e.target.value })} />
                    <Input className="w-20" placeholder="Cód." value={opt.codigo_pdv} onChange={e => updateOption(idx, { codigo_pdv: e.target.value })} />
                    <Input className="w-24" type="number" step="0.01" placeholder="Preço" value={opt.price || ''} onChange={e => updateOption(idx, { price: parseFloat(e.target.value) || 0 })} />
                    <button onClick={() => removeOption(idx)} className="p-1.5 hover:bg-destructive/10 rounded-lg">
                      <X className="w-4 h-4 text-destructive" />
                    </button>
                  </div>
                  <div className="flex items-center gap-4 text-xs">
                    <label className="flex items-center gap-1.5">
                      <Switch checked={opt.availability.tablet} onCheckedChange={v => updateOption(idx, { availability: { ...opt.availability, tablet: v } })} />
                      <span className="text-muted-foreground">Mesa</span>
                    </label>
                    <label className="flex items-center gap-1.5">
                      <Switch checked={opt.availability.delivery} onCheckedChange={v => updateOption(idx, { availability: { ...opt.availability, delivery: v } })} />
                      <span className="text-muted-foreground">Delivery</span>
                    </label>
                  </div>
                </div>
              ))}
              <Button type="button" size="sm" variant="outline" onClick={addOption} className="w-full">
                <Plus className="w-3.5 h-3.5 mr-1" /> Nova Opção
              </Button>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-4">
            <Button onClick={handleSave} className="flex-1" disabled={!form.title}>Salvar</Button>
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
