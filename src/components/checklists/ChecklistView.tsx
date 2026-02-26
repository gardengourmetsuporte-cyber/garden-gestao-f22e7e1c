import { useState, useEffect, useCallback, useRef } from 'react';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { 
  Check,
  ChevronDown,
  ChevronRight,
  Clock,
  User,
  Lock,
  Star,
  RefreshCw,
  Users,
  Sparkles,
  X,
  Zap,
  AlertTriangle,
  Send,
  Undo2
} from 'lucide-react';
import { AppIcon } from '@/components/ui/app-icon';
import { ICON_MAP } from '@/lib/iconMap';
import { ChecklistSector, ChecklistType, ChecklistCompletion, Profile } from '@/types/database';
import { cn } from '@/lib/utils';
import { useCoinAnimation } from '@/contexts/CoinAnimationContext';
// Inline expandable options — no Popover/Portal to avoid scroll issues
import { getPointsColors, getBonusPointsColors } from '@/lib/points';
import { supabase } from '@/integrations/supabase/client';

interface ChecklistViewProps {
  sectors: ChecklistSector[];
  checklistType: ChecklistType;
  date: string;
  completions: ChecklistCompletion[];
  isItemCompleted: (itemId: string) => boolean;
  onToggleItem: (itemId: string, points: number, completedByUserId?: string, isSkipped?: boolean) => void;
  getCompletionProgress: (sectorId: string) => { completed: number; total: number };
  currentUserId?: string;
  isAdmin: boolean;
  deadlinePassed?: boolean;
  onContestCompletion?: (completionId: string, reason: string) => Promise<void>;
}

const isToday = (dateStr: string): boolean => {
  const now = new Date();
  const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  if (dateStr === todayStr) return true;
  // Between midnight and 2 AM, also allow yesterday's checklist
  if (now.getHours() < 2) {
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = `${yesterday.getFullYear()}-${String(yesterday.getMonth() + 1).padStart(2, '0')}-${String(yesterday.getDate()).padStart(2, '0')}`;
    return dateStr === yesterdayStr;
  }
  return false;
};

// Fallback icon based on sector name when icon field is null
const sectorNameIconMap: Record<string, string> = {
  'cozinha': 'restaurant',
  'salão': 'storefront',
  'salao': 'storefront',
  'caixa': 'payments',
  'banheiro': 'bathtub',
  'banheiros': 'bathtub',
  'geral': 'checklist',
  'produção': 'manufacturing',
  'producao': 'manufacturing',
  'estoque': 'inventory_2',
  'limpeza': 'cleaning_services',
  'atendimento': 'support_agent',
};

function getSectorIcon(sector: { icon?: string | null; name: string }): string {
  if (sector.icon) return sector.icon;
  const key = sector.name.toLowerCase().trim();
  return sectorNameIconMap[key] || 'folder';
}

