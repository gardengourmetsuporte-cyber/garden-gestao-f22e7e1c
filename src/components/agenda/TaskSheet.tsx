import { useState } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { CalendarIcon, Clock, AlertCircle, AlertTriangle, Info } from 'lucide-react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import type { TaskPriority } from '@/types/agenda';

interface TaskSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (task: { 
    title: string; 
    notes?: string;
    due_date?: string; 
    due_time?: string;
    priority: TaskPriority 
  }) => void;
  isSubmitting?: boolean;
}

export function TaskSheet({ open, onOpenChange, onSubmit, isSubmitting }: TaskSheetProps) {
  const [title, setTitle] = useState('');
  const [notes, setNotes] = useState('');
  const [hasDate, setHasDate] = useState(true);
  const [dueDate, setDueDate] = useState<Date>(new Date());
  const [hasTime, setHasTime] = useState(false);
  const [dueTime, setDueTime] = useState('09:00');
  const [priority, setPriority] = useState<TaskPriority>('medium');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    
    onSubmit({ 
      title: title.trim(), 
      notes: notes.trim() || undefined,
      due_date: hasDate ? format(dueDate, 'yyyy-MM-dd') : undefined,
      due_time: hasTime ? dueTime : undefined,
      priority 
    });
    
    setTitle('');
    setNotes('');
    setHasDate(true);
    setDueDate(new Date());
    setHasTime(false);
    setDueTime('09:00');
    setPriority('medium');
    onOpenChange(false);
  };

  const priorityOptions = [
    { value: 'low', label: 'Baixa', icon: Info, color: 'text-primary' },
    { value: 'medium', label: 'Média', icon: AlertTriangle, color: 'text-warning' },
    { value: 'high', label: 'Alta', icon: AlertCircle, color: 'text-destructive' },
  ];

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="h-auto max-h-[85vh] rounded-t-2xl overflow-y-auto">
        <SheetHeader className="text-left">
          <SheetTitle>Novo Lembrete</SheetTitle>
          <SheetDescription>
            Adicione um lembrete com data opcional
          </SheetDescription>
        </SheetHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-4 pb-4">
          {/* Title & Notes Card */}
          <div className="bg-muted/50 rounded-xl p-3 space-y-2">
            <Input
              placeholder="Título"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="h-11 border-0 bg-transparent px-0 text-base font-medium focus-visible:ring-0"
              autoFocus
            />
            <Textarea
              placeholder="Notas"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="min-h-[60px] border-0 bg-transparent px-0 resize-none focus-visible:ring-0"
            />
          </div>

          {/* Date & Time Card */}
          <div className="bg-muted/50 rounded-xl divide-y divide-border">
            <div className="flex items-center justify-between p-3">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-destructive/10">
                  <CalendarIcon className="w-4 h-4 text-destructive" />
                </div>
                <div>
                  <p className="font-medium text-sm">Data</p>
                  {hasDate && (
                    <Popover>
                      <PopoverTrigger asChild>
                        <button className="text-xs text-primary hover:underline">
                          {format(dueDate, "d 'de' MMMM", { locale: ptBR })}
                        </button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={dueDate}
                          onSelect={(date) => date && setDueDate(date)}
                          locale={ptBR}
                        />
                      </PopoverContent>
                    </Popover>
                  )}
                </div>
              </div>
              <Switch checked={hasDate} onCheckedChange={setHasDate} />
            </div>

            <div className="flex items-center justify-between p-3">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Clock className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <p className="font-medium text-sm">Horário</p>
                  {hasTime && (
                    <input 
                      type="time" 
                      value={dueTime}
                      onChange={(e) => setDueTime(e.target.value)}
                      className="text-xs text-primary bg-transparent border-none p-0"
                    />
                  )}
                </div>
              </div>
              <Switch checked={hasTime} onCheckedChange={setHasTime} />
            </div>
          </div>

          {/* Priority Card */}
          <div className="bg-muted/50 rounded-xl p-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-destructive/10">
                  <AlertCircle className="w-4 h-4 text-destructive" />
                </div>
                <p className="font-medium text-sm">Prioridade</p>
              </div>
              <Select value={priority} onValueChange={(v) => setPriority(v as TaskPriority)}>
                <SelectTrigger className="w-auto h-8 border-0 bg-transparent gap-2">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent align="end">
                  {priorityOptions.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      <div className="flex items-center gap-2">
                        <opt.icon className={cn('w-4 h-4', opt.color)} />
                        {opt.label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <Button 
            type="submit" 
            className="w-full h-12" 
            disabled={!title.trim() || isSubmitting}
          >
            {isSubmitting ? 'Criando...' : 'Criar Lembrete'}
          </Button>
        </form>
      </SheetContent>
    </Sheet>
  );
}