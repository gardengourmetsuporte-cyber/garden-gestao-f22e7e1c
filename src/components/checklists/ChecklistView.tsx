import { useState, useEffect, useCallback, useRef } from 'react';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { 
  ChefHat, 
  UtensilsCrossed, 
  Wallet, 
  Bath, 
  Folder,
  Check,
  ChevronDown,
  ChevronRight,
  Clock,
  User,
  Lock,
  Star,
  RefreshCw,
  Users,
  Sparkles
} from 'lucide-react';
import { ChecklistSector, ChecklistType, ChecklistCompletion, Profile } from '@/types/database';
import { cn } from '@/lib/utils';
import { useCoinAnimation } from '@/contexts/CoinAnimationContext';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { getPointsColors } from '@/lib/points';
import { supabase } from '@/integrations/supabase/client';

interface ChecklistViewProps {
  sectors: ChecklistSector[];
  checklistType: ChecklistType;
  date: string;
  completions: ChecklistCompletion[];
  isItemCompleted: (itemId: string) => boolean;
  onToggleItem: (itemId: string, points: number, completedByUserId?: string) => void;
  getCompletionProgress: (sectorId: string) => { completed: number; total: number };
  currentUserId?: string;
  isAdmin: boolean;
}

const isToday = (dateStr: string): boolean => {
  const today = new Date();
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
  return dateStr === todayStr;
};

const iconMap: Record<string, React.ReactNode> = {
  ChefHat: <ChefHat className="w-5 h-5" />,
  UtensilsCrossed: <UtensilsCrossed className="w-5 h-5" />,
  Wallet: <Wallet className="w-5 h-5" />,
  Bath: <Bath className="w-5 h-5" />,
  Folder: <Folder className="w-5 h-5" />,
};

