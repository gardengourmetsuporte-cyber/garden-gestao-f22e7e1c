import { useState } from 'react';
import { useTeamAchievements, TeamMember } from '@/hooks/useTeamAchievements';
import { BonusGuide } from './BonusGuide';
import { RankedAvatar } from '@/components/profile/RankedAvatar';
import { AchievementList } from '@/components/profile/AchievementList';
import { MedalList } from '@/components/profile/MedalList';
import { AppIcon } from '@/components/ui/app-icon';
import { Skeleton } from '@/components/ui/skeleton';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

export function TeamAchievements() {
  const { members, isLoading } = useTeamAchievements();
  const [expandedId, setExpandedId] = useState<string | null>(null);

  if (isLoading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-32 w-full rounded-xl" />
        {[1, 2, 3].map(i => <Skeleton key={i} className="h-16 w-full rounded-xl" />)}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Guia de Bônus */}
      <BonusGuide />

      {/* Lista da Equipe */}
      <div className="space-y-3">
        <div className="flex items-center gap-2 px-1">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: 'hsl(var(--primary) / 0.15)' }}>
            <AppIcon name="Users" size={16} className="text-primary" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-foreground">Conquistas da Equipe</h3>
            <p className="text-[10px] text-muted-foreground">{members.length} membros ativos</p>
          </div>
        </div>

        {members.length === 0 ? (
          <div className="text-center py-10">
            <AppIcon name="Trophy" size={32} className="text-muted-foreground/30 mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">Nenhum membro com atividade ainda</p>
          </div>
        ) : (
          <div className="space-y-2">
            {members.map(member => (
              <TeamMemberCard
                key={member.user_id}
                member={member}
                isExpanded={expandedId === member.user_id}
                onToggle={() => setExpandedId(prev => prev === member.user_id ? null : member.user_id)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function TeamMemberCard({ member, isExpanded, onToggle }: { member: TeamMember; isExpanded: boolean; onToggle: () => void }) {
  return (
    <Collapsible open={isExpanded} onOpenChange={onToggle}>
      <CollapsibleTrigger asChild>
        <button className="card-command p-3 w-full flex items-center gap-3 text-left">
          <RankedAvatar avatarUrl={member.avatar_url} earnedPoints={member.earnedPoints} size={36} />
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-foreground truncate">{member.full_name}</p>
            <div className="flex items-center gap-3 mt-0.5">
              <span className="text-[10px] text-muted-foreground">
                🏅 {member.unlockedAchievements} conquistas
              </span>
              <span className="text-[10px] text-muted-foreground">
                🎖️ {member.unlockedMedals} medalhas
              </span>
              {member.bonusPoints > 0 && (
                <span className="text-[10px] font-semibold" style={{ color: 'hsl(var(--neon-amber))' }}>
                  🔥 +{member.bonusPoints} bônus
                </span>
              )}
            </div>
          </div>
          <AppIcon
            name="ChevronDown"
            size={16}
            className={cn("text-muted-foreground transition-transform shrink-0", isExpanded && "rotate-180")}
          />
        </button>
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div className="px-3 pb-3 space-y-4">
          <div className="pt-2 border-t border-border/30">
            <AchievementList achievements={member.achievements} />
          </div>
          <MedalList medals={member.medals} />
          <Link
            to={`/profile/${member.user_id}`}
            className="block text-center text-xs text-primary font-semibold py-2 hover:underline"
          >
            Ver perfil completo →
          </Link>
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}
