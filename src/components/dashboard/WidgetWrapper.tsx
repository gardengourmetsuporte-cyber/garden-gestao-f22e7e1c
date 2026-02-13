import { ReactNode, useRef, useCallback } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { WidgetConfig, WidgetSize, WIDGET_DEFINITIONS } from '@/types/dashboard';

interface WidgetWrapperProps {
  widget: WidgetConfig;
  isEditing: boolean;
  onLongPress: (widgetId: string) => void;
  children: ReactNode;
}

export function WidgetWrapper({ widget, isEditing, onLongPress, children }: WidgetWrapperProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: widget.id, disabled: !isEditing });

  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const style = {
    transform: CSS.Translate.toString(transform),
    transition,
    zIndex: isDragging ? 50 : undefined,
  };

  // Per-widget long-press: only opens context menu for THIS widget
  const handleTouchStart = useCallback(() => {
    if (isEditing) return; // In jiggle mode, DnD handles touch
    longPressTimer.current = setTimeout(() => {
      onLongPress(widget.id);
    }, 500);
  }, [isEditing, onLongPress, widget.id]);

  const handleTouchEnd = useCallback(() => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  }, []);

  const handleContextMenu = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
  }, []);

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'relative col-span-1 aspect-square transition-all select-none',
        isDragging && 'scale-[1.03] opacity-90 shadow-2xl',
        isEditing && !isDragging && 'animate-wiggle',
      )}
      {...attributes}
      {...(isEditing ? listeners : {})}
      onTouchStart={!isEditing ? handleTouchStart : undefined}
      onTouchEnd={!isEditing ? handleTouchEnd : undefined}
      onTouchCancel={!isEditing ? handleTouchEnd : undefined}
      onMouseDown={!isEditing ? handleTouchStart : undefined}
      onMouseUp={!isEditing ? handleTouchEnd : undefined}
      onMouseLeave={!isEditing ? handleTouchEnd : undefined}
      onContextMenu={handleContextMenu}
    >
      {/* Remove button - only in jiggle/edit mode */}
      {isEditing && (
        <button
          onClick={(e) => { e.stopPropagation(); }}
          onPointerDown={(e) => { e.stopPropagation(); }}
          onTouchStart={(e) => { e.stopPropagation(); }}
          className="absolute -top-2 -left-2 z-10 w-6 h-6 rounded-full bg-destructive/90 text-destructive-foreground flex items-center justify-center shadow-lg active:scale-90 transition-transform"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      )}

      <div className="w-full h-full overflow-hidden rounded-2xl" style={{ WebkitTouchCallout: 'none' } as React.CSSProperties}>
        {children}
      </div>
    </div>
  );
}
