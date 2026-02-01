import { AppLayout } from '@/components/layout/AppLayout';
import { AdminDashboard } from '@/components/dashboard/AdminDashboard';
import { EmployeeDashboard } from '@/components/dashboard/EmployeeDashboard';
import { useAuth } from '@/contexts/AuthContext';

export default function DashboardPage() {
  const { isAdmin, isLoading } = useAuth();

  if (isLoading) {
    return (
      <AppLayout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-pulse text-muted-foreground">Carregando...</div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="min-h-screen bg-background pb-24">
        {/* Header */}
        <header className="bg-card border-b sticky top-0 lg:top-0 z-40">
          <div className="px-4 py-4 lg:px-6">
            <h1 className="text-xl font-bold text-foreground">Dashboard</h1>
            <p className="text-sm text-muted-foreground">
              {isAdmin ? 'Visão geral do sistema' : 'Seu progresso e conquistas'}
            </p>
          </div>
        </header>

        <div className="px-4 py-6 lg:px-6">
          {isAdmin ? <AdminDashboard /> : <EmployeeDashboard />}
        </div>
      </div>
    </AppLayout>
  );
}
