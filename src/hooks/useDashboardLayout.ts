import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import {
  WidgetConfig,
  WidgetSize,
  WidgetType,
  DEFAULT_ADMIN_WIDGETS,
  DEFAULT_EMPLOYEE_WIDGETS,
  WIDGET_DEFINITIONS,
} from '@/types/dashboard';
import { toast } from 'sonner';

export function useDashboardLayout() {
  const { user, isAdmin } = useAuth();
  const [widgets, setWidgets] = useState<WidgetConfig[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  

  const defaultWidgets = isAdmin ? DEFAULT_ADMIN_WIDGETS : DEFAULT_EMPLOYEE_WIDGETS;

  // Load layout
  useEffect(() => {
    if (!user) return;
    
    (async () => {
      const { data } = await supabase
        .from('dashboard_layouts')
        .select('widgets')
        .eq('user_id', user.id)
        .maybeSingle();

      if (data?.widgets) {
        setWidgets(data.widgets as unknown as WidgetConfig[]);
      } else {
        setWidgets(defaultWidgets);
      }
      setIsLoading(false);
    })();
  }, [user?.id, isAdmin]);

  // Save layout
  const saveLayout = useCallback(async (newWidgets: WidgetConfig[]) => {
    if (!user) return;
    setWidgets(newWidgets);

    const payload: any = {
      user_id: user.id,
      widgets: newWidgets,
    };
    const { error } = await supabase
      .from('dashboard_layouts')
      .upsert(payload, { onConflict: 'user_id' });

    if (error) {
      toast.error('Erro ao salvar layout');
    }
  }, [user]);

  const reorderWidgets = useCallback((activeId: string, overId: string) => {
    const oldIndex = widgets.findIndex(w => w.id === activeId);
    const newIndex = widgets.findIndex(w => w.id === overId);
    if (oldIndex === -1 || newIndex === -1) return;

    const updated = [...widgets];
    const [moved] = updated.splice(oldIndex, 1);
    updated.splice(newIndex, 0, moved);
    const reordered = updated.map((w, i) => ({ ...w, order: i }));
    saveLayout(reordered);
  }, [widgets, saveLayout]);

  const resizeWidget = useCallback((widgetId: string) => {
    const widget = widgets.find(w => w.id === widgetId);
    if (!widget) return;
    
    const def = WIDGET_DEFINITIONS.find(d => d.type === widget.type);
    if (!def) return;

    const sizes = def.allowedSizes;
    const currentIdx = sizes.indexOf(widget.size);
    const nextSize = sizes[(currentIdx + 1) % sizes.length];

    const updated = widgets.map(w => w.id === widgetId ? { ...w, size: nextSize } : w);
    saveLayout(updated);
  }, [widgets, saveLayout]);

  const removeWidget = useCallback((widgetId: string) => {
    const updated = widgets.filter(w => w.id !== widgetId).map((w, i) => ({ ...w, order: i }));
    saveLayout(updated);
  }, [widgets, saveLayout]);

  const addWidget = useCallback((type: WidgetType) => {
    const def = WIDGET_DEFINITIONS.find(d => d.type === type);
    if (!def) return;
    
    const newWidget: WidgetConfig = {
      id: `w_${Date.now()}`,
      type,
      size: def.defaultSize,
      order: widgets.length,
    };
    saveLayout([...widgets, newWidget]);
  }, [widgets, saveLayout]);

  const resetLayout = useCallback(() => {
    saveLayout(defaultWidgets);
    toast.success('Layout restaurado ao padrão');
  }, [defaultWidgets, saveLayout]);

  return {
    widgets,
    isLoading,
    reorderWidgets,
    resizeWidget,
    removeWidget,
    addWidget,
    resetLayout,
  };
}
