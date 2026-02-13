import { useAuth } from '@/contexts/AuthContext';

interface WelcomeWidgetProps {
  size: 'medium' | 'large';
}

export function WelcomeWidget({ size }: WelcomeWidgetProps) {
  const { profile } = useAuth();

  const currentDate = new Date().toLocaleDateString('pt-BR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });

  return (
    <div className="card-command p-5">
      <h2 className={size === 'large' ? 'text-2xl font-bold text-foreground' : 'text-xl font-bold text-foreground'}>
        Olá, {profile?.full_name?.split(' ')[0] || 'Usuário'}! 👋
      </h2>
      <p className="text-muted-foreground text-xs mt-1 capitalize">{currentDate}</p>
    </div>
  );
}
