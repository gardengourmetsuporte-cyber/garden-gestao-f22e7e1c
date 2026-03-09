import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useUnit } from '@/contexts/UnitContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AppIcon } from '@/components/ui/app-icon';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

const COLOR_OPTIONS = [
  '#ef4444', '#f97316', '#f59e0b', '#22c55e',
  '#06b6d4', '#3b82f6', '#6366f1', '#8b5cf6',
  '#ec4899', '#64748b',
];

type KDSStation = {
  id: string;
  unit_id: string;
  name: string;
  color: string;
  icon: string | null;
  sort_order: number;
};

export function KDSStationsManager() {
  const { activeUnit } = useUnit();
  const queryClient = useQueryClient();
  const [newName, setNewName] = useState('');
  const [newColor, setNewColor] = useState(COLOR_OPTIONS[0]);
  const [editId, setEditId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editColor, setEditColor] = useState('');

  const { data: stations = [], isLoading } = useQuery({
    queryKey: ['kds-stations', activeUnit?.id],
    queryFn: async () => {
      if (!activeUnit) return [];
      const { data, error } = await supabase
        .from('kds_stations')
        .select('*')
        .eq('unit_id', activeUnit.id)
        .order('sort_order');
      if (error) throw error;
      return data as KDSStation[];
    },
    enabled: !!activeUnit,
  });

  const addMutation = useMutation({
    mutationFn: async () => {
      if (!activeUnit || !newName.trim()) return;
      const { error } = await supabase.from('kds_stations').insert({
        unit_id: activeUnit.id,
        name: newName.trim(),
        color: newColor,
        sort_order: stations.length,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['kds-stations'] });
      setNewName('');
      toast.success('Pista criada!');
    },
    onError: () => toast.error('Erro ao criar pista'),
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, name, color }: { id: string; name: string; color: string }) => {
      const { error } = await supabase.from('kds_stations').update({ name, color }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['kds-stations'] });
      setEditId(null);
      toast.success('Pista atualizada!');
    },
    onError: () => toast.error('Erro ao atualizar'),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('kds_stations').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['kds-stations'] });
      toast.success('Pista removida!');
    },
    onError: () => toast.error('Erro ao remover'),
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <AppIcon name="ChefHat" size={18} className="text-primary" />
        <h3 className="text-sm font-bold text-foreground">Pistas da Cozinha (KDS)</h3>
      </div>
      <p className="text-xs text-muted-foreground">
        Configure os setores da cozinha. Vincule ingredientes das fichas técnicas às pistas para que o KDS mostre o resumo por setor.
      </p>

      {/* Existing stations */}
      <div className="space-y-2">
        {stations.map((s) => (
          <div key={s.id} className="flex items-center gap-2 p-2.5 rounded-xl border border-border/30 bg-card">
            {editId === s.id ? (
              <>
                <div className="w-5 h-5 rounded-full shrink-0 ring-2 ring-border" style={{ backgroundColor: editColor }} />
                <Input
                  value={editName}
                  onChange={e => setEditName(e.target.value)}
                  className="h-8 flex-1 text-sm"
                  autoFocus
                />
                <div className="flex gap-1">
                  {COLOR_OPTIONS.map(c => (
                    <button
                      key={c}
                      onClick={() => setEditColor(c)}
                      className={cn('w-5 h-5 rounded-full transition-transform', editColor === c && 'scale-125 ring-2 ring-foreground')}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
                <Button size="sm" variant="ghost" className="h-7 px-2" onClick={() => updateMutation.mutate({ id: s.id, name: editName, color: editColor })}>
                  <AppIcon name="Check" size={14} className="text-primary" />
                </Button>
                <Button size="sm" variant="ghost" className="h-7 px-2" onClick={() => setEditId(null)}>
                  <AppIcon name="X" size={14} />
                </Button>
              </>
            ) : (
              <>
                <div className="w-5 h-5 rounded-full shrink-0" style={{ backgroundColor: s.color }} />
                <span className="flex-1 text-sm font-medium text-foreground">{s.name}</span>
                <Button size="sm" variant="ghost" className="h-7 px-2" onClick={() => { setEditId(s.id); setEditName(s.name); setEditColor(s.color); }}>
                  <AppIcon name="Pencil" size={14} className="text-muted-foreground" />
                </Button>
                <Button size="sm" variant="ghost" className="h-7 px-2" onClick={() => deleteMutation.mutate(s.id)}>
                  <AppIcon name="Trash2" size={14} className="text-destructive" />
                </Button>
              </>
            )}
          </div>
        ))}
        {isLoading && <p className="text-xs text-muted-foreground">Carregando...</p>}
        {!isLoading && stations.length === 0 && (
          <p className="text-xs text-muted-foreground text-center py-4">Nenhuma pista configurada</p>
        )}
      </div>

      {/* Add new */}
      <div className="p-3 rounded-xl border border-dashed border-border/50 bg-secondary/20 space-y-2">
        <Label className="text-xs font-semibold text-muted-foreground">Nova pista</Label>
        <div className="flex items-center gap-2">
          <Input
            placeholder="Ex: Pista Porção"
            value={newName}
            onChange={e => setNewName(e.target.value)}
            className="h-8 flex-1 text-sm"
            onKeyDown={e => e.key === 'Enter' && newName.trim() && addMutation.mutate()}
          />
          <Button size="sm" className="h-8" onClick={() => addMutation.mutate()} disabled={!newName.trim() || addMutation.isPending}>
            <AppIcon name="Plus" size={14} className="mr-1" /> Criar
          </Button>
        </div>
        <div className="flex gap-1.5">
          {COLOR_OPTIONS.map(c => (
            <button
              key={c}
              onClick={() => setNewColor(c)}
              className={cn('w-5 h-5 rounded-full transition-transform', newColor === c && 'scale-125 ring-2 ring-foreground')}
              style={{ backgroundColor: c }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
