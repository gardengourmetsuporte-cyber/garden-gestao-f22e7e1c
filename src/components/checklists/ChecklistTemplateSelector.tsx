import { useState } from 'react';
import { AppIcon } from '@/components/ui/app-icon';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { CHECKLIST_TEMPLATES, ChecklistTemplate } from '@/lib/checklistTemplates';
import { supabase } from '@/integrations/supabase/client';
import { useUnit } from '@/contexts/UnitContext';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';

interface Props {
  onManual: () => void;
  onDone: () => void;
}

export function ChecklistTemplateSelector({ onManual, onDone }: Props) {
  const { activeUnit } = useUnit();
  const queryClient = useQueryClient();
  const [selected, setSelected] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleApply = async () => {
    const template = CHECKLIST_TEMPLATES.find(t => t.id === selected);
    if (!template || !activeUnit) return;

    setLoading(true);
    try {
      for (let si = 0; si < template.sectors.length; si++) {
        const sector = template.sectors[si];

        const { data: sectorData, error: sectorErr } = await supabase
          .from('checklist_sectors')
          .insert({
            name: sector.name,
            color: sector.color,
            icon: sector.icon,
            sort_order: si,
            unit_id: activeUnit.id,
          })
          .select('id')
          .single();

        if (sectorErr || !sectorData) {
          console.error('Error creating sector:', sectorErr);
          continue;
        }

        for (let sci = 0; sci < sector.subcategories.length; sci++) {
          const sub = sector.subcategories[sci];

          const { data: subData, error: subErr } = await supabase
            .from('checklist_subcategories')
            .insert({
              name: sub.name,
              sector_id: sectorData.id,
              sort_order: sci,
              unit_id: activeUnit.id,
            })
            .select('id')
            .single();

          if (subErr || !subData) {
            console.error('Error creating subcategory:', subErr);
            continue;
          }

          if (sub.items.length > 0) {
            const items = sub.items.map((item, ii) => ({
              name: item.name,
              checklist_type: item.checklist_type,
              points: item.points,
              requires_photo: item.requires_photo,
              subcategory_id: subData.id,
              sort_order: ii,
              unit_id: activeUnit.id,
            }));

            const { error: itemErr } = await supabase
              .from('checklist_items')
              .insert(items);

            if (itemErr) console.error('Error creating items:', itemErr);
          }
        }
      }

      queryClient.invalidateQueries({ queryKey: ['checklists'] });
      queryClient.invalidateQueries({ queryKey: ['setup-progress'] });
      toast.success(`Checklist "${template.name}" criado com sucesso!`);
      onDone();
    } catch (err) {
      console.error(err);
      toast.error('Erro ao criar checklist');
    } finally {
      setLoading(false);
    }
  };

  const selectedTemplate = CHECKLIST_TEMPLATES.find(t => t.id === selected);

  return (
    <div className="space-y-6 py-4">
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto">
          <AppIcon name="ClipboardCheck" size={32} className="text-primary" />
        </div>
        <h2 className="text-xl font-bold font-display text-foreground">Configure seus checklists</h2>
        <p className="text-sm text-muted-foreground max-w-sm mx-auto">
          Escolha o nível de detalhamento ideal para sua operação.
        </p>
      </div>

      {/* Templates */}
      <div className="space-y-3">
        {CHECKLIST_TEMPLATES.map(template => {
          const isSelected = selected === template.id;
          const totalItems = template.sectors.reduce(
            (sum, s) => sum + s.subcategories.reduce((subSum, sub) => subSum + sub.items.length, 0), 0
          );
          const abertura = template.sectors.reduce(
            (sum, s) => sum + s.subcategories.reduce((subSum, sub) => subSum + sub.items.filter(i => i.checklist_type === 'abertura').length, 0), 0
          );
          const fechamento = totalItems - abertura;

          return (
            <button
              key={template.id}
              onClick={() => setSelected(isSelected ? null : template.id)}
              className={cn(
                "relative w-full p-4 rounded-2xl border-2 text-left transition-all duration-200",
                "hover:border-primary/40 hover:bg-primary/5",
                isSelected
                  ? "border-primary bg-primary/10 shadow-lg shadow-primary/10"
                  : "border-border/50 bg-card"
              )}
            >
              <div className="flex items-start gap-3">
                {isSelected && (
                  <div className="absolute top-3 right-3 w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                    <AppIcon name="Check" size={12} className="text-primary-foreground" />
                  </div>
                )}
                <div className={cn(
                  "w-11 h-11 rounded-xl flex items-center justify-center shrink-0",
                  isSelected ? "bg-primary/20" : "bg-muted"
                )}>
                  <AppIcon name={template.icon} size={22} className={isSelected ? "text-primary" : "text-muted-foreground"} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-foreground">{template.name}</h3>
                    {template.badge && (
                      <span className={cn(
                        "text-[10px] px-2 py-0.5 rounded-full font-semibold",
                        template.id === 'avancado' ? "bg-primary/15 text-primary" : "bg-muted text-muted-foreground"
                      )}>
                        {template.badge}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">{template.description}</p>
                  <div className="flex flex-wrap items-center gap-2 mt-2">
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-muted text-muted-foreground font-medium">
                      {template.sectors.length} setores
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-muted text-muted-foreground font-medium">
                      {abertura} abertura
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-muted text-muted-foreground font-medium">
                      {fechamento} fechamento
                    </span>
                  </div>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Actions */}
      <div className="space-y-3">
        <Button
          onClick={handleApply}
          disabled={!selected || loading}
          className="w-full h-12 rounded-xl font-semibold"
          size="lg"
        >
          {loading ? (
            <span className="flex items-center gap-2">
              <AppIcon name="Loader2" size={18} className="animate-spin" />
              Criando checklist...
            </span>
          ) : (
            <span className="flex items-center gap-2">
              <AppIcon name="Sparkles" size={18} />
              Usar modelo selecionado
            </span>
          )}
        </Button>

        <button
          onClick={onManual}
          className="w-full text-center text-sm text-muted-foreground hover:text-foreground transition-colors py-2"
        >
          Prefiro configurar manualmente →
        </button>
      </div>
    </div>
  );
}
