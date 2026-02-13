import { DndContext, closestCenter, PointerSensor, TouchSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
// no modifiers needed
import { Edit3, Plus, RotateCcw, Check } from 'lucide-react';
import { WidgetConfig } from '@/types/dashboard';
import { WidgetWrapper } from './WidgetWrapper';
import { WidgetRenderer } from './WidgetRenderer';
import { WidgetCatalog } from './WidgetCatalog';
import { useDashboardLayout } from '@/hooks/useDashboardLayout';
import { useState } from 'react';
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

  if (isLoading) {
    return (
      <div className="p-4 space-y-3">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="h-24 bg-card/60 rounded-2xl animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-24">
      {/* Header Actions */}
      <div className="flex items-center justify-end gap-2 px-4 pt-4 pb-2">
        {isEditing && (
          <>
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
          </>
        )}
        <button
          onClick={() => setIsEditing(!isEditing)}
          className={cn(
            "flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors",
            isEditing
              ? "bg-success/10 text-success hover:bg-success/20"
              : "bg-secondary/60 text-muted-foreground hover:text-foreground"
          )}
        >
          {isEditing ? <Check className="w-3.5 h-3.5" /> : <Edit3 className="w-3.5 h-3.5" />}
          {isEditing ? 'Concluir' : 'Editar'}
        </button>
      </div>

      {/* Widget Grid */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext items={widgets.map(w => w.id)} strategy={verticalListSortingStrategy}>
          <div className="grid grid-cols-2 gap-3 px-4">
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
