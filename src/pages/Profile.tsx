import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Star, TrendingDown, Coins, Trophy, Award, Flame } from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { ProfileHeader } from '@/components/profile/ProfileHeader';
import { AchievementList } from '@/components/profile/AchievementList';
import { MedalList } from '@/components/profile/MedalList';
import { useProfile } from '@/hooks/useProfile';
import { useLeaderboard } from '@/hooks/useLeaderboard';
import { useAuth } from '@/contexts/AuthContext';
import { formatPoints } from '@/lib/points';
import { PageLoader } from '@/components/PageLoader';

export default function Profile() {
  const { userId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { leaderboard } = useLeaderboard();

  const resolvedUserId = userId === 'me' ? user?.id : userId;
  const { profile, isLoading } = useProfile(resolvedUserId, leaderboard);

  if (isLoading) return <AppLayout><PageLoader /></AppLayout>;
  if (!profile) return <AppLayout><div className="p-6 text-center text-muted-foreground">Perfil não encontrado</div></AppLayout>;

  return (
    <AppLayout>
      <div className="page-header-bar">
        <div className="page-header-content flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="p-2 rounded-xl hover:bg-secondary transition-all">
            <ArrowLeft className="w-5 h-5 text-muted-foreground" />
          </button>
          <h1 className="page-title">Perfil</h1>
        </div>
      </div>

      <div className="p-4 space-y-4 max-w-lg mx-auto">
        <ProfileHeader
          fullName={profile.fullName}
          avatarUrl={profile.avatarUrl}
          jobTitle={profile.jobTitle}
          earnedPoints={profile.earned}
        />

        {/* Points Card - 4 columns: Ganhos, Bônus, Gastos, Saldo */}
        <div className="card-command p-4 space-y-3">
          <div className="grid grid-cols-4 gap-2">
            <div className="text-center">
              <div className="flex items-center justify-center gap-1 mb-1">
                <Star className="w-3.5 h-3.5" style={{ color: 'hsl(var(--neon-green))' }} />
              </div>
              <p className="text-lg font-bold text-foreground">{formatPoints(profile.earned)}</p>
              <p className="text-[10px] text-muted-foreground">Ganhos</p>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center gap-1 mb-1">
                <Flame className="w-3.5 h-3.5" style={{ color: 'hsl(var(--neon-amber))' }} />
              </div>
              <p className="text-lg font-bold" style={{ color: 'hsl(var(--neon-amber))' }}>{formatPoints(profile.totalBonusPoints)}</p>
              <p className="text-[10px] text-muted-foreground">Bônus</p>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center gap-1 mb-1">
                <TrendingDown className="w-3.5 h-3.5" style={{ color: 'hsl(var(--neon-red))' }} />
              </div>
              <p className="text-lg font-bold text-foreground">{formatPoints(profile.spent)}</p>
              <p className="text-[10px] text-muted-foreground">Gastos</p>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center gap-1 mb-1">
                <Coins className="w-3.5 h-3.5" style={{ color: 'hsl(var(--neon-cyan))' }} />
              </div>
              <p className="text-lg font-bold text-foreground">{formatPoints(profile.balance)}</p>
              <p className="text-[10px] text-muted-foreground">Saldo</p>
            </div>
          </div>
          {profile.leaderboardRank && (
            <div className="flex items-center justify-center gap-2 pt-2" style={{ borderTop: '1px solid hsl(var(--border) / 0.3)' }}>
              <Trophy className="w-4 h-4" style={{ color: 'hsl(var(--neon-amber))' }} />
              <span className="text-sm text-muted-foreground">
                Posição <span className="font-bold text-foreground">#{profile.leaderboardRank}</span> no ranking
              </span>
            </div>
          )}
        </div>

        {/* Bonus do Mês */}
        {profile.bonusPoints.length > 0 && (
          <div className="card-command p-4" style={{ borderColor: 'hsl(var(--neon-amber) / 0.2)' }}>
            <div className="flex items-center gap-2 mb-3">
              <Flame className="w-4 h-4" style={{ color: 'hsl(var(--neon-amber))' }} />
              <h3 className="font-semibold text-sm" style={{ color: 'hsl(var(--neon-amber))' }}>
                Bônus do Mês (+{profile.totalBonusPoints} pts)
              </h3>
            </div>
            <div className="space-y-2">
              {profile.bonusPoints.map((bp, i) => (
                <div key={i} className="flex items-center justify-between py-1.5 px-2 rounded-lg" style={{ background: 'hsl(var(--neon-amber) / 0.06)' }}>
                  <span className="text-xs text-foreground truncate flex-1">{bp.reason}</span>
                  <span className="text-xs font-bold ml-2 shrink-0" style={{ color: 'hsl(var(--neon-amber))' }}>+{bp.points}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-2 gap-2">
          <div className="stat-command text-center">
            <p className="text-2xl font-bold text-foreground">{profile.totalCompletions}</p>
            <p className="text-xs text-muted-foreground">Tarefas completas</p>
          </div>
          <div className="stat-command text-center">
            <p className="text-2xl font-bold text-foreground">{profile.totalRedemptions}</p>
            <p className="text-xs text-muted-foreground">Resgates feitos</p>
          </div>
        </div>

        {/* Achievements */}
        <AchievementList achievements={profile.achievements} />

        {/* Medals */}
        <MedalList medals={profile.medals} />
      </div>
    </AppLayout>
  );
}
