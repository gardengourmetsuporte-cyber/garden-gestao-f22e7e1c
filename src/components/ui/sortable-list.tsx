import React from 'react';
import {
  DndContext,
  closestCenter,
  TouchSensor,
  MouseSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
  horizontalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { cn } from '@/lib/utils';
import { AppIcon } from '@/components/ui/app-icon';

export interface SortableItemRenderProps {
  isDragging: boolean;
  dragHandleProps: Record<string, unknown>;
}

interface SortableListProps<T> {
  items: T[];
  getItemId: (item: T) => string;
  onReorder: (reorderedItems: T[]) => void;
  renderItem: (item: T, props: SortableItemRenderProps) => React.ReactNode;
  disabled?: boolean;
  className?: string;
  direction?: 'vertical' | 'horizontal';
}

function SortableItemWrapper({
  id,
  renderItem,
}: {
  id: string;
  renderItem: (props: SortableItemRenderProps) => React.ReactNode;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style: React.CSSProperties = {
    transform: CSS.Translate.toString(transform),
    transition,
    zIndex: isDragging ? 50 : 'auto',
    position: 'relative' as const,
    ...(isDragging && {
      scale: '1.02',
      boxShadow: '0 8px 32px rgba(0,0,0,0.3), 0 0 0 1px hsl(var(--neon-cyan) / 0.2)',
      borderRadius: '16px',
      opacity: 0.95,
    }),
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      {renderItem({
        isDragging,
        dragHandleProps: {},
      })}
    </div>
  );
}

export function SortableList<T>({
  items,
  getItemId,
  onReorder,
  renderItem,
  disabled,
  className,
  direction = 'vertical',
}: SortableListProps<T>) {
  const sensors = useSensors(
    useSensor(TouchSensor, {
      activationConstraint: { delay: 250, tolerance: 5 },
    }),
    useSensor(MouseSensor, {
      activationConstraint: { delay: 200, tolerance: 5 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = items.findIndex(item => getItemId(item) === active.id);
      const newIndex = items.findIndex(item => getItemId(item) === over.id);
      if (oldIndex !== -1 && newIndex !== -1) {
        onReorder(arrayMove(items, oldIndex, newIndex));
      }
    }
  };

  if (disabled) {
    return (
      <div className={className}>
        {items.map(item => (
          <div key={getItemId(item)}>
            {renderItem(item, { isDragging: false, dragHandleProps: {} })}
          </div>
        ))}
      </div>
    );
  }

  const strategy = direction === 'horizontal' ? horizontalListSortingStrategy : verticalListSortingStrategy;

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <SortableContext items={items.map(getItemId)} strategy={strategy}>
        <div className={className}>
          {items.map(item => (
            <SortableItemWrapper
              key={getItemId(item)}
              id={getItemId(item)}
              renderItem={(props) => renderItem(item, props)}
            />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
}

export function DragHandle({
  dragHandleProps,
  className,
}: {
  dragHandleProps: Record<string, unknown>;
  className?: string;
}) {
  return (
    <div
      {...dragHandleProps}
      className={cn(
        "touch-none cursor-grab active:cursor-grabbing p-1 text-muted-foreground/40 hover:text-muted-foreground transition-colors",
        className
      )}
    >
      <AppIcon name="GripVertical" className="w-5 h-5" />
    </div>
  );
}
