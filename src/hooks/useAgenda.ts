import { useState, useEffect, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import type { ManagerTask, TaskPriority, TaskCategory } from '@/types/agenda';

export function useAgenda() {
  const { user } = useAuth();
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
  const { data: tasks = [], isLoading: tasksLoading } = useQuery({
    queryKey: ['manager-tasks', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data, error } = await supabase
        .from('manager_tasks')
        .select('*, category:task_categories(*)')
        .eq('user_id', user.id)
        .order('due_date', { ascending: true, nullsFirst: false })
        .order('priority', { ascending: false })
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as ManagerTask[];
    },
    enabled: !!user?.id,
  });

  // Add task mutation
  const addTaskMutation = useMutation({
    mutationFn: async (task: { 
      title: string; 
      notes?: string;
      due_date?: string; 
      due_time?: string;
      priority: TaskPriority;
      category_id?: string;
    }) => {
      if (!user?.id) throw new Error('User not authenticated');
      const { error } = await supabase
        .from('manager_tasks')
        .insert({
          user_id: user.id,
          title: task.title,
          notes: task.notes || null,
          due_date: task.due_date || null,
          due_time: task.due_time || null,
          priority: task.priority,
          category_id: task.category_id || null,
        });
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
    mutationFn: async ({ id, ...task }: { 
      id: string;
      title: string; 
      notes?: string;
      due_date?: string; 
      due_time?: string;
      priority: TaskPriority;
      category_id?: string;
    }) => {
      const { error } = await supabase
        .from('manager_tasks')
        .update({
          title: task.title,
          notes: task.notes || null,
          due_date: task.due_date || null,
          due_time: task.due_time || null,
          priority: task.priority,
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
      const task = tasks.find(t => t.id === taskId);
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

  return {
    tasks,
    categories,
    isLoading: tasksLoading,
    addTask: addTaskMutation.mutate,
    updateTask: updateTaskMutation.mutate,
    toggleTask: toggleTaskMutation.mutate,
    deleteTask: deleteTaskMutation.mutate,
    addCategory: addCategoryMutation.mutate,
    deleteCategory: deleteCategoryMutation.mutate,
    isAddingTask: addTaskMutation.isPending,
    isUpdatingTask: updateTaskMutation.isPending,
  };
}
