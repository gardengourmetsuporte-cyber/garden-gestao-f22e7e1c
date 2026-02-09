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
      <div className="min-h-screen pb-24">
          {isAdmin ? <AdminDashboard /> : <EmployeeDashboard />}
      </div>
    </AppLayout>
  );
}
