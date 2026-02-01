import { useState } from 'react';
import { format } from 'date-fns';
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
  Star
} from 'lucide-react';
import { ChecklistSector, ChecklistType, ChecklistCompletion } from '@/types/database';
import { cn } from '@/lib/utils';
import { useCoinAnimation } from '@/contexts/CoinAnimationContext';

interface ChecklistViewProps {
  sectors: ChecklistSector[];
  checklistType: ChecklistType;
  date: string;
  completions: ChecklistCompletion[];
  isItemCompleted: (itemId: string) => boolean;
  onToggleItem: (itemId: string, event?: React.MouseEvent) => void;
  getCompletionProgress: (sectorId: string) => { completed: number; total: number };
  currentUserId?: string;
  isAdmin: boolean;
}

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
      case 'limpeza': return 'Limpeza';
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

  // Check if a completed item can be toggled (unchecked) by current user
  const canToggleItem = (completion: ChecklistCompletion | undefined, completed: boolean) => {
    // If not completed, anyone can mark it
    if (!completed) return true;
    // If admin, can toggle any item
    if (isAdmin) return true;
    // If completed by current user, can uncheck
    if (completion?.completed_by === currentUserId) return true;
    // Otherwise, cannot toggle
    return false;
  };

  return (
    <div className="space-y-4">
      {/* Progress Header */}
      <div className="bg-card rounded-2xl border p-4">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="font-semibold text-foreground">
              Checklist de {getTypeLabel(checklistType)}
            </h3>
            <p className="text-sm text-muted-foreground">
              {format(new Date(date), "EEEE, d 'de' MMMM", { locale: ptBR })}
            </p>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold text-primary">{progressPercent}%</p>
            <p className="text-xs text-muted-foreground">
              {totalProgress.completed}/{totalProgress.total} itens
            </p>
          </div>
        </div>
        
        {/* Progress Bar */}
        <div className="h-2 bg-secondary rounded-full overflow-hidden">
          <div
            className="h-full bg-primary transition-all duration-300"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
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
                  : "bg-card border"
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
                      "w-full flex items-center justify-between p-3 rounded-lg transition-all",
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

                        return (
                          <button
                            key={item.id}
                            onClick={(e) => {
                              if (!canToggle) return;
                              // Trigger coin animation only when completing (not uncompleting)
                              if (!completed) {
                                const rect = e.currentTarget.getBoundingClientRect();
                                triggerCoin(rect.right - 40, rect.top + rect.height / 2);
                              }
                              onToggleItem(item.id, e);
                            }}
                            disabled={!canToggle}
                            className={cn(
                              "w-full flex items-start gap-3 p-3 rounded-lg transition-all",
                              !canToggle && "cursor-not-allowed opacity-80",
                              canToggle && "active:scale-[0.98]",
                              completed
                                ? "bg-success/10 border border-success/20"
                                : "bg-card border hover:border-primary/30"
                            )}
                          >
                            <div
                              className={cn(
                                "w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all mt-0.5",
                                completed
                                  ? "bg-success border-success text-white"
                                  : "border-muted-foreground/30"
                              )}
                            >
                              {completed && <Check className="w-4 h-4" />}
                            </div>
                            <div className="flex-1 text-left">
                              <div className="flex items-center gap-2">
                                <p className={cn(
                                  "font-medium",
                                  completed ? "text-success line-through" : "text-foreground"
                                )}>
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
                              {completed && completion && (
                                <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
                                  <User className="w-3 h-3" />
                                  <span>
                                    {completion.profile?.full_name || 'Usuário'} às{' '}
                                    {format(new Date(completion.completed_at), 'HH:mm')}
                                  </span>
                                </div>
                              )}
                            </div>
                            {/* Coin badge showing points reward */}
                            <div className={cn(
                              "flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium shrink-0",
                              completed 
                                ? "bg-amber-500/10 text-amber-500/50" 
                                : "bg-amber-500/20 text-amber-600"
                            )}>
                              <Star className={cn("w-3 h-3", completed ? "fill-amber-500/50" : "fill-amber-500")} />
                              <span>+1</span>
                            </div>
                          </button>
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
