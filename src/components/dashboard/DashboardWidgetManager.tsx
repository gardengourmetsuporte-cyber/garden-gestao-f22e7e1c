import { useState, useEffect, useCallback } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { AppIcon } from '@/components/ui/app-icon';
import { GripVertical } from 'lucide-react';
import { DashboardWidget } from '@/hooks/useDashboardWidgets';
import {
  DndContext,
  closestCenter,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragStartEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
  arrayMove,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { cn } from '@/lib/utils';
// Custom modifier to restrict drag to vertical axis
import type { Modifier } from '@dnd-kit/core';

const restrictToVerticalAxis: Modifier = ({ transform }) => ({
  ...transform,
  x: 0,
});

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  widgets: DashboardWidget[];
  onSave: (widgets: DashboardWidget[]) => void;
  onReset: () => void;
}

function SortableItem({ widget, onToggle, isDragActive }: { widget: DashboardWidget; onToggle: (key: string) => void; isDragActive: boolean }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: widget.key });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : undefined,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      data-vaul-no-drag
      className={cn(
        'flex items-center gap-3 rounded-xl px-3 py-3 bg-card border border-border/50 touch-pan-y select-none',
        isDragging && 'opacity-60 shadow-lg scale-[1.02] relative'
      )}
    >
      <AppIcon name={widget.icon} size={20} className="text-muted-foreground shrink-0" />
      <span className="flex-1 text-sm font-medium text-foreground">{widget.label}</span>

      <button
        type="button"
        {...attributes}
        {...listeners}
        data-vaul-no-drag
        onClick={(e) => e.stopPropagation()}
        aria-label={`Reordenar ${widget.label}`}
        className="shrink-0 rounded-md p-2 text-muted-foreground/70 touch-none cursor-grab active:cursor-grabbing"
      >
        <GripVertical className="h-4 w-4" />
      </button>

      <div
        onClick={(e) => e.stopPropagation()}
        onPointerDown={(e) => e.stopPropagation()}
        onTouchStart={(e) => e.stopPropagation()}
      >
        <Switch
          checked={widget.visible}
          onCheckedChange={() => onToggle(widget.key)}
        />
      </div>
    </div>
  );
}

export function DashboardWidgetManager({ open, onOpenChange, widgets, onSave, onReset }: Props) {
  const [draft, setDraft] = useState<DashboardWidget[]>(widgets);
  const [isDragActive, setIsDragActive] = useState(false);

  // Sync draft when sheet opens or widgets prop changes
  useEffect(() => {
    if (open) setDraft(widgets);
  }, [open, widgets]);

  useEffect(() => {
    if (!isDragActive) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isDragActive]);

  const sensors = useSensors(
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 5 } }),
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  );

  const handleDragStart = useCallback((_event: DragStartEvent) => {
    setIsDragActive(true);
  }, []);

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    setIsDragActive(false);
    const { active, over } = event;
    if (over && active.id !== over.id) {
      setDraft(prev => {
        const oldIndex = prev.findIndex(w => w.key === active.id);
        const newIndex = prev.findIndex(w => w.key === over.id);
        return arrayMove(prev, oldIndex, newIndex);
      });
    }
  }, []);

  const handleDragCancel = useCallback(() => {
    setIsDragActive(false);
  }, []);

  const handleToggle = useCallback((key: string) => {
    setDraft(prev => prev.map(w => w.key === key ? { ...w, visible: !w.visible } : w));
  }, []);

  const handleSave = () => {
    onSave(draft);
    onOpenChange(false);
  };

  const handleReset = () => {
    onReset();
    onOpenChange(false);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange} mobileHandleOnly>
      <SheetContent side="bottom" className="!max-h-[85vh]" data-vaul-no-drag>
        <SheetHeader className="mb-4">
          <SheetTitle className="text-base font-bold">Gerenciar tela inicial</SheetTitle>
          <SheetDescription className="text-xs text-muted-foreground">
            Role a lista normalmente; use a alça para reordenar e ative/desative os widgets.
          </SheetDescription>
        </SheetHeader>

        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
          onDragCancel={handleDragCancel}
          modifiers={[restrictToVerticalAxis]}
        >
          <SortableContext items={draft.map(w => w.key)} strategy={verticalListSortingStrategy}>
            <div
              data-vaul-no-drag
              style={{ touchAction: isDragActive ? 'none' : 'pan-y' }}
              className={cn(
                "space-y-2 max-h-[50vh] overflow-y-auto overscroll-contain pr-1",
                isDragActive && "overflow-hidden"
              )}
            >
              {draft.map(widget => (
                <SortableItem key={widget.key} widget={widget} onToggle={handleToggle} isDragActive={isDragActive} />
              ))}
            </div>
          </SortableContext>
        </DndContext>

        <div className="flex gap-2 mt-5">
          <Button variant="ghost" size="sm" className="text-xs text-muted-foreground" onClick={handleReset}>
            Restaurar padrão
          </Button>
          <div className="flex-1" />
          <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button size="sm" onClick={handleSave}>Salvar</Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
