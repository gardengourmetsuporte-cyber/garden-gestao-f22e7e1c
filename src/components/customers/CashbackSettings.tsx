import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useUnit } from '@/contexts/UnitContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Coins, Plus, Trash2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

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
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <Coins className="w-4 h-4" />
            Regras de Fidelidade & Cashback
          </CardTitle>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button size="sm" variant="outline">
                <Plus className="w-4 h-4 mr-1" /> Nova Regra
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Nova Regra de Fidelidade</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
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
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {loyaltyRules.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            Nenhuma regra de fidelidade configurada
          </p>
        ) : (
          <div className="space-y-3">
            {loyaltyRules.map((rule: any) => (
              <div key={rule.id} className="flex items-center justify-between p-3 rounded-lg border">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm">
                      {ruleLabels[rule.rule_type] || rule.rule_type}
                    </span>
                    <Badge variant={rule.is_active ? 'default' : 'secondary'}>
                      {rule.is_active ? 'Ativa' : 'Inativa'}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {rule.rule_type === 'cashback_percent'
                      ? `${rule.reward_value}% de cashback em compras acima de R$ ${rule.threshold}`
                      : rule.rule_type === 'points_per_real'
                      ? `${rule.reward_value} ponto(s) a cada R$ ${rule.threshold} gastos`
                      : rule.rule_type === 'visits_reward'
                      ? `${rule.reward_value} pontos bônus após ${rule.threshold} visitas`
                      : `${rule.reward_value} pontos bônus no aniversário`}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={rule.is_active}
                    onCheckedChange={v => updateRule.mutate({ id: rule.id, is_active: v })}
                  />
                  <Button
                    size="icon"
                    variant="ghost"
                    className="text-destructive"
                    onClick={() => deleteRule.mutate(rule.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
