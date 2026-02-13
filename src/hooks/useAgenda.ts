import { useState, useEffect, useCallback, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useUnit } from '@/contexts/UnitContext';
import { useToast } from '@/hooks/use-toast';
import type { ManagerTask, TaskCategory } from '@/types/agenda';

interface ReorderUpdate {
  id: string;
  sort_order: number;
}

export function useAgenda() {
  const { user } = useAuth();
  const { activeUnitId } = useUnit();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch task categories
  const { data: categories = [] } = useQuery({
    queryKey: ['task-categories', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data, error } = await supabase
        .from('task_categories' as any)
        .select('*')
        .eq('user_id', user.id)
        .order('sort_order');
      
      if (error) throw error;
      return data as unknown as TaskCategory[];
    },
    enabled: !!user?.id,
  });

  // Fetch all tasks for user (not filtered by date)
  const { data: allTasks = [], isLoading: tasksLoading } = useQuery({
    queryKey: ['manager-tasks', user?.id, activeUnitId],
    queryFn: async () => {
      if (!user?.id || !activeUnitId) return [];
      const { data, error } = await supabase
        .from('manager_tasks')
        .select('*, category:task_categories(*)')
        .eq('user_id', user.id)
        .eq('unit_id', activeUnitId)
        .order('sort_order', { ascending: true })
        .order('due_date', { ascending: true, nullsFirst: true });
      
      if (error) throw error;
      return data as ManagerTask[];
    },
    enabled: !!user?.id && !!activeUnitId,
  });

  // Build hierarchical tasks: group subtasks under parents
  const tasks = useMemo(() => {
    const parentTasks = allTasks.filter(t => !t.parent_id);
    const childMap = new Map<string, ManagerTask[]>();
    allTasks.filter(t => t.parent_id).forEach(t => {
      const children = childMap.get(t.parent_id!) || [];
      children.push(t);
      childMap.set(t.parent_id!, children);
    });
    return parentTasks.map(t => ({
      ...t,
      subtasks: childMap.get(t.id) || [],
    }));
  }, [allTasks]);

  // Add task mutation
  const addTaskMutation = useMutation({
    mutationFn: async (task: { title: string; notes?: string; due_date?: string; due_time?: string; category_id?: string; parent_id?: string }) => {
      if (!user?.id || !activeUnitId) throw new Error('User not authenticated');
      const { error } = await supabase
        .from('manager_tasks')
        .insert({
          user_id: user.id,
          unit_id: activeUnitId,
          title: task.title,
          notes: task.notes || null,
          due_date: task.due_date || null,
          due_time: task.due_time || null,
          priority: 'medium',
          category_id: task.category_id || null,
          parent_id: task.parent_id || null,
        } as any);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['manager-tasks'] });
      toast({ title: 'Lembrete criado!' });
    },
    onError: () => {
      toast({ title: 'Erro ao criar lembrete', variant: 'destructive' });
    },
  });

  // Update task mutation
  const updateTaskMutation = useMutation({
    mutationFn: async ({ id, ...task }: { id: string; title: string; notes?: string; due_date?: string; due_time?: string; category_id?: string }) => {
      const { error } = await supabase
        .from('manager_tasks')
        .update({
          title: task.title,
          notes: task.notes || null,
          due_date: task.due_date || null,
          due_time: task.due_time || null,
          category_id: task.category_id || null,
        })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['manager-tasks'] });
      toast({ title: 'Lembrete atualizado!' });
    },
    onError: () => {
      toast({ title: 'Erro ao atualizar lembrete', variant: 'destructive' });
    },
  });

  // Toggle task completion mutation
  const toggleTaskMutation = useMutation({
    mutationFn: async (taskId: string) => {
      const task = allTasks.find(t => t.id === taskId);
      if (!task) throw new Error('Task not found');
      
      const { error } = await supabase
        .from('manager_tasks')
        .update({
          is_completed: !task.is_completed,
          completed_at: !task.is_completed ? new Date().toISOString() : null,
        })
        .eq('id', taskId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['manager-tasks'] });
    },
  });

  // Delete task mutation
  const deleteTaskMutation = useMutation({
    mutationFn: async (taskId: string) => {
      const { error } = await supabase
        .from('manager_tasks')
        .delete()
        .eq('id', taskId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['manager-tasks'] });
      toast({ title: 'Lembrete removido!' });
    },
    onError: () => {
      toast({ title: 'Erro ao remover lembrete', variant: 'destructive' });
    },
  });

  // Reorder tasks mutation
  const reorderTasksMutation = useMutation({
    mutationFn: async (updates: ReorderUpdate[]) => {
      // Batch update all sort_order values
      const promises = updates.map(({ id, sort_order }) =>
        supabase
          .from('manager_tasks')
          .update({ sort_order })
          .eq('id', id)
      );
      
      const results = await Promise.all(promises);
      const error = results.find(r => r.error)?.error;
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['manager-tasks'] });
    },
    onError: () => {
      toast({ title: 'Erro ao reordenar', variant: 'destructive' });
    },
  });

  // Add category mutation
  const addCategoryMutation = useMutation({
    mutationFn: async (category: { name: string; color: string; icon?: string }) => {
      if (!user?.id) throw new Error('User not authenticated');
      const { error } = await supabase
        .from('task_categories' as any)
        .insert({
          user_id: user.id,
          name: category.name,
          color: category.color,
          icon: category.icon || 'Folder',
          sort_order: categories.length,
        } as any);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['task-categories'] });
      toast({ title: 'Categoria criada!' });
    },
    onError: () => {
      toast({ title: 'Erro ao criar categoria', variant: 'destructive' });
    },
  });

  // Update category mutation
  const updateCategoryMutation = useMutation({
    mutationFn: async ({ id, name, color }: { id: string; name: string; color: string }) => {
      const { error } = await supabase
        .from('task_categories' as any)
        .update({ name, color } as any)
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['task-categories'] });
      queryClient.invalidateQueries({ queryKey: ['manager-tasks'] });
      toast({ title: 'Categoria atualizada!' });
    },
    onError: () => {
      toast({ title: 'Erro ao atualizar categoria', variant: 'destructive' });
    },
  });

  // Delete category mutation
  const deleteCategoryMutation = useMutation({
    mutationFn: async (categoryId: string) => {
      const { error } = await supabase
        .from('task_categories' as any)
        .delete()
        .eq('id', categoryId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['task-categories'] });
      toast({ title: 'Categoria removida!' });
    },
    onError: () => {
      toast({ title: 'Erro ao remover categoria', variant: 'destructive' });
    },
  });

  // Reorder categories mutation
  const reorderCategoriesMutation = useMutation({
    mutationFn: async (reorderedCategories: TaskCategory[]) => {
      const promises = reorderedCategories.map((cat, index) =>
        supabase
          .from('task_categories' as any)
          .update({ sort_order: index } as any)
          .eq('id', cat.id)
      );
      const results = await Promise.all(promises);
      const error = results.find(r => r.error)?.error;
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['task-categories'] });
    },
  });

  return {
    tasks,
    categories,
    isLoading: tasksLoading,
    addTask: addTaskMutation.mutate,
    updateTask: updateTaskMutation.mutate,
    toggleTask: toggleTaskMutation.mutate,
    deleteTask: deleteTaskMutation.mutate,
    addCategory: addCategoryMutation.mutate,
    updateCategory: updateCategoryMutation.mutate,
    deleteCategory: deleteCategoryMutation.mutate,
    reorderTasks: reorderTasksMutation.mutate,
    reorderCategories: reorderCategoriesMutation.mutate,
    isAddingTask: addTaskMutation.isPending,
    isUpdatingTask: updateTaskMutation.isPending,
  };
}
