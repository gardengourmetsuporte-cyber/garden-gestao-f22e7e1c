import { useState } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { AppIcon } from '@/components/ui/app-icon';
import { MyRankCard } from '@/components/ranking/MyRankCard';
import { EloList } from '@/components/profile/EloList';
import { MedalList } from '@/components/profile/MedalList';
import { Leaderboard } from '@/components/dashboard/Leaderboard';
import { BonusGuide } from '@/components/employees/BonusGuide';
import { BonusPointSheet } from '@/components/employees/BonusPointSheet';
import { useAuth } from '@/contexts/AuthContext';
import { usePoints } from '@/hooks/usePoints';
import { useLeaderboard } from '@/hooks/useLeaderboard';
import { useBonusPoints } from '@/hooks/useBonusPoints';
import { useProfile } from '@/hooks/useProfile';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

type TabKey = 'ranking' | 'elos' | 'medalhas';

export default function Ranking() {
  const { user, profile, isAdmin } = useAuth();
  const { earned, monthlyScore } = usePoints();
  const { leaderboard, isLoading, selectedMonth, setSelectedMonth } = useLeaderboard();
  const { bonusPoints } = useBonusPoints();
  const { profile: userProfile } = useProfile(user?.id, leaderboard);
  const [bonusSheetOpen, setBonusSheetOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<{ name: string; userId: string } | null>(null);
  const [activeTab, setActiveTab] = useState<TabKey>('ranking');

  const myPosition = leaderboard.find(e => e.user_id === user?.id)?.rank;

  const tabs: { key: TabKey; label: string; icon: string }[] = [
    { key: 'ranking', label: 'Ranking', icon: 'Trophy' },
    { key: 'elos', label: 'Elos', icon: 'Shield' },
    { key: 'medalhas', label: 'Medalhas', icon: 'Medal' },
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
              <p className="page-subtitle">Ranking, progressão e medalhas</p>
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

          {activeTab === 'elos' && (
            <EloList earnedPoints={earned} />
          )}

          {activeTab === 'medalhas' && (
            <div className="space-y-4">
              {userProfile && (
                <MedalList medals={userProfile.medals} />
              )}

              {isAdmin && (
                <Button
                  size="sm"
                  variant="outline"
                  className="w-full"
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
