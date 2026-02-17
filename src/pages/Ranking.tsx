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
import { cn } from '@/lib/utils';

type TabKey = 'ranking' | 'objetivos' | 'bonus';

export default function Ranking() {
  const { user, profile, isAdmin } = useAuth();
  const { earned, monthlyScore, monthlyBonus } = usePoints();
  const { leaderboard, isLoading, selectedMonth, setSelectedMonth } = useLeaderboard();
  const { bonusPoints } = useBonusPoints();
  const [bonusSheetOpen, setBonusSheetOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<{ name: string; userId: string } | null>(null);
  const [activeTab, setActiveTab] = useState<TabKey>('ranking');

  const myPosition = leaderboard.find(e => e.user_id === user?.id)?.rank;

  const tabs: { key: TabKey; label: string; icon: string }[] = [
    { key: 'ranking', label: 'Ranking', icon: 'Trophy' },
    { key: 'objetivos', label: 'Objetivos', icon: 'Target' },
    { key: 'bonus', label: 'Bônus', icon: 'Flame' },
  ];

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

          {/* Tabs */}
          <div className="tab-command">
            {tabs.map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={cn(
                  "tab-command-item",
                  activeTab === tab.key ? "tab-command-active" : "tab-command-inactive"
                )}
              >
                <AppIcon name={tab.icon} size={14} />
                <span className="text-xs">{tab.label}</span>
              </button>
            ))}
          </div>

          {/* Tab Content */}
          {activeTab === 'ranking' && (
            <Leaderboard
              entries={leaderboard}
              currentUserId={user?.id}
              isLoading={isLoading}
              selectedMonth={selectedMonth}
              onMonthChange={setSelectedMonth}
            />
          )}

          {activeTab === 'objetivos' && (
            <ObjectivesList
              data={{
                totalCompletions: earned,
                earnedPoints: earned,
                totalRedemptions: 0,
              }}
            />
          )}

          {activeTab === 'bonus' && (
            <div className="space-y-4">
              {/* Current bonus points */}
              <div className="card-surface p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <AppIcon name="Flame" size={16} style={{ color: 'hsl(var(--neon-amber))' }} />
                    <h3 className="font-semibold text-sm text-foreground">Bônus do Mês</h3>
                  </div>
                  {monthlyBonus > 0 && (
                    <Badge variant="outline" className="text-xs" style={{ borderColor: 'hsl(var(--neon-amber) / 0.5)', color: 'hsl(var(--neon-amber))' }}>
                      +{monthlyBonus} pts
                    </Badge>
                  )}
                </div>

                {bonusPoints.length > 0 ? (
                  <div className="space-y-1.5">
                    {bonusPoints.map(bp => (
                      <div key={bp.id} className="flex items-center gap-2 p-2.5 rounded-lg bg-secondary/30">
                        <AppIcon name="Star" size={14} style={{ color: 'hsl(var(--neon-amber))' }} />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium text-foreground truncate">{bp.reason}</p>
                          <p className="text-xs text-muted-foreground">{bp.type === 'auto' ? 'Automático' : 'Manual'}</p>
                        </div>
                        <span className="text-xs font-bold shrink-0" style={{ color: 'hsl(var(--neon-amber))' }}>+{bp.points}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground">Nenhum bônus recebido este mês</p>
                )}

                {isAdmin && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="w-full mt-3"
                    onClick={() => {
                      const target = leaderboard.find(e => e.user_id !== user?.id);
                      if (target) {
                        setSelectedEmployee({ name: target.full_name, userId: target.user_id });
                        setBonusSheetOpen(true);
                      }
                    }}
                  >
                    <AppIcon name="Medal" size={14} className="mr-2" />
                    Dar Bônus a Funcionário
                  </Button>
                )}
              </div>

              {/* Bonus Guide */}
              <BonusGuide />
            </div>
          )}
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
