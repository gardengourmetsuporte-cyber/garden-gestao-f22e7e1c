import { useState } from 'react';
import { useCoupons, type Coupon } from '@/hooks/useCoupons';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { AppIcon } from '@/components/ui/app-icon';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { format } from 'date-fns';

export function CouponManager() {
  const { coupons, isLoading, create, update, remove } = useCoupons();
  const [sheetOpen, setSheetOpen] = useState(false);
  const [form, setForm] = useState({
    code: '',
    discount_type: 'percentage',
    discount_value: 10,
    min_order_value: 0,
    max_uses: '',
    valid_until: '',
  });

  const handleCreate = () => {
    create.mutate({
      code: form.code,
      discount_type: form.discount_type,
      discount_value: form.discount_value,
      min_order_value: form.min_order_value,
      max_uses: form.max_uses ? Number(form.max_uses) : null,
      valid_until: form.valid_until || null,
    });
    setSheetOpen(false);
    setForm({ code: '', discount_type: 'percentage', discount_value: 10, min_order_value: 0, max_uses: '', valid_until: '' });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold">Cupons de Desconto</h3>
        <Button size="sm" onClick={() => setSheetOpen(true)} className="rounded-xl gap-1">
          <AppIcon name="Plus" size={14} /> Novo Cupom
        </Button>
      </div>

      {coupons.length === 0 ? (
        <Card className="border-border/50">
          <CardContent className="py-8 text-center">
            <AppIcon name="Ticket" size={32} className="mx-auto text-muted-foreground/40 mb-2" />
            <p className="text-sm text-muted-foreground">Nenhum cupom criado</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {coupons.map(c => (
            <Card key={c.id} className="border-border/50">
              <CardContent className="py-3 px-4 flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-sm font-bold">{c.code}</span>
                    <Badge variant={c.is_active ? 'default' : 'secondary'} className="text-[10px]">
                      {c.is_active ? 'Ativo' : 'Inativo'}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {c.discount_type === 'percentage' ? `${c.discount_value}%` : `R$ ${c.discount_value}`} de desconto
                    {c.min_order_value > 0 && ` · Mín. R$ ${c.min_order_value}`}
                    {c.max_uses && ` · ${c.current_uses}/${c.max_uses} usos`}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={c.is_active}
                    onCheckedChange={checked => update.mutate({ id: c.id, is_active: checked })}
                  />
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => remove.mutate(c.id)}>
                    <AppIcon name="Trash2" size={14} className="text-destructive" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent side="bottom" className="max-h-[85vh] rounded-t-2xl">
          <SheetHeader>
            <SheetTitle>Novo Cupom</SheetTitle>
          </SheetHeader>
          <div className="space-y-4 mt-4 pb-8">
            <div className="space-y-1.5">
              <label className="text-xs font-medium">Código *</label>
              <Input
                value={form.code}
                onChange={e => setForm(f => ({ ...f, code: e.target.value.toUpperCase() }))}
                placeholder="Ex: DESCONTO10"
                className="rounded-xl font-mono"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-medium">Tipo</label>
                <Select value={form.discount_type} onValueChange={v => setForm(f => ({ ...f, discount_type: v }))}>
                  <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="percentage">Percentual (%)</SelectItem>
                    <SelectItem value="fixed">Valor fixo (R$)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium">Valor</label>
                <Input
                  type="number"
                  value={form.discount_value}
                  onChange={e => setForm(f => ({ ...f, discount_value: Number(e.target.value) }))}
                  className="rounded-xl"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-medium">Pedido mínimo (R$)</label>
                <Input
                  type="number"
                  value={form.min_order_value}
                  onChange={e => setForm(f => ({ ...f, min_order_value: Number(e.target.value) }))}
                  className="rounded-xl"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium">Máx. usos</label>
                <Input
                  type="number"
                  value={form.max_uses}
                  onChange={e => setForm(f => ({ ...f, max_uses: e.target.value }))}
                  placeholder="Ilimitado"
                  className="rounded-xl"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium">Válido até</label>
              <Input
                type="date"
                value={form.valid_until}
                onChange={e => setForm(f => ({ ...f, valid_until: e.target.value }))}
                className="rounded-xl"
              />
            </div>
            <Button onClick={handleCreate} disabled={!form.code || create.isPending} className="w-full rounded-xl">
              {create.isPending ? 'Criando...' : 'Criar Cupom'}
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
