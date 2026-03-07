import { useState } from 'react';
import { AppIcon } from '@/components/ui/app-icon';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { INVENTORY_TEMPLATES, InventoryTemplate } from '@/lib/inventoryTemplates';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useUnit } from '@/contexts/UnitContext';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';

interface Props {
  onManual: () => void;
  onDone: () => void;
}

export function InventoryTemplateSelector({ onManual, onDone }: Props) {
  const { user } = useAuth();
  const { activeUnit } = useUnit();
  const queryClient = useQueryClient();
  const [selected, setSelected] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleApply = async () => {
    const template = INVENTORY_TEMPLATES.find(t => t.id === selected);
    if (!template || !user || !activeUnit) return;

    setLoading(true);
    try {
      // Create categories and items
      for (let ci = 0; ci < template.categories.length; ci++) {
        const cat = template.categories[ci];

        // Create category
        const { data: catData, error: catErr } = await supabase
          .from('categories')
          .insert({
            name: cat.name,
            color: cat.color,
            icon: cat.icon,
            sort_order: ci,
            unit_id: activeUnit.id,
          })
          .select('id')
          .single();

        if (catErr) {
          console.error('Error creating category:', catErr);
          continue;
        }

        // Create items for this category
        if (catData && cat.items.length > 0) {
          const items = cat.items.map(item => ({
            name: item.name,
            unit_type: item.unit_type,
            current_stock: 0,
            min_stock: item.min_stock,
            category_id: catData.id,
            unit_id: activeUnit.id,
          }));

          const { error: itemErr } = await supabase
            .from('inventory_items')
            .insert(items);

          if (itemErr) console.error('Error creating items:', itemErr);
        }
      }

      queryClient.invalidateQueries({ queryKey: ['inventory-items'] });
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      queryClient.invalidateQueries({ queryKey: ['setup-progress'] });
      toast.success(`Estoque "${template.name}" criado com sucesso!`);
      onDone();
    } catch (err) {
      console.error(err);
      toast.error('Erro ao criar estoque');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 py-4">
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto">
          <AppIcon name="Package" size={32} className="text-primary" />
        </div>
        <h2 className="text-xl font-bold font-display text-foreground">Monte seu estoque</h2>
        <p className="text-sm text-muted-foreground max-w-sm mx-auto">
          Escolha um modelo pronto para o seu tipo de negócio ou comece do zero.
        </p>
      </div>

      {/* Templates grid */}
      <div className="grid grid-cols-2 gap-3">
        {INVENTORY_TEMPLATES.map(template => {
          const isSelected = selected === template.id;
          const totalItems = template.categories.reduce((sum, c) => sum + c.items.length, 0);

          return (
            <button
              key={template.id}
              onClick={() => setSelected(isSelected ? null : template.id)}
              className={cn(
                "relative p-4 rounded-2xl border-2 text-left transition-all duration-200",
                "hover:border-primary/40 hover:bg-primary/5",
                isSelected
                  ? "border-primary bg-primary/10 shadow-lg shadow-primary/10"
                  : "border-border/50 bg-card"
              )}
            >
              {isSelected && (
                <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                  <AppIcon name="Check" size={12} className="text-primary-foreground" />
                </div>
              )}
              <div className={cn(
                "w-10 h-10 rounded-xl flex items-center justify-center mb-3",
                isSelected ? "bg-primary/20" : "bg-muted"
              )}>
                <AppIcon name={template.icon} size={20} className={isSelected ? "text-primary" : "text-muted-foreground"} />
              </div>
              <h3 className="font-semibold text-foreground text-sm">{template.name}</h3>
              <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{template.description}</p>
              <div className="flex items-center gap-2 mt-2">
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-muted text-muted-foreground font-medium">
                  {template.categories.length} categorias
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-muted text-muted-foreground font-medium">
                  {totalItems} itens
                </span>
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
              Criando estoque...
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
          Prefiro cadastrar manualmente →
        </button>
      </div>
    </div>
  );
}
