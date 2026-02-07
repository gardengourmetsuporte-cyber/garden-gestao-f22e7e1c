import { useState } from 'react';
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
  RefreshCw
} from 'lucide-react';
import { ChecklistSector, ChecklistType, ChecklistCompletion } from '@/types/database';
import { cn } from '@/lib/utils';
import { useCoinAnimation } from '@/contexts/CoinAnimationContext';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { getPointsColors, clampPoints } from '@/lib/points';

interface ChecklistViewProps {
  sectors: ChecklistSector[];
  checklistType: ChecklistType;
  date: string;
  completions: ChecklistCompletion[];
  isItemCompleted: (itemId: string) => boolean;
  onToggleItem: (itemId: string, points: number, event?: React.MouseEvent) => void;
  getCompletionProgress: (sectorId: string) => { completed: number; total: number };
  currentUserId?: string;
  isAdmin: boolean;
}

// Helper to check if a date is today
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

  const toggleSector = (sectorId: string) => {
    setExpandedSectors(prev => {
      const newSet = new Set(prev);
      if (newSet.has(sectorId)) {
        newSet.delete(sectorId);
      } else {
        newSet.add(sectorId);
      }
      return newSet;
    });
  };

  const toggleSubcategory = (subcategoryId: string) => {
    setExpandedSubcategories(prev => {
      const newSet = new Set(prev);
      if (newSet.has(subcategoryId)) {
        newSet.delete(subcategoryId);
      } else {
        newSet.add(subcategoryId);
      }
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

  // Calculate total progress
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

  // Check if the selected date is today
  const isTodayDate = isToday(date);

  // Check if a completed item can be toggled (unchecked) by current user
  const canToggleItem = (completion: ChecklistCompletion | undefined, completed: boolean) => {
    // Non-admins can only interact with tasks on today's date
    if (!isAdmin && !isTodayDate) return false;
    // If not completed, anyone can mark it (admin always, employee only on today)
    if (!completed) return true;
    // If admin, can toggle any item
    if (isAdmin) return true;
    // If completed by current user, can uncheck
    if (completion?.completed_by === currentUserId) return true;
    // Otherwise, cannot toggle
    return false;
  };

  const getMotivationalMessage = () => {
    if (progressPercent === 100) return "🎉 Excelente! Tudo concluído!";
    if (progressPercent >= 75) return "💪 Quase lá! Continue assim!";
    if (progressPercent >= 50) return "👍 Bom progresso!";
    if (progressPercent >= 25) return "🚀 Você está indo bem!";
    return "☕ Vamos começar!";
  };

  const handleComplete = (itemId: string, points: number, configuredPoints: number, e: React.MouseEvent) => {
    if (points > 0) {
      // Trigger coin animation for each point with color based on total points
      const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
      for (let i = 0; i < points; i++) {
        setTimeout(() => {
          triggerCoin(rect.right - 40 + (i * 10), rect.top + rect.height / 2, configuredPoints);
        }, i * 100);
      }
    }
    onToggleItem(itemId, points, e);
    setOpenPopover(null);
  };

  return (
    <div className="space-y-4">
      {/* Progress Header */}
      <div className={cn(
        "card-base p-5 transition-all duration-500",
        progressPercent === 100
          ? "bg-gradient-to-br from-success/20 to-success/5 border-2 border-success/30"
          : "bg-gradient-to-br from-primary/10 to-primary/5"
      )}>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-bold text-lg text-foreground">
              {getTypeLabel(checklistType)}
            </h3>
            <p className="text-sm text-muted-foreground">
              {format(parseISO(date), "EEEE, d 'de' MMMM", { locale: ptBR })}
            </p>
          </div>
          <div className="text-right">
            <div className={cn(
              "text-3xl font-black transition-all",
              progressPercent === 100 ? "text-success" : "text-primary"
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
              "h-full rounded-full transition-all duration-500 ease-out",
              progressPercent === 100
                ? "bg-gradient-to-r from-success to-emerald-400"
                : "bg-gradient-to-r from-primary to-primary/70"
            )}
            style={{ width: `${progressPercent}%` }}
          />
        </div>
        
        {/* Motivational Message */}
        <p className="text-center mt-3 text-sm font-medium text-muted-foreground">
          {getMotivationalMessage()}
        </p>
      </div>

      {/* Sectors */}
      {sectors.map(sector => {
        const isExpanded = expandedSectors.has(sector.id);
        const progress = getCompletionProgress(sector.id);
        const sectorComplete = progress.total > 0 && progress.completed === progress.total;

        return (
          <div key={sector.id} className="space-y-2">
            {/* Sector Header */}
            <button
              onClick={() => toggleSector(sector.id)}
              className={cn(
                "w-full flex items-center justify-between p-4 rounded-xl transition-all",
                sectorComplete 
                  ? "bg-success/10 border border-success/20" 
                  : "card-base"
              )}
            >
              <div className="flex items-center gap-3">
                <div
                  className={cn(
                    "w-10 h-10 rounded-xl flex items-center justify-center",
                    sectorComplete ? "bg-success/20 text-success" : "text-white"
                  )}
                  style={{ backgroundColor: sectorComplete ? undefined : sector.color }}
                >
                  {sectorComplete ? <Check className="w-5 h-5" /> : iconMap[sector.icon || 'Folder']}
                </div>
                <div className="text-left">
                  <p className="font-semibold text-foreground">{sector.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {progress.completed}/{progress.total} concluídos
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-12 h-1.5 bg-secondary rounded-full overflow-hidden">
                  <div
                    className={cn(
                      "h-full transition-all",
                      sectorComplete ? "bg-success" : "bg-primary"
                    )}
                    style={{ width: `${progress.total > 0 ? (progress.completed / progress.total) * 100 : 0}%` }}
                  />
                </div>
                {isExpanded ? (
                  <ChevronDown className="w-5 h-5 text-muted-foreground" />
                ) : (
                  <ChevronRight className="w-5 h-5 text-muted-foreground" />
                )}
              </div>
            </button>

            {/* Subcategories */}
            {isExpanded && sector.subcategories?.map(subcategory => {
              const isSubExpanded = expandedSubcategories.has(subcategory.id);
              // Filter items by checklist_type AND is_active
              const activeItems = subcategory.items?.filter(i => i.is_active && (i as any).checklist_type === checklistType) || [];
              const completedItems = activeItems.filter(i => isItemCompleted(i.id));
              const subComplete = activeItems.length > 0 && completedItems.length === activeItems.length;

              return (
                <div key={subcategory.id} className="ml-4 space-y-1">
                  {/* Subcategory Header */}
                  <button
                    onClick={() => toggleSubcategory(subcategory.id)}
                    className={cn(
                      "w-full flex items-center justify-between p-3 rounded-xl transition-all",
                      subComplete 
                        ? "bg-success/5 border border-success/10" 
                        : "bg-secondary/50 hover:bg-secondary"
                    )}
                  >
                    <div className="flex items-center gap-2">
                      {subComplete ? (
                        <Check className="w-4 h-4 text-success" />
                      ) : (
                        <Clock className="w-4 h-4 text-muted-foreground" />
                      )}
                      <span className={cn(
                        "font-medium",
                        subComplete ? "text-success" : "text-foreground"
                      )}>
                        {subcategory.name}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        ({completedItems.length}/{activeItems.length})
                      </span>
                    </div>
                    {isSubExpanded ? (
                      <ChevronDown className="w-4 h-4 text-muted-foreground" />
                    ) : (
                      <ChevronRight className="w-4 h-4 text-muted-foreground" />
                    )}
                  </button>

                  {/* Items */}
                  {isSubExpanded && (
                    <div className="ml-4 space-y-1">
                      {activeItems.map(item => {
                        const completed = isItemCompleted(item.id);
                        const completion = completions.find(c => c.item_id === item.id);
                        const canToggle = canToggleItem(completion, completed);
                        const isLockedByOther = completed && !canToggle;
                        const wasAwardedPoints = completion?.awarded_points !== false;
                        const pointsAwarded = completion?.points_awarded ?? item.points;
                        const configuredPoints = item.points ?? 1; // Get configured points from task

                        // If completed, clicking unchecks it. If not completed, show popover.
                        if (completed) {
                          return (
                            <button
                              key={item.id}
                              onClick={(e) => {
                                if (!canToggle) return;
                                onToggleItem(item.id, 0, e); // 0 points for unchecking
                              }}
                              disabled={!canToggle}
                              className={cn(
                                "w-full flex items-start gap-4 p-4 rounded-xl transition-all",
                                !canToggle && "cursor-not-allowed opacity-80",
                                canToggle && "active:scale-[0.98] hover:shadow-md",
                                "bg-gradient-to-r from-success/15 to-success/5 border-2 border-success/30"
                              )}
                            >
                              <div className="w-8 h-8 rounded-xl flex items-center justify-center transition-all shrink-0 bg-success text-white shadow-lg shadow-success/30">
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
                                      <span className="text-blue-500 ml-1">(já pronto)</span>
                                    )}
                                  </div>
                                )}
                              </div>
                              {/* Badge showing completion type and points */}
                              <div
                                className={cn(
                                  "flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium shrink-0 border",
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

                        // Not completed - show popover with options
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
                                  "w-full flex items-start gap-4 p-4 rounded-xl transition-all",
                                  !canToggle && "cursor-not-allowed opacity-80",
                                  canToggle && "active:scale-[0.98] hover:shadow-md",
                                  "card-base border-2 hover:border-primary/40"
                                )}
                              >
                                <div className="w-8 h-8 rounded-xl flex items-center justify-center transition-all shrink-0 border-2 border-muted-foreground/30 bg-background" />
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
                                {/* Coin badge showing potential points */}
                                {configuredPoints > 0 ? (
                                  <div
                                    className="flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium shrink-0 border"
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
                            <PopoverContent className="w-64 p-3" align="end">
                              <div className="space-y-3">
                                {/* Main action - mark complete with configured points */}
                                <button
                                  onClick={(e) => handleComplete(item.id, configuredPoints, configuredPoints, e)}
                                  className="w-full flex items-center gap-3 p-3 rounded-xl bg-success/10 hover:bg-success/20 text-left transition-colors border-2 border-success/30"
                                >
                                  <div className="w-10 h-10 bg-success rounded-xl flex items-center justify-center">
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
                                
                                {/* Divider - only show if task has points */}
                                {configuredPoints > 0 && (
                                  <>
                                    <div className="border-t border-border" />
                                    
                                    {/* Already done - no points */}
                                    <button
                                      onClick={(e) => handleComplete(item.id, 0, configuredPoints, e)}
                                      className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-secondary text-left transition-colors"
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
                              </div>
                            </PopoverContent>
                          </Popover>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        );
      })}

      {sectors.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          <Folder className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p className="font-medium">Nenhum setor configurado</p>
          <p className="text-sm mt-1">Adicione setores nas configurações</p>
        </div>
      )}
    </div>
  );
}
