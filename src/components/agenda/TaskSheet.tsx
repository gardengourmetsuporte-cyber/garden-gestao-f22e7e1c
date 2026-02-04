import { useState } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Sunrise, Sun, Moon, AlertCircle, AlertTriangle, Info } from 'lucide-react';
import type { DayPeriod, TaskPriority } from '@/types/agenda';

interface TaskSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (task: { title: string; period: DayPeriod; priority: TaskPriority }) => void;
  isSubmitting?: boolean;
}

export function TaskSheet({ open, onOpenChange, onSubmit, isSubmitting }: TaskSheetProps) {
  const [title, setTitle] = useState('');
  const [period, setPeriod] = useState<DayPeriod>('morning');
  const [priority, setPriority] = useState<TaskPriority>('medium');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    
    onSubmit({ title: title.trim(), period, priority });
    setTitle('');
    setPeriod('morning');
    setPriority('medium');
    onOpenChange(false);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="h-auto max-h-[80vh] rounded-t-2xl">
        <SheetHeader className="text-left">
          <SheetTitle>Nova Tarefa</SheetTitle>
          <SheetDescription>
            Adicione uma tarefa para sua agenda
          </SheetDescription>
        </SheetHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label htmlFor="title">Título</Label>
            <Input
              id="title"
              placeholder="Ex: Conferir estoque de laticínios"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="h-12"
              autoFocus
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Período</Label>
              <Select value={period} onValueChange={(v) => setPeriod(v as DayPeriod)}>
                <SelectTrigger className="h-12">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="morning">
                    <div className="flex items-center gap-2">
                      <Sunrise className="w-4 h-4 text-amber-500" />
                      Manhã
                    </div>
                  </SelectItem>
                  <SelectItem value="afternoon">
                    <div className="flex items-center gap-2">
                      <Sun className="w-4 h-4 text-orange-500" />
                      Tarde
                    </div>
                  </SelectItem>
                  <SelectItem value="evening">
                    <div className="flex items-center gap-2">
                      <Moon className="w-4 h-4 text-indigo-500" />
                      Noite
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Prioridade</Label>
              <Select value={priority} onValueChange={(v) => setPriority(v as TaskPriority)}>
                <SelectTrigger className="h-12">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">
                    <div className="flex items-center gap-2">
                      <Info className="w-4 h-4 text-primary" />
                      Baixa
                    </div>
                  </SelectItem>
                  <SelectItem value="medium">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-warning" />
                      Média
                    </div>
                  </SelectItem>
                  <SelectItem value="high">
                    <div className="flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 text-destructive" />
                      Alta
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <Button 
            type="submit" 
            className="w-full h-12" 
            disabled={!title.trim() || isSubmitting}
          >
            {isSubmitting ? 'Criando...' : 'Criar Tarefa'}
          </Button>
        </form>
      </SheetContent>
    </Sheet>
  );
}
