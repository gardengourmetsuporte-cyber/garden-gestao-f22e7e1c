import { useAuth } from '@/contexts/AuthContext';

export function WelcomeWidget() {
  const { profile } = useAuth();

  const currentDate = new Date().toLocaleDateString('pt-BR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });

  return (
    <div className="card-command p-5 h-full flex flex-col justify-center">
      <h2 className="text-lg font-bold text-foreground">
        Olá, {profile?.full_name?.split(' ')[0] || 'Usuário'}! 👋
      </h2>
      <p className="text-muted-foreground text-xs mt-1 capitalize">{currentDate}</p>
    </div>
  );
}
