import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ListChecks, Plus, CheckCircle2 } from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { useAgenda } from '@/hooks/useAgenda';
import { TaskSheet } from '@/components/agenda/TaskSheet';
import { TaskItem } from '@/components/agenda/TaskItem';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useEffect } from 'react';

export default function Agenda() {
  const { isAdmin } = useAuth();
  const navigate = useNavigate();
  const [taskSheetOpen, setTaskSheetOpen] = useState(false);

  const {
    tasks,
    isLoading,
    addTask,
    toggleTask,
    deleteTask,
    isAddingTask,
  } = useAgenda();

  // Redirect non-admins
  useEffect(() => {
    if (!isAdmin) {
      navigate('/');
    }
  }, [isAdmin, navigate]);

  const pendingTasks = tasks.filter(t => !t.is_completed);
  const completedTasks = tasks.filter(t => t.is_completed);

  if (!isAdmin) return null;

  return (
    <AppLayout>
      <div className="p-4 lg:p-6 space-y-6 max-w-3xl mx-auto">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-primary/10">
              <ListChecks className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-foreground">Lembretes</h1>
              <p className="text-sm text-muted-foreground">
                {pendingTasks.length} pendente{pendingTasks.length !== 1 ? 's' : ''}
              </p>
            </div>
          </div>

          <Button 
            size="icon" 
            className="rounded-full w-12 h-12 shadow-lg"
            onClick={() => setTaskSheetOpen(true)}
          >
            <Plus className="w-5 h-5" />
          </Button>
        </div>

        {/* Tasks */}
        <Tabs defaultValue="pending" className="w-full">
          <TabsList className="w-full">
            <TabsTrigger value="pending" className="flex-1 gap-2">
              <ListChecks className="w-4 h-4" />
              Pendentes ({pendingTasks.length})
            </TabsTrigger>
            <TabsTrigger value="completed" className="flex-1 gap-2">
              <CheckCircle2 className="w-4 h-4" />
              Concluídos ({completedTasks.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="pending" className="mt-4 space-y-2">
            {isLoading ? (
              <p className="text-center text-muted-foreground py-8">Carregando...</p>
            ) : pendingTasks.length === 0 ? (
              <div className="text-center py-12">
                <ListChecks className="w-12 h-12 mx-auto text-muted-foreground/50 mb-3" />
                <p className="text-muted-foreground">Nenhum lembrete pendente</p>
                <Button 
                  variant="link" 
                  className="mt-2"
                  onClick={() => setTaskSheetOpen(true)}
                >
                  Criar novo lembrete
                </Button>
              </div>
            ) : (
              pendingTasks.map(task => (
                <TaskItem
                  key={task.id}
                  task={task}
                  onToggle={toggleTask}
                  onDelete={deleteTask}
                />
              ))
            )}
          </TabsContent>

          <TabsContent value="completed" className="mt-4 space-y-2">
            {completedTasks.length === 0 ? (
              <div className="text-center py-12">
                <CheckCircle2 className="w-12 h-12 mx-auto text-muted-foreground/50 mb-3" />
                <p className="text-muted-foreground">Nenhum lembrete concluído</p>
              </div>
            ) : (
              completedTasks.map(task => (
                <TaskItem
                  key={task.id}
                  task={task}
                  onToggle={toggleTask}
                  onDelete={deleteTask}
                />
              ))
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Sheets */}
      <TaskSheet
        open={taskSheetOpen}
        onOpenChange={setTaskSheetOpen}
        onSubmit={addTask}
        isSubmitting={isAddingTask}
      />
    </AppLayout>
  );
}
