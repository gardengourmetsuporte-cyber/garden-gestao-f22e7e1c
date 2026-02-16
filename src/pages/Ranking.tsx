import { useState } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { AppIcon } from '@/components/ui/app-icon';
import { MyRankCard } from '@/components/ranking/MyRankCard';
import { ObjectivesList } from '@/components/ranking/ObjectivesList';
import { Leaderboard } from '@/components/dashboard/Leaderboard';
import { BonusGuide } from '@/components/employees/BonusGuide';
import { BonusPointSheet } from '@/components/employees/BonusPointSheet';
import { useAuth } from '@/contexts/AuthContext';
import { usePoints } from '@/hooks/usePoints';
import { useLeaderboard } from '@/hooks/useLeaderboard';
import { useBonusPoints } from '@/hooks/useBonusPoints';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Flame, Award } from 'lucide-react';

export default function Ranking() {
  const { user, profile, isAdmin } = useAuth();
  const { earned, monthlyScore, monthlyBonus } = usePoints();
  const { leaderboard, isLoading, selectedMonth, setSelectedMonth } = useLeaderboard();
  const { bonusPoints } = useBonusPoints();
  const [bonusSheetOpen, setBonusSheetOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<{ name: string; userId: string } | null>(null);

  const myPosition = leaderboard.find(e => e.user_id === user?.id)?.rank;

  return (
    <AppLayout>
      <div className="min-h-screen bg-background pb-24">
        {/* Header */}
        <div className="page-header-bar">
          <div className="page-header-content flex items-center gap-3">
            <div className="icon-glow icon-glow-md icon-glow-primary">
              <AppIcon name="Trophy" size={20} />
            </div>
            <div>
              <h1 className="page-title">Ranking & Pontos</h1>
              <p className="page-subtitle">Seu progresso, ranking e objetivos</p>
            </div>
          </div>
        </div>

        <div className="px-4 py-4 space-y-4">
          {/* My Rank Card */}
          <MyRankCard
            fullName={profile?.full_name || 'Usuário'}
            avatarUrl={profile?.avatar_url}
            earnedPoints={earned}
            monthlyScore={monthlyScore}
            leaderboardPosition={myPosition}
          />

          {/* Leaderboard */}
          <Leaderboard
            entries={leaderboard}
            currentUserId={user?.id}
            isLoading={isLoading}
            selectedMonth={selectedMonth}
            onMonthChange={setSelectedMonth}
          />

          {/* Objectives */}
          <ObjectivesList
            data={{
              totalCompletions: earned,
              earnedPoints: earned,
              totalRedemptions: 0,
            }}
          />

          {/* Bonus section */}
          <div className="card-command p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Flame className="w-4 h-4" style={{ color: 'hsl(var(--neon-amber))' }} />
                <h3 className="font-semibold text-sm text-foreground">Bônus do Mês</h3>
              </div>
              {monthlyBonus > 0 && (
                <Badge variant="outline" className="text-[10px]" style={{ borderColor: 'hsl(var(--neon-amber) / 0.5)', color: 'hsl(var(--neon-amber))' }}>
                  +{monthlyBonus} pts
                </Badge>
              )}
            </div>

            {bonusPoints.length > 0 ? (
              <div className="space-y-1.5 mb-3">
                {bonusPoints.map(bp => (
                  <div key={bp.id} className="flex items-center gap-2 p-2 rounded-lg bg-secondary/30">
                    <span className="text-sm">⭐</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-[11px] font-medium text-foreground truncate">{bp.reason}</p>
                      <p className="text-[9px] text-muted-foreground">{bp.type === 'auto' ? 'Automático' : 'Manual'}</p>
                    </div>
                    <span className="text-[11px] font-bold shrink-0" style={{ color: 'hsl(var(--neon-amber))' }}>+{bp.points}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-muted-foreground mb-3">Nenhum bônus recebido este mês</p>
            )}

            {isAdmin && (
              <Button
                size="sm"
                variant="outline"
                className="w-full"
                onClick={() => {
                  // Pick first employee from leaderboard that isn't current user
                  const target = leaderboard.find(e => e.user_id !== user?.id);
                  if (target) {
                    setSelectedEmployee({ name: target.full_name, userId: target.user_id });
                    setBonusSheetOpen(true);
                  }
                }}
              >
                <Award className="w-4 h-4 mr-2" />
                Dar Bônus a Funcionário
              </Button>
            )}
          </div>

          {/* Bonus Guide */}
          <BonusGuide />
        </div>
      </div>

      {selectedEmployee && (
        <BonusPointSheet
          open={bonusSheetOpen}
          onOpenChange={setBonusSheetOpen}
          employeeName={selectedEmployee.name}
          employeeUserId={selectedEmployee.userId}
        />
      )}
    </AppLayout>
  );
}
