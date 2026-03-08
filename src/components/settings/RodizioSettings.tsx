import { useState, useEffect } from 'react';
import { useRodizioSettings } from '@/hooks/useRodizioSettings';
import { useMenuAdmin } from '@/hooks/useMenuAdmin';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Skeleton } from '@/components/ui/skeleton';
import { AppIcon } from '@/components/ui/app-icon';
import { Checkbox } from '@/components/ui/checkbox';

export function RodizioSettings() {
  const { settings, loading, save } = useRodizioSettings();
  const { categories, groups } = useMenuAdmin();

  const [form, setForm] = useState(settings);

  useEffect(() => {
    if (settings) setForm(settings);
  }, [settings]);

  if (loading || !form) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  const handleSave = () => save(form);

  const toggleCategory = (catId: string) => {
    const ids = form.allowed_category_ids || [];
    setForm({
      ...form,
      allowed_category_ids: ids.includes(catId) ? ids.filter(i => i !== catId) : [...ids, catId],
    });
  };

  const toggleGroup = (gid: string) => {
    const ids = form.allowed_group_ids || [];
    setForm({
      ...form,
      allowed_group_ids: ids.includes(gid) ? ids.filter(i => i !== gid) : [...ids, gid],
    });
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="icon-glow icon-glow-md icon-glow-warning">
          <AppIcon name="AllInclusive" size={18} />
        </div>
        <div>
          <h2 className="text-base font-bold text-foreground">Rodízio</h2>
          <p className="text-[11px] text-muted-foreground">Configure o sistema de rodízio para mesas</p>
        </div>
      </div>

      {/* Active toggle */}
      <div className="card-base p-4 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-foreground">Ativar Rodízio</p>
            <p className="text-xs text-muted-foreground">Disponibiliza o rodízio no tablet das mesas</p>
          </div>
          <Switch
            checked={form.is_active}
            onCheckedChange={v => setForm({ ...form, is_active: v })}
          />
        </div>

        {/* Price */}
        <div>
          <Label>Valor do Rodízio (por pessoa)</Label>
          <Input
            type="number"
            step="0.01"
            value={form.price || ''}
            onChange={e => setForm({ ...form, price: parseFloat(e.target.value) || 0 })}
            placeholder="Ex: 59.90"
            className="mt-1"
          />
        </div>

        {/* Description */}
        <div>
          <Label>Descrição (opcional)</Label>
          <Input
            value={form.description || ''}
            onChange={e => setForm({ ...form, description: e.target.value })}
            placeholder='Ex: "Rodízio completo com entradas, pratos principais e sobremesas"'
            className="mt-1"
          />
        </div>
      </div>

      {/* Rules */}
      <div className="card-base p-4 space-y-4">
        <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
          <AppIcon name="Shield" size={16} className="text-warning" />
          Regras de Controle
        </h3>

        <div>
          <Label>Limite de itens por pedido (por item)</Label>
          <p className="text-xs text-muted-foreground mb-1">Evita desperdício limitando a quantidade de cada item</p>
          <Input
            type="number"
            value={form.max_item_quantity}
            onChange={e => setForm({ ...form, max_item_quantity: parseInt(e.target.value) || 1 })}
            min={1}
            className="w-24"
          />
        </div>

        <div>
          <Label>Tempo limite (minutos)</Label>
          <p className="text-xs text-muted-foreground mb-1">Duração máxima do rodízio após iniciar</p>
          <Input
            type="number"
            value={form.time_limit_minutes}
            onChange={e => setForm({ ...form, time_limit_minutes: parseInt(e.target.value) || 60 })}
            min={30}
            step={15}
            className="w-24"
          />
        </div>
      </div>

      {/* Allowed categories */}
      <div className="card-base p-4 space-y-3">
        <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
          <AppIcon name="LayoutGrid" size={16} className="text-primary" />
          Categorias disponíveis no Rodízio
        </h3>
        <p className="text-xs text-muted-foreground">Selecione quais categorias os clientes podem pedir no rodízio</p>
        
        {categories.length === 0 ? (
          <p className="text-xs text-muted-foreground italic">Nenhuma categoria cadastrada</p>
        ) : (
          <div className="space-y-2">
            {categories.map(cat => (
              <label key={cat.id} className="flex items-center gap-3 p-2.5 rounded-xl bg-secondary/30 cursor-pointer hover:bg-secondary/50 transition-colors">
                <Checkbox
                  checked={(form.allowed_category_ids || []).includes(cat.id)}
                  onCheckedChange={() => toggleCategory(cat.id)}
                />
                <div className="flex items-center gap-2">
                  {cat.icon && <AppIcon name={cat.icon} size={16} className="text-muted-foreground" />}
                  <span className="text-sm font-medium text-foreground">{cat.name}</span>
                </div>
              </label>
            ))}
          </div>
        )}
      </div>

      {/* Allowed groups */}
      <div className="card-base p-4 space-y-3">
        <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
          <AppIcon name="Layers" size={16} className="text-primary" />
          Grupos disponíveis no Rodízio
        </h3>
        <p className="text-xs text-muted-foreground">Selecione grupos específicos (dentro das categorias acima)</p>
        
        {groups.length === 0 ? (
          <p className="text-xs text-muted-foreground italic">Nenhum grupo cadastrado</p>
        ) : (
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {groups.map(g => {
              const cat = categories.find(c => c.id === g.category_id);
              return (
                <label key={g.id} className="flex items-center gap-3 p-2.5 rounded-xl bg-secondary/30 cursor-pointer hover:bg-secondary/50 transition-colors">
                  <Checkbox
                    checked={(form.allowed_group_ids || []).includes(g.id)}
                    onCheckedChange={() => toggleGroup(g.id)}
                  />
                  <div>
                    <span className="text-sm font-medium text-foreground">{g.name}</span>
                    {cat && <span className="text-[10px] text-muted-foreground ml-2">({cat.name})</span>}
                  </div>
                </label>
              );
            })}
          </div>
        )}
      </div>

      {/* Save */}
      <Button onClick={handleSave} className="w-full">
        <AppIcon name="Save" size={16} className="mr-2" />
        Salvar Configurações do Rodízio
      </Button>
    </div>
  );
}
