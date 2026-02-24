import { AppIcon } from '@/components/ui/app-icon';
import { Leaderboard } from './Leaderboard';
import { useLeaderboard } from '@/hooks/useLeaderboard';
import { useAuth } from '@/contexts/AuthContext';


export function EmployeeDashboard() {
  const { user, profile } = useAuth();
  const { leaderboard, isLoading: leaderboardLoading, selectedMonth, setSelectedMonth } = useLeaderboard();

  const userRank = leaderboard.find(e => e.user_id === user?.id)?.rank;

  return (
    <div className="space-y-5 p-4 lg:p-6">
      {/* Welcome Header */}
      <div className="animate-spring-in spring-stagger-1">
        <div className="card-surface p-5" style={{ border: 'none' }}>
          <h2 className="text-xl font-bold text-foreground">
            Olá, {profile?.full_name?.split(' ')[0] || 'Colaborador'}!
          </h2>
          <p className="text-muted-foreground text-xs mt-1">
            {userRank ? (
              <>Você está em <span className="font-bold text-primary">#{userRank}</span> no ranking mensal</>
            ) : (
              'Complete tarefas para ganhar pontos'
            )}
          </p>
        </div>
      </div>

      {/* Leaderboard */}
      <div className="animate-spring-in spring-stagger-2">
        <Leaderboard 
          entries={leaderboard}
          currentUserId={user?.id}
          isLoading={leaderboardLoading}
          selectedMonth={selectedMonth}
          onMonthChange={setSelectedMonth}
        />
      </div>
    </div>
  );
}
