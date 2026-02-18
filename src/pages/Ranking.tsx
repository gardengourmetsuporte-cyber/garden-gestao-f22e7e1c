import { useState } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { AppIcon } from '@/components/ui/app-icon';
import { MyRankCard } from '@/components/ranking/MyRankCard';
import { EloList } from '@/components/profile/EloList';
import { MedalList } from '@/components/profile/MedalList';
import { Leaderboard } from '@/components/dashboard/Leaderboard';
import { useAuth } from '@/contexts/AuthContext';
import { usePoints } from '@/hooks/usePoints';
import { useLeaderboard } from '@/hooks/useLeaderboard';
import { useProfile } from '@/hooks/useProfile';
import { cn } from '@/lib/utils';

type TabKey = 'ranking' | 'elos' | 'medalhas';

export default function Ranking() {
  const { user, profile } = useAuth();
  const { earned, monthlyScore } = usePoints();
  const { leaderboard, isLoading, selectedMonth, setSelectedMonth } = useLeaderboard();
  const { profile: userProfile } = useProfile(user?.id, leaderboard);
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
          <div className="page-header-content">
            <h1 className="page-title">Ranking</h1>
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

          {activeTab === 'medalhas' && userProfile && (
            <MedalList medals={userProfile.medals} />
          )}
        </div>
      </div>
    </AppLayout>
  );
}
