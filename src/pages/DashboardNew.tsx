import { AppLayout } from '@/components/layout/AppLayout';
import { WidgetGrid } from '@/components/dashboard/WidgetGrid';
import { useAuth } from '@/contexts/AuthContext';

export default function DashboardPage() {
  const { isLoading } = useAuth();

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
      <WidgetGrid />
    </AppLayout>
  );
}
