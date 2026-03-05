// Dashboard page
import { AppLayout } from '@/components/layout/AppLayout';
import { AdminDashboard } from '@/components/dashboard/AdminDashboard';
import { EmployeeDashboard } from '@/components/dashboard/EmployeeDashboard';
import { PageSkeleton } from '@/components/ui/page-skeleton';
import { useAuth } from '@/contexts/AuthContext';
import { useUnit } from '@/contexts/UnitContext';

export default function DashboardPage() {
  const { isAdmin, isLoading } = useAuth();
  const { isLoading: unitLoading } = useUnit();

  if (isLoading || unitLoading) {
    return (
      <AppLayout>
        <div className="min-h-screen pb-24 px-4 py-4">
          <PageSkeleton variant="dashboard" />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="min-h-screen pb-36">
          {isAdmin ? <AdminDashboard /> : <EmployeeDashboard />}
      </div>
    </AppLayout>
  );
}
