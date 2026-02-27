import { useState } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { AppIcon } from '@/components/ui/app-icon';
import { DashboardWidget } from '@/hooks/useDashboardWidgets';
import {
  DndContext,
  closestCenter,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
  arrayMove,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { cn } from '@/lib/utils';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  widgets: DashboardWidget[];
  onSave: (widgets: DashboardWidget[]) => void;
  onReset: () => void;
}

function SortableItem({ widget, onToggle }: { widget: DashboardWidget; onToggle: (key: string) => void }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: widget.key });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'flex items-center gap-3 rounded-xl px-3 py-3 bg-card border border-border/50',
        isDragging && 'opacity-60 shadow-lg z-50'
      )}
    >
      <button {...attributes} {...listeners} className="touch-none text-muted-foreground/50 cursor-grab active:cursor-grabbing p-1 -ml-1">
        <AppIcon name="DragIndicator" size={20} />
      </button>
      <AppIcon name={widget.icon} size={20} className="text-muted-foreground" />
      <span className="flex-1 text-sm font-medium text-foreground">{widget.label}</span>
      <Switch
        checked={widget.visible}
        onCheckedChange={() => onToggle(widget.key)}
      />
    </div>
  );
}

export function DashboardWidgetManager({ open, onOpenChange, widgets, onSave, onReset }: Props) {
  const [draft, setDraft] = useState<DashboardWidget[]>(widgets);

  // Reset draft when opening
  const handleOpenChange = (o: boolean) => {
    if (o) setDraft(widgets);
    onOpenChange(o);
  };

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 5 } })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      setDraft(prev => {
        const oldIndex = prev.findIndex(w => w.key === active.id);
        const newIndex = prev.findIndex(w => w.key === over.id);
        return arrayMove(prev, oldIndex, newIndex);
      });
    }
  };

  const handleToggle = (key: string) => {
    setDraft(prev => prev.map(w => w.key === key ? { ...w, visible: !w.visible } : w));
  };

  const handleSave = () => {
    onSave(draft);
    onOpenChange(false);
  };

  const handleReset = () => {
    onReset();
    onOpenChange(false);
  };

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetContent side="bottom" className="!max-h-[85vh]">
        <SheetHeader className="mb-4">
          <SheetTitle className="text-base font-bold">Gerenciar tela inicial</SheetTitle>
          <SheetDescription className="text-xs text-muted-foreground">
            Arraste para reordenar e ative/desative os widgets.
          </SheetDescription>
        </SheetHeader>

        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={draft.map(w => w.key)} strategy={verticalListSortingStrategy}>
            <div className="space-y-2 max-h-[50vh] overflow-y-auto pr-1">
              {draft.map(widget => (
                <SortableItem key={widget.key} widget={widget} onToggle={handleToggle} />
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
