import { useState, useEffect, useCallback, useRef } from 'react';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { AppIcon } from '@/components/ui/app-icon';
import { ICON_MAP } from '@/lib/iconMap';
import { ChecklistSector, ChecklistType, ChecklistCompletion, Profile } from '@/types/database';
import { cn } from '@/lib/utils';
import { useCoinAnimation } from '@/contexts/CoinAnimationContext';
import { useUnit } from '@/contexts/UnitContext';
// Inline expandable options — no Popover/Portal to avoid scroll issues
import { getPointsColors, getBonusPointsColors } from '@/lib/points';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Checkbox } from '@/components/ui/checkbox';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction } from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { ActiveTimer, ItemTimeStats } from '@/hooks/checklists/useChecklistTimer';
import { TimerBadge, TimerStatsIndicator } from '@/components/checklists/TimerBadge';
import { PinDialog } from '@/components/checklists/PinDialog';
import { ProductionCompletionSheet } from '@/components/checklists/ProductionCompletionSheet';

interface ChecklistViewProps {
  sectors: ChecklistSector[];
  checklistType: ChecklistType;
  date: string;
  completions: ChecklistCompletion[];
  isItemCompleted: (itemId: string) => boolean;
  onToggleItem: (itemId: string, points: number, completedByUserId?: string, isSkipped?: boolean, photoUrl?: string, preserveTimerOnUncheck?: boolean, bypassGrace?: boolean) => Promise<void>;
  getCompletionProgress: (sectorId: string) => { completed: number; total: number };
  currentUserId?: string;
  isAdmin: boolean;
  deadlinePassed?: boolean;
  onContestCompletion?: (completionId: string, reason: string) => Promise<void>;
  onSplitCompletion?: (itemId: string, date: string, checklistType: ChecklistType, userIds: string[]) => Promise<void>;
  // Timer mode props
  isTimerMode?: boolean;
  getActiveTimer?: (itemId: string) => ActiveTimer | undefined;
  getUserActiveTimer?: (itemId: string, userId: string) => ActiveTimer | undefined;
  onStartTimer?: (itemId: string, userId: string) => Promise<void>;
  onFinishTimer?: (itemId: string, userId: string, onComplete: (itemId: string, points: number, completedByUserId: string) => void, basePoints: number) => Promise<void>;
  onCancelTimer?: (itemId: string, options?: { includeFinished?: boolean }) => Promise<void>;
  validatePin?: (pin: string) => Promise<{ userId: string; userName: string } | null>;
  timeStats?: Map<string, ItemTimeStats>;
  timerMinExecutions?: number;
  autoExpandAll?: boolean;
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
  'produção': 'soup_kitchen',
  'producao': 'soup_kitchen',
  'estoque': 'inventory_2',
  'limpeza': 'cleaning_services',
  'atendimento': 'support_agent',
};

const sectorGradientMap: Record<string, string> = {
  'cozinha': 'linear-gradient(135deg, #F97316, #EF4444)',
  'salão': 'linear-gradient(135deg, #8B5CF6, #EC4899)',
  'salao': 'linear-gradient(135deg, #8B5CF6, #EC4899)',
  'caixa': 'linear-gradient(135deg, #22C55E, #10B981)',
  'banheiro': 'linear-gradient(135deg, #06B6D4, #3B82F6)',
  'banheiros': 'linear-gradient(135deg, #06B6D4, #3B82F6)',
  'geral': 'linear-gradient(135deg, #6366F1, #8B5CF6)',
  'produção': 'linear-gradient(135deg, #F59E0B, #F97316)',
  'producao': 'linear-gradient(135deg, #F59E0B, #F97316)',
  'estoque': 'linear-gradient(135deg, #14B8A6, #0EA5E9)',
  'limpeza': 'linear-gradient(135deg, #06B6D4, #22D3EE)',
  'atendimento': 'linear-gradient(135deg, #EC4899, #A855F7)',
};

function getSectorIcon(sector: { icon?: string | null; name: string }): string {
  if (sector.icon && sector.icon !== 'Folder') return sector.icon;
  const key = sector.name.toLowerCase().trim();
  return sectorNameIconMap[key] || 'folder';
}

