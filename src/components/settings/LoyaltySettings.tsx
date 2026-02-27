import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { AppIcon } from '@/components/ui/app-icon';
import { useCustomers } from '@/hooks/useCustomers';
import { useCustomerCRM } from '@/hooks/useCustomerCRM';
import type { LoyaltyRule } from '@/types/customer';

const RULE_TYPES = [
  { value: 'orders_for_free', label: 'Pedidos para 1 grátis', icon: 'ShoppingBag', desc: 'A cada X pedidos, 1 é por conta da casa' },
  { value: 'points_per_real', label: 'Pontos por R$ gasto', icon: 'Star', desc: 'Acumula X pontos a cada R$1 gasto' },
  { value: 'birthday_discount', label: 'Desconto de Aniversário', icon: 'Cake', desc: 'Desconto automático no mês do aniversário' },
] as const;

export function LoyaltySettings() {
  const { customers } = useCustomers();
  const { loyaltyRules, createRule, updateRule, deleteRule, recalculateScores } = useCustomerCRM(customers);
  const [adding, setAdding] = useState<string | null>(null);
  const [threshold, setThreshold] = useState('10');
  const [rewardValue, setRewardValue] = useState('1');

  const handleAdd = () => {
    if (!adding) return;
    createRule.mutate(
      { rule_type: adding as LoyaltyRule['rule_type'], threshold: Number(threshold), reward_value: Number(rewardValue) },
      { onSuccess: () => { setAdding(null); setThreshold('10'); setRewardValue('1'); } }
    );
  };

  return (
    <div className="space-y-6">
      {/* Recalculate button */}
      <div className="flex items-center justify-between rounded-xl bg-secondary/30 p-4">
        <div>
          <p className="text-sm font-medium">Recalcular Scores</p>
          <p className="text-xs text-muted-foreground">Atualizar segmentação de todos os clientes</p>
        </div>
        <Button size="sm" variant="outline" onClick={() => recalculateScores.mutate()} disabled={recalculateScores.isPending}>
          <AppIcon name="RefreshCw" size={14} />
          {recalculateScores.isPending ? 'Calculando...' : 'Recalcular'}
        </Button>
      </div>

      {/* Existing rules */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold">Regras Ativas</h3>
        {loyaltyRules.length === 0 && (
          <p className="text-xs text-muted-foreground">Nenhuma regra configurada.</p>
        )}
        {loyaltyRules.map(rule => {
          const ruleInfo = RULE_TYPES.find(r => r.value === rule.rule_type);
          return (
            <div key={rule.id} className="rounded-xl bg-card border p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <AppIcon name={ruleInfo?.icon || 'Settings'} size={18} className="text-primary" />
                <div>
                  <p className="text-sm font-medium">{ruleInfo?.label || rule.rule_type}</p>
                  <p className="text-xs text-muted-foreground">
                    {rule.rule_type === 'orders_for_free' && `A cada ${rule.threshold} pedidos = ${rule.reward_value} grátis`}
                    {rule.rule_type === 'points_per_real' && `${rule.reward_value} pts por R$${rule.threshold} gasto`}
                    {rule.rule_type === 'birthday_discount' && `${rule.reward_value}% de desconto`}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  checked={rule.is_active}
                  onCheckedChange={(checked) => updateRule.mutate({ id: rule.id, is_active: checked })}
                />
                <button
                  onClick={() => deleteRule.mutate(rule.id)}
                  className="p-1.5 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive"
                >
                  <AppIcon name="Trash2" size={14} />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add new rule */}
      {!adding ? (
        <div className="space-y-2">
          <h3 className="text-sm font-semibold">Adicionar Regra</h3>
          <div className="grid gap-2">
            {RULE_TYPES.filter(rt => !loyaltyRules.some(r => r.rule_type === rt.value)).map(rt => (
              <button
                key={rt.value}
                onClick={() => setAdding(rt.value)}
                className="rounded-xl border border-dashed p-3 flex items-center gap-3 text-left hover:bg-secondary/30 transition-colors"
              >
                <AppIcon name={rt.icon} size={18} className="text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">{rt.label}</p>
                  <p className="text-xs text-muted-foreground">{rt.desc}</p>
                </div>
              </button>
            ))
            }
          </div>
        </div>
      ) : (
        <div className="rounded-xl border p-4 space-y-4">
          <h3 className="text-sm font-semibold">
            {RULE_TYPES.find(r => r.value === adding)?.label}
          </h3>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">
                {adding === 'orders_for_free' ? 'Nº de pedidos' : adding === 'points_per_real' ? 'A cada R$' : 'Mín. pedidos'}
              </Label>
              <Input type="number" value={threshold} onChange={e => setThreshold(e.target.value)} />
            </div>
            <div>
              <Label className="text-xs">
                {adding === 'orders_for_free' ? 'Grátis' : adding === 'points_per_real' ? 'Pontos' : '% desconto'}
              </Label>
              <Input type="number" value={rewardValue} onChange={e => setRewardValue(e.target.value)} />
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setAdding(null)}>Cancelar</Button>
            <Button size="sm" onClick={handleAdd} disabled={createRule.isPending}>Salvar</Button>
          </div>
        </div>
      )}
    </div>
  );
}
