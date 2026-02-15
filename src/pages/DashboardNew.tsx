import { useState, useEffect } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { AdminDashboard } from '@/components/dashboard/AdminDashboard';
import { EmployeeDashboard } from '@/components/dashboard/EmployeeDashboard';
import { OnboardingWizard } from '@/components/onboarding/OnboardingWizard';
import { useAuth } from '@/contexts/AuthContext';
import { useUnit } from '@/contexts/UnitContext';

export default function DashboardPage() {
  const { isAdmin, isLoading } = useAuth();
  const { units, isLoading: unitsLoading } = useUnit();
  const [showOnboarding, setShowOnboarding] = useState(false);

  useEffect(() => {
    if (isLoading || unitsLoading) return;
    const done = localStorage.getItem('garden_onboarding_done');
    if (!done && isAdmin && units.length === 0) {
      setShowOnboarding(true);
    }
  }, [isLoading, unitsLoading, isAdmin, units.length]);

  if (isLoading) {
    return (
      <AppLayout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-pulse text-muted-foreground">Carregando...</div>
        </div>
      </AppLayout>
    );
  }

  if (showOnboarding) {
    return <OnboardingWizard onComplete={() => setShowOnboarding(false)} />;
  }

  return (
    <AppLayout>
      <div className="min-h-screen pb-24">
          {isAdmin ? <AdminDashboard /> : <EmployeeDashboard />}
      </div>
    </AppLayout>
  );
}
