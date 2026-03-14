import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useUnit } from '@/contexts/UnitContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AppIcon } from '@/components/ui/app-icon';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';

export function CashbackSettings() {
  const { activeUnit } = useUnit();
  const unitId = activeUnit?.id;
  const qc = useQueryClient();

  const { data: loyaltyRules = [] } = useQuery({
    queryKey: ['loyalty_rules', unitId],
    queryFn: async () => {
      if (!unitId) return [];
      const { data, error } = await supabase.from('loyalty_rules').select('*').eq('unit_id', unitId).order('created_at');
      if (error) throw error;
      return data;
    },
    enabled: !!unitId,
  });

  const createRule = useMutation({
    mutationFn: async (input: any) => {
      if (!unitId) throw new Error('Sem unidade');
      const { error } = await supabase.from('loyalty_rules').insert({ unit_id: unitId, ...input });
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['loyalty_rules', unitId] }); },
  });

  const updateRule = useMutation({
    mutationFn: async ({ id, ...input }: any) => {
      const { error } = await supabase.from('loyalty_rules').update(input).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['loyalty_rules', unitId] }); },
  });

  const deleteRule = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('loyalty_rules').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['loyalty_rules', unitId] }); },
  });

  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    rule_type: 'points_per_real' as string,
    threshold: '1',
    reward_value: '1',
    is_active: true,
  });

  const ruleLabels: Record<string, string> = {
    points_per_real: 'Pontos por Real gasto',
    visits_reward: 'Recompensa por Visitas',
    birthday_bonus: 'Bônus de Aniversário',
    cashback_percent: 'Cashback (%)',
  };

  const ruleIcons: Record<string, string> = {
    points_per_real: 'Coins',
    visits_reward: 'UserCheck',
    birthday_bonus: 'Gift',
    cashback_percent: 'Percent',
  };

  const handleCreate = () => {
    createRule.mutate({
      rule_type: form.rule_type,
      threshold: parseFloat(form.threshold),
      reward_value: parseFloat(form.reward_value),
      is_active: form.is_active,
    } as any, {
      onSuccess: () => {
        setOpen(false);
        setForm({ rule_type: 'points_per_real', threshold: '1', reward_value: '1', is_active: true });
      }
    });
  };

  return (
    <div className="card-surface rounded-2xl overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-4 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-primary/15 flex items-center justify-center">
            <AppIcon name="Gem" size={16} className="text-primary" />
          </div>
          <span className="text-sm font-semibold text-foreground">Fidelidade & Cashback</span>
        </div>

        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <button className="flex items-center gap-1.5 text-xs font-medium text-primary px-3 py-1.5 rounded-full bg-primary/10 hover:bg-primary/15 transition-colors">
              <AppIcon name="Plus" size={12} />
              Nova Regra
            </button>
          </SheetTrigger>
          <SheetContent side="bottom" className="rounded-t-2xl">
            <SheetHeader>
              <SheetTitle>Nova Regra de Fidelidade</SheetTitle>
            </SheetHeader>
            <div className="space-y-4 pt-4">
              <div>
                <Label>Tipo de Regra</Label>
                <Select value={form.rule_type} onValueChange={v => setForm(f => ({ ...f, rule_type: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(ruleLabels).map(([k, v]) => (
                      <SelectItem key={k} value={k}>{v}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>
                    {form.rule_type === 'cashback_percent' ? 'Compra mín. (R$)' :
                     form.rule_type === 'visits_reward' ? 'Nº de visitas' :
                     form.rule_type === 'birthday_bonus' ? '(não aplicável)' :
                     'A cada R$'}
                  </Label>
                  <Input
                    type="number"
                    value={form.threshold}
                    onChange={e => setForm(f => ({ ...f, threshold: e.target.value }))}
                    disabled={form.rule_type === 'birthday_bonus'}
                  />
                </div>
                <div>
                  <Label>
                    {form.rule_type === 'cashback_percent' ? '% de cashback' :
                     form.rule_type === 'points_per_real' ? 'Pontos ganhos' :
                     'Pontos bônus'}
                  </Label>
                  <Input
                    type="number"
                    value={form.reward_value}
                    onChange={e => setForm(f => ({ ...f, reward_value: e.target.value }))}
                  />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Switch checked={form.is_active} onCheckedChange={v => setForm(f => ({ ...f, is_active: v }))} />
                <Label>Ativa</Label>
              </div>
              <Button onClick={handleCreate} className="w-full">Criar Regra</Button>
            </div>
          </SheetContent>
        </Sheet>
      </div>

      {/* Content */}
      <div className="px-4 pb-4">
        {loyaltyRules.length === 0 ? (
          <div className="flex items-center gap-3 py-3 px-3 rounded-xl bg-secondary/40">
            <AppIcon name="Info" size={14} className="text-muted-foreground shrink-0" />
            <p className="text-xs text-muted-foreground">
              Nenhuma regra configurada. Crie sua primeira regra de fidelidade.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {loyaltyRules.map((rule: any) => (
              <div key={rule.id} className="flex items-center gap-3 p-3 rounded-xl bg-secondary/40">
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  <AppIcon name={ruleIcons[rule.rule_type] || 'Coins'} size={14} className="text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">
                    {ruleLabels[rule.rule_type] || rule.rule_type}
                  </p>
                  <p className="text-[11px] text-muted-foreground">
                    {rule.rule_type === 'cashback_percent'
                      ? `${rule.reward_value}% acima de R$ ${rule.threshold}`
                      : rule.rule_type === 'points_per_real'
                      ? `${rule.reward_value} pt a cada R$ ${rule.threshold}`
                      : rule.rule_type === 'visits_reward'
                      ? `${rule.reward_value} pts após ${rule.threshold} visitas`
                      : `${rule.reward_value} pts no aniversário`}
                  </p>
                </div>
                <Switch
                  checked={rule.is_active}
                  onCheckedChange={v => updateRule.mutate({ id: rule.id, is_active: v })}
                />
                <button
                  onClick={() => deleteRule.mutate(rule.id)}
                  className="p-1.5 rounded-lg hover:bg-destructive/10 transition-colors"
                >
                  <AppIcon name="Trash2" size={14} className="text-muted-foreground hover:text-destructive" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}