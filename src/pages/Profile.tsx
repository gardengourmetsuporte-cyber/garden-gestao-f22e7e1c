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
        {/* Back button only - no title bar */}
        <div className="px-4 pt-3">
          <button onClick={() => navigate(-1)} className="p-2 rounded-xl hover:bg-secondary transition-all">
            <AppIcon name="ArrowLeft" size={20} className="text-muted-foreground" />
          </button>
        </div>

        <div className="p-4 space-y-4 max-w-lg mx-auto">
          {/* Profile Header - Avatar + Name + Rank Progress */}
          <ProfileHeader
            fullName={profile.fullName}
            avatarUrl={profile.avatarUrl}
            jobTitle={profile.jobTitle}
            earnedPoints={profile.earned}
            selectedFrame={profile.selectedFrame}
            userId={profile.userId}
          />

          {/* Score do Mês */}
          <div className="card-surface p-5 space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: 'hsl(var(--neon-amber) / 0.12)' }}>
                <AppIcon name="Trophy" size={20} style={{ color: 'hsl(var(--neon-amber))' }} />
              </div>
              <h3 className="font-bold text-base text-foreground font-display" style={{ letterSpacing: '-0.02em' }}>
                Score do Mês
              </h3>
            </div>

            <div className="flex items-center justify-center gap-2.5 py-2">
              <AppIcon name="Flame" size={30} style={{ color: 'hsl(var(--neon-amber))' }} />
              <span className="text-5xl font-black text-foreground font-display" style={{ letterSpacing: '-0.04em' }}>
                {formatPoints(profile.monthlyScore)}
              </span>
              <span className="text-sm text-muted-foreground mt-2">pts</span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="text-center p-4 rounded-xl bg-primary/8 border border-primary/15">
                <AppIcon name="TrendingUp" size={18} className="mx-auto mb-1.5 text-primary" />
                <p className="text-xl font-bold text-foreground">{formatPoints(profile.monthlyBase)}</p>
                <p className="text-[11px] text-muted-foreground mt-0.5">Base Mensal</p>
              </div>
              <div className="text-center p-4 rounded-xl border" style={{ background: 'hsl(var(--neon-amber) / 0.06)', borderColor: 'hsl(var(--neon-amber) / 0.12)' }}>
                <AppIcon name="Flame" size={18} className="mx-auto mb-1.5" style={{ color: 'hsl(var(--neon-amber))' }} />
                <p className="text-xl font-bold" style={{ color: 'hsl(var(--neon-amber))' }}>{formatPoints(profile.monthlyBonus)}</p>
                <p className="text-[11px] text-muted-foreground mt-0.5">Bônus Mensal</p>
              </div>
            </div>

            {profile.leaderboardRank && (
              <div className="flex items-center justify-center gap-2 pt-3 border-t border-border/30">
                <AppIcon name="Trophy" size={16} style={{ color: 'hsl(var(--neon-amber))' }} />
                <span className="text-sm text-muted-foreground">
                  Posição <span className="font-bold text-foreground">#{profile.leaderboardRank}</span> no ranking
                </span>
              </div>
            )}
          </div>

          {/* Bônus do Mês */}
          {profile.bonusPoints.length > 0 && (
            <div className="card-surface p-4 space-y-3">
              <div className="flex items-center gap-2">
                <AppIcon name="Flame" size={16} className="text-warning" />
                <h3 className="font-semibold text-sm text-warning">
                  Bônus do Mês (+{profile.totalBonusPoints} pts)
                </h3>
              </div>
              <div className="space-y-1.5">
                {profile.bonusPoints.map((bp, i) => (
                  <div key={i} className="flex items-center justify-between py-2 px-3 rounded-xl border border-border/30 bg-secondary/50">
                    <span className="text-xs text-foreground truncate flex-1">{bp.reason}</span>
                    <span className="text-xs font-bold ml-2 shrink-0 text-warning">+{bp.points}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Histórico + Stats combinados */}
          <div className="card-surface p-4 space-y-3">
            <div className="flex items-center gap-2">
              <AppIcon name="BarChart3" size={16} className="text-primary" />
              <h3 className="font-bold text-sm text-foreground font-display" style={{ letterSpacing: '-0.02em' }}>Resumo</h3>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div className="text-center p-3 rounded-xl border border-border/30 bg-secondary/50">
                <AppIcon name="Star" size={14} className="mx-auto mb-1 text-success" />
                <p className="text-lg font-bold text-foreground">{formatPoints(profile.earned)}</p>
                <p className="text-[10px] text-muted-foreground">Ganhos</p>
              </div>
              <div className="text-center p-3 rounded-xl border border-border/30 bg-secondary/50">
                <AppIcon name="ShoppingBag" size={14} className="mx-auto mb-1 text-destructive" />
                <p className="text-lg font-bold text-foreground">{formatPoints(profile.spent)}</p>
                <p className="text-[10px] text-muted-foreground">Gastos</p>
              </div>
              <div className="text-center p-3 rounded-xl border border-border/30 bg-secondary/50">
                <AppIcon name="Coins" size={14} className="mx-auto mb-1 text-primary" />
                <p className="text-lg font-bold text-foreground">{formatPoints(profile.balance)}</p>
                <p className="text-[10px] text-muted-foreground">Saldo</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-1">
              <div className="flex items-center gap-3 p-3 rounded-xl border border-border/30 bg-secondary/50">
                <AppIcon name="CheckCircle2" size={18} className="text-success shrink-0" />
                <div>
                  <p className="text-lg font-bold text-foreground">{profile.totalCompletions}</p>
                  <p className="text-[10px] text-muted-foreground">Tarefas</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 rounded-xl border border-border/30 bg-secondary/50">
                <AppIcon name="Gift" size={18} className="text-primary shrink-0" />
                <div>
                  <p className="text-lg font-bold text-foreground">{profile.totalRedemptions}</p>
                  <p className="text-[10px] text-muted-foreground">Resgates</p>
                </div>
              </div>
            </div>
          </div>

          {/* Elo Progression */}
          <div className="card-surface p-4">
            <EloList earnedPoints={profile.earned} />
          </div>

          {/* Medals */}
          <div className="card-surface p-4">
            <MedalList medals={profile.medals} />
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
