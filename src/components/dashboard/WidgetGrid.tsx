import { DndContext, closestCenter, PointerSensor, TouchSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core';
import { SortableContext, rectSortingStrategy } from '@dnd-kit/sortable';
import { Plus, RotateCcw, Check } from 'lucide-react';
import { WidgetWrapper } from './WidgetWrapper';
import { WidgetRenderer } from './WidgetRenderer';
import { WidgetCatalog } from './WidgetCatalog';
import { useDashboardLayout } from '@/hooks/useDashboardLayout';
import { useState, useCallback, useRef } from 'react';
import { cn } from '@/lib/utils';

export function WidgetGrid() {
  const {
    widgets,
    isLoading,
    isEditing,
    setIsEditing,
    reorderWidgets,
    resizeWidget,
    removeWidget,
    addWidget,
    resetLayout,
  } = useDashboardLayout();

  const [catalogOpen, setCatalogOpen] = useState(false);
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 300, tolerance: 8 } }),
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      reorderWidgets(String(active.id), String(over.id));
    }
  };

  // Long-press on a widget enters edit mode (like iOS)
  const handleWidgetLongPress = useCallback(() => {
    if (!isEditing) {
      setIsEditing(true);
    }
  }, [isEditing, setIsEditing]);

  const handleWidgetTouchStart = useCallback(() => {
    if (!isEditing) {
      longPressTimer.current = setTimeout(handleWidgetLongPress, 500);
    }
  }, [isEditing, handleWidgetLongPress]);

  const handleWidgetTouchEnd = useCallback(() => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  }, []);

  if (isLoading) {
    return (
      <div className="p-4 grid grid-cols-2 gap-3">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="aspect-square bg-card/60 rounded-2xl animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-24">
      {/* Header Actions - only in edit mode */}
      {isEditing && (
        <div className="flex items-center justify-end gap-2 px-4 pt-4 pb-2">
          <button
            onClick={resetLayout}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium text-muted-foreground hover:text-foreground transition-colors bg-secondary/60"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Resetar
          </button>
          <button
            onClick={() => setCatalogOpen(true)}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium text-primary bg-primary/10 hover:bg-primary/20 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            Adicionar
          </button>
          <button
            onClick={() => setIsEditing(false)}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium bg-success/10 text-success hover:bg-success/20 transition-colors"
          >
            <Check className="w-3.5 h-3.5" />
            OK
          </button>
        </div>
      )}

      {/* Widget Grid - uniform squares like iOS */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext items={widgets.map(w => w.id)} strategy={rectSortingStrategy}>
          <div
            className={cn("grid grid-cols-2 gap-3 px-4", !isEditing && "pt-4")}
            onTouchStart={handleWidgetTouchStart}
            onTouchEnd={handleWidgetTouchEnd}
            onTouchCancel={handleWidgetTouchEnd}
            onMouseDown={handleWidgetTouchStart}
            onMouseUp={handleWidgetTouchEnd}
            onMouseLeave={handleWidgetTouchEnd}
          >
            {widgets.map((widget) => (
              <WidgetWrapper
                key={widget.id}
                widget={widget}
                isEditing={isEditing}
                onRemove={removeWidget}
                onResize={resizeWidget}
              >
                <WidgetRenderer widget={widget} />
              </WidgetWrapper>
            ))}
          </div>
        </SortableContext>
      </DndContext>

      {/* Catalog */}
      <WidgetCatalog
        open={catalogOpen}
        onOpenChange={setCatalogOpen}
        onAdd={addWidget}
        existingTypes={widgets.map(w => w.type)}
      />
    </div>
  );
}