function getSectorGradient(sector: { name: string; color?: string }): string {
  const key = sector.name.toLowerCase().trim();
  return sectorGradientMap[key] || `linear-gradient(135deg, ${sector.color || '#6366F1'}, ${sector.color || '#8B5CF6'})`;
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
  onSplitCompletion,
  currentUserId,
  isAdmin,
  deadlinePassed = false,
  isTimerMode = false,
  getActiveTimer,
  getUserActiveTimer,
  onStartTimer,
  onFinishTimer,
  onCancelTimer,
  validatePin,
  timeStats,
  timerMinExecutions = 3,
  autoExpandAll = false,
}: ChecklistViewProps) {
  const { triggerCoin } = useCoinAnimation();
  const { activeUnitId } = useUnit();
  const [expandedSectors, setExpandedSectors] = useState<Set<string>>(new Set());
  const [expandedSubcategories, setExpandedSubcategories] = useState<Set<string>>(new Set());

  // Auto-expand all sectors and subcategories when autoExpandAll is true
  useEffect(() => {
    if (autoExpandAll && sectors.length > 0) {
      const allSectorIds = new Set(sectors.map(s => s.id));
      const allSubIds = new Set(
        sectors.flatMap(s => (s.subcategories || []).map(sub => sub.id))
      );
      setExpandedSectors(allSectorIds);
      setExpandedSubcategories(allSubIds);
    }
  }, [autoExpandAll, sectors]);
  const [openPopover, setOpenPopover] = useState<string | null>(null);
  const [profiles, setProfiles] = useState<Pick<Profile, 'user_id' | 'full_name'>[]>([]);
  const [optimisticToggles, setOptimisticToggles] = useState<Set<string>>(new Set());
  const [recentlyCompleted, setRecentlyCompleted] = useState<Set<string>>(new Set());
  // Contestation state
  const [expandedPeopleFor, setExpandedPeopleFor] = useState<string | null>(null);
  const [contestingItemId, setContestingItemId] = useState<string | null>(null);
  const [contestReason, setContestReason] = useState('');
  const [contestLoading, setContestLoading] = useState(false);
  // Split state
  const [splittingItemId, setSplittingItemId] = useState<string | null>(null);
  const [splitSelectedUsers, setSplitSelectedUsers] = useState<Set<string>>(new Set());
  const [splitLoading, setSplitLoading] = useState(false);
  // Timer PIN state
  const [pinDialogOpen, setPinDialogOpen] = useState(false);
  const [pendingTimerItemId, setPendingTimerItemId] = useState<string | null>(null);
  const [pendingTimerPoints, setPendingTimerPoints] = useState(0);
  // Photo capture state
  const [photoSheetOpen, setPhotoSheetOpen] = useState(false);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoUploading, setPhotoUploading] = useState(false);
  const [pendingPhotoAction, setPendingPhotoAction] = useState<{
    itemId: string; points: number; configuredPoints: number;
    completedByUserId?: string; buttonElement?: HTMLElement;
  } | null>(null);
  // Photo viewer
  const [viewingPhotoUrl, setViewingPhotoUrl] = useState<string | null>(null);
  // Production sheet state
  const [productionSheetOpen, setProductionSheetOpen] = useState(false);
  const [pendingProductionAction, setPendingProductionAction] = useState<{
    itemId: string; points: number; configuredPoints: number;
    completedByUserId?: string; buttonElement?: HTMLElement;
    linkedInventoryItemId: string; itemName: string;
  } | null>(null);
  // Production undo state
  const [productionUndoOpen, setProductionUndoOpen] = useState(false);
  const [productionUndoLoading, setProductionUndoLoading] = useState(false);
  const [pendingProductionUndo, setPendingProductionUndo] = useState<{
    itemId: string; linkedInventoryItemId: string; itemName: string;
  } | null>(null);

  useEffect(() => {
    if (!activeUnitId) return;
    
    // Step 1: get user_ids for this unit
    supabase
      .from('user_units')
      .select('user_id')
      .eq('unit_id', activeUnitId)
      .then(({ data: unitMembers }) => {
        if (!unitMembers || unitMembers.length === 0) {
          setProfiles([]);
          return;
        }
        const userIds = unitMembers.map(m => m.user_id);
        // Step 2: fetch only profiles belonging to this unit
        supabase
          .from('profiles')
          .select('user_id, full_name')
          .in('user_id', userIds)
          .order('full_name')
          .then(({ data }) => {
            if (data) setProfiles(data);
          });
      });
  }, [activeUnitId]);

  // Auto-expand all sectors when sectors list changes
  // Sectors start collapsed — no auto-expand effect needed

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
    // Check if item has linked inventory item (production) and is not being unchecked or skipped
    if (!isSkipped) {
      const linkedItem = sectors.flatMap(s =>
        (s.subcategories || []).flatMap(sub =>
          (sub.items || []).filter(i => i.id === itemId && (i as any).linked_inventory_item_id)
        )
      )[0];
      if (linkedItem && (linkedItem as any).linked_inventory_item_id) {
        setPendingProductionAction({
          itemId, points, configuredPoints, completedByUserId, buttonElement,
          linkedInventoryItemId: (linkedItem as any).linked_inventory_item_id,
          itemName: linkedItem.name,
        });
        setProductionSheetOpen(true);
        return;
      }
    }

    // Check if item requires photo and is not being unchecked or skipped
    if (!isSkipped) {
      const itemRequiresPhoto = sectors.some(s => 
        s.subcategories?.some(sub => 
          sub.items?.some(i => i.id === itemId && (i as any).requires_photo === true)
        )
      );
      if (itemRequiresPhoto) {
        // Open photo capture sheet
        setPendingPhotoAction({ itemId, points, configuredPoints, completedByUserId, buttonElement });
        setPhotoSheetOpen(true);
        setPhotoPreview(null);
        setPhotoFile(null);
        return;
      }
    }

    executeComplete(itemId, points, configuredPoints, completedByUserId, buttonElement, isSkipped);
  };

  const executeComplete = (itemId: string, points: number, configuredPoints: number, completedByUserId?: string, buttonElement?: HTMLElement, isSkipped?: boolean, photoUrl?: string) => {
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
    onToggleItem(itemId, isSkipped ? 0 : points, completedByUserId, isSkipped, photoUrl);
    setOpenPopover(null);
    setExpandedPeopleFor(null);
  };

  const handlePhotoCapture = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPhotoFile(file);
    const reader = new FileReader();
    reader.onload = () => setPhotoPreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handlePhotoConfirm = async () => {
    if (!photoFile || !pendingPhotoAction) return;
    setPhotoUploading(true);
    try {
      const ext = photoFile.name.split('.').pop() || 'jpg';
      const path = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
      const { error: uploadError } = await supabase.storage
        .from('checklist-photos')
        .upload(path, photoFile);
      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from('checklist-photos')
        .getPublicUrl(path);

      const { itemId, points, configuredPoints, completedByUserId, buttonElement } = pendingPhotoAction;
      setPhotoSheetOpen(false);
      executeComplete(itemId, points, configuredPoints, completedByUserId, buttonElement, false, urlData.publicUrl);
      setPendingPhotoAction(null);
      setPhotoPreview(null);
      setPhotoFile(null);
    } catch (err: any) {
      console.error('Photo upload error:', err);
      toast.error('Erro ao enviar foto');
    } finally {
      setPhotoUploading(false);
    }
  };

  const handleSplit = async (itemId: string, completion: any, configuredPoints: number) => {
    if (!onSplitCompletion || splitSelectedUsers.size < 2) return;
    setSplitLoading(true);
    try {
      await onSplitCompletion(itemId, date, checklistType, Array.from(splitSelectedUsers));
      setSplittingItemId(null);
      setSplitSelectedUsers(new Set());
      toast.success('Pontos divididos com sucesso!');
    } catch (err: any) {
      console.error('Split error:', err);
      toast.error(err.message || 'Erro ao dividir pontos');
    } finally {
      setSplitLoading(false);
    }
  };

  const handleProductionUndo = async () => {
    if (!pendingProductionUndo || !activeUnitId) return;
    const { itemId, linkedInventoryItemId } = pendingProductionUndo;
    setProductionUndoLoading(true);
    try {
      const { error: smError } = await supabase
        .from('stock_movements')
        .delete()
        .eq('item_id', linkedInventoryItemId)
        .eq('type', 'entrada')
        .like('notes', '%Produção via checklist%')
        .eq('unit_id', activeUnitId);
      if (smError) console.error('Error deleting stock movements:', smError);

      const { error: poError } = await supabase
        .from('production_orders')
        .delete()
        .eq('item_id', linkedInventoryItemId)
        .eq('unit_id', activeUnitId);
      if (poError) console.error('Error deleting production orders:', poError);

      setOptimisticToggles(prev => { const next = new Set(prev); next.add(itemId); return next; });
      await onToggleItem(itemId, 0, undefined, undefined, undefined, false, true);
      toast.success('Produção revertida com sucesso');
    } catch (err: any) {
      console.error('Production undo error:', err);
      toast.error(err.message || 'Erro ao reverter produção');
      setOptimisticToggles(prev => { const next = new Set(prev); next.delete(itemId); return next; });
    } finally {
      setProductionUndoLoading(false);
      setProductionUndoOpen(false);
      setPendingProductionUndo(null);
      setOpenPopover(null);
    }
  };

  const getItemCompletionCount = useCallback((itemId: string) => {
    return completions.filter(c => c.item_id === itemId && !c.is_skipped).length;
  }, [completions]);

  const handleContest = async (completionId: string) => {
    if (!onContestCompletion || !contestReason.trim()) return;
    setContestLoading(true);
    try {
      await onContestCompletion(completionId, contestReason);
      setContestingItemId(null);
      setContestReason('');
    } catch (err: any) {
      console.error('Contest error:', err);
      toast.error('Erro ao contestar item');
    } finally {
      setContestLoading(false);
    }
  };

  // For bonus: collect all items flat across all sectors
  const allBonusItems = isBonus ? sectors.flatMap(sector =>
    sector.subcategories?.flatMap(sub =>
      (sub.items || []).filter(i => i.is_active && (i as any).checklist_type === 'bonus')
    ) || []
  ) : [];

  // For production: collect all items with linked_inventory_item_id
  const allProductionItems = isProduction ? sectors.flatMap(sector =>
    sector.subcategories?.flatMap(sub =>
      (sub.items || []).filter(i => i.is_active && (i as any).linked_inventory_item_id)
    ) || []
  ) : [];

  const filteredSectors = sectors.filter(sector => {
    const hasActiveItems = sector.subcategories?.some(sub =>
      sub.items?.some(i => i.is_active && (i as any).checklist_type === checklistType)
    );
    return hasActiveItems;
  });

  const deadlineBannerText = deadlinePassed
    ? '⏰ Prazo encerrado — itens pendentes marcados como "não concluído"'
    : null;

  return (
    <div className="space-y-5">
      {/* Deadline banner */}
      {deadlineBannerText && !isAdmin && (
        <div className="flex items-center gap-2 p-3 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-sm font-medium">
          <AppIcon name="Clock" className="w-4 h-4 shrink-0" />
          <span>{deadlineBannerText}</span>
        </div>
      )}

      {/* Bonus: Flat list without sectors */}
      {isBonus && allBonusItems.length === 0 && (
        <div className="card-command p-8 text-center">
          <p className="text-muted-foreground text-sm">
            Nenhuma tarefa bônus disponível.
          </p>
        </div>
      )}
      {isBonus && allBonusItems.length > 0 && (
        <div className="space-y-1.5">
          {allBonusItems.map((item, itemIndex) => {
            const completed = isItemCompletedOptimistic(item.id);
            const completion = completions.find(c => c.item_id === item.id);
            const canToggle = canToggleItem(completion, completed);
            const configuredPoints = item.points ?? 1;
            const isJustCompleted = recentlyCompleted.has(item.id);

            return (
              <button
                key={item.id}
                ref={(el) => { /* no-op */ }}
                onClick={(e) => {
                  if (!canToggle) return;
                  handleComplete(item.id, configuredPoints, configuredPoints, currentUserId, e.currentTarget as HTMLElement);
                }}
                disabled={!canToggle}
                className={cn(
                  "w-full flex items-center gap-3 p-4 rounded-2xl border text-left transition-all duration-300",
                  completed
                    ? "bg-success/5 border-success/20"
                    : "card-stat-holo",
                  isJustCompleted && "animate-scale-in",
                  !canToggle && !completed && "opacity-50"
                )}
                style={{ animationDelay: `${itemIndex * 50}ms` }}
              >
                {/* Checkbox */}
                <div className={cn(
                  "w-6 h-6 rounded-lg border-2 flex items-center justify-center shrink-0 transition-all",
                  completed ? "bg-success border-success" : "border-muted-foreground/30"
                )}>
                  {completed && <AppIcon name="check" size={14} className="text-success-foreground" />}
                </div>

                {/* Name */}
                <div className="flex-1 min-w-0">
                  <p className={cn(
                    "text-sm font-medium transition-colors",
                    completed ? "text-success line-through" : "text-foreground"
                  )}>
                    {item.name}
                  </p>
                  {item.description && (
                    <p className="text-[11px] text-muted-foreground truncate">{item.description}</p>
                  )}
                </div>

                {/* Points */}
                {configuredPoints > 0 && (
                  <div className={cn(
                    "px-2 py-1 rounded-lg text-xs font-bold flex items-center gap-0.5 shrink-0",
                    completed ? "bg-success/10 text-success" : "bg-primary/10 text-primary"
                  )}>
                    <AppIcon name="bolt" size={12} />
                    {configuredPoints}
                  </div>
                )}
              </button>
            );
          })}
        </div>
      )}

      {/* Production: Flat list of production items */}
      {isProduction && allProductionItems.length === 0 && (
        <div className="card-command p-8 text-center">
          <p className="text-muted-foreground text-sm">
            Nenhum item de produção disponível.
          </p>
        </div>
      )}
      {isProduction && allProductionItems.length > 0 && (
        <div className="space-y-1.5">
          {allProductionItems.map((item, itemIndex) => {
            const completed = isItemCompletedOptimistic(item.id);
            const completion = completions.find(c => c.item_id === item.id);
            const canToggle = canToggleItem(completion, completed);
            const configuredPoints = item.points ?? 1;
            const isJustCompleted = recentlyCompleted.has(item.id);
            const linkedInventoryItemId = (item as any).linked_inventory_item_id;

            if (completed) {
              const wasSkipped = completion?.is_skipped === true;
              const wasAwardedPoints = completion?.awarded_points !== false;
              const pointsAwarded = completion?.points_awarded ?? item.points;
              return (
                <div key={item.id} className="space-y-1.5">
                  <button
                    onClick={() => {
                      const isOwnCompletion = completion?.completed_by === currentUserId;
                      if (isAdmin || isOwnCompletion) {
                        setOpenPopover(openPopover === item.id ? null : item.id);
                        return;
                      }
                      if (!canToggle) return;
                    }}
                    disabled={(isAdmin || completion?.completed_by === currentUserId) ? false : !canToggle}
                    className={cn(
                      "w-full flex items-start gap-3 p-3.5 rounded-2xl transition-all duration-300",
                      wasSkipped
                        ? "bg-gradient-to-r from-destructive/15 to-destructive/5 border-2 border-destructive/30"
                        : "bg-gradient-to-r from-success/15 to-success/5 border-2 border-success/30",
                      isJustCompleted && "animate-scale-in",
                      openPopover === item.id && "ring-2 ring-primary/30"
                    )}
                  >
                    <div className={cn(
                      "w-7 h-7 rounded-lg flex items-center justify-center shrink-0 text-white shadow-md mt-0.5",
                      wasSkipped ? "bg-destructive" : "bg-success"
                    )}>
                      {wasSkipped ? <AppIcon name="X" className="w-4 h-4" /> : <AppIcon name="Check" className="w-4 h-4" />}
                    </div>
                    <div className="flex-1 min-w-0 text-left">
                      <div className="flex items-center gap-2">
                        <p className={cn("font-medium line-through text-sm", wasSkipped ? "text-destructive" : "text-success")}>{item.name}</p>
                        <AppIcon name="soup_kitchen" size={14} className="text-success shrink-0" />
                      </div>
                      {completion && (
                        <div className="flex items-center gap-1 mt-1 text-[11px] text-muted-foreground">
                          <AppIcon name="User" className="w-3 h-3" />
                          <span>{completion.profile?.full_name || 'Usuário'} · {format(new Date(completion.completed_at), 'HH:mm')}</span>
                        </div>
                      )}
                    </div>
                    {wasAwardedPoints && pointsAwarded > 0 && !wasSkipped && (
                      <div className="flex items-center gap-0.5 shrink-0" style={{ color: getItemPointsColors(pointsAwarded).color }}>
                        <AppIcon name="Star" size={18} />
                        <span className="text-sm font-bold">{pointsAwarded}</span>
                      </div>
                    )}
                  </button>
                  {/* Popover panel for completed production items */}
                  {(isAdmin || completion?.completed_by === currentUserId) && openPopover === item.id && completion && (
                    <div className="mt-2 rounded-xl border bg-card p-4 shadow-lg animate-fade-in space-y-3">
                      {canToggle && (
                        <button
                          onClick={() => {
                            if (linkedInventoryItemId) {
                              setPendingProductionUndo({ itemId: item.id, linkedInventoryItemId, itemName: item.name });
                              setProductionUndoOpen(true);
                            } else {
                              setOpenPopover(null);
                              setOptimisticToggles(prev => { const next = new Set(prev); next.add(item.id); return next; });
                              onToggleItem(item.id, 0, undefined, undefined, undefined, false, true).catch(err => {
                                setOptimisticToggles(prev => { const next = new Set(prev); next.delete(item.id); return next; });
                                toast.error(err.message || 'Erro ao desfazer');
                              });
                            }
                          }}
                          className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-secondary text-left transition-all duration-200 active:scale-[0.97]"
                        >
                          <div className="w-10 h-10 bg-secondary rounded-xl flex items-center justify-center">
                            <AppIcon name="undo" size={20} className="text-muted-foreground" />
                          </div>
                          <div>
                            <p className="font-semibold text-foreground">Desfazer</p>
                            <p className="text-xs text-muted-foreground">Reverter produção e estoque</p>
                          </div>
                        </button>
                      )}
                    </div>
                  )}
                </div>
              );
            }

            // Uncompleted production item
            return (
              <div key={item.id}>
                <button
                  disabled={!canToggle}
                  onClick={(e) => {
                    if (!canToggle) return;
                    if (!isAdmin) {
                      handleComplete(item.id, configuredPoints, configuredPoints, undefined, e.currentTarget as HTMLElement);
                    } else {
                      setOpenPopover(openPopover === item.id ? null : item.id);
                    }
                  }}
                  className={cn(
                    "w-full flex items-center gap-3 p-3.5 rounded-2xl transition-all duration-300",
                    "card-stat-holo",
                    !canToggle && "opacity-50",
                    canToggle && "active:scale-[0.97]",
                    openPopover === item.id && "!border-primary/40"
                  )}
                >
                  <div className="w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 border-2 border-muted-foreground/20 bg-background/50">
                    <AppIcon name="Check" className="w-5 h-5 text-muted-foreground/40" />
                  </div>
                  <div className="flex-1 min-w-0 text-left">
                    <div className="flex items-center gap-1.5">
                      <p className="font-semibold text-sm text-foreground truncate">{item.name}</p>
                      <AppIcon name="soup_kitchen" size={14} className="text-amber-500 shrink-0" />
                    </div>
                    {item.description && <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">{item.description}</p>}
                  </div>
                  {configuredPoints > 0 && (
                    <div className="flex items-center gap-0.5 shrink-0 pr-1" style={{ color: getItemPointsColors(configuredPoints).color }}>
                      <AppIcon name="Star" size={20} />
                      <span className="text-sm font-bold">{configuredPoints}</span>
                    </div>
                  )}
                </button>
                {/* Admin popover for uncompleted production items */}
                {openPopover === item.id && (
                  <div className="mt-2 rounded-xl border bg-card p-4 shadow-lg animate-fade-in space-y-3">
                    {isAdmin && profiles.length > 0 && (
                      <>
                        <button
                          onClick={() => setExpandedPeopleFor(expandedPeopleFor === item.id ? null : item.id)}
                          className="w-full flex items-center gap-3 p-3 rounded-xl bg-primary/5 hover:bg-primary/10 text-left transition-all duration-200 border border-primary/20 active:scale-[0.97]"
                        >
                          <div className="w-10 h-10 bg-primary/15 rounded-xl flex items-center justify-center">
                            <AppIcon name="Users" className="w-5 h-5 text-primary" />
                          </div>
                          <div className="flex-1">
                            <p className="font-semibold text-foreground">Quem realizou?</p>
                            <p className="text-xs text-muted-foreground">Selecione quem fez</p>
                          </div>
                          <AppIcon name="ChevronDown" className={cn("w-5 h-5 text-muted-foreground transition-transform", expandedPeopleFor === item.id && "rotate-180")} />
                        </button>
                        <div className={cn("overflow-hidden transition-all duration-300", expandedPeopleFor === item.id ? "max-h-64 opacity-100" : "max-h-0 opacity-0")}>
                          <div className="max-h-48 overflow-y-auto space-y-1 pt-1">
                            {profiles.map((profile) => (
                              <button key={profile.user_id} onClick={(e) => handleComplete(item.id, configuredPoints, configuredPoints, profile.user_id, e.currentTarget)}
                                className={cn("w-full flex items-center gap-2 p-2 rounded-lg text-left text-sm",
                                  profile.user_id === currentUserId ? "bg-primary/10 hover:bg-primary/20 text-primary font-medium" : "hover:bg-secondary text-foreground")}>
                                <AppIcon name="User" className="w-4 h-4 shrink-0" /><span className="truncate">{profile.full_name}</span>
                                {profile.user_id === currentUserId && <span className="text-xs text-muted-foreground ml-auto">(eu)</span>}
                              </button>
                            ))}
                          </div>
                        </div>
                      </>
                    )}
                    {!isAdmin && (
                      <>
                        <button onClick={(e) => handleComplete(item.id, configuredPoints, configuredPoints, undefined, e.currentTarget)}
                          className="w-full flex items-center gap-3 p-3 rounded-xl bg-success/10 hover:bg-success/20 text-left transition-all duration-200 border-2 border-success/30 active:scale-[0.97]">
                          <div className="w-10 h-10 bg-success rounded-xl flex items-center justify-center shadow-lg shadow-success/20"><AppIcon name="Check" className="w-5 h-5 text-success-foreground" /></div>
                          <div className="flex-1"><p className="font-semibold text-success">Concluí agora</p>
                            {configuredPoints > 0 ? (
                              <div className="flex items-center gap-1 mt-0.5"><div className="w-2 h-2 rounded-full" style={{ backgroundColor: getItemPointsColors(configuredPoints).color }} />
                                <span className="text-xs font-bold" style={{ color: getItemPointsColors(configuredPoints).color }}>+{configuredPoints}</span></div>
                            ) : (<span className="text-xs text-muted-foreground">Tarefa sem pontos</span>)}
                          </div>
                        </button>
                        <div className="border-t border-border" />
                        <button onClick={(e) => handleComplete(item.id, 0, configuredPoints, undefined, e.currentTarget, true)}
                          className="w-full flex items-center gap-3 p-3 rounded-xl bg-destructive/5 hover:bg-destructive/10 text-left transition-all duration-200 border border-destructive/20 active:scale-[0.97]">
                          <div className="w-10 h-10 bg-destructive/15 rounded-xl flex items-center justify-center"><AppIcon name="X" className="w-5 h-5 text-destructive" /></div>
                          <div><p className="font-semibold text-destructive">Não concluído</p><p className="text-xs text-muted-foreground">Sem pontos</p></div>
                        </button>
                      </>
                    )}
                    {isAdmin && (
                      <>
                        <div className="border-t border-border" />
                        <button onClick={(e) => handleComplete(item.id, 0, configuredPoints, currentUserId, e.currentTarget, true)}
                          className="w-full flex items-center gap-3 p-3 rounded-xl bg-destructive/5 hover:bg-destructive/10 text-left transition-all duration-200 border border-destructive/20 active:scale-[0.97]">
                          <div className="w-10 h-10 bg-destructive/15 rounded-xl flex items-center justify-center"><AppIcon name="X" className="w-5 h-5 text-destructive" /></div>
                          <div><p className="font-semibold text-destructive">Não concluído</p><p className="text-xs text-muted-foreground">Sem pontos</p></div>
                        </button>
                      </>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Sectors (non-bonus, non-production) */}
      {!isBonus && !isProduction && filteredSectors.length === 0 && (
        <div className="card-command p-8 text-center">
          <p className="text-muted-foreground text-sm">
            Nenhuma tarefa configurada para {getTypeLabel(checklistType)}.
          </p>
        </div>
      )}
      {!isBonus && !isProduction && filteredSectors.map((sector, sectorIndex) => {
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
                "w-full flex items-center gap-3.5 p-3.5 rounded-2xl transition-all duration-300 relative overflow-hidden",
                "bg-card border border-border/40 hover:border-border/70",
                sectorComplete && "border-success/30"
              )}
            >
              {/* Left accent bar */}
              <div
                className="absolute left-0 top-3 bottom-3 w-[3px] rounded-full transition-colors"
                style={{ background: sectorComplete ? 'hsl(var(--success))' : sector.color }}
              />

              {/* Icon */}
              <div className={cn(
                "w-12 h-12 rounded-full flex items-center justify-center shrink-0 transition-all duration-300 shadow-lg",
                sectorComplete && "ring-2 ring-success/30"
              )} style={{ background: sectorComplete ? 'linear-gradient(135deg, #22C55E, #10B981)' : getSectorGradient(sector) }}>
                {sectorComplete ? (
                  <AppIcon name="check_circle" size={22} fill={1} className="text-white animate-scale-in" />
                ) : (
                  <AppIcon name={getSectorIcon(sector)} size={22} fill={1} className="text-white" />
                )}
              </div>

              <div className="flex-1 min-w-0 text-left">
                <p className={cn(
                  "font-semibold text-sm transition-colors duration-300",
                  sectorComplete ? "text-success" : "text-foreground"
                )}>
                  {sector.name}
                </p>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  {progress.completed}/{progress.total} concluídos
                </p>
              </div>

              <div className="flex items-center gap-3 shrink-0">
                <div className="w-14 h-1.5 bg-secondary rounded-full overflow-hidden">
                  <div
                    className={cn(
                      "h-full transition-all duration-500 rounded-full",
                      sectorComplete ? "bg-success" : "bg-primary"
                    )}
                    style={{ width: `${progress.total > 0 ? (progress.completed / progress.total) * 100 : 0}%` }}
                  />
                </div>
                <AppIcon name="ChevronRight" size={16} className={cn(
                  "text-muted-foreground/50 transition-transform duration-300",
                  isExpanded && "rotate-90"
                )} />
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
                              const isOwnCompletion = completion?.completed_by === currentUserId;
                              if (isAdmin || isOwnCompletion) {
                                setOpenPopover(openPopover === item.id ? null : item.id);
                                setContestingItemId(null);
                                setContestReason('');
                                setSplittingItemId(null);
                                return;
                              }
                              if (!canToggle) return;
                              setOptimisticToggles(prev => { const next = new Set(prev); next.add(item.id); return next; });
                              onToggleItem(item.id, 0);
                            }}
                            disabled={isContested ? true : (isAdmin || completion?.completed_by === currentUserId) ? false : !canToggle}
                            className={cn(
                              "w-full flex items-start gap-3 p-3 rounded-xl transition-all duration-300",
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
                              "w-7 h-7 rounded-lg flex items-center justify-center shrink-0 text-white shadow-md transition-all duration-300 mt-0.5",
                              isContested ? "bg-amber-500 shadow-amber-500/30"
                                : wasSkipped ? "bg-destructive shadow-destructive/30" : "bg-success shadow-success/30",
                              isJustCompleted && "scale-125"
                            )}>
                              {isContested ? <AppIcon name="AlertTriangle" className="w-4 h-4" /> : wasSkipped ? <AppIcon name="X" className="w-4 h-4" /> : <AppIcon name="Check" className="w-4 h-4" />}
                            </div>
                            <div className="flex-1 min-w-0 text-left">
                              <div className="flex items-start justify-between gap-2">
                                <p className={cn("font-medium line-through text-sm leading-tight", isContested ? "text-amber-600 dark:text-amber-400" : wasSkipped ? "text-destructive" : "text-success")}>{item.name}</p>
                                {wasAwardedPoints && pointsAwarded > 0 && !isContested && !wasSkipped ? (
                                  <div className="flex items-center gap-0.5 shrink-0" style={{ color: getItemPointsColors(pointsAwarded).color }}>
                                    <AppIcon name="Star" size={18} />
                                    <span className="text-sm font-bold">{pointsAwarded}</span>
                                  </div>
                                ) : (
                                <div className={cn(
                                  "flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium shrink-0 border transition-all duration-300",
                                  isContested ? "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20"
                                    : wasSkipped ? "bg-destructive/10 text-destructive border-destructive/20"
                                    : "bg-primary/10 text-primary border-primary/20"
                                 )}>
                                  {isContested ? (<><AppIcon name="AlertTriangle" className="w-3 h-3" /><span>contestado</span></>)
                                    : wasSkipped ? (<><AppIcon name="X" className="w-3 h-3" /><span>não concluído</span></>) 
                                    : (<><AppIcon name="RefreshCw" className="w-3 h-3" /><span>pronto</span></>)}
                                </div>
                                )}
                              </div>
                              {isContested && contestedReason && (
                                <p className="text-xs text-amber-600 dark:text-amber-400 mt-0.5">Contestado: {contestedReason}</p>
                              )}
                              {item.description && !isContested && <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{item.description}</p>}
                              {completion && (
                                <div className="flex items-center gap-1 mt-1 text-[11px] text-muted-foreground flex-wrap">
                                  <AppIcon name="User" className="w-3 h-3 shrink-0" />
                                  <span className="truncate">{completion.profile?.full_name || 'Usuário'} · {format(new Date(completion.completed_at), 'HH:mm')}</span>
                                  {isContested && <span className="text-amber-600 dark:text-amber-400">(contestado)</span>}
                                  {!isContested && !wasSkipped && !wasAwardedPoints && <span className="text-primary">(já pronto)</span>}
                                  {(() => { const count = getItemCompletionCount(item.id); return count > 1 ? <span className="text-primary">👥 {count}</span> : null; })()}
                                  {(completion as any)?.photo_url && (
                                    <button
                                      onClick={(e) => { e.stopPropagation(); setViewingPhotoUrl((completion as any).photo_url); }}
                                      className="flex items-center gap-0.5 text-primary hover:underline"
                                    >
                                      <AppIcon name="Camera" className="w-3 h-3" />
                                      <span>foto</span>
                                    </button>
                                  )}
                                </div>
                              )}
                            </div>
                          </button>
                          {/* Inline panel for completed items (admin or own completion) */}
                          {(isAdmin || completion?.completed_by === currentUserId) && openPopover === item.id && !isContested && completion && (
                            <div className="mt-2 rounded-xl border bg-card p-4 shadow-lg animate-fade-in space-y-3">
                              {/* Desfazer (non-timer mode) */}
                              {!isTimerMode && canToggle && (
                                <button
                                  onClick={async () => {
                                    setOpenPopover(null);
                                    setOptimisticToggles(prev => { const next = new Set(prev); next.add(item.id); return next; });
                                    try {
                                      await onToggleItem(item.id, 0, undefined, undefined, undefined, false, true);
                                    } catch (error: any) {
                                      setOptimisticToggles(prev => { const next = new Set(prev); next.delete(item.id); return next; });
                                      toast.error(error.message || 'Erro ao desfazer');
                                    }
                                  }}
                                  className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-secondary text-left transition-all duration-200 active:scale-[0.97]"
                                >
                                  <div className="w-10 h-10 bg-secondary rounded-xl flex items-center justify-center">
                                    <AppIcon name="undo" size={20} className="text-muted-foreground" />
                                  </div>
                                  <div>
                                    <p className="font-semibold text-foreground">Desfazer</p>
                                    <p className="text-xs text-muted-foreground">Desmarcar conclusão</p>
                                  </div>
                                </button>
                              )}
                              {/* Continuar (desmarcar sem zerar timer) - only in timer mode */}
                              {isTimerMode && canToggle && (
                                <button
                                  onClick={async () => {
                                    setOpenPopover(null);
                                    setOptimisticToggles(prev => { const next = new Set(prev); next.add(item.id); return next; });
                                    try {
                                      const resumeUserId = completion?.completed_by || currentUserId;
                                      await onToggleItem(item.id, 0, undefined, undefined, undefined, true, true);
                                      if (onStartTimer && resumeUserId) await onStartTimer(item.id, resumeUserId);
                                    } catch (error: any) {
                                      setOptimisticToggles(prev => { const next = new Set(prev); next.delete(item.id); return next; });
                                      toast.error(error.message || 'Erro ao continuar tarefa');
                                    }
                                  }}
                                  className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-secondary text-left transition-all duration-200 active:scale-[0.97]"
                                >
                                  <div className="w-10 h-10 bg-secondary rounded-xl flex items-center justify-center">
                                    <AppIcon name="Play" className="w-5 h-5 text-muted-foreground" />
                                  </div>
                                  <div>
                                    <p className="font-semibold text-foreground">Continuar</p>
                                    <p className="text-xs text-muted-foreground">Retomar sem zerar o timer</p>
                                  </div>
                                </button>
                              )}
                              {/* Resetar tarefa (desmarcar + zerar timer) - only in timer mode */}
                              {isTimerMode && canToggle && onCancelTimer && (
                                <>
                                  <div className="border-t border-border" />
                                  <button
                                    onClick={async () => {
                                      setOpenPopover(null);
                                      setOptimisticToggles(prev => { const next = new Set(prev); next.add(item.id); return next; });
                                      try {
                                        await onCancelTimer(item.id, { includeFinished: true });
                                        await onToggleItem(item.id, 0, undefined, undefined, undefined, false, true);
                                      } catch (error: any) {
                                        setOptimisticToggles(prev => { const next = new Set(prev); next.delete(item.id); return next; });
                                        toast.error(error.message || 'Erro ao resetar tarefa');
                                        console.error('Reset error:', error);
                                      }
                                    }}
                                    className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-secondary text-left transition-all duration-200 active:scale-[0.97]"
                                  >
                                    <div className="w-10 h-10 bg-destructive/15 rounded-xl flex items-center justify-center">
                                      <AppIcon name="RefreshCw" className="w-5 h-5 text-destructive" />
                                    </div>
                                    <div>
                                      <p className="font-semibold text-destructive">Resetar tarefa</p>
                                      <p className="text-xs text-muted-foreground">Zerar tudo e recomeçar</p>
                                    </div>
                                  </button>
                                </>
                              )}
                              {/* Dividir pontos */}
                              {!wasSkipped && onSplitCompletion && profiles.length > 0 && (
                                <>
                                  <div className="border-t border-border" />
                                  {splittingItemId === item.id ? (
                                    <div className="space-y-2 animate-fade-in">
                                      <div className="flex items-center gap-2 text-sm font-medium text-primary">
                                        <AppIcon name="Users" className="w-4 h-4" />
                                        <span>Dividir pontos ({item.points ?? 1} pts)</span>
                                      </div>
                                      <div className="max-h-40 overflow-y-auto space-y-1">
                                        {profiles.map((profile) => {
                                          const isSelected = splitSelectedUsers.has(profile.user_id);
                                          const isOriginal = profile.user_id === completion.completed_by;
                                          return (
                                            <label key={profile.user_id} className={cn("flex items-center gap-2 p-2 rounded-lg cursor-pointer text-sm transition-colors", isSelected ? "bg-primary/10" : "hover:bg-secondary")}>
                                              <Checkbox checked={isSelected} onCheckedChange={(checked) => {
                                                setSplitSelectedUsers(prev => {
                                                  const next = new Set(prev);
                                                  if (checked) next.add(profile.user_id); else next.delete(profile.user_id);
                                                  return next;
                                                });
                                              }} />
                                              <span className="truncate">{profile.full_name}</span>
                                              {isOriginal && <span className="text-xs text-muted-foreground ml-auto">(completou)</span>}
                                            </label>
                                          );
                                        })}
                                      </div>
                                      {splitSelectedUsers.size >= 2 && (() => {
                                        const pts = item.points ?? 1;
                                        const base = Math.floor(pts / splitSelectedUsers.size);
                                        const rem = pts - base * splitSelectedUsers.size;
                                        return (
                                          <p className="text-xs text-muted-foreground text-center">
                                            {pts} pts ÷ {splitSelectedUsers.size} = {base} pts cada
                                            {rem > 0 && <span> (+{rem} pt p/ quem completou)</span>}
                                          </p>
                                        );
                                      })()}
                                      <div className="flex gap-2">
                                        <button
                                          onClick={() => handleSplit(item.id, completion, item.points ?? 1)}
                                          disabled={splitSelectedUsers.size < 2 || splitLoading}
                                          className="flex-1 p-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium disabled:opacity-50 hover:bg-primary/90 transition-colors"
                                        >
                                          {splitLoading ? 'Dividindo...' : 'Confirmar divisão'}
                                        </button>
                                        <button onClick={() => { setSplittingItemId(null); setSplitSelectedUsers(new Set()); }} className="p-2 rounded-lg hover:bg-secondary transition-colors">
                                          <AppIcon name="X" className="w-4 h-4 text-muted-foreground" />
                                        </button>
                                      </div>
                                    </div>
                                  ) : (
                                    <button
                                      onClick={() => { setSplittingItemId(item.id); setSplitSelectedUsers(new Set([completion.completed_by])); setContestingItemId(null); }}
                                      className="w-full flex items-center gap-3 p-3 rounded-xl bg-primary/5 hover:bg-primary/10 text-left transition-all duration-200 border border-primary/20 active:scale-[0.97]"
                                    >
                                      <div className="w-10 h-10 bg-primary/15 rounded-xl flex items-center justify-center">
                                        <AppIcon name="Users" className="w-5 h-5 text-primary" />
                                      </div>
                                      <div>
                                        <p className="font-semibold text-primary">Dividir pontos</p>
                                        <p className="text-xs text-muted-foreground">Dividir entre participantes</p>
                                      </div>
                                    </button>
                                  )}
                                </>
                              )}
                              {/* Contestar — admin only */}
                              {isAdmin && !wasSkipped && (
                                <>
                                  <div className="border-t border-border" />
                                  {contestingItemId === item.id ? (
                                    <div className="space-y-3 animate-fade-in">
                                      <div className="flex items-center gap-2 text-sm font-medium text-amber-600 dark:text-amber-400">
                                        <AppIcon name="AlertTriangle" className="w-4 h-4" />
                                        <span>Motivo da contestação</span>
                                      </div>
                                      <input
                                        type="text"
                                        value={contestReason}
                                        onChange={(e) => setContestReason(e.target.value)}
                                        placeholder="Descreva o motivo..."
                                        className="w-full bg-transparent border border-amber-500/30 rounded-xl px-3 py-2.5 outline-none text-sm text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-amber-500/30"
                                        onKeyDown={(e) => { if (e.key === 'Enter' && contestReason.trim()) handleContest(completion.id); if (e.key === 'Escape') { setContestingItemId(null); setContestReason(''); } }}
                                      />
                                      <div className="flex items-center gap-2">
                                        <button
                                          onClick={() => handleContest(completion.id)}
                                          disabled={!contestReason.trim() || contestLoading}
                                          className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-amber-500 text-white text-sm font-semibold disabled:opacity-50 hover:bg-amber-600 transition-colors"
                                        >
                                          <AppIcon name="Send" className="w-4 h-4" />
                                          Contestar
                                        </button>
                                        <button onClick={() => { setContestingItemId(null); setContestReason(''); }} className="p-2.5 rounded-xl hover:bg-secondary transition-colors">
                                          <AppIcon name="X" className="w-5 h-5 text-muted-foreground" />
                                        </button>
                                      </div>
                                    </div>
                                  ) : (
                                    <button
                                      onClick={() => { setContestingItemId(item.id); setContestReason(''); }}
                                      className="w-full flex items-center gap-3 p-3 rounded-xl bg-amber-500/5 hover:bg-amber-500/10 text-left transition-all duration-200 border border-amber-500/20 active:scale-[0.97]"
                                    >
                                      <div className="w-10 h-10 bg-amber-500/15 rounded-xl flex items-center justify-center">
                                        <AppIcon name="AlertTriangle" className="w-5 h-5 text-amber-500" />
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

                    // Timer mode: check if item has active timer
                    const activeTimer = isTimerMode && getActiveTimer ? getActiveTimer(item.id) : undefined;
                    const itemStats = isTimerMode && timeStats ? timeStats.get(item.id) : undefined;

                    // Timer mode: handle click differently
                    const handleTimerClick = (event: React.MouseEvent<HTMLButtonElement>) => {
                      if (!canToggle) return;
                      if (activeTimer) {
                        // Has active timer → toggle popover with finish/reset options
                        setOpenPopover(openPopover === item.id ? null : item.id);
                      } else if (isTimerMode && onStartTimer && validatePin) {
                        // No active timer → ask PIN to start
                        setPendingTimerItemId(item.id);
                        setPendingTimerPoints(configuredPoints);
                        setPinDialogOpen(true);
                      } else if (!isAdmin) {
                        // Standard mode for non-admin: single tap completes directly
                        handleComplete(item.id, configuredPoints, configuredPoints, undefined, event.currentTarget);
                      } else {
                        // Standard mode for admin keeps the action panel
                        setOpenPopover(openPopover === item.id ? null : item.id);
                      }
                    };

                    return (
                      <div key={item.id}>
                        <button
                          disabled={!canToggle}
                          onClick={handleTimerClick}
                          className={cn(
                            "w-full flex items-center gap-3 p-3.5 rounded-2xl transition-all duration-200",
                            !canToggle && "cursor-not-allowed opacity-80",
                            canToggle && "active:scale-[0.97]",
                            "card-stat-holo",
                            activeTimer && "!border-primary/40 bg-primary/5",
                            openPopover === item.id && "!border-primary/40"
                          )}
                          style={{ animationDelay: `${itemIndex * 40}ms` }}
                        >
                          {activeTimer ? (
                            <div className="w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 bg-primary/15 border border-primary/30">
                              <AppIcon name="Timer" className="w-5 h-5 text-primary animate-pulse" />
                            </div>
                          ) : (
                            <div className="w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 border-2 border-muted-foreground/20 bg-background/50 transition-all duration-300 hover:border-success/50 hover:bg-success/10">
                              <AppIcon name="Check" className="w-5 h-5 text-muted-foreground/40" />
                            </div>
                          )}
                          <div className="flex-1 text-left min-w-0">
                            <div className="flex items-center gap-1.5">
                              <p className="font-semibold text-sm text-foreground truncate">{item.name}</p>
                              {(item as any).requires_photo && <AppIcon name="Camera" className="w-3.5 h-3.5 text-primary shrink-0" />}
                            </div>
                            {item.description && <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">{item.description}</p>}
                            {activeTimer && (
                              <div className="mt-1.5 flex items-center gap-2">
                                <TimerBadge timer={activeTimer} stats={itemStats} minExecutions={timerMinExecutions} />
                                <span className="text-[10px] text-muted-foreground">{activeTimer.userName}</span>
                              </div>
                            )}
                            {!activeTimer && itemStats && isTimerMode && (
                              <div className="mt-1">
                                <TimerStatsIndicator stats={itemStats} minExecutions={timerMinExecutions} />
                              </div>
                            )}
                          </div>
                          {configuredPoints > 0 && (
                            <div className="flex items-center gap-0.5 shrink-0 pr-1" style={{ color: getItemPointsColors(configuredPoints).color }}>
                              <AppIcon name="Star" size={20} />
                              <span className="text-sm font-bold">{configuredPoints}</span>
                            </div>
                          )}
                        </button>
                        {openPopover === item.id && activeTimer && onCancelTimer && (
                          <div className="mt-2 rounded-xl border bg-card p-4 shadow-lg animate-fade-in space-y-3">
                            {/* Finalizar timer */}
                            <button
                              onClick={() => {
                                setPendingTimerItemId(item.id);
                                setPendingTimerPoints(configuredPoints);
                                setPinDialogOpen(true);
                                setOpenPopover(null);
                              }}
                              className="w-full flex items-center gap-3 p-3 rounded-xl bg-success/10 hover:bg-success/20 text-left transition-all duration-200 border-2 border-success/30 active:scale-[0.97]"
                            >
                              <div className="w-10 h-10 bg-success rounded-xl flex items-center justify-center shadow-lg shadow-success/20">
                                <AppIcon name="CheckCircle" className="w-5 h-5 text-success-foreground" />
                              </div>
                              <div>
                                <p className="font-semibold text-success">Finalizar tarefa</p>
                                <p className="text-xs text-muted-foreground">Concluir e parar o timer</p>
                              </div>
                            </button>
                            {/* Resetar timer */}
                            <button
                              onClick={async () => {
                                await onCancelTimer(item.id);
                                setOpenPopover(null);
                              }}
                              className="w-full flex items-center gap-3 p-3 rounded-xl bg-destructive/5 hover:bg-destructive/10 text-left transition-all duration-200 border border-destructive/20 active:scale-[0.97]"
                            >
                              <div className="w-10 h-10 bg-destructive/15 rounded-xl flex items-center justify-center">
                                <AppIcon name="RefreshCw" className="w-5 h-5 text-destructive" />
                              </div>
                              <div>
                                <p className="font-semibold text-destructive">Resetar tarefa</p>
                                <p className="text-xs text-muted-foreground">Zerar o timer sem concluir</p>
                              </div>
                            </button>
                          </div>
                        )}
                        {openPopover === item.id && !activeTimer && (
                          <div className="mt-2 rounded-xl border bg-card p-4 shadow-lg animate-fade-in space-y-3">
                            {isAdmin && profiles.length > 0 && (
                              <>
                                <button
                                  onClick={() => setExpandedPeopleFor(expandedPeopleFor === item.id ? null : item.id)}
                                  className="w-full flex items-center gap-3 p-3 rounded-xl bg-primary/5 hover:bg-primary/10 text-left transition-all duration-200 border border-primary/20 active:scale-[0.97]"
                                >
                                  <div className="w-10 h-10 bg-primary/15 rounded-xl flex items-center justify-center">
                                    <AppIcon name="Users" className="w-5 h-5 text-primary" />
                                  </div>
                                  <div className="flex-1">
                                    <p className="font-semibold text-foreground">Quem realizou?</p>
                                    <p className="text-xs text-muted-foreground">Selecione quem fez</p>
                                  </div>
                                  <AppIcon name="ChevronDown" className={cn("w-5 h-5 text-muted-foreground transition-transform duration-200", expandedPeopleFor === item.id && "rotate-180")} />
                                </button>
                                <div className={cn("overflow-hidden transition-all duration-300 ease-out", expandedPeopleFor === item.id ? "max-h-64 opacity-100" : "max-h-0 opacity-0")}>
                                  <div className="max-h-48 overflow-y-auto space-y-1 pt-1">
                                    {profiles.map((profile) => (
                                      <button key={profile.user_id} onClick={(e) => handleComplete(item.id, configuredPoints, configuredPoints, profile.user_id, e.currentTarget)}
                                        className={cn("w-full flex items-center gap-2 p-2 rounded-lg text-left transition-all duration-200 text-sm",
                                          profile.user_id === currentUserId ? "bg-primary/10 hover:bg-primary/20 text-primary font-medium" : "hover:bg-secondary text-foreground")}>
                                        <AppIcon name="User" className="w-4 h-4 shrink-0" /><span className="truncate">{profile.full_name}</span>
                                        {profile.user_id === currentUserId && <span className="text-xs text-muted-foreground ml-auto">(eu)</span>}
                                      </button>
                                    ))}
                                  </div>
                                </div>
                                {expandedPeopleFor === item.id && <div className="border-t border-border" />}
                              </>
                            )}
                            {!isAdmin && (
                              <>
                                <button onClick={(e) => handleComplete(item.id, configuredPoints, configuredPoints, undefined, e.currentTarget)}
                                  className="w-full flex items-center gap-3 p-3 rounded-xl bg-success/10 hover:bg-success/20 text-left transition-all duration-200 border-2 border-success/30 active:scale-[0.97]">
                                  <div className="w-10 h-10 bg-success rounded-xl flex items-center justify-center shadow-lg shadow-success/20"><AppIcon name="Check" className="w-5 h-5 text-success-foreground" /></div>
                                  <div className="flex-1"><p className="font-semibold text-success">Concluí agora</p>
                                    {configuredPoints > 0 ? (
                                      <div className="flex items-center gap-1 mt-0.5"><div className="w-2 h-2 rounded-full" style={{ backgroundColor: getItemPointsColors(configuredPoints).color }} />
                                        <span className="text-xs font-bold" style={{ color: getItemPointsColors(configuredPoints).color }}>+{configuredPoints}</span></div>
                                    ) : (<span className="text-xs text-muted-foreground">Tarefa sem pontos</span>)}
                                  </div>
                                </button>
                                <div className="border-t border-border" />
                                <button onClick={(e) => handleComplete(item.id, 0, configuredPoints, undefined, e.currentTarget, true)}
                                  className="w-full flex items-center gap-3 p-3 rounded-xl bg-destructive/5 hover:bg-destructive/10 text-left transition-all duration-200 border border-destructive/20 active:scale-[0.97]">
                                  <div className="w-10 h-10 bg-destructive/15 rounded-xl flex items-center justify-center"><AppIcon name="X" className="w-5 h-5 text-destructive" /></div>
                                  <div><p className="font-semibold text-destructive">Não concluído</p><p className="text-xs text-muted-foreground">Sem pontos</p></div>
                                </button>
                              </>
                            )}
                            {isAdmin && (
                              <>
                                <div className="border-t border-border" />
                                <button onClick={(e) => handleComplete(item.id, 0, configuredPoints, currentUserId, e.currentTarget, true)}
                                  className="w-full flex items-center gap-3 p-3 rounded-xl bg-destructive/5 hover:bg-destructive/10 text-left transition-all duration-200 border border-destructive/20 active:scale-[0.97]">
                                  <div className="w-10 h-10 bg-destructive/15 rounded-xl flex items-center justify-center"><AppIcon name="X" className="w-5 h-5 text-destructive" /></div>
                                  <div><p className="font-semibold text-destructive">Não concluído</p><p className="text-xs text-muted-foreground">Sem pontos</p></div>
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
                      <button
                        onClick={() => toggleSubcategory(subcategory.id)}
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
                              ? <AppIcon name="Check" className="w-3.5 h-3.5 text-success animate-scale-in" /> 
                              : <AppIcon name="ChevronRight" className={cn("w-3.5 h-3.5 text-muted-foreground transition-transform duration-300", isSubExpanded && "rotate-90")} />
                            }
                          </div>
                          <span className={cn("font-medium text-sm transition-colors duration-300", subComplete ? "text-success" : "text-foreground")}>{subcategory.name}</span>
                          <span className={cn(
                            "text-[11px] px-1.5 py-0.5 rounded-md font-medium",
                            subComplete ? "bg-success/10 text-success" : "bg-muted/50 text-muted-foreground"
                          )}>{completedItems.length}/{activeItems.length}</span>
                        </div>
                        <AppIcon name="ChevronDown" className={cn("w-4 h-4 text-muted-foreground transition-transform duration-300", isSubExpanded ? "rotate-0" : "-rotate-90")} />
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
                                      const isOwnCompletion = completion?.completed_by === currentUserId;
                                      if (isAdmin || isOwnCompletion) {
                                        setOpenPopover(openPopover === item.id ? null : item.id);
                                        setContestingItemId(null);
                                        setContestReason('');
                                        setSplittingItemId(null);
                                        return;
                                      }
                                      if (!canToggle) return;
                                      setOptimisticToggles(prev => { const next = new Set(prev); next.add(item.id); return next; });
                                      onToggleItem(item.id, 0);
                                    }}
                                    disabled={isContested ? true : (isAdmin || completion?.completed_by === currentUserId) ? false : !canToggle}
                                    className={cn(
                                      "w-full flex items-start gap-3 p-3 rounded-xl transition-all duration-300",
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
                                      "w-7 h-7 rounded-lg flex items-center justify-center shrink-0 text-white shadow-md transition-all duration-300 mt-0.5",
                                      isContested ? "bg-amber-500 shadow-amber-500/30"
                                        : wasSkipped ? "bg-destructive shadow-destructive/30" : "bg-success shadow-success/30",
                                      isJustCompleted && "scale-125"
                                    )}>
                                      {isContested ? <AppIcon name="AlertTriangle" className="w-4 h-4" /> : wasSkipped ? <AppIcon name="X" className="w-4 h-4" /> : <AppIcon name="Check" className="w-4 h-4" />}
                                    </div>
                                    <div className="flex-1 min-w-0 text-left">
                                      <div className="flex items-start justify-between gap-2">
                                        <p className={cn("font-medium line-through text-sm leading-tight", isContested ? "text-amber-600 dark:text-amber-400" : wasSkipped ? "text-destructive" : "text-success")}>{item.name}</p>
                                        {wasAwardedPoints && pointsAwarded > 0 && !isContested && !wasSkipped ? (
                                          <div className="flex items-center gap-0.5 shrink-0" style={{ color: getItemPointsColors(pointsAwarded).color }}>
                                            <AppIcon name="Star" size={18} />
                                            <span className="text-sm font-bold">{pointsAwarded}</span>
                                          </div>
                                        ) : (
                                        <div className={cn(
                                          "flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium shrink-0 border transition-all duration-300",
                                          isContested ? "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20"
                                            : wasSkipped ? "bg-destructive/10 text-destructive border-destructive/20"
                                            : "bg-primary/10 text-primary border-primary/20"
                                        )}>
                                          {isContested ? (<><AppIcon name="AlertTriangle" className="w-3 h-3" /><span>contestado</span></>)
                                            : wasSkipped ? (<><AppIcon name="X" className="w-3 h-3" /><span>não concluído</span></>) 
                                            : (<><AppIcon name="RefreshCw" className="w-3 h-3" /><span>pronto</span></>)}
                                        </div>
                                        )}
                                      </div>
                                      {isContested && contestedReason && (
                                        <p className="text-xs text-amber-600 dark:text-amber-400 mt-0.5">Contestado: {contestedReason}</p>
                                      )}
                                      {item.description && !isContested && <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{item.description}</p>}
                                      {completion && (
                                        <div className="flex items-center gap-1 mt-1 text-[11px] text-muted-foreground flex-wrap">
                                          <AppIcon name="User" className="w-3 h-3 shrink-0" />
                                          <span className="truncate">{completion.profile?.full_name || 'Usuário'} · {format(new Date(completion.completed_at), 'HH:mm')}</span>
                                          {isContested && <span className="text-amber-600 dark:text-amber-400">(contestado)</span>}
                                          {!isContested && !wasSkipped && !wasAwardedPoints && <span className="text-primary">(já pronto)</span>}
                                          {(() => { const count = getItemCompletionCount(item.id); return count > 1 ? <span className="text-primary">👥 {count}</span> : null; })()}
                                          {(completion as any)?.photo_url && (
                                            <button
                                              onClick={(e) => { e.stopPropagation(); setViewingPhotoUrl((completion as any).photo_url); }}
                                              className="flex items-center gap-0.5 text-primary hover:underline"
                                            >
                                              <AppIcon name="Camera" className="w-3 h-3" />
                                              <span>foto</span>
                                            </button>
                                          )}
                                        </div>
                                      )}
                                    </div>
                                  </button>
                                  {/* Inline panel for completed items (admin or own completion) */}
                                  {(isAdmin || completion?.completed_by === currentUserId) && openPopover === item.id && !isContested && completion && (
                                    <div className="mt-2 rounded-xl border bg-card p-4 shadow-lg animate-fade-in space-y-3">
                                      {!isTimerMode && canToggle && (
                                        <button
                                          onClick={async () => {
                                            const linkedId = (item as any).linked_inventory_item_id;
                                            if (linkedId) {
                                              setPendingProductionUndo({ itemId: item.id, linkedInventoryItemId: linkedId, itemName: item.name });
                                              setProductionUndoOpen(true);
                                              return;
                                            }
                                            setOpenPopover(null);
                                            setOptimisticToggles(prev => { const next = new Set(prev); next.add(item.id); return next; });
                                            try {
                                              await onToggleItem(item.id, 0, undefined, undefined, undefined, false, true);
                                            } catch (error: any) {
                                              setOptimisticToggles(prev => { const next = new Set(prev); next.delete(item.id); return next; });
                                              toast.error(error.message || 'Erro ao desfazer');
                                            }
                                          }}
                                          className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-secondary text-left transition-all duration-200 active:scale-[0.97]"
                                        >
                                          <div className="w-10 h-10 bg-secondary rounded-xl flex items-center justify-center">
                                            <AppIcon name="undo" size={20} className="text-muted-foreground" />
                                          </div>
                                          <div>
                                            <p className="font-semibold text-foreground">Desfazer</p>
                                            <p className="text-xs text-muted-foreground">{(item as any).linked_inventory_item_id ? 'Reverter produção e estoque' : 'Desmarcar conclusão'}</p>
                                          </div>
                                        </button>
                                      )}
                                      {isTimerMode && canToggle && (
                                        <button
                                          onClick={async () => {
                                            setOpenPopover(null);
                                            setOptimisticToggles(prev => { const next = new Set(prev); next.add(item.id); return next; });
                                            try {
                                              const resumeUserId = completion?.completed_by || currentUserId;
                                              await onToggleItem(item.id, 0, undefined, undefined, undefined, true, true);
                                              if (onStartTimer && resumeUserId) await onStartTimer(item.id, resumeUserId);
                                            } catch (error: any) {
                                              setOptimisticToggles(prev => { const next = new Set(prev); next.delete(item.id); return next; });
                                              toast.error(error.message || 'Erro ao continuar tarefa');
                                            }
                                          }}
                                          className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-secondary text-left transition-all duration-200 active:scale-[0.97]"
                                        >
                                          <div className="w-10 h-10 bg-secondary rounded-xl flex items-center justify-center">
                                            <AppIcon name="Play" className="w-5 h-5 text-muted-foreground" />
                                          </div>
                                          <div>
                                            <p className="font-semibold text-foreground">Continuar</p>
                                            <p className="text-xs text-muted-foreground">Retomar sem zerar o timer</p>
                                          </div>
                                        </button>
                                      )}
                                      {isTimerMode && canToggle && onCancelTimer && (
                                        <>
                                          <div className="border-t border-border" />
                                          <button
                                            onClick={async () => {
                                              setOpenPopover(null);
                                              setOptimisticToggles(prev => { const next = new Set(prev); next.add(item.id); return next; });
                                              try {
                                                await onCancelTimer(item.id, { includeFinished: true });
                                                await onToggleItem(item.id, 0, undefined, undefined, undefined, false, true);
                                              } catch (error: any) {
                                                setOptimisticToggles(prev => { const next = new Set(prev); next.delete(item.id); return next; });
                                                toast.error(error.message || 'Erro ao resetar tarefa');
                                                console.error('Reset error:', error);
                                              }
                                            }}
                                            className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-secondary text-left transition-all duration-200 active:scale-[0.97]"
                                          >
                                            <div className="w-10 h-10 bg-destructive/15 rounded-xl flex items-center justify-center">
                                              <AppIcon name="RefreshCw" className="w-5 h-5 text-destructive" />
                                            </div>
                                            <div>
                                              <p className="font-semibold text-destructive">Resetar tarefa</p>
                                              <p className="text-xs text-muted-foreground">Zerar tudo e recomeçar</p>
                                            </div>
                                          </button>
                                        </>
                                      )}
                                      {/* Dividir pontos */}
                                      {!wasSkipped && onSplitCompletion && profiles.length > 0 && (
                                        <>
                                          <div className="border-t border-border" />
                                          {splittingItemId === item.id ? (
                                            <div className="space-y-2 animate-fade-in">
                                              <div className="flex items-center gap-2 text-sm font-medium text-primary">
                                                <AppIcon name="Users" className="w-4 h-4" />
                                                <span>Dividir pontos ({item.points ?? 1} pts)</span>
                                              </div>
                                              <div className="max-h-40 overflow-y-auto space-y-1">
                                                {profiles.map((profile) => {
                                                  const isSelected = splitSelectedUsers.has(profile.user_id);
                                                  const isOriginal = profile.user_id === completion.completed_by;
                                                  return (
                                                    <label key={profile.user_id} className={cn("flex items-center gap-2 p-2 rounded-lg cursor-pointer text-sm transition-colors", isSelected ? "bg-primary/10" : "hover:bg-secondary")}>
                                                      <Checkbox checked={isSelected} onCheckedChange={(checked) => {
                                                        setSplitSelectedUsers(prev => {
                                                          const next = new Set(prev);
                                                          if (checked) next.add(profile.user_id); else next.delete(profile.user_id);
                                                          return next;
                                                        });
                                                      }} />
                                                      <span className="truncate">{profile.full_name}</span>
                                                      {isOriginal && <span className="text-xs text-muted-foreground ml-auto">(completou)</span>}
                                                    </label>
                                                  );
                                                })}
                                              </div>
                                              {splitSelectedUsers.size >= 2 && (() => {
                                                const pts = item.points ?? 1;
                                                const base = Math.floor(pts / splitSelectedUsers.size);
                                                const rem = pts - base * splitSelectedUsers.size;
                                                return (
                                                  <p className="text-xs text-muted-foreground text-center">
                                                    {pts} pts ÷ {splitSelectedUsers.size} = {base} pts cada
                                                    {rem > 0 && <span> (+{rem} pt p/ quem completou)</span>}
                                                  </p>
                                                );
                                              })()}
                                              <div className="flex gap-2">
                                                <button
                                                  onClick={() => handleSplit(item.id, completion, item.points ?? 1)}
                                                  disabled={splitSelectedUsers.size < 2 || splitLoading}
                                                  className="flex-1 p-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium disabled:opacity-50 hover:bg-primary/90 transition-colors"
                                                >
                                                  {splitLoading ? 'Dividindo...' : 'Confirmar divisão'}
                                                </button>
                                                <button onClick={() => { setSplittingItemId(null); setSplitSelectedUsers(new Set()); }} className="p-2 rounded-lg hover:bg-secondary transition-colors">
                                                  <AppIcon name="X" className="w-4 h-4 text-muted-foreground" />
                                                </button>
                                              </div>
                                            </div>
                                          ) : (
                                            <button
                                              onClick={() => { setSplittingItemId(item.id); setSplitSelectedUsers(new Set([completion.completed_by])); setContestingItemId(null); }}
                                              className="w-full flex items-center gap-3 p-3 rounded-xl bg-primary/5 hover:bg-primary/10 text-left transition-all duration-200 border border-primary/20 active:scale-[0.97]"
                                            >
                                              <div className="w-10 h-10 bg-primary/15 rounded-xl flex items-center justify-center">
                                                <AppIcon name="Users" className="w-5 h-5 text-primary" />
                                              </div>
                                              <div>
                                                <p className="font-semibold text-primary">Dividir pontos</p>
                                                <p className="text-xs text-muted-foreground">Dividir entre participantes</p>
                                              </div>
                                            </button>
                                          )}
                                        </>
                                      )}
                                      {isAdmin && !wasSkipped && (
                                        <>
                                          <div className="border-t border-border" />
                                          {contestingItemId === item.id ? (
                                            <div className="space-y-3 animate-fade-in">
                                              <div className="flex items-center gap-2 text-sm font-medium text-amber-600 dark:text-amber-400">
                                                <AppIcon name="AlertTriangle" className="w-4 h-4" />
                                                <span>Motivo da contestação</span>
                                              </div>
                                              <input
                                                type="text"
                                                value={contestReason}
                                                onChange={(e) => setContestReason(e.target.value)}
                                                placeholder="Descreva o motivo..."
                                                className="w-full bg-transparent border border-amber-500/30 rounded-xl px-3 py-2.5 outline-none text-sm text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-amber-500/30"
                                                onKeyDown={(e) => { if (e.key === 'Enter' && contestReason.trim()) handleContest(completion.id); if (e.key === 'Escape') { setContestingItemId(null); setContestReason(''); } }}
                                              />
                                              <div className="flex items-center gap-2">
                                                <button
                                                  onClick={() => handleContest(completion.id)}
                                                  disabled={!contestReason.trim() || contestLoading}
                                                  className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-amber-500 text-white text-sm font-semibold disabled:opacity-50 hover:bg-amber-600 transition-colors"
                                                >
                                                  <AppIcon name="Send" className="w-4 h-4" />
                                                  Contestar
                                                </button>
                                                <button onClick={() => { setContestingItemId(null); setContestReason(''); }} className="p-2.5 rounded-xl hover:bg-secondary transition-colors">
                                                  <AppIcon name="X" className="w-5 h-5 text-muted-foreground" />
                                                </button>
                                              </div>
                                            </div>
                                          ) : (
                                            <button
                                              onClick={() => { setContestingItemId(item.id); setContestReason(''); }}
                                              className="w-full flex items-center gap-3 p-3 rounded-xl bg-amber-500/5 hover:bg-amber-500/10 text-left transition-all duration-200 border border-amber-500/20 active:scale-[0.97]"
                                            >
                                              <div className="w-10 h-10 bg-amber-500/15 rounded-xl flex items-center justify-center">
                                                <AppIcon name="AlertTriangle" className="w-5 h-5 text-amber-500" />
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

                            // Timer mode: check if item has active timer (standard)
                            const stdActiveTimer = isTimerMode && getActiveTimer ? getActiveTimer(item.id) : undefined;
                            const stdItemStats = isTimerMode && timeStats ? timeStats.get(item.id) : undefined;

                            const handleStdTimerClick = () => {
                              if (!canToggle) return;
                              if (stdActiveTimer || (isTimerMode && onStartTimer && validatePin)) {
                                setPendingTimerItemId(item.id);
                                setPendingTimerPoints(configuredPoints);
                                setPinDialogOpen(true);
                              } else {
                                setOpenPopover(openPopover === item.id ? null : item.id);
                              }
                            };

                            return (
                              <div key={item.id}>
                                <button
                                  disabled={!canToggle}
                                  onClick={() => isTimerMode ? handleStdTimerClick() : (canToggle && setOpenPopover(openPopover === item.id ? null : item.id))}
                                  className={cn(
                                    "w-full flex items-center gap-3 p-3.5 rounded-2xl transition-all duration-200",
                                    !canToggle && "cursor-not-allowed opacity-80",
                                    canToggle && "active:scale-[0.97]",
                                    "card-stat-holo",
                                    stdActiveTimer && "!border-primary/40 bg-primary/5",
                                    openPopover === item.id && "!border-primary/40"
                                  )}
                                  style={{ animationDelay: `${itemIndex * 40}ms` }}
                                >
                                  {isTimerMode ? (
                                    stdActiveTimer ? (
                                      <div className="w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 bg-primary/15 border border-primary/30">
                                        <AppIcon name="Timer" className="w-5 h-5 text-primary animate-pulse" />
                                      </div>
                                    ) : (
                                      <div className="w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 border-2 border-muted-foreground/20 bg-background/50 transition-all duration-300 hover:border-primary/50 hover:bg-primary/10">
                                        <AppIcon name="Play" className="w-5 h-5 text-muted-foreground/40" />
                                      </div>
                                    )
                                  ) : (
                                    <div className="w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 border-2 border-muted-foreground/20 bg-background/50 transition-all duration-300 hover:border-success/50 hover:bg-success/10">
                                      <AppIcon name="Check" className="w-5 h-5 text-muted-foreground/40" />
                                    </div>
                                  )}
                                  <div className="flex-1 text-left min-w-0">
                                    <div className="flex items-center gap-1.5">
                                      <p className="font-semibold text-sm text-foreground truncate">{item.name}</p>
                                      {(item as any).requires_photo && <AppIcon name="Camera" className="w-3.5 h-3.5 text-primary shrink-0" />}
                                      {(item as any).linked_inventory_item_id && <AppIcon name="soup_kitchen" size={14} className="text-primary shrink-0" />}
                                    </div>
                                    {item.description && <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">{item.description}</p>}
                                    {stdActiveTimer && (
                                      <div className="mt-1.5 flex items-center gap-2">
                                        <TimerBadge timer={stdActiveTimer} stats={stdItemStats} minExecutions={timerMinExecutions} />
                                        <span className="text-[10px] text-muted-foreground">{stdActiveTimer.userName}</span>
                                      </div>
                                    )}
                                    {!stdActiveTimer && stdItemStats && isTimerMode && (
                                      <div className="mt-1">
                                        <TimerStatsIndicator stats={stdItemStats} minExecutions={timerMinExecutions} />
                                      </div>
                                    )}
                                  </div>
                                  {configuredPoints > 0 && (
                                    <div className="flex items-center gap-0.5 shrink-0 pr-1" style={{ color: getItemPointsColors(configuredPoints).color }}>
                                      <AppIcon name="Star" size={20} />
                                      <span className="text-sm font-bold">{configuredPoints}</span>
                                    </div>
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
                                            <AppIcon name="Users" className="w-5 h-5 text-primary" />
                                          </div>
                                          <div className="flex-1">
                                            <p className="font-semibold text-foreground">Quem realizou?</p>
                                            <p className="text-xs text-muted-foreground">Selecione quem fez</p>
                                          </div>
                                          <AppIcon name="ChevronDown" className={cn("w-5 h-5 text-muted-foreground transition-transform duration-200", expandedPeopleFor === item.id && "rotate-180")} />
                                        </button>
                                        <div className={cn("overflow-hidden transition-all duration-300 ease-out", expandedPeopleFor === item.id ? "max-h-64 opacity-100" : "max-h-0 opacity-0")}>
                                          <div className="max-h-48 overflow-y-auto space-y-1 pt-1">
                                            {profiles.map((profile) => (
                                              <button key={profile.user_id} onClick={(e) => handleComplete(item.id, configuredPoints, configuredPoints, profile.user_id, e.currentTarget)}
                                                className={cn("w-full flex items-center gap-2 p-2 rounded-lg text-left transition-all duration-200 text-sm",
                                                  profile.user_id === currentUserId ? "bg-primary/10 hover:bg-primary/20 text-primary font-medium" : "hover:bg-secondary text-foreground")}>
                                                <AppIcon name="User" className="w-4 h-4 shrink-0" /><span className="truncate">{profile.full_name}</span>
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
                                          <div className="w-10 h-10 bg-success rounded-xl flex items-center justify-center shadow-lg shadow-success/20"><AppIcon name="Check" className="w-5 h-5 text-success-foreground" /></div>
                                          <div className="flex-1"><p className="font-semibold text-success">Concluí agora</p>
                                            {configuredPoints > 0 ? (
                                              <div className="flex items-center gap-0.5 mt-0.5">
                                                {isBonus ? <AppIcon name="Zap" className="w-3 h-3" style={{ color: getItemPointsColors(configuredPoints).color }} /> : (
                                                  Array.from({ length: configuredPoints }).map((_, i) => (
                                                    <AppIcon name="Star" key={i} className="w-3 h-3" style={{ color: getItemPointsColors(configuredPoints).color, fill: getItemPointsColors(configuredPoints).color }} />
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
                                          <div className="w-10 h-10 bg-destructive/15 rounded-xl flex items-center justify-center"><AppIcon name="X" className="w-5 h-5 text-destructive" /></div>
                                          <div><p className="font-semibold text-destructive">Não concluído</p><p className="text-xs text-muted-foreground">Sem pontos</p></div>
                                        </button>
                                      </>
                                    )}
                                    {isAdmin && (
                                      <>
                                        <div className="border-t border-border" />
                                        <button onClick={(e) => handleComplete(item.id, 0, configuredPoints, currentUserId, e.currentTarget, true)}
                                          className="w-full flex items-center gap-3 p-3 rounded-xl bg-destructive/5 hover:bg-destructive/10 text-left transition-all duration-200 border border-destructive/20 active:scale-[0.97]">
                                          <div className="w-10 h-10 bg-destructive/15 rounded-xl flex items-center justify-center"><AppIcon name="X" className="w-5 h-5 text-destructive" /></div>
                                          <div><p className="font-semibold text-destructive">Não concluído</p><p className="text-xs text-muted-foreground">Sem pontos</p></div>
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

      {/* Photo Capture Sheet */}
      <Sheet open={photoSheetOpen} onOpenChange={(open) => {
        if (!open) { setPhotoSheetOpen(false); setPendingPhotoAction(null); setPhotoPreview(null); setPhotoFile(null); }
      }}>
        <SheetContent side="bottom" className="rounded-t-3xl px-4 pb-8">
          <SheetHeader className="pb-4">
            <SheetTitle className="flex items-center gap-2">
              <AppIcon name="Camera" className="w-5 h-5 text-primary" />
              Foto de confirmação
            </SheetTitle>
          </SheetHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Esta tarefa exige uma foto de confirmação. Tire uma foto ou selecione da galeria.
            </p>
            {photoPreview ? (
              <div className="relative">
                <img src={photoPreview} alt="Preview" className="w-full max-h-64 object-cover rounded-xl border" />
                <button
                  onClick={() => { setPhotoPreview(null); setPhotoFile(null); }}
                  className="absolute top-2 right-2 w-8 h-8 bg-background/80 backdrop-blur rounded-full flex items-center justify-center"
                >
                  <AppIcon name="X" className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <label className="flex flex-col items-center justify-center gap-3 p-8 rounded-xl border-2 border-dashed border-primary/30 bg-primary/5 cursor-pointer hover:bg-primary/10 transition-colors">
                <AppIcon name="Camera" className="w-10 h-10 text-primary" />
                <span className="text-sm font-medium text-primary">Tirar foto ou escolher</span>
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handlePhotoCapture}
                />
              </label>
            )}
            <Button
              onClick={handlePhotoConfirm}
              disabled={!photoFile || photoUploading}
              className="w-full h-12"
            >
              {photoUploading ? 'Enviando...' : 'Confirmar e concluir'}
            </Button>
          </div>
        </SheetContent>
      </Sheet>

      {/* Photo Viewer */}
      <Sheet open={!!viewingPhotoUrl} onOpenChange={(open) => { if (!open) setViewingPhotoUrl(null); }}>
        <SheetContent side="bottom" className="rounded-t-3xl px-4 pb-8">
          <SheetHeader className="pb-4">
            <SheetTitle className="flex items-center gap-2">
              <AppIcon name="Image" className="w-5 h-5 text-primary" />
              Foto de confirmação
            </SheetTitle>
          </SheetHeader>
          {viewingPhotoUrl && (
            <img src={viewingPhotoUrl} alt="Foto de confirmação" className="w-full max-h-[70vh] object-contain rounded-xl" />
          )}
        </SheetContent>
      </Sheet>

      {/* Timer PIN Dialog */}
      {isTimerMode && validatePin && (
        <PinDialog
          open={pinDialogOpen}
          onOpenChange={(open) => { if (!open) { setPinDialogOpen(false); setPendingTimerItemId(null); } }}
          title={pendingTimerItemId && getActiveTimer?.(pendingTimerItemId) ? 'Finalizar tarefa' : 'Iniciar tarefa'}
          subtitle="Digite seu PIN de 4 dígitos"
          onSubmit={async (pin) => {
            const employee = await validatePin(pin);
            if (!employee) return false;
            if (!pendingTimerItemId) return false;
            const activeT = getActiveTimer?.(pendingTimerItemId);
            if (activeT) {
              // Finishing: must be same user
              if (activeT.userId !== employee.userId) {
                toast.error('Este timer foi iniciado por outro funcionário');
                return false;
              }
              if (onFinishTimer) {
                await onFinishTimer(pendingTimerItemId, employee.userId, (itemId, pts, uid) => {
                  onToggleItem(itemId, pts, uid);
                }, pendingTimerPoints);
              }
            } else {
              // Starting
              if (onStartTimer) {
                await onStartTimer(pendingTimerItemId, employee.userId);
              }
            }
            setPinDialogOpen(false);
            setPendingTimerItemId(null);
            return true;
          }}
        />
      )}

      {/* Production Completion Sheet */}
      {pendingProductionAction && (
        <ProductionCompletionSheet
          open={productionSheetOpen}
          onOpenChange={(open) => {
            setProductionSheetOpen(open);
            if (!open) setPendingProductionAction(null);
          }}
          inventoryItemId={pendingProductionAction.linkedInventoryItemId}
          checklistItemName={pendingProductionAction.itemName}
          onConfirm={() => {
            const { itemId, points, configuredPoints, completedByUserId, buttonElement } = pendingProductionAction;
            setProductionSheetOpen(false);
            setPendingProductionAction(null);
            executeComplete(itemId, points, configuredPoints, completedByUserId, buttonElement);
          }}
        />
      )}

      {/* Production Undo AlertDialog */}
      <AlertDialog open={productionUndoOpen} onOpenChange={setProductionUndoOpen}>
        <AlertDialogContent className="max-w-sm mx-auto">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AppIcon name="warning" size={20} className="text-amber-500" />
              Reverter Produção
            </AlertDialogTitle>
            <AlertDialogDescription>
              Ao desfazer, a entrada de estoque de <strong>{pendingProductionUndo?.itemName}</strong> será revertida e a ordem de produção será removida. Deseja continuar?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={productionUndoLoading}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleProductionUndo}
              disabled={productionUndoLoading}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {productionUndoLoading ? 'Revertendo...' : 'Reverter'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
