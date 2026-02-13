import { ReactNode } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { WidgetConfig, WidgetSize, WIDGET_DEFINITIONS } from '@/types/dashboard';

interface WidgetWrapperProps {
  widget: WidgetConfig;
  onRemove: (id: string) => void;
  onResize: (id: string) => void;
  children: ReactNode;
}

const sizeLabel: Record<WidgetSize, string> = {
  small: 'P',
  medium: 'M',
  large: 'G',
};

export function WidgetWrapper({ widget, onRemove, onResize, children }: WidgetWrapperProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: widget.id });

  const style = {
    transform: CSS.Translate.toString(transform),
    transition,
    zIndex: isDragging ? 50 : undefined,
  };

  const def = WIDGET_DEFINITIONS.find(d => d.type === widget.type);
  const canResize = def && def.allowedSizes.length > 1;
  const isFullWidth = widget.size === 'medium' || widget.size === 'large';

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'relative transition-all',
        isFullWidth ? 'col-span-2' : 'col-span-1',
        isDragging && 'scale-[1.03] opacity-90 shadow-2xl',
      )}
      {...attributes}
      {...listeners}
    >
      {/* Remove button - always visible */}
      <button
        onClick={(e) => { e.stopPropagation(); onRemove(widget.id); }}
        className="absolute -top-2 -left-2 z-10 w-6 h-6 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center shadow-lg active:scale-90 transition-transform"
      >
        <X className="w-3.5 h-3.5" />
      </button>

      {/* Resize button - always visible */}
      {canResize && (
        <button
          onClick={(e) => { e.stopPropagation(); onResize(widget.id); }}
          className="absolute -bottom-2 -right-2 z-10 w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-lg active:scale-90 transition-transform text-[10px] font-bold"
        >
          {sizeLabel[widget.size]}
        </button>
      )}

      {children}
    </div>
  );
}
