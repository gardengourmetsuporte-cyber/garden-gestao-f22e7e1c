import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from '@/components/ui/drawer';
import { Plus } from 'lucide-react';
import { WIDGET_DEFINITIONS, WidgetType } from '@/types/dashboard';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';
import * as Icons from 'lucide-react';

interface WidgetCatalogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAdd: (type: WidgetType) => void;
  existingTypes: WidgetType[];
}

export function WidgetCatalog({ open, onOpenChange, onAdd, existingTypes }: WidgetCatalogProps) {
  const { isAdmin } = useAuth();

  const available = WIDGET_DEFINITIONS.filter(d => {
    if (d.adminOnly && !isAdmin) return false;
    if (existingTypes.includes(d.type)) return false;
    return true;
  });

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle>Adicionar Widget</DrawerTitle>
        </DrawerHeader>
        <div className="px-4 pb-6 space-y-2 max-h-[60vh] overflow-y-auto">
          {available.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              Todos os widgets já foram adicionados
            </p>
          ) : (
            available.map((def) => {
              const IconComponent = (Icons as any)[def.icon] || Icons.LayoutGrid;
              return (
                <button
                  key={def.type}
                  onClick={() => { onAdd(def.type); onOpenChange(false); }}
                  className="w-full flex items-center gap-3 p-4 rounded-xl bg-card border border-border/40 hover:border-primary/30 transition-all active:scale-[0.98]"
                >
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                    <IconComponent className="w-5 h-5 text-primary" />
                  </div>
                  <div className="flex-1 text-left">
                    <p className="font-medium text-sm text-foreground">{def.label}</p>
                    <p className="text-[11px] text-muted-foreground">{def.description}</p>
                  </div>
                  <Plus className="w-5 h-5 text-primary" />
                </button>
              );
            })
          )}
        </div>
      </DrawerContent>
    </Drawer>
  );
}
