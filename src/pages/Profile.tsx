import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { AppIcon } from '@/components/ui/app-icon';
import { ProfileHeader } from '@/components/profile/ProfileHeader';
import { EloList } from '@/components/profile/EloList';
import { MedalList } from '@/components/profile/MedalList';

import { useProfile } from '@/hooks/useProfile';
import { useLeaderboard } from '@/hooks/useLeaderboard';
import { useAuth } from '@/contexts/AuthContext';
import { useUnit } from '@/contexts/UnitContext';
import { formatPoints } from '@/lib/points';
import { PageLoader } from '@/components/PageLoader';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

export default function Profile() {
  const { userId } = useParams();
  const { user } = useAuth();
  const { activeUnitId } = useUnit();
  const navigate = useNavigate();
  const { leaderboard } = useLeaderboard();
  const queryClient = useQueryClient();
  

  const resolvedUserId = userId === 'me' ? user?.id : userId;
  const isOwnProfile = resolvedUserId === user?.id;
  const { profile, isLoading } = useProfile(resolvedUserId, leaderboard, activeUnitId);

  const handleSelectFrame = async (frame: string | null) => {
    if (!resolvedUserId) return;
    const { error } = await supabase
      .from('profiles')
      .update({ selected_frame: frame } as any)
      .eq('user_id', resolvedUserId);

    if (error) {
      toast.error('Erro ao salvar moldura');
      return;
    }
    toast.success('Moldura atualizada!');
    queryClient.invalidateQueries({ queryKey: ['profile', resolvedUserId] });
  };

  if (isLoading) return <AppLayout><PageLoader /></AppLayout>;
  if (!profile) return <AppLayout><div className="p-6 text-center text-muted-foreground">Perfil não encontrado</div></AppLayout>;

  return (
    <AppLayout>
      <div className="min-h-screen bg-background pb-24">
      <header className="page-header-bar">
        <div className="page-header-content flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="p-2 rounded-xl hover:bg-secondary transition-all">
            <AppIcon name="ArrowLeft" size={20} className="text-muted-foreground" />
          </button>
          <h1 className="page-title">Perfil</h1>
        </div>
      </header>

      <div className="p-4 space-y-4 max-w-lg mx-auto">
        <ProfileHeader
          fullName={profile.fullName}
          avatarUrl={profile.avatarUrl}
          jobTitle={profile.jobTitle}
          earnedPoints={profile.earned}
          selectedFrame={profile.selectedFrame}
          userId={profile.userId}
        />



        {/* Score do Mês - Card em destaque */}
        <div className="card-command p-4 space-y-3" style={{ borderColor: 'hsl(var(--warning) / 0.3)' }}>
          <div className="flex items-center gap-2 mb-1">
            <AppIcon name="Trophy" size={16} className="text-warning" />
            <h3 className="font-semibold text-sm text-warning">Score do Mês</h3>
          </div>
          <div className="flex items-center justify-center gap-2 py-2">
            <AppIcon name="Flame" size={24} className="text-warning" />
            <span className="text-3xl font-bold text-foreground">{formatPoints(profile.monthlyScore)}</span>
            <span className="text-sm text-muted-foreground">pts</span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="text-center p-2 rounded-lg" style={{ background: 'hsl(var(--neon-green) / 0.08)' }}>
              <div className="flex items-center justify-center gap-1 mb-0.5">
                <AppIcon name="TrendingUp" size={14} style={{ color: 'hsl(var(--neon-green))' }} />
              </div>
              <p className="text-base font-bold text-foreground">{formatPoints(profile.monthlyBase)}</p>
              <p className="text-[10px] text-muted-foreground">Base Mensal</p>
            </div>
            <div className="text-center p-2 rounded-lg" style={{ background: 'hsl(var(--neon-amber) / 0.08)' }}>
              <div className="flex items-center justify-center gap-1 mb-0.5">
                <AppIcon name="Flame" size={14} style={{ color: 'hsl(var(--neon-amber))' }} />
              </div>
              <p className="text-base font-bold" style={{ color: 'hsl(var(--neon-amber))' }}>{formatPoints(profile.monthlyBonus)}</p>
              <p className="text-[10px] text-muted-foreground">Bônus Mensal</p>
            </div>
          </div>
          {profile.leaderboardRank && (
            <div className="flex items-center justify-center gap-2 pt-2" style={{ borderTop: '1px solid hsl(var(--border) / 0.3)' }}>
              <AppIcon name="Trophy" size={16} style={{ color: 'hsl(var(--neon-amber))' }} />
              <span className="text-sm text-muted-foreground">
                Posição <span className="font-bold text-foreground">#{profile.leaderboardRank}</span> no ranking mensal
              </span>
            </div>
          )}
          <p className="text-[10px] text-center text-muted-foreground">
            O ranking é mensal e reinicia todo mês. Apenas o score mensal conta.
          </p>
        </div>

        {/* Bônus do Mês */}
        {profile.bonusPoints.length > 0 && (
          <div className="card-command p-4" style={{ borderColor: 'hsl(var(--neon-amber) / 0.2)' }}>
            <div className="flex items-center gap-2 mb-3">
              <AppIcon name="Flame" size={16} style={{ color: 'hsl(var(--neon-amber))' }} />
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

        {/* Histórico Total - Card secundário */}
        <div className="card-command p-4 space-y-3">
          <div className="flex items-center gap-2 mb-1">
            <AppIcon name="Star" size={16} className="text-muted-foreground" />
            <h3 className="font-semibold text-sm text-muted-foreground">Histórico Total</h3>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <div className="text-center">
              <div className="flex items-center justify-center gap-1 mb-1">
                <AppIcon name="Star" size={14} style={{ color: 'hsl(var(--neon-green))' }} />
              </div>
              <p className="text-lg font-bold text-foreground">{formatPoints(profile.earned)}</p>
              <p className="text-[10px] text-muted-foreground">Ganhos</p>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center gap-1 mb-1">
                <AppIcon name="TrendingDown" size={14} style={{ color: 'hsl(var(--neon-red))' }} />
              </div>
              <p className="text-lg font-bold text-foreground">{formatPoints(profile.spent)}</p>
              <p className="text-[10px] text-muted-foreground">Gastos</p>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center gap-1 mb-1">
                <AppIcon name="Coins" size={14} style={{ color: 'hsl(var(--neon-cyan))' }} />
              </div>
              <p className="text-lg font-bold text-foreground">{formatPoints(profile.balance)}</p>
              <p className="text-[10px] text-muted-foreground">Saldo</p>
            </div>
          </div>
        </div>

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

        {/* Elo Progression */}
        <EloList earnedPoints={profile.earned} />

        {/* Medals */}
        <MedalList medals={profile.medals} />
      </div>
      </div>


    </AppLayout>
  );
}