export function ChecklistView({
  sectors,
  checklistType,
  date,
  completions,
  isItemCompleted,
  onToggleItem,
  getCompletionProgress,
  onContestCompletion,
  currentUserId,
  isAdmin,
  deadlinePassed = false,
}: ChecklistViewProps) {
  const { triggerCoin } = useCoinAnimation();
  const [expandedSectors, setExpandedSectors] = useState<Set<string>>(new Set());
  const [expandedSubcategories, setExpandedSubcategories] = useState<Set<string>>(new Set());
  const [openPopover, setOpenPopover] = useState<string | null>(null);
  const [profiles, setProfiles] = useState<Pick<Profile, 'user_id' | 'full_name'>[]>([]);
  const [optimisticToggles, setOptimisticToggles] = useState<Set<string>>(new Set());
  const [recentlyCompleted, setRecentlyCompleted] = useState<Set<string>>(new Set());
  // Contestation state
  const [expandedPeopleFor, setExpandedPeopleFor] = useState<string | null>(null);
  const [contestingItemId, setContestingItemId] = useState<string | null>(null);
  const [contestReason, setContestReason] = useState('');
  const [contestLoading, setContestLoading] = useState(false);

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

  // Reset collapsed state when sectors change (keep collapsed)
  // No need to auto-expand

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
      case 'bonus': return 'Bônus';
      default: return 'Abertura';
    }
  };

  const isBonus = checklistType === 'bonus';
  const getItemPointsColors = isBonus ? getBonusPointsColors : getPointsColors;

  const isTodayDate = isToday(date);

  const canToggleItem = (completion: ChecklistCompletion | undefined, completed: boolean) => {
    if (isAdmin) {
      if (completed) return true;
      return true; // admins can always toggle
    }
    if (!isTodayDate) return false;
    // After deadline, non-admins cannot toggle uncompleted items
    if (deadlinePassed && !completed) return false;
    if (!completed) return true;
    if (completion?.completed_by === currentUserId) return true;
    return false;
  };

  // Optimistic item completed check
  const isItemCompletedOptimistic = useCallback((itemId: string) => {
    if (optimisticToggles.has(itemId)) {
      // Optimistic toggle inverts the real state
      return !isItemCompleted(itemId);
    }
    return isItemCompleted(itemId);
  }, [isItemCompleted, optimisticToggles]);

  const handleComplete = (itemId: string, points: number, configuredPoints: number, completedByUserId?: string, buttonElement?: HTMLElement, isSkipped?: boolean) => {
    // Haptic feedback
    if (navigator.vibrate) navigator.vibrate(10);

    // Optimistic toggle
    setOptimisticToggles(prev => {
      const next = new Set(prev);
      next.add(itemId);
      return next;
    });

    // Burst animation for completion (not for skip)
    if (points > 0 && !isSkipped) {
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

    if (points > 0 && !isSkipped && buttonElement) {
      const rect = buttonElement.getBoundingClientRect();
      const coinCount = isBonus ? Math.min(points, 5) : points;
      for (let i = 0; i < coinCount; i++) {
        setTimeout(() => {
          triggerCoin(rect.right - 40 + (i * 10), rect.top + rect.height / 2, configuredPoints);
        }, i * 100);
      }
    }
                    onToggleItem(itemId, isSkipped ? 0 : points, completedByUserId, isSkipped);
    setOpenPopover(null);
    setExpandedPeopleFor(null);
  };

  const handleContest = async (completionId: string) => {
    if (!onContestCompletion || !contestReason.trim()) return;
    setContestLoading(true);
    try {
      await onContestCompletion(completionId, contestReason);
      setContestingItemId(null);
      setContestReason('');
    } catch (err: any) {
      console.error('Contest error:', err);
    } finally {
      setContestLoading(false);
    }
  };

  const filteredSectors = sectors.filter(sector => {
    const hasActiveItems = sector.subcategories?.some(sub =>
      sub.items?.some(i => i.is_active && (i as any).checklist_type === checklistType)
    );
    return hasActiveItems;
  });

  const deadlineBannerText = deadlinePassed && checklistType !== 'bonus'
    ? checklistType === 'abertura'
      ? '⏰ Prazo encerrado às 07:30 — itens pendentes marcados como "não fiz"'
      : '⏰ Prazo encerrado às 02:00 — itens pendentes marcados como "não fiz"'
    : null;

  return (
    <div className="space-y-5">
      {/* Deadline banner */}
      {deadlineBannerText && !isAdmin && (
        <div className="flex items-center gap-2 p-3 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-sm font-medium">
          <Clock className="w-4 h-4 shrink-0" />
          <span>{deadlineBannerText}</span>
        </div>
      )}

      {/* Sectors */}
      {filteredSectors.length === 0 && (
        <div className="card-command p-8 text-center">
          <p className="text-muted-foreground text-sm">
            Nenhuma tarefa configurada para {getTypeLabel(checklistType)}.
          </p>
        </div>
      )}
      {filteredSectors.map((sector, sectorIndex) => {
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
              <div className="flex items-stretch gap-3">
                {/* Lateral color bar */}
                <div
                  className="w-[3px] rounded-full shrink-0 transition-colors duration-500"
                  style={{ backgroundColor: sectorComplete ? 'hsl(var(--success))' : sector.color }}
                />
                {/* Monochrome icon */}
                <div className="shrink-0">
                  {sectorComplete ? (
                    <AppIcon name="check_circle" size={22} fill={1} className="text-success animate-scale-in" />
                  ) : (
                    <AppIcon name={getSectorIcon(sector)} size={22} fill={0} className="text-muted-foreground" />
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

            {/* Items — animated collapse */}
            <div className={cn(
              "overflow-hidden transition-all duration-300 ease-out",
              isExpanded ? "max-h-[5000px] opacity-100" : "max-h-0 opacity-0"
            )}>
              {isBonus ? (
                /* BONUS: Flat list - items directly under sector, no subcategory headers */
                <div className="ml-4 space-y-1.5 pt-1 pb-2">
                  {sector.subcategories?.flatMap(sub => 
                    (sub.items || []).filter(i => i.is_active && (i as any).checklist_type === checklistType)
                  ).map((item, itemIndex) => {
                    const completed = isItemCompletedOptimistic(item.id);
                    const completion = completions.find(c => c.item_id === item.id);
                    const canToggle = canToggleItem(completion, completed);
                    const isLockedByOther = completed && !canToggle;
                    const wasAwardedPoints = completion?.awarded_points !== false;
                    const wasSkipped = completion?.is_skipped === true;
                    const pointsAwarded = completion?.points_awarded ?? item.points;
                    const configuredPoints = item.points ?? 1;
                    const isJustCompleted = recentlyCompleted.has(item.id);

                    if (completed) {
                      const isContested = (completion as any)?.is_contested === true;
                      const contestedReason = (completion as any)?.contested_reason;
                      return (
                        <div key={item.id} className="space-y-1.5">
                          <button
                            onClick={() => {
                              if (isContested) return;
                              if (isAdmin) {
                                // Admin: open inline panel instead of direct uncheck
                                setOpenPopover(openPopover === item.id ? null : item.id);
                                setContestingItemId(null);
                                setContestReason('');
                                return;
                              }
                              if (!canToggle) return;
                              setOptimisticToggles(prev => { const next = new Set(prev); next.add(item.id); return next; });
                              onToggleItem(item.id, 0);
                            }}
                            disabled={isContested ? true : isAdmin ? false : !canToggle}
                            className={cn(
                              "w-full flex items-start gap-4 p-4 rounded-xl transition-all duration-300",
                              isContested
                                ? "bg-gradient-to-r from-amber-500/15 to-amber-500/5 border-2 border-amber-500/30"
                                : !canToggle && !isAdmin && "cursor-not-allowed opacity-80",
                              !isContested && (canToggle || isAdmin) && "active:scale-[0.97] hover:shadow-md",
                              !isContested && wasSkipped
                                ? "bg-gradient-to-r from-destructive/15 to-destructive/5 border-2 border-destructive/30"
                                : !isContested && "bg-gradient-to-r from-success/15 to-success/5 border-2 border-success/30",
                              isJustCompleted && "animate-scale-in",
                              openPopover === item.id && !isContested && "ring-2 ring-primary/30"
                            )}
                            style={{ animationDelay: `${itemIndex * 40}ms` }}
                          >
                            <div className={cn(
                              "w-8 h-8 rounded-xl flex items-center justify-center shrink-0 text-white shadow-lg transition-all duration-300",
                              isContested ? "bg-amber-500 shadow-amber-500/30"
                                : wasSkipped ? "bg-destructive shadow-destructive/30" : "bg-success shadow-success/30",
                              isJustCompleted && "scale-125"
                            )}>
                              {isContested ? <AlertTriangle className="w-5 h-5" /> : wasSkipped ? <X className="w-5 h-5" /> : <Check className="w-5 h-5" />}
                            </div>
                            <div className="flex-1 text-left">
                              <div className="flex items-center gap-2">
                                <p className={cn("font-medium line-through", isContested ? "text-amber-600 dark:text-amber-400" : wasSkipped ? "text-destructive" : "text-success")}>{item.name}</p>
                                {isLockedByOther && !isContested && <Lock className="w-3.5 h-3.5 text-muted-foreground" />}
                              </div>
                              {isContested && contestedReason && (
                                <p className="text-xs text-amber-600 dark:text-amber-400 mt-0.5">Contestado: {contestedReason}</p>
                              )}
                              {item.description && !isContested && <p className="text-xs text-muted-foreground">{item.description}</p>}
                              {completion && (
                                <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
                                  <User className="w-3 h-3" />
                                  <span>{completion.profile?.full_name || 'Usuário'} às {format(new Date(completion.completed_at), 'HH:mm')}</span>
                                  {isContested && <span className="text-amber-600 dark:text-amber-400 ml-1">(contestado)</span>}
                                  {!isContested && wasSkipped && <span className="text-destructive ml-1">(não fiz)</span>}
                                  {!isContested && !wasSkipped && !wasAwardedPoints && <span className="text-primary ml-1">(já pronto)</span>}
                                </div>
                              )}
                            </div>
                            <div className={cn(
                              "flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium shrink-0 border transition-all duration-300",
                              isContested ? "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20"
                                : wasSkipped ? "bg-destructive/10 text-destructive border-destructive/20"
                                : !wasAwardedPoints ? "bg-primary/10 text-primary border-primary/20" : "border-border"
                            )}
                            style={!isContested && !wasSkipped && wasAwardedPoints && pointsAwarded > 0 ? {
                              backgroundColor: getItemPointsColors(pointsAwarded).bg,
                              color: getItemPointsColors(pointsAwarded).color,
                              borderColor: getItemPointsColors(pointsAwarded).border,
                            } : undefined}>
                              {isContested ? (<><AlertTriangle className="w-3 h-3" /><span>contestado</span></>)
                                : wasSkipped ? (<><X className="w-3 h-3" /><span>não fiz</span></>) 
                                : !wasAwardedPoints ? (<><RefreshCw className="w-3 h-3" /><span>pronto</span></>) 
                                : (<div className="flex items-center gap-0.5"><Zap className="w-3 h-3" style={{ color: getItemPointsColors(pointsAwarded).color }} /><span className="ml-0.5">+{pointsAwarded}</span></div>)}
                            </div>
                          </button>
                          {/* Admin inline panel for completed items */}
                          {isAdmin && openPopover === item.id && !isContested && completion && (
                            <div className="mt-2 rounded-xl border bg-card p-4 shadow-lg animate-fade-in space-y-3">
                              {/* Desmarcar */}
                              {canToggle && (
                                <button
                                  onClick={() => {
                                    setOptimisticToggles(prev => { const next = new Set(prev); next.add(item.id); return next; });
                                    onToggleItem(item.id, 0);
                                    setOpenPopover(null);
                                  }}
                                  className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-secondary text-left transition-all duration-200 active:scale-[0.97]"
                                >
                                  <div className="w-10 h-10 bg-secondary rounded-xl flex items-center justify-center">
                                    <Undo2 className="w-5 h-5 text-muted-foreground" />
                                  </div>
                                  <div>
                                    <p className="font-semibold text-foreground">Desmarcar item</p>
                                    <p className="text-xs text-muted-foreground">Reverter a conclusão</p>
                                  </div>
                                </button>
                              )}
                              {/* Contestar */}
                              {!wasSkipped && (
                                <>
                                  <div className="border-t border-border" />
                                  {contestingItemId === item.id ? (
                                    <div className="space-y-2 animate-fade-in">
                                      <div className="flex items-center gap-2 text-sm font-medium text-amber-600 dark:text-amber-400">
                                        <AlertTriangle className="w-4 h-4" />
                                        <span>Motivo da contestação</span>
                                      </div>
                                      <div className="flex items-center gap-2">
                                        <input
                                          type="text"
                                          value={contestReason}
                                          onChange={(e) => setContestReason(e.target.value)}
                                          placeholder="Descreva o motivo..."
                                          className="flex-1 bg-transparent border border-amber-500/30 rounded-lg px-3 py-2 outline-none text-sm text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-amber-500/30"
                                          autoFocus
                                          onKeyDown={(e) => { if (e.key === 'Enter' && contestReason.trim()) handleContest(completion.id); if (e.key === 'Escape') { setContestingItemId(null); setContestReason(''); } }}
                                        />
                                        <button
                                          onClick={() => handleContest(completion.id)}
                                          disabled={!contestReason.trim() || contestLoading}
                                          className="p-2 rounded-lg bg-amber-500 text-white disabled:opacity-50 hover:bg-amber-600 transition-colors"
                                        >
                                          <Send className="w-4 h-4" />
                                        </button>
                                        <button onClick={() => { setContestingItemId(null); setContestReason(''); }} className="p-2 rounded-lg hover:bg-secondary transition-colors">
                                          <X className="w-4 h-4 text-muted-foreground" />
                                        </button>
                                      </div>
                                    </div>
                                  ) : (
                                    <button
                                      onClick={() => { setContestingItemId(item.id); setContestReason(''); }}
                                      className="w-full flex items-center gap-3 p-3 rounded-xl bg-amber-500/5 hover:bg-amber-500/10 text-left transition-all duration-200 border border-amber-500/20 active:scale-[0.97]"
                                    >
                                      <div className="w-10 h-10 bg-amber-500/15 rounded-xl flex items-center justify-center">
                                        <AlertTriangle className="w-5 h-5 text-amber-500" />
                                      </div>
                                      <div>
                                        <p className="font-semibold text-amber-600 dark:text-amber-400">Contestar</p>
                                        <p className="text-xs text-muted-foreground">Registrar que não foi feito</p>
                                      </div>
                                    </button>
                                  )}
                                </>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    }

                    return (
                      <div key={item.id}>
                        <button
                          disabled={!canToggle}
                          onClick={() => canToggle && setOpenPopover(openPopover === item.id ? null : item.id)}
                          className={cn(
                            "w-full flex items-start gap-4 p-4 rounded-xl transition-all duration-200",
                            !canToggle && "cursor-not-allowed opacity-80",
                            canToggle && "active:scale-[0.97] hover:shadow-md hover:border-primary/40",
                            "card-base border-2",
                            openPopover === item.id && "border-primary/50 shadow-md"
                          )}
                          style={{ animationDelay: `${itemIndex * 40}ms` }}
                        >
                          <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0 border-2 border-muted-foreground/30 bg-background transition-all duration-300 hover:border-primary/50 hover:bg-primary/5" />
                          <div className="flex-1 text-left">
                            <p className="font-medium text-foreground">{item.name}</p>
                            {item.description && <p className="text-xs text-muted-foreground">{item.description}</p>}
                          </div>
                          {configuredPoints > 0 ? (
                            <div className={cn("flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium shrink-0 border transition-all duration-200 animate-pulse")}
                              style={{
                                backgroundColor: getItemPointsColors(configuredPoints).bg,
                                color: getItemPointsColors(configuredPoints).color,
                                borderColor: getItemPointsColors(configuredPoints).border,
                                boxShadow: `0 0 12px ${getItemPointsColors(configuredPoints).glow}`,
                              }}>
                              <Zap className="w-3 h-3" />
                              <span>+{configuredPoints}</span>
                            </div>
                          ) : (
                            <div className="flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium shrink-0 bg-muted text-muted-foreground"><span>sem pts</span></div>
                          )}
                        </button>
                        {openPopover === item.id && (
                          <div className="mt-2 rounded-xl border bg-card p-4 shadow-lg animate-fade-in space-y-3">
                            {isAdmin && profiles.length > 0 && (
                              <>
                                <button
                                  onClick={() => setExpandedPeopleFor(expandedPeopleFor === item.id ? null : item.id)}
                                  className="w-full flex items-center gap-3 p-3 rounded-xl bg-primary/5 hover:bg-primary/10 text-left transition-all duration-200 border border-primary/20 active:scale-[0.97]"
                                >
                                  <div className="w-10 h-10 bg-primary/15 rounded-xl flex items-center justify-center">
                                    <Users className="w-5 h-5 text-primary" />
                                  </div>
                                  <div className="flex-1">
                                    <p className="font-semibold text-foreground">Quem realizou?</p>
                                    <p className="text-xs text-muted-foreground">Selecione quem fez</p>
                                  </div>
                                  <ChevronDown className={cn("w-5 h-5 text-muted-foreground transition-transform duration-200", expandedPeopleFor === item.id && "rotate-180")} />
                                </button>
                                <div className={cn("overflow-hidden transition-all duration-300 ease-out", expandedPeopleFor === item.id ? "max-h-64 opacity-100" : "max-h-0 opacity-0")}>
                                  <div className="max-h-48 overflow-y-auto space-y-1 pt-1">
                                    {profiles.map((profile) => (
                                      <button key={profile.user_id} onClick={(e) => handleComplete(item.id, configuredPoints, configuredPoints, profile.user_id, e.currentTarget)}
                                        className={cn("w-full flex items-center gap-2 p-2 rounded-lg text-left transition-all duration-200 text-sm",
                                          profile.user_id === currentUserId ? "bg-primary/10 hover:bg-primary/20 text-primary font-medium" : "hover:bg-secondary text-foreground")}>
                                        <User className="w-4 h-4 shrink-0" /><span className="truncate">{profile.full_name}</span>
                                        {profile.user_id === currentUserId && <span className="text-xs text-muted-foreground ml-auto">(eu)</span>}
                                      </button>
                                    ))}
                                  </div>
                                </div>
                                <div className="border-t border-border" />
                              </>
                            )}
                            {!isAdmin && (
                              <>
                                <button onClick={(e) => handleComplete(item.id, configuredPoints, configuredPoints, undefined, e.currentTarget)}
                                  className="w-full flex items-center gap-3 p-3 rounded-xl bg-success/10 hover:bg-success/20 text-left transition-all duration-200 border-2 border-success/30 active:scale-[0.97]">
                                  <div className="w-10 h-10 bg-success rounded-xl flex items-center justify-center shadow-lg shadow-success/20"><Check className="w-5 h-5 text-success-foreground" /></div>
                                  <div className="flex-1"><p className="font-semibold text-success">Concluí agora</p>
                                    {configuredPoints > 0 ? (
                                      <div className="flex items-center gap-0.5 mt-0.5"><Zap className="w-3 h-3" style={{ color: getItemPointsColors(configuredPoints).color }} />
                                        <span className="text-xs font-bold ml-0.5" style={{ color: getItemPointsColors(configuredPoints).color }}>+{configuredPoints}</span></div>
                                    ) : (<span className="text-xs text-muted-foreground">Tarefa sem pontos</span>)}
                                  </div>
                                </button>
                                <div className="border-t border-border" />
                                <button onClick={(e) => handleComplete(item.id, 0, configuredPoints, undefined, e.currentTarget, true)}
                                  className="w-full flex items-center gap-3 p-3 rounded-xl bg-destructive/5 hover:bg-destructive/10 text-left transition-all duration-200 border border-destructive/20 active:scale-[0.97]">
                                  <div className="w-10 h-10 bg-destructive/15 rounded-xl flex items-center justify-center"><X className="w-5 h-5 text-destructive" /></div>
                                  <div><p className="font-semibold text-destructive">Não fiz</p><p className="text-xs text-muted-foreground">Sem pontos</p></div>
                                </button>
                                {configuredPoints > 0 && (
                                  <>
                                    <div className="border-t border-border" />
                                    <button onClick={(e) => handleComplete(item.id, 0, configuredPoints, undefined, e.currentTarget)}
                                      className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-secondary text-left transition-all duration-200 active:scale-[0.97]">
                                      <div className="w-10 h-10 bg-secondary rounded-xl flex items-center justify-center"><RefreshCw className="w-5 h-5 text-muted-foreground" /></div>
                                      <div><p className="font-semibold text-foreground">Já estava pronto</p><p className="text-xs text-muted-foreground">Sem pontos</p></div>
                                    </button>
                                  </>
                                )}
                              </>
                            )}
                            {isAdmin && configuredPoints > 0 && (
                              <button onClick={(e) => handleComplete(item.id, 0, configuredPoints, currentUserId, e.currentTarget)}
                                className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-secondary text-left transition-all duration-200 active:scale-[0.97]">
                                <div className="w-10 h-10 bg-secondary rounded-xl flex items-center justify-center"><RefreshCw className="w-5 h-5 text-muted-foreground" /></div>
                                <div><p className="font-semibold text-foreground">Já estava pronto</p><p className="text-xs text-muted-foreground">Sem pontos (eu marquei)</p></div>
                              </button>
                            )}
                            {isAdmin && (
                              <>
                                <div className="border-t border-border" />
                                <button onClick={(e) => handleComplete(item.id, 0, configuredPoints, currentUserId, e.currentTarget, true)}
                                  className="w-full flex items-center gap-3 p-3 rounded-xl bg-destructive/5 hover:bg-destructive/10 text-left transition-all duration-200 border border-destructive/20 active:scale-[0.97]">
                                  <div className="w-10 h-10 bg-destructive/15 rounded-xl flex items-center justify-center"><X className="w-5 h-5 text-destructive" /></div>
                                  <div><p className="font-semibold text-destructive">Não fiz</p><p className="text-xs text-muted-foreground">Sem pontos</p></div>
                                </button>
                              </>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                /* STANDARD: Sector > Subcategory > Items */
                sector.subcategories?.map((subcategory, subIndex) => {
                  const isSubExpanded = expandedSubcategories.has(subcategory.id);
                  const activeItems = subcategory.items?.filter(i => i.is_active && (i as any).checklist_type === checklistType) || [];
                  const completedItems = activeItems.filter(i => isItemCompletedOptimistic(i.id));
                  const subComplete = activeItems.length > 0 && completedItems.length === activeItems.length;

                  if (activeItems.length === 0) return null;

                  return (
                    <div key={subcategory.id} className="ml-2 space-y-1 mb-2 animate-fade-in" style={{ animationDelay: `${subIndex * 50}ms` }}>
                      <button onClick={() => toggleSubcategory(subcategory.id)}
                        className={cn(
                          "w-full flex items-center justify-between px-3 py-2.5 rounded-lg transition-all duration-300 border",
                          subComplete 
                            ? "border-success/20 bg-success/5" 
                            : "border-border/50 bg-card/50 hover:bg-card hover:border-border"
                        )}>
                        <div className="flex items-center gap-2.5">
                          <div className={cn(
                            "w-6 h-6 rounded-md flex items-center justify-center transition-all duration-300",
                            subComplete ? "bg-success/15" : "bg-muted/50"
                          )}>
                            {subComplete 
                              ? <Check className="w-3.5 h-3.5 text-success animate-scale-in" /> 
                              : <ChevronRight className={cn("w-3.5 h-3.5 text-muted-foreground transition-transform duration-300", isSubExpanded && "rotate-90")} />
                            }
                          </div>
                          <span className={cn("font-medium text-sm transition-colors duration-300", subComplete ? "text-success" : "text-foreground")}>{subcategory.name}</span>
                          <span className={cn(
                            "text-[11px] px-1.5 py-0.5 rounded-md font-medium",
                            subComplete ? "bg-success/10 text-success" : "bg-muted/50 text-muted-foreground"
                          )}>{completedItems.length}/{activeItems.length}</span>
                        </div>
                        <ChevronDown className={cn("w-4 h-4 text-muted-foreground transition-transform duration-300", isSubExpanded ? "rotate-0" : "-rotate-90")} />
                      </button>

                      <div className={cn("overflow-hidden transition-all duration-300 ease-out", isSubExpanded ? "max-h-[3000px] opacity-100" : "max-h-0 opacity-0")}>
                        <div className="ml-4 space-y-1.5 pt-1">
                          {activeItems.map((item, itemIndex) => {
                            const completed = isItemCompletedOptimistic(item.id);
                            const completion = completions.find(c => c.item_id === item.id);
                            const canToggle = canToggleItem(completion, completed);
                            const isLockedByOther = completed && !canToggle;
                            const wasAwardedPoints = completion?.awarded_points !== false;
                            const wasSkipped = completion?.is_skipped === true;
                            const pointsAwarded = completion?.points_awarded ?? item.points;
                            const configuredPoints = item.points ?? 1;
                            const isJustCompleted = recentlyCompleted.has(item.id);

                            if (completed) {
                              const isContested = (completion as any)?.is_contested === true;
                              const contestedReason = (completion as any)?.contested_reason;
                              return (
                                <div key={item.id} className="space-y-1.5">
                                  <button
                                    onClick={() => {
                                      if (isContested) return;
                                      if (isAdmin) {
                                        setOpenPopover(openPopover === item.id ? null : item.id);
                                        setContestingItemId(null);
                                        setContestReason('');
                                        return;
                                      }
                                      if (!canToggle) return;
                                      setOptimisticToggles(prev => { const next = new Set(prev); next.add(item.id); return next; });
                                      onToggleItem(item.id, 0);
                                    }}
                                    disabled={isContested ? true : isAdmin ? false : !canToggle}
                                    className={cn(
                                      "w-full flex items-start gap-4 p-4 rounded-xl transition-all duration-300",
                                      isContested
                                        ? "bg-gradient-to-r from-amber-500/15 to-amber-500/5 border-2 border-amber-500/30"
                                        : !canToggle && !isAdmin && "cursor-not-allowed opacity-80",
                                      !isContested && (canToggle || isAdmin) && "active:scale-[0.97] hover:shadow-md",
                                      !isContested && wasSkipped
                                        ? "bg-gradient-to-r from-destructive/15 to-destructive/5 border-2 border-destructive/30"
                                        : !isContested && "bg-gradient-to-r from-success/15 to-success/5 border-2 border-success/30",
                                      isJustCompleted && "animate-scale-in",
                                      openPopover === item.id && !isContested && "ring-2 ring-primary/30"
                                    )}
                                    style={{ animationDelay: `${itemIndex * 40}ms` }}
                                  >
                                    <div className={cn(
                                      "w-8 h-8 rounded-xl flex items-center justify-center shrink-0 text-white shadow-lg transition-all duration-300",
                                      isContested ? "bg-amber-500 shadow-amber-500/30"
                                        : wasSkipped ? "bg-destructive shadow-destructive/30" : "bg-success shadow-success/30",
                                      isJustCompleted && "scale-125"
                                    )}>
                                      {isContested ? <AlertTriangle className="w-5 h-5" /> : wasSkipped ? <X className="w-5 h-5" /> : <Check className="w-5 h-5" />}
                                    </div>
                                    <div className="flex-1 text-left">
                                      <div className="flex items-center gap-2">
                                        <p className={cn("font-medium line-through", isContested ? "text-amber-600 dark:text-amber-400" : wasSkipped ? "text-destructive" : "text-success")}>{item.name}</p>
                                        {isLockedByOther && !isContested && <Lock className="w-3.5 h-3.5 text-muted-foreground" />}
                                      </div>
                                      {isContested && contestedReason && (
                                        <p className="text-xs text-amber-600 dark:text-amber-400 mt-0.5">Contestado: {contestedReason}</p>
                                      )}
                                      {item.description && !isContested && <p className="text-xs text-muted-foreground">{item.description}</p>}
                                      {completion && (
                                        <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
                                          <User className="w-3 h-3" />
                                          <span>{completion.profile?.full_name || 'Usuário'} às {format(new Date(completion.completed_at), 'HH:mm')}</span>
                                          {isContested && <span className="text-amber-600 dark:text-amber-400 ml-1">(contestado)</span>}
                                          {!isContested && wasSkipped && <span className="text-destructive ml-1">(não fiz)</span>}
                                          {!isContested && !wasSkipped && !wasAwardedPoints && <span className="text-primary ml-1">(já pronto)</span>}
                                        </div>
                                      )}
                                    </div>
                                    <div className={cn(
                                      "flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium shrink-0 border transition-all duration-300",
                                      isContested ? "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20"
                                        : wasSkipped ? "bg-destructive/10 text-destructive border-destructive/20"
                                        : !wasAwardedPoints ? "bg-primary/10 text-primary border-primary/20" : "border-border"
                                    )}
                                    style={!isContested && !wasSkipped && wasAwardedPoints && pointsAwarded > 0 ? {
                                      backgroundColor: getItemPointsColors(pointsAwarded).bg,
                                      color: getItemPointsColors(pointsAwarded).color,
                                      borderColor: getItemPointsColors(pointsAwarded).border,
                                    } : undefined}>
                                      {isContested ? (<><AlertTriangle className="w-3 h-3" /><span>contestado</span></>)
                                        : wasSkipped ? (<><X className="w-3 h-3" /><span>não fiz</span></>) 
                                        : !wasAwardedPoints ? (<><RefreshCw className="w-3 h-3" /><span>pronto</span></>) 
                                        : (<div className="flex items-center gap-0.5">
                                            {pointsAwarded > 0 && !isBonus && Array.from({ length: pointsAwarded }).map((_, i) => {
                                              const colors = getItemPointsColors(pointsAwarded);
                                              return <Star key={i} className="w-3 h-3" style={{ color: colors.color, fill: colors.color }} />;
                                            })}
                                            {isBonus && <Zap className="w-3 h-3" style={{ color: getItemPointsColors(pointsAwarded).color }} />}
                                            <span className="ml-0.5">+{pointsAwarded}</span>
                                          </div>)}
                                    </div>
                                  </button>
                                  {/* Admin inline panel for completed items */}
                                  {isAdmin && openPopover === item.id && !isContested && completion && (
                                    <div className="mt-2 rounded-xl border bg-card p-4 shadow-lg animate-fade-in space-y-3">
                                      {canToggle && (
                                        <button
                                          onClick={() => {
                                            setOptimisticToggles(prev => { const next = new Set(prev); next.add(item.id); return next; });
                                            onToggleItem(item.id, 0);
                                            setOpenPopover(null);
                                          }}
                                          className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-secondary text-left transition-all duration-200 active:scale-[0.97]"
                                        >
                                          <div className="w-10 h-10 bg-secondary rounded-xl flex items-center justify-center">
                                            <Undo2 className="w-5 h-5 text-muted-foreground" />
                                          </div>
                                          <div>
                                            <p className="font-semibold text-foreground">Desmarcar item</p>
                                            <p className="text-xs text-muted-foreground">Reverter a conclusão</p>
                                          </div>
                                        </button>
                                      )}
                                      {!wasSkipped && (
                                        <>
                                          <div className="border-t border-border" />
                                          {contestingItemId === item.id ? (
                                            <div className="space-y-2 animate-fade-in">
                                              <div className="flex items-center gap-2 text-sm font-medium text-amber-600 dark:text-amber-400">
                                                <AlertTriangle className="w-4 h-4" />
                                                <span>Motivo da contestação</span>
                                              </div>
                                              <div className="flex items-center gap-2">
                                                <input
                                                  type="text"
                                                  value={contestReason}
                                                  onChange={(e) => setContestReason(e.target.value)}
                                                  placeholder="Descreva o motivo..."
                                                  className="flex-1 bg-transparent border border-amber-500/30 rounded-lg px-3 py-2 outline-none text-sm text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-amber-500/30"
                                                  autoFocus
                                                  onKeyDown={(e) => { if (e.key === 'Enter' && contestReason.trim()) handleContest(completion.id); if (e.key === 'Escape') { setContestingItemId(null); setContestReason(''); } }}
                                                />
                                                <button
                                                  onClick={() => handleContest(completion.id)}
                                                  disabled={!contestReason.trim() || contestLoading}
                                                  className="p-2 rounded-lg bg-amber-500 text-white disabled:opacity-50 hover:bg-amber-600 transition-colors"
                                                >
                                                  <Send className="w-4 h-4" />
                                                </button>
                                                <button onClick={() => { setContestingItemId(null); setContestReason(''); }} className="p-2 rounded-lg hover:bg-secondary transition-colors">
                                                  <X className="w-4 h-4 text-muted-foreground" />
                                                </button>
                                              </div>
                                            </div>
                                          ) : (
                                            <button
                                              onClick={() => { setContestingItemId(item.id); setContestReason(''); }}
                                              className="w-full flex items-center gap-3 p-3 rounded-xl bg-amber-500/5 hover:bg-amber-500/10 text-left transition-all duration-200 border border-amber-500/20 active:scale-[0.97]"
                                            >
                                              <div className="w-10 h-10 bg-amber-500/15 rounded-xl flex items-center justify-center">
                                                <AlertTriangle className="w-5 h-5 text-amber-500" />
                                              </div>
                                              <div>
                                                <p className="font-semibold text-amber-600 dark:text-amber-400">Contestar</p>
                                                <p className="text-xs text-muted-foreground">Registrar que não foi feito</p>
                                              </div>
                                            </button>
                                          )}
                                        </>
                                      )}
                                    </div>
                                  )}
                                </div>
                              );
                            }

                            return (
                              <div key={item.id}>
                                <button
                                  disabled={!canToggle}
                                  onClick={() => canToggle && setOpenPopover(openPopover === item.id ? null : item.id)}
                                  className={cn(
                                    "w-full flex items-start gap-4 p-4 rounded-xl transition-all duration-200",
                                    !canToggle && "cursor-not-allowed opacity-80",
                                    canToggle && "active:scale-[0.97] hover:shadow-md hover:border-primary/40",
                                    "card-base border-2",
                                    openPopover === item.id && "border-primary/50 shadow-md"
                                  )}
                                  style={{ animationDelay: `${itemIndex * 40}ms` }}
                                >
                                  <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0 border-2 border-muted-foreground/30 bg-background transition-all duration-300 hover:border-primary/50 hover:bg-primary/5" />
                                  <div className="flex-1 text-left">
                                    <p className="font-medium text-foreground">{item.name}</p>
                                    {item.description && <p className="text-xs text-muted-foreground">{item.description}</p>}
                                  </div>
                                  {configuredPoints > 0 ? (
                                    <div className={cn("flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium shrink-0 border transition-all duration-200", isBonus && "animate-pulse")}
                                      style={{
                                        backgroundColor: getItemPointsColors(configuredPoints).bg,
                                        color: getItemPointsColors(configuredPoints).color,
                                        borderColor: getItemPointsColors(configuredPoints).border,
                                        boxShadow: isBonus ? `0 0 12px ${getItemPointsColors(configuredPoints).glow}` : undefined,
                                      }}>
                                      {isBonus ? <Zap className="w-3 h-3" /> : <Star className="w-3 h-3" style={{ color: getItemPointsColors(configuredPoints).color, fill: getItemPointsColors(configuredPoints).color }} />}
                                      <span>+{configuredPoints}</span>
                                    </div>
                                  ) : (
                                    <div className="flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium shrink-0 bg-muted text-muted-foreground"><span>sem pts</span></div>
                                  )}
                                </button>
                                {openPopover === item.id && (
                                  <div className="mt-2 rounded-xl border bg-card p-4 shadow-lg animate-fade-in space-y-3">
                                    {isAdmin && profiles.length > 0 && (
                                      <>
                                        <button
                                          onClick={() => setExpandedPeopleFor(expandedPeopleFor === item.id ? null : item.id)}
                                          className="w-full flex items-center gap-3 p-3 rounded-xl bg-primary/5 hover:bg-primary/10 text-left transition-all duration-200 border border-primary/20 active:scale-[0.97]"
                                        >
                                          <div className="w-10 h-10 bg-primary/15 rounded-xl flex items-center justify-center">
                                            <Users className="w-5 h-5 text-primary" />
                                          </div>
                                          <div className="flex-1">
                                            <p className="font-semibold text-foreground">Quem realizou?</p>
                                            <p className="text-xs text-muted-foreground">Selecione quem fez</p>
                                          </div>
                                          <ChevronDown className={cn("w-5 h-5 text-muted-foreground transition-transform duration-200", expandedPeopleFor === item.id && "rotate-180")} />
                                        </button>
                                        <div className={cn("overflow-hidden transition-all duration-300 ease-out", expandedPeopleFor === item.id ? "max-h-64 opacity-100" : "max-h-0 opacity-0")}>
                                          <div className="max-h-48 overflow-y-auto space-y-1 pt-1">
                                            {profiles.map((profile) => (
                                              <button key={profile.user_id} onClick={(e) => handleComplete(item.id, configuredPoints, configuredPoints, profile.user_id, e.currentTarget)}
                                                className={cn("w-full flex items-center gap-2 p-2 rounded-lg text-left transition-all duration-200 text-sm",
                                                  profile.user_id === currentUserId ? "bg-primary/10 hover:bg-primary/20 text-primary font-medium" : "hover:bg-secondary text-foreground")}>
                                                <User className="w-4 h-4 shrink-0" /><span className="truncate">{profile.full_name}</span>
                                                {profile.user_id === currentUserId && <span className="text-xs text-muted-foreground ml-auto">(eu)</span>}
                                              </button>
                                            ))}
                                          </div>
                                        </div>
                                        <div className="border-t border-border" />
                                      </>
                                    )}
                                    {!isAdmin && (
                                      <>
                                        <button onClick={(e) => handleComplete(item.id, configuredPoints, configuredPoints, undefined, e.currentTarget)}
                                          className="w-full flex items-center gap-3 p-3 rounded-xl bg-success/10 hover:bg-success/20 text-left transition-all duration-200 border-2 border-success/30 active:scale-[0.97]">
                                          <div className="w-10 h-10 bg-success rounded-xl flex items-center justify-center shadow-lg shadow-success/20"><Check className="w-5 h-5 text-success-foreground" /></div>
                                          <div className="flex-1"><p className="font-semibold text-success">Concluí agora</p>
                                            {configuredPoints > 0 ? (
                                              <div className="flex items-center gap-0.5 mt-0.5">
                                                {isBonus ? <Zap className="w-3 h-3" style={{ color: getItemPointsColors(configuredPoints).color }} /> : (
                                                  Array.from({ length: configuredPoints }).map((_, i) => (
                                                    <Star key={i} className="w-3 h-3" style={{ color: getItemPointsColors(configuredPoints).color, fill: getItemPointsColors(configuredPoints).color }} />
                                                  ))
                                                )}
                                                <span className="text-xs font-bold ml-0.5" style={{ color: getItemPointsColors(configuredPoints).color }}>+{configuredPoints}</span>
                                              </div>
                                            ) : (<span className="text-xs text-muted-foreground">Tarefa sem pontos</span>)}
                                          </div>
                                        </button>
                                        <div className="border-t border-border" />
                                        <button onClick={(e) => handleComplete(item.id, 0, configuredPoints, undefined, e.currentTarget, true)}
                                          className="w-full flex items-center gap-3 p-3 rounded-xl bg-destructive/5 hover:bg-destructive/10 text-left transition-all duration-200 border border-destructive/20 active:scale-[0.97]">
                                          <div className="w-10 h-10 bg-destructive/15 rounded-xl flex items-center justify-center"><X className="w-5 h-5 text-destructive" /></div>
                                          <div><p className="font-semibold text-destructive">Não fiz</p><p className="text-xs text-muted-foreground">Sem pontos</p></div>
                                        </button>
                                        {configuredPoints > 0 && (
                                          <>
                                            <div className="border-t border-border" />
                                            <button onClick={(e) => handleComplete(item.id, 0, configuredPoints, undefined, e.currentTarget)}
                                              className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-secondary text-left transition-all duration-200 active:scale-[0.97]">
                                              <div className="w-10 h-10 bg-secondary rounded-xl flex items-center justify-center"><RefreshCw className="w-5 h-5 text-muted-foreground" /></div>
                                              <div><p className="font-semibold text-foreground">Já estava pronto</p><p className="text-xs text-muted-foreground">Sem pontos</p></div>
                                            </button>
                                          </>
                                        )}
                                      </>
                                    )}
                                    {isAdmin && configuredPoints > 0 && (
                                      <button onClick={(e) => handleComplete(item.id, 0, configuredPoints, currentUserId, e.currentTarget)}
                                        className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-secondary text-left transition-all duration-200 active:scale-[0.97]">
                                        <div className="w-10 h-10 bg-secondary rounded-xl flex items-center justify-center"><RefreshCw className="w-5 h-5 text-muted-foreground" /></div>
                                        <div><p className="font-semibold text-foreground">Já estava pronto</p><p className="text-xs text-muted-foreground">Sem pontos (eu marquei)</p></div>
                                      </button>
                                    )}
                                    {isAdmin && (
                                      <>
                                        <div className="border-t border-border" />
                                        <button onClick={(e) => handleComplete(item.id, 0, configuredPoints, currentUserId, e.currentTarget, true)}
                                          className="w-full flex items-center gap-3 p-3 rounded-xl bg-destructive/5 hover:bg-destructive/10 text-left transition-all duration-200 border border-destructive/20 active:scale-[0.97]">
                                          <div className="w-10 h-10 bg-destructive/15 rounded-xl flex items-center justify-center"><X className="w-5 h-5 text-destructive" /></div>
                                          <div><p className="font-semibold text-destructive">Não fiz</p><p className="text-xs text-muted-foreground">Sem pontos</p></div>
                                        </button>
                                      </>
                                    )}
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        );
      })}

      {sectors.length === 0 && (
        <div className="text-center py-12 text-muted-foreground animate-fade-in">
          <AppIcon name="Folder" size={48} fill={0} className="mx-auto mb-3 opacity-50" />
          <p className="font-medium">Nenhum setor configurado</p>
          <p className="text-sm mt-1">Adicione setores nas configurações</p>
        </div>
      )}
    </div>
  );
}
