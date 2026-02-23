import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useUnit } from '@/contexts/UnitContext';
import { OnboardingWizard } from '@/components/onboarding/OnboardingWizard';
import { PageLoader } from '@/components/PageLoader';

export default function Onboarding() {
  const { user, isLoading } = useAuth();
  const { units, isLoading: unitsLoading } = useUnit();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isLoading && !user) {
      navigate('/auth', { replace: true });
    }
  }, [user, isLoading, navigate]);

  // If user already has units, skip onboarding
  useEffect(() => {
    if (!unitsLoading && units.length > 0) {
      navigate('/', { replace: true });
    }
  }, [units, unitsLoading, navigate]);

  if (isLoading || unitsLoading) return <PageLoader />;
  if (!user) return null;

  return (
    <OnboardingWizard onComplete={() => navigate('/', { replace: true })} />
  );
}
