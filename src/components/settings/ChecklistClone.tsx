import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useUnit } from '@/contexts/UnitContext';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AppIcon } from '@/components/ui/app-icon';

interface ChecklistCloneProps {
  onCloned?: () => void;
}

export function ChecklistClone({ onCloned }: ChecklistCloneProps) {
  const { units, activeUnitId } = useUnit();
  const [sourceUnitId, setSourceUnitId] = useState<string>('');
  const [isCloning, setIsCloning] = useState(false);

  const availableSourceUnits = units.filter(u => u.id !== activeUnitId);
  const targetUnit = units.find(u => u.id === activeUnitId);

  if (availableSourceUnits.length === 0) return null;

  const handleClone = async () => {
    if (!sourceUnitId || !activeUnitId) return;
    setIsCloning(true);
    try {
      const { data: srcSectors, error: secErr } = await supabase
        .from('checklist_sectors').select('*').eq('unit_id', sourceUnitId).order('sort_order');
      if (secErr) throw secErr;
      if (!srcSectors?.length) {
        toast.info('A unidade de origem não possui setores de checklist.');
        return;
      }
      for (const sector of srcSectors) {
        const { data: newSector, error: nsErr } = await supabase
          .from('checklist_sectors')
          .insert({ name: sector.name, color: sector.color, icon: sector.icon, sort_order: sector.sort_order, unit_id: activeUnitId })
          .select().single();
        if (nsErr) throw nsErr;
        const { data: srcSubs } = await supabase
          .from('checklist_subcategories').select('*').eq('sector_id', sector.id).eq('unit_id', sourceUnitId).order('sort_order');
        for (const sub of srcSubs || []) {
          const { data: newSub, error: nsubErr } = await supabase
            .from('checklist_subcategories')
            .insert({ sector_id: newSector.id, name: sub.name, sort_order: sub.sort_order, unit_id: activeUnitId })
            .select().single();
          if (nsubErr) throw nsubErr;
          const { data: srcItems } = await supabase
            .from('checklist_items').select('*').eq('subcategory_id', sub.id).eq('unit_id', sourceUnitId).is('deleted_at', null).order('sort_order');
          if (srcItems?.length) {
            const itemsToInsert = srcItems.map(item => ({
              subcategory_id: newSub.id, name: item.name, description: item.description, frequency: item.frequency,
              checklist_type: item.checklist_type, sort_order: item.sort_order, points: item.points, is_active: item.is_active, unit_id: activeUnitId,
            }));
            await supabase.from('checklist_items').insert(itemsToInsert);
          }
        }
      }
      toast.success(`Checklists clonados com sucesso!`);
      onCloned?.();
    } catch (err: any) {
      console.error('Clone error:', err);
      toast.error('Erro ao clonar: ' + (err.message || 'tente novamente'));
    } finally {
      setIsCloning(false);
    }
  };

  return (
    <div className="border border-border rounded-xl p-4 space-y-3 bg-card">
      <div className="flex items-center gap-2">
        <AppIcon name="Copy" size={16} className="text-primary" />
        <h4 className="font-semibold text-sm">Clonar de outra unidade</h4>
      </div>
      <p className="text-xs text-muted-foreground">
        Copie todos os setores, subcategorias e itens de checklist de outra unidade para <strong>{targetUnit?.name || 'esta unidade'}</strong>.
      </p>
      <div className="flex gap-2">
        <Select value={sourceUnitId} onValueChange={setSourceUnitId}>
          <SelectTrigger className="flex-1">
            <SelectValue placeholder="Selecionar unidade de origem" />
          </SelectTrigger>
          <SelectContent>
            {availableSourceUnits.map(u => (
              <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button size="sm" onClick={handleClone} disabled={!sourceUnitId || isCloning}>
          {isCloning ? <AppIcon name="progress_activity" size={16} className="animate-spin" /> : 'Clonar'}
        </Button>
      </div>
    </div>
  );
}
