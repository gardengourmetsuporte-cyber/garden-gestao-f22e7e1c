import { Drawer, DrawerContent } from '@/components/ui/drawer';
import { Trash2, Maximize2, LayoutGrid } from 'lucide-react';
import { WidgetConfig, WidgetSize, WIDGET_DEFINITIONS } from '@/types/dashboard';
import { cn } from '@/lib/utils';

interface WidgetContextMenuProps {
  widget: WidgetConfig | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onRemove: (id: string) => void;
  onResize: (id: string) => void;
  onEditLayout: () => void;
}

const sizeLabel: Record<WidgetSize, string> = {
  small: 'Pequeno',
  medium: 'Médio',
  large: 'Grande',
};

export function WidgetContextMenu({ widget, open, onOpenChange, onRemove, onResize, onEditLayout }: WidgetContextMenuProps) {
  if (!widget) return null;

  const def = WIDGET_DEFINITIONS.find(d => d.type === widget.type);
  const canResize = def && def.allowedSizes.length > 1;

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent>
        <div className="px-4 pb-6 pt-2 space-y-1">
          {/* Widget title */}
          <p className="text-sm font-semibold text-foreground px-3 py-2">{def?.label || 'Widget'}</p>

          {/* Resize option */}
          {canResize && (
            <button
              onClick={() => onResize(widget.id)}
              className="w-full flex items-center gap-3 px-3 py-3 rounded-xl text-sm text-foreground hover:bg-secondary/50 active:scale-[0.98] transition-all"
            >
              <Maximize2 className="w-4 h-4 text-muted-foreground" />
              <span>Redimensionar ({sizeLabel[widget.size]})</span>
            </button>
          )}

          {/* Edit home screen */}
          <button
            onClick={onEditLayout}
            className="w-full flex items-center gap-3 px-3 py-3 rounded-xl text-sm text-foreground hover:bg-secondary/50 active:scale-[0.98] transition-all"
          >
            <LayoutGrid className="w-4 h-4 text-muted-foreground" />
            <span>Editar Tela de Início</span>
          </button>

          {/* Remove widget */}
          <button
            onClick={() => onRemove(widget.id)}
            className="w-full flex items-center gap-3 px-3 py-3 rounded-xl text-sm text-destructive hover:bg-destructive/10 active:scale-[0.98] transition-all"
          >
            <Trash2 className="w-4 h-4" />
            <span>Remover Widget</span>
          </button>
        </div>
      </DrawerContent>
    </Drawer>
  );
}
