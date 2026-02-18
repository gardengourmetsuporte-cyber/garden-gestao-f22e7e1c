import { useState } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { AppIcon } from '@/components/ui/app-icon';
import { MyRankCard } from '@/components/ranking/MyRankCard';
import { EloList } from '@/components/profile/EloList';
import { MedalList } from '@/components/profile/MedalList';
import { Leaderboard } from '@/components/dashboard/Leaderboard';
import { AnimatedTabs } from '@/components/ui/animated-tabs';
import { useAuth } from '@/contexts/AuthContext';
import { usePoints } from '@/hooks/usePoints';
import { useLeaderboard } from '@/hooks/useLeaderboard';
import { useProfile } from '@/hooks/useProfile';

type TabKey = 'ranking' | 'elos' | 'medalhas';

export default function Ranking() {
  const { user, profile } = useAuth();
  const { earned, monthlyScore } = usePoints();
  const { leaderboard, isLoading, selectedMonth, setSelectedMonth } = useLeaderboard();
  const { profile: userProfile } = useProfile(user?.id, leaderboard);
  const [activeTab, setActiveTab] = useState<TabKey>('ranking');

  const myPosition = leaderboard.find(e => e.user_id === user?.id)?.rank;

  return (
    <AppLayout>
      <div className="min-h-screen bg-background pb-24">
        <header className="page-header-bar">
          <div className="page-header-content">
            <h1 className="page-title">Ranking</h1>
          </div>
        </header>

        <div className="px-4 py-4 space-y-4">
          <MyRankCard
            fullName={profile?.full_name || 'Usuário'}
            avatarUrl={profile?.avatar_url}
            earnedPoints={earned}
            monthlyScore={monthlyScore}
            leaderboardPosition={myPosition}
          />

          <AnimatedTabs
            tabs={[
              { key: 'ranking', label: 'Ranking', icon: <AppIcon name="Trophy" size={14} /> },
              { key: 'elos', label: 'Elos', icon: <AppIcon name="Shield" size={14} /> },
              { key: 'medalhas', label: 'Medalhas', icon: <AppIcon name="Medal" size={14} /> },
            ]}
            activeTab={activeTab}
            onTabChange={(key) => setActiveTab(key as TabKey)}
          />

          <div className="animate-fade-in" key={activeTab}>
            {activeTab === 'ranking' && (
              <Leaderboard
                entries={leaderboard}
                currentUserId={user?.id}
                isLoading={isLoading}
                selectedMonth={selectedMonth}
                onMonthChange={setSelectedMonth}
              />
            )}
            {activeTab === 'elos' && <EloList earnedPoints={earned} />}
            {activeTab === 'medalhas' && userProfile && <MedalList medals={userProfile.medals} />}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
