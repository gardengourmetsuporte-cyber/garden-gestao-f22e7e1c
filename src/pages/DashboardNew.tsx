import { LayoutDashboard } from 'lucide-react';
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
        <header className="page-header">
          <div className="page-header-content">
            <div className="flex items-center gap-3">
              <div className="page-header-icon bg-primary/10">
                <LayoutDashboard className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h1 className="page-title">Dashboard</h1>
                <p className="page-subtitle">
                  {isAdmin ? 'Visão geral do sistema' : 'Seu progresso e conquistas'}
                </p>
              </div>
            </div>
          </div>
        </header>

        <div className="px-4 py-6 lg:px-6">
          {isAdmin ? <AdminDashboard /> : <EmployeeDashboard />}
        </div>
      </div>
    </AppLayout>
  );
}
