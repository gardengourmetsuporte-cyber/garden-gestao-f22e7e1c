import { AppLayout } from '@/components/layout/AppLayout';
import { ClipboardCheck, Plus, Clock } from 'lucide-react';

export default function ChecklistsPage() {
  return (
    <AppLayout>
      <div className="min-h-screen bg-background pb-24">
        {/* Header */}
        <header className="bg-card border-b sticky top-0 lg:top-0 z-40">
          <div className="px-4 py-4 lg:px-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-xl font-bold text-foreground">Checklists</h1>
                <p className="text-sm text-muted-foreground">Controle de tarefas</p>
              </div>
              <button
                className="w-12 h-12 rounded-xl bg-primary text-primary-foreground flex items-center justify-center active:scale-95 transition-transform shadow-lg"
              >
                <Plus className="w-6 h-6" />
              </button>
            </div>
          </div>
        </header>

        <div className="px-4 py-6 lg:px-6">
          {/* Coming Soon */}
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-20 h-20 rounded-2xl bg-primary/10 flex items-center justify-center mb-6">
              <ClipboardCheck className="w-10 h-10 text-primary" />
            </div>
            <h2 className="text-xl font-bold text-foreground mb-2">Em Breve</h2>
            <p className="text-muted-foreground max-w-sm">
              O módulo de checklists está em desenvolvimento. Em breve você poderá criar checklists de abertura, fechamento e limpeza.
            </p>
            
            <div className="mt-8 space-y-3 w-full max-w-sm">
              <div className="flex items-center gap-3 p-4 rounded-xl bg-card border">
                <Clock className="w-5 h-5 text-muted-foreground" />
                <div className="text-left">
                  <p className="font-medium">Checklist de Abertura</p>
                  <p className="text-sm text-muted-foreground">Em desenvolvimento</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-4 rounded-xl bg-card border">
                <Clock className="w-5 h-5 text-muted-foreground" />
                <div className="text-left">
                  <p className="font-medium">Checklist de Fechamento</p>
                  <p className="text-sm text-muted-foreground">Em desenvolvimento</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-4 rounded-xl bg-card border">
                <Clock className="w-5 h-5 text-muted-foreground" />
                <div className="text-left">
                  <p className="font-medium">Checklist de Limpeza</p>
                  <p className="text-sm text-muted-foreground">Em desenvolvimento</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
