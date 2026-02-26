import { useState } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { useGamificationAdmin } from '@/hooks/useGamificationAdmin';
import { GamificationSettingsPanel } from '@/components/gamification/GamificationSettings';
import { GamificationMetrics } from '@/components/gamification/GamificationMetrics';
import { PrizeSheet } from '@/components/gamification/PrizeSheet';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { AppIcon } from '@/components/ui/app-icon';
import { toast } from 'sonner';
import { useUnit } from '@/contexts/UnitContext';
import type { GamificationPrize } from '@/hooks/useGamification';

export default function Gamification() {
  const { prizes, prizesLoading, settings, metrics, upsertSettings, savePrize, deletePrize, togglePrize } = useGamificationAdmin();
  const { activeUnit } = useUnit();
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editingPrize, setEditingPrize] = useState<GamificationPrize | null>(null);

  const handleToggleEnabled = (enabled: boolean) => {
    upsertSettings.mutate({ is_enabled: enabled }, {
      onSuccess: () => toast.success(enabled ? 'Jogo ativado!' : 'Jogo desativado'),
    });
  };

  const handleSettingsUpdate = (data: any) => {
    upsertSettings.mutate(data);
  };

  const handleSavePrize = (data: Partial<GamificationPrize>) => {
    savePrize.mutate(data, {
      onSuccess: () => {
        toast.success(data.id ? 'Prêmio atualizado!' : 'Prêmio criado!');
        setSheetOpen(false);
        setEditingPrize(null);
      },
    });
  };

  const handleDelete = (id: string) => {
    if (!confirm('Remover este prêmio?')) return;
    deletePrize.mutate(id, {
      onSuccess: () => toast.success('Prêmio removido'),
    });
  };

  const tabletUrl = activeUnit ? `${window.location.origin}/gamification/${activeUnit.id}` : '';

  return (
    <AppLayout>
      <div className="min-h-screen bg-background pb-24">
        <div className="px-4 py-3 lg:px-6 space-y-4">

        {/* Settings */}
        <GamificationSettingsPanel
          settings={settings}
          onToggle={handleToggleEnabled}
          onUpdate={handleSettingsUpdate}
        />

        {/* Tablet link */}
        {tabletUrl && (
          <Card className="p-3">
            <p className="text-xs text-muted-foreground mb-1">Link do tablet</p>
            <div className="flex items-center gap-2">
              <code className="flex-1 text-xs bg-muted px-2 py-1.5 rounded truncate">{tabletUrl}</code>
              <Button
                size="sm"
                variant="outline"
                onClick={() => { navigator.clipboard.writeText(tabletUrl); toast.success('Link copiado!'); }}
              >
                <AppIcon name="Copy" size={14} />
              </Button>
            </div>
          </Card>
        )}

        {/* Metrics */}
        <GamificationMetrics
          playsToday={metrics.playsToday}
          prizesToday={metrics.prizesToday}
          costToday={metrics.costToday}
          maxDailyCost={settings?.max_daily_cost ?? 100}
        />

        {/* Prizes */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold text-foreground">Prêmios</h2>
            <Button size="sm" onClick={() => { setEditingPrize(null); setSheetOpen(true); }}>
              <AppIcon name="Plus" size={16} className="mr-1" /> Novo
            </Button>
          </div>

          {prizesLoading ? (
            <div className="flex justify-center py-8">
              <AppIcon name="Loader2" size={24} className="animate-spin text-muted-foreground" />
            </div>
          ) : prizes.length === 0 ? (
            <Card className="p-6 text-center">
              <AppIcon name="Gift" size={32} className="mx-auto text-muted-foreground mb-2" />
              <p className="text-muted-foreground">Nenhum prêmio configurado</p>
              <Button variant="outline" className="mt-3" onClick={() => { setEditingPrize(null); setSheetOpen(true); }}>
                Criar primeiro prêmio
              </Button>
            </Card>
          ) : (
            <div className="space-y-2">
              {prizes.map(prize => (
                <Card key={prize.id} className="p-3 flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-lg flex items-center justify-center text-lg shrink-0"
                    style={{ background: `${prize.color}20`, border: `2px solid ${prize.color}` }}
                  >
                    {prize.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-foreground text-sm truncate">{prize.name}</p>
                    <p className="text-xs text-muted-foreground">
                      Peso: {prize.probability} · R$ {prize.estimated_cost.toFixed(2)}
                    </p>
                  </div>
                  <Switch
                    checked={prize.is_active}
                    onCheckedChange={val => togglePrize.mutate({ id: prize.id, is_active: val })}
                  />
                  <button onClick={() => { setEditingPrize(prize); setSheetOpen(true); }} className="p-1.5 hover:bg-muted rounded">
                    <AppIcon name="Pencil" size={14} className="text-muted-foreground" />
                  </button>
                  <button onClick={() => handleDelete(prize.id)} className="p-1.5 hover:bg-destructive/10 rounded">
                    <AppIcon name="Trash2" size={14} className="text-destructive" />
                  </button>
                </Card>
              ))}
            </div>
          )}
        </div>
        </div>
      </div>

      <PrizeSheet
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        prize={editingPrize}
        onSave={handleSavePrize}
        saving={savePrize.isPending}
      />
    </AppLayout>
  );
}