export function ChecklistView({
  sectors,
  checklistType,
  date,
  completions,
  isItemCompleted,
  onToggleItem,
  getCompletionProgress,
  currentUserId,
  isAdmin,
}: ChecklistViewProps) {
  const { triggerCoin } = useCoinAnimation();
  const [expandedSectors, setExpandedSectors] = useState<Set<string>>(new Set(sectors.map(s => s.id)));
  const [expandedSubcategories, setExpandedSubcategories] = useState<Set<string>>(new Set());
  const [openPopover, setOpenPopover] = useState<string | null>(null);
  const [profiles, setProfiles] = useState<Pick<Profile, 'user_id' | 'full_name'>[]>([]);
  // Optimistic toggles for instant UI feedback
  const [optimisticToggles, setOptimisticToggles] = useState<Set<string>>(new Set());
  // Recently completed items for burst animation
  const [recentlyCompleted, setRecentlyCompleted] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (isAdmin) {
      supabase
        .from('profiles')
        .select('user_id, full_name')
        .order('full_name')
        .then(({ data }) => {
          if (data) setProfiles(data);
        });
    }
  }, [isAdmin]);

  // Keep sectors expanded when they change
  useEffect(() => {
    setExpandedSectors(new Set(sectors.map(s => s.id)));
  }, [sectors]);

  // Clear optimistic toggles when completions update — only if there are pending toggles
  useEffect(() => {
    setOptimisticToggles(prev => prev.size > 0 ? new Set() : prev);
  }, [completions]);

  const toggleSector = (sectorId: string) => {
    setExpandedSectors(prev => {
      const newSet = new Set(prev);
      if (newSet.has(sectorId)) newSet.delete(sectorId);
      else newSet.add(sectorId);
      return newSet;
    });
  };

  const toggleSubcategory = (subcategoryId: string) => {
    setExpandedSubcategories(prev => {
      const newSet = new Set(prev);
      if (newSet.has(subcategoryId)) newSet.delete(subcategoryId);
      else newSet.add(subcategoryId);
      return newSet;
    });
  };

  const getTypeLabel = (type: ChecklistType) => {
    switch (type) {
      case 'abertura': return 'Abertura';
      case 'fechamento': return 'Fechamento';
      default: return 'Abertura';
    }
  };

  const totalProgress = sectors.reduce(
    (acc, sector) => {
      const progress = getCompletionProgress(sector.id);
      return {
        completed: acc.completed + progress.completed,
        total: acc.total + progress.total,
      };
    },
    { completed: 0, total: 0 }
  );

  const progressPercent = totalProgress.total > 0 
    ? Math.round((totalProgress.completed / totalProgress.total) * 100) 
    : 0;

  const isTodayDate = isToday(date);

  const canToggleItem = (completion: ChecklistCompletion | undefined, completed: boolean) => {
    if (!isAdmin && !isTodayDate) return false;
    if (!completed) return true;
    if (isAdmin) return true;
    if (completion?.completed_by === currentUserId) return true;
    return false;
  };

  const getMotivationalMessage = () => {
    if (progressPercent === 100) return "🎉 Excelente! Tudo concluído!";
    if (progressPercent >= 75) return "💪 Quase lá! Continue assim!";
    if (progressPercent >= 50) return "👍 Bom progresso!";
    if (progressPercent >= 25) return "🚀 Você está indo bem!";
    return "☕ Vamos começar!";
  };

  // Optimistic item completed check
  const isItemCompletedOptimistic = useCallback((itemId: string) => {
    if (optimisticToggles.has(itemId)) {
      // Optimistic toggle inverts the real state
      return !isItemCompleted(itemId);
    }
    return isItemCompleted(itemId);
  }, [isItemCompleted, optimisticToggles]);

  const handleComplete = (itemId: string, points: number, configuredPoints: number, completedByUserId?: string, buttonElement?: HTMLElement) => {
    // Optimistic toggle
    setOptimisticToggles(prev => {
      const next = new Set(prev);
      next.add(itemId);
      return next;
    });

    // Burst animation for completion
    if (points > 0) {
      setRecentlyCompleted(prev => {
        const next = new Set(prev);
        next.add(itemId);
        return next;
      });
      setTimeout(() => {
        setRecentlyCompleted(prev => {
          const next = new Set(prev);
          next.delete(itemId);
          return next;
        });
      }, 600);
    }

    if (points > 0 && buttonElement) {
      const rect = buttonElement.getBoundingClientRect();
      for (let i = 0; i < points; i++) {
        setTimeout(() => {
          triggerCoin(rect.right - 40 + (i * 10), rect.top + rect.height / 2, configuredPoints);
        }, i * 100);
      }
    }
    onToggleItem(itemId, points, completedByUserId);
    setOpenPopover(null);
  };

  return (
    <div className="space-y-4">
      {/* Progress Header */}
      <div className={cn(
        "card-command p-5 transition-all duration-700 ease-out animate-fade-in",
        progressPercent === 100 && "card-command-success ring-2 ring-success/20"
      )}>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-bold text-lg text-foreground flex items-center gap-2">
              {getTypeLabel(checklistType)}
              {progressPercent === 100 && (
                <Sparkles className="w-5 h-5 text-success animate-pulse" />
              )}
            </h3>
            <p className="text-sm text-muted-foreground">
              {format(parseISO(date + 'T12:00:00'), "EEEE, d 'de' MMMM", { locale: ptBR })}
            </p>
          </div>
          <div className="text-right">
            <div className={cn(
              "text-3xl font-black transition-all duration-500",
              progressPercent === 100 ? "text-success scale-110" : "text-primary"
            )}>
              {progressPercent}%
            </div>
            <p className="text-xs text-muted-foreground font-medium">
              {totalProgress.completed} de {totalProgress.total}
            </p>
          </div>
        </div>
        
        {/* Progress Bar */}
        <div className="h-3 bg-secondary/50 rounded-full overflow-hidden">
          <div
            className={cn(
              "h-full rounded-full transition-all duration-700 ease-out",
              progressPercent === 100 ? "bg-success" : "bg-primary"
            )}
            style={{ 
              width: `${progressPercent}%`,
              boxShadow: progressPercent === 100 
                ? '0 0 16px hsl(var(--neon-green) / 0.5), 0 0 32px hsl(var(--neon-green) / 0.2)' 
                : '0 0 12px hsl(var(--primary) / 0.3)' 
            }}
          />
        </div>
        
        {/* Motivational Message */}
        <p className={cn(
          "text-center mt-3 text-sm font-medium transition-all duration-500",
          progressPercent === 100 ? "text-success" : "text-muted-foreground"
        )}>
          {getMotivationalMessage()}
        </p>
      </div>

      {/* Sectors */}
      {sectors.map((sector, sectorIndex) => {
        const isExpanded = expandedSectors.has(sector.id);
        const progress = getCompletionProgress(sector.id);
        const sectorComplete = progress.total > 0 && progress.completed === progress.total;

        return (
          <div 
            key={sector.id} 
            className="space-y-2 animate-fade-in"
            style={{ animationDelay: `${sectorIndex * 80}ms` }}
          >
            {/* Sector Header */}
            <button
              onClick={() => toggleSector(sector.id)}
              className={cn(
                "w-full flex items-center justify-between p-4 rounded-xl transition-all duration-300",
                sectorComplete 
                  ? "card-command-success ring-1 ring-success/20" 
                  : "card-command hover:shadow-lg"
              )}
            >
              <div className="flex items-center gap-3">
                <div
                  className={cn(
                    "w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-500",
                    sectorComplete ? "bg-success/20 text-success scale-110" : "text-white"
                  )}
                  style={{ backgroundColor: sectorComplete ? undefined : sector.color }}
                >
                  {sectorComplete ? (
                    <Check className="w-5 h-5 animate-scale-in" />
                  ) : (
                    iconMap[sector.icon || 'Folder']
                  )}
                </div>
                <div className="text-left">
                  <p className={cn(
                    "font-semibold transition-colors duration-300",
                    sectorComplete ? "text-success" : "text-foreground"
                  )}>
                    {sector.name}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {progress.completed}/{progress.total} concluídos
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-12 h-1.5 bg-secondary rounded-full overflow-hidden">
                  <div
                    className={cn(
                      "h-full transition-all duration-500",
                      sectorComplete ? "bg-success" : "bg-primary"
                    )}
                    style={{ width: `${progress.total > 0 ? (progress.completed / progress.total) * 100 : 0}%` }}
                  />
                </div>
                <div className={cn(
                  "transition-transform duration-300",
                  isExpanded ? "rotate-0" : "-rotate-90"
                )}>
                  <ChevronDown className="w-5 h-5 text-muted-foreground" />
                </div>
              </div>
            </button>

            {/* Subcategories — animated collapse */}
            <div className={cn(
              "overflow-hidden transition-all duration-300 ease-out",
              isExpanded ? "max-h-[5000px] opacity-100" : "max-h-0 opacity-0"
            )}>
              {sector.subcategories?.map((subcategory, subIndex) => {
                const isSubExpanded = expandedSubcategories.has(subcategory.id);
                const activeItems = subcategory.items?.filter(i => i.is_active && (i as any).checklist_type === checklistType) || [];
                const completedItems = activeItems.filter(i => isItemCompletedOptimistic(i.id));
                const subComplete = activeItems.length > 0 && completedItems.length === activeItems.length;

                if (activeItems.length === 0) return null;

                return (
                  <div 
                    key={subcategory.id} 
                    className="ml-4 space-y-1 mb-2 animate-fade-in"
                    style={{ animationDelay: `${subIndex * 50}ms` }}
                  >
                    {/* Subcategory Header */}
                    <button
                      onClick={() => toggleSubcategory(subcategory.id)}
                      className={cn(
                        "w-full flex items-center justify-between p-3 rounded-xl transition-all duration-300",
                        subComplete 
                          ? "bg-success/8 border border-success/15" 
                          : "bg-secondary/50 hover:bg-secondary"
                      )}
                    >
                      <div className="flex items-center gap-2">
                        {subComplete ? (
                          <Check className="w-4 h-4 text-success animate-scale-in" />
                        ) : (
                          <Clock className="w-4 h-4 text-muted-foreground" />
                        )}
                        <span className={cn(
                          "font-medium transition-colors duration-300",
                          subComplete ? "text-success" : "text-foreground"
                        )}>
                          {subcategory.name}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          ({completedItems.length}/{activeItems.length})
                        </span>
                      </div>
                      <div className={cn(
                        "transition-transform duration-300",
                        isSubExpanded ? "rotate-0" : "-rotate-90"
                      )}>
                        <ChevronDown className="w-4 h-4 text-muted-foreground" />
                      </div>
                    </button>

                    {/* Items — animated collapse */}
                    <div className={cn(
                      "overflow-hidden transition-all duration-300 ease-out",
                      isSubExpanded ? "max-h-[3000px] opacity-100" : "max-h-0 opacity-0"
                    )}>
                      <div className="ml-4 space-y-1.5 pt-1">
                        {activeItems.map((item, itemIndex) => {
                          const completed = isItemCompletedOptimistic(item.id);
                          const completion = completions.find(c => c.item_id === item.id);
                          const canToggle = canToggleItem(completion, completed);
                          const isLockedByOther = completed && !canToggle;
                          const wasAwardedPoints = completion?.awarded_points !== false;
                          const pointsAwarded = completion?.points_awarded ?? item.points;
                          const configuredPoints = item.points ?? 1;
                          const isJustCompleted = recentlyCompleted.has(item.id);

                          if (completed) {
                            return (
                              <button
                                key={item.id}
                                onClick={() => {
                                  if (!canToggle) return;
                                  // Optimistic uncheck
                                  setOptimisticToggles(prev => {
                                    const next = new Set(prev);
                                    next.add(item.id);
                                    return next;
                                  });
                                  onToggleItem(item.id, 0);
                                }}
                                disabled={!canToggle}
                                className={cn(
                                  "w-full flex items-start gap-4 p-4 rounded-xl transition-all duration-300",
                                  !canToggle && "cursor-not-allowed opacity-80",
                                  canToggle && "active:scale-[0.97] hover:shadow-md",
                                  "bg-gradient-to-r from-success/15 to-success/5 border-2 border-success/30",
                                  isJustCompleted && "animate-scale-in"
                                )}
                                style={{ animationDelay: `${itemIndex * 40}ms` }}
                              >
                                <div className={cn(
                                  "w-8 h-8 rounded-xl flex items-center justify-center shrink-0 bg-success text-white shadow-lg shadow-success/30 transition-all duration-300",
                                  isJustCompleted && "scale-125"
                                )}>
                                  <Check className="w-5 h-5" />
                                </div>
                                <div className="flex-1 text-left">
                                  <div className="flex items-center gap-2">
                                    <p className="font-medium text-success line-through">
                                      {item.name}
                                    </p>
                                    {isLockedByOther && (
                                      <Lock className="w-3.5 h-3.5 text-muted-foreground" />
                                    )}
                                  </div>
                                  {item.description && (
                                    <p className="text-xs text-muted-foreground">
                                      {item.description}
                                    </p>
                                  )}
                                  {completion && (
                                    <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
                                      <User className="w-3 h-3" />
                                      <span>
                                        {completion.profile?.full_name || 'Usuário'} às{' '}
                                        {format(new Date(completion.completed_at), 'HH:mm')}
                                      </span>
                                      {!wasAwardedPoints && (
                                        <span className="text-primary ml-1">(já pronto)</span>
                                      )}
                                    </div>
                                  )}
                                </div>
                                {/* Points badge */}
                                <div
                                  className={cn(
                                    "flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium shrink-0 border transition-all duration-300",
                                    !wasAwardedPoints
                                      ? "bg-primary/10 text-primary border-primary/20"
                                      : "border-border"
                                  )}
                                  style={
                                    wasAwardedPoints && pointsAwarded > 0
                                      ? {
                                          backgroundColor: getPointsColors(pointsAwarded).bg,
                                          color: getPointsColors(pointsAwarded).color,
                                          borderColor: getPointsColors(pointsAwarded).border,
                                        }
                                      : undefined
                                  }
                                >
                                  {!wasAwardedPoints ? (
                                    <>
                                      <RefreshCw className="w-3 h-3" />
                                      <span>pronto</span>
                                    </>
                                  ) : (
                                    <div className="flex items-center gap-0.5">
                                      {pointsAwarded > 0 &&
                                        Array.from({ length: pointsAwarded }).map((_, i) => {
                                          const colors = getPointsColors(pointsAwarded);
                                          return (
                                            <Star
                                              key={i}
                                              className="w-3 h-3"
                                              style={{ color: colors.color, fill: colors.color }}
                                            />
                                          );
                                        })}
                                      <span className="ml-0.5">+{pointsAwarded}</span>
                                    </div>
                                  )}
                                </div>
                              </button>
                            );
                          }

                          // Not completed
                          return (
                            <Popover 
                              key={item.id} 
                              open={openPopover === item.id} 
                              onOpenChange={(open) => setOpenPopover(open ? item.id : null)}
                            >
                              <PopoverTrigger asChild>
                                <button
                                  disabled={!canToggle}
                                  className={cn(
                                    "w-full flex items-start gap-4 p-4 rounded-xl transition-all duration-200",
                                    !canToggle && "cursor-not-allowed opacity-80",
                                    canToggle && "active:scale-[0.97] hover:shadow-md hover:border-primary/40",
                                    "card-base border-2"
                                  )}
                                  style={{ animationDelay: `${itemIndex * 40}ms` }}
                                >
                                  <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0 border-2 border-muted-foreground/30 bg-background transition-all duration-300 hover:border-primary/50 hover:bg-primary/5" />
                                  <div className="flex-1 text-left">
                                    <p className="font-medium text-foreground">
                                      {item.name}
                                    </p>
                                    {item.description && (
                                      <p className="text-xs text-muted-foreground">
                                        {item.description}
                                      </p>
                                    )}
                                  </div>
                                  {/* Points badge */}
                                  {configuredPoints > 0 ? (
                                    <div
                                      className="flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium shrink-0 border transition-all duration-200"
                                      style={{
                                        backgroundColor: getPointsColors(configuredPoints).bg,
                                        color: getPointsColors(configuredPoints).color,
                                        borderColor: getPointsColors(configuredPoints).border,
                                      }}
                                    >
                                      <Star
                                        className="w-3 h-3"
                                        style={{
                                          color: getPointsColors(configuredPoints).color,
                                          fill: getPointsColors(configuredPoints).color,
                                        }}
                                      />
                                      <span>+{configuredPoints}</span>
                                    </div>
                                  ) : (
                                    <div className="flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium shrink-0 bg-muted text-muted-foreground">
                                      <span>sem pts</span>
                                    </div>
                                  )}
                                </button>
                              </PopoverTrigger>
                              <PopoverContent className="w-72 p-3 animate-scale-in" align="end">
                                <div className="space-y-3">
                                  {/* Admin: User selector */}
                                  {isAdmin && profiles.length > 0 && (
                                    <>
                                      <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                                        <Users className="w-4 h-4" />
                                        <span>Quem realizou?</span>
                                      </div>
                                      <div className="max-h-32 overflow-y-auto space-y-1">
                                        {profiles.map((profile) => (
                                          <button
                                            key={profile.user_id}
                                            onClick={(e) => {
                                              handleComplete(item.id, configuredPoints, configuredPoints, profile.user_id, e.currentTarget);
                                            }}
                                            className={cn(
                                              "w-full flex items-center gap-2 p-2 rounded-lg text-left transition-all duration-200 text-sm",
                                              profile.user_id === currentUserId
                                                ? "bg-primary/10 hover:bg-primary/20 text-primary font-medium"
                                                : "hover:bg-secondary text-foreground"
                                            )}
                                          >
                                            <User className="w-4 h-4 shrink-0" />
                                            <span className="truncate">{profile.full_name}</span>
                                            {profile.user_id === currentUserId && (
                                              <span className="text-xs text-muted-foreground ml-auto">(eu)</span>
                                            )}
                                          </button>
                                        ))}
                                      </div>
                                      <div className="border-t border-border" />
                                    </>
                                  )}

                                  {/* Non-admin: Completion options */}
                                  {!isAdmin && (
                                    <>
                                      <button
                                        onClick={(e) => handleComplete(item.id, configuredPoints, configuredPoints, undefined, e.currentTarget)}
                                        className="w-full flex items-center gap-3 p-3 rounded-xl bg-success/10 hover:bg-success/20 text-left transition-all duration-200 border-2 border-success/30 active:scale-[0.97]"
                                      >
                                        <div className="w-10 h-10 bg-success rounded-xl flex items-center justify-center shadow-lg shadow-success/20">
                                          <Check className="w-5 h-5 text-success-foreground" />
                                        </div>
                                        <div className="flex-1">
                                          <p className="font-semibold text-success">Concluí agora</p>
                                          {configuredPoints > 0 ? (
                                            <div className="flex items-center gap-0.5 mt-0.5">
                                              {Array.from({ length: configuredPoints }).map((_, i) => (
                                                <Star
                                                  key={i}
                                                  className="w-3 h-3"
                                                  style={{
                                                    color: getPointsColors(configuredPoints).color,
                                                    fill: getPointsColors(configuredPoints).color,
                                                  }}
                                                />
                                              ))}
                                              <span
                                                className="text-xs font-bold ml-0.5"
                                                style={{ color: getPointsColors(configuredPoints).color }}
                                              >
                                                +{configuredPoints}
                                              </span>
                                            </div>
                                          ) : (
                                            <span className="text-xs text-muted-foreground">Tarefa sem pontos</span>
                                          )}
                                        </div>
                                      </button>
                                      
                                      {configuredPoints > 0 && (
                                        <>
                                          <div className="border-t border-border" />
                                          <button
                                            onClick={(e) => handleComplete(item.id, 0, configuredPoints, undefined, e.currentTarget)}
                                            className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-secondary text-left transition-all duration-200 active:scale-[0.97]"
                                          >
                                            <div className="w-10 h-10 bg-secondary rounded-xl flex items-center justify-center">
                                              <RefreshCw className="w-5 h-5 text-muted-foreground" />
                                            </div>
                                            <div>
                                              <p className="font-semibold text-foreground">Já estava pronto</p>
                                              <p className="text-xs text-muted-foreground">Sem pontos</p>
                                            </div>
                                          </button>
                                        </>
                                      )}
                                    </>
                                  )}

                                  {/* Admin: Already done */}
                                  {isAdmin && configuredPoints > 0 && (
                                    <button
                                      onClick={(e) => handleComplete(item.id, 0, configuredPoints, currentUserId, e.currentTarget)}
                                      className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-secondary text-left transition-all duration-200 active:scale-[0.97]"
                                    >
                                      <div className="w-10 h-10 bg-secondary rounded-xl flex items-center justify-center">
                                        <RefreshCw className="w-5 h-5 text-muted-foreground" />
                                      </div>
                                      <div>
                                        <p className="font-semibold text-foreground">Já estava pronto</p>
                                        <p className="text-xs text-muted-foreground">Sem pontos (eu marquei)</p>
                                      </div>
                                    </button>
                                  )}
                                </div>
                              </PopoverContent>
                            </Popover>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}

      {sectors.length === 0 && (
        <div className="text-center py-12 text-muted-foreground animate-fade-in">
          <Folder className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p className="font-medium">Nenhum setor configurado</p>
          <p className="text-sm mt-1">Adicione setores nas configurações</p>
        </div>
      )}
    </div>
  );
}
