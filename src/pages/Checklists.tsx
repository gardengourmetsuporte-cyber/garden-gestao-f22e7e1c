import { useState, useEffect, useMemo } from 'react';
import { DatePicker } from '@/components/ui/date-picker';
import { AppLayout } from '@/components/layout/AppLayout';
import { ChecklistView } from '@/components/checklists/ChecklistView';
import { ChecklistSettings } from '@/components/checklists/ChecklistSettings';
import { ChecklistReminderSheet } from '@/components/checklists/ChecklistReminderSheet';
import { AppIcon } from '@/components/ui/app-icon';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { getDeadlineInfo } from '@/lib/checklistTiming';
import { TimerSettingsPanel } from '@/components/checklists/TimerSettingsPanel';

import { ChecklistTypeCard, ChecklistBonusCard, ChecklistProductionSubCard } from '@/components/checklists/ChecklistTypeCards';
import { useChecklistPage } from '@/hooks/checklists/useChecklistPage';

export default function ChecklistsPage() {
  const {
    isAdmin, user, sectors, completions, isLoading,
    settingsMode, setSettingsMode, checklistType, setChecklistType,
    selectedDate, setSelectedDate, currentDate,
    settingsType, setSettingsType,
    deadlineSettings, updateDeadline, removeDeadline, isSavingDeadline,
    deadlineLabel, deadlinePassed,
    closingType, sendingReminder,
    getTypeProgress,
    isTimerMode, timerSettings, timeStatsMap,
    getActiveTimer, getUserActiveTimer, startTimer, finishTimer, cancelTimer, validatePin,
    handleToggleItem, handleAddSector, handleUpdateSector, handleDeleteSector,
    handleAddSubcategory, handleUpdateSubcategory, handleDeleteSubcategory,
    handleAddItem, handleUpdateItem, handleDeleteItem,
    handleSendReminder, handleManualClose,
    reorderSectors, reorderSubcategories, reorderItems,
    isItemCompleted, getCompletionProgress, contestCompletion, splitCompletion,
  } = useChecklistPage();
  const [reminderOpen, setReminderOpen] = useState(false);

  // View mode: 'full' (all sectors) or 'sector' (single sector)
  const [viewMode, setViewMode] = useState<'full' | 'sector'>(() => {
    try { return (localStorage.getItem('checklist-view-mode') as 'full' | 'sector') || 'full'; } catch { return 'full'; }
  });
  const [selectedSectorId, setSelectedSectorId] = useState<string | null>(() => {
    try { return localStorage.getItem('checklist-selected-sector') || null; } catch { return null; }
  });
  const [selectedSubcategoryId, setSelectedSubcategoryId] = useState<string | null>(null);

  useEffect(() => {
    try { localStorage.setItem('checklist-view-mode', viewMode); } catch {}
  }, [viewMode]);
  useEffect(() => {
    try { if (selectedSectorId) localStorage.setItem('checklist-selected-sector', selectedSectorId); else localStorage.removeItem('checklist-selected-sector'); } catch {}
  }, [selectedSectorId]);

  if (isLoading) {
    return (
      <AppLayout>
        <div className="min-h-screen bg-background pb-24">
          <div className="px-4 py-4 space-y-4">
            <Skeleton className="h-12 rounded-xl" />
            <div className="grid grid-cols-2 gap-3">
              {[1, 2].map(i => <Skeleton key={i} className="h-32 rounded-2xl" />)}
            </div>
            {[1, 2, 3].map(i => <Skeleton key={i} className="h-16 rounded-2xl" />)}
          </div>
        </div>
      </AppLayout>
    );
  }


  const reminderBtn = isAdmin && checklistType !== 'bonus' ? (() => {
    const progress = checklistType === 'abertura' ? getTypeProgress.abertura : getTypeProgress.fechamento;
    if (progress.percent === 100 || progress.total === 0) return null;
    return (
      <button
        onClick={() => setReminderOpen(true)}
        title="Lembrar equipe de completar o checklist"
        className={cn(
          "w-6 h-6 rounded-full flex items-center justify-center transition-all shrink-0",
          "hover:bg-amber-500/10 active:scale-95",
        )}
      >
        <AppIcon name="notifications" size={14} fill={0} className="text-muted-foreground/60" />
      </button>
    );
  })() : null;

  const currentProgress = checklistType === 'abertura' ? getTypeProgress.abertura : getTypeProgress.fechamento;
  const pendingCount = currentProgress.total - currentProgress.completed;

  const sharedCardProps = {
    settingsMode, isAdmin, currentDate, deadlineSettings,
    updateDeadline, removeDeadline, isSavingDeadline,
    closingType, onManualClose: handleManualClose,
  };

  return (
    <AppLayout>
      <div className="min-h-screen bg-background pb-24 lg:pb-12">
        <div className="px-4 py-3 lg:px-8 space-y-5 lg:max-w-4xl lg:mx-auto">
          <div className="animate-fade-in space-y-5" key={settingsMode ? 'settings' : 'view'}>
            {/* Date Strip */}
            {!settingsMode && (
              <div className="flex items-center gap-2">
                <div className="flex-1">
                  <DatePicker date={selectedDate} onSelect={setSelectedDate} />
                </div>
                {reminderBtn}
              </div>
            )}

            {/* Settings mode header */}
            {settingsMode && (
              <div className="flex items-center gap-3 p-3 rounded-2xl bg-primary/5 border border-primary/20">
                <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
                  <AppIcon name="Settings" size={18} className="text-primary animate-spin" style={{ animationDuration: '3s' }} />
                </div>
                <div className="flex-1">
                  <h2 className="font-semibold text-sm text-foreground">Modo Configuração</h2>
                  <p className="text-[11px] text-muted-foreground">Editando {checklistType === 'bonus' ? 'Bônus' : checklistType === 'abertura' ? 'Abertura' : 'Fechamento'}</p>
                </div>
                <button onClick={() => setSettingsMode(false)} className="p-2 rounded-xl bg-secondary/50 hover:bg-secondary transition-colors">
                  <AppIcon name="X" size={16} className="text-muted-foreground" />
                </button>
              </div>
            )}

            {/* Type Cards */}
            <div className="grid grid-cols-2 gap-3">
              <ChecklistTypeCard
                type="abertura" icon="Sun" label="Abertura"
                progress={getTypeProgress.abertura}
                isSelected={checklistType === 'abertura'}
                onSelect={() => setChecklistType('abertura')}
                deadlineLabel={deadlineLabel.abertura || ''}
                deadlinePassed={!!getDeadlineInfo(currentDate, 'abertura', deadlineSettings)?.passed}
                gradientColors="linear-gradient(90deg, hsl(32 100% 50%), hsl(40 100% 55% / 0.7))"
                {...sharedCardProps}
              />
              <ChecklistTypeCard
                type="fechamento" icon="Moon" label="Fechamento"
                progress={getTypeProgress.fechamento}
                isSelected={checklistType === 'fechamento'}
                onSelect={() => setChecklistType('fechamento')}
                deadlineLabel={deadlineLabel.fechamento || ''}
                deadlinePassed={!!getDeadlineInfo(currentDate, 'fechamento', deadlineSettings)?.passed}
                gradientColors="linear-gradient(90deg, hsl(234 89% 67%), hsl(234 70% 75% / 0.7))"
                {...sharedCardProps}
              />
            </div>

            {/* Production Card */}
            {(() => {
              const productionItems = sectors.flatMap((s: any) =>
                (s.subcategories || []).flatMap((sub: any) =>
                  (sub.items || []).filter((i: any) => i.is_active && (i as any).linked_inventory_item_id)
                )
              );
              if (productionItems.length === 0) return null;
              const completedCount = productionItems.filter((i: any) => isItemCompleted(i.id)).length;
              return (
                <ChecklistProductionCard
                  isSelected={checklistType === 'production' as any}
                  onSelect={() => setChecklistType('production' as any)}
                  productionCount={productionItems.length}
                  completedCount={completedCount}
                />
              );
            })()}

            {/* Bonus Card - hidden for non-admins when no active bonus items */}
            {(() => {
              const hasActiveBonusItems = sectors.some((s: any) =>
                s.scope === 'bonus' && s.subcategories?.some((sub: any) =>
                  sub.items?.some((i: any) => i.is_active && i.checklist_type === 'bonus')
                )
              );
              if (!isAdmin && !hasActiveBonusItems) return null;
              return (
                <ChecklistBonusCard
                  isSelected={checklistType === 'bonus'}
                  onSelect={() => setChecklistType('bonus')}
                  settingsMode={settingsMode} isAdmin={isAdmin}
                  deadlineSettings={deadlineSettings}
                  updateDeadline={updateDeadline} removeDeadline={removeDeadline} isSavingDeadline={isSavingDeadline}
                  hasActiveItems={hasActiveBonusItems}
                />
              );
            })()}

            {/* View Mode Toggle — only in view mode and not bonus */}
            {!settingsMode && checklistType !== 'bonus' && (checklistType as string) !== 'production' && (() => {
              const availableSectors = sectors.filter((s: any) =>
                s.scope !== 'bonus' && s.subcategories?.some((sub: any) =>
                  sub.items?.some((i: any) => i.is_active && (i as any).checklist_type === checklistType)
                )
              );
              return (
                <div className="space-y-3">
                  <div className="flex items-center bg-secondary/50 rounded-xl p-1 gap-1">
                    <button
                      onClick={() => setViewMode('full')}
                      className={cn(
                        "flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs font-semibold transition-all",
                        viewMode === 'full'
                          ? "bg-background text-foreground shadow-sm"
                          : "text-muted-foreground hover:text-foreground"
                      )}
                    >
                      <AppIcon name="checklist" size={14} />
                      Completo
                    </button>
                    <button
                      onClick={() => {
                        setViewMode('sector');
                        if (!selectedSectorId && availableSectors.length > 0) {
                          setSelectedSectorId(availableSectors[0].id);
                        }
                      }}
                      className={cn(
                        "flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs font-semibold transition-all",
                        viewMode === 'sector'
                          ? "bg-background text-foreground shadow-sm"
                          : "text-muted-foreground hover:text-foreground"
                      )}
                    >
                      <AppIcon name="label" size={14} />
                      Meu Setor
                    </button>
                  </div>

                   {viewMode === 'sector' && availableSectors.length > 0 && (
                    <div className="space-y-2">
                      <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1 scrollbar-hide">
                        {availableSectors.map((sector: any) => {
                          const isSelected = selectedSectorId === sector.id;
                          return (
                            <button
                              key={sector.id}
                              onClick={() => { setSelectedSectorId(sector.id); setSelectedSubcategoryId(null); }}
                              className={cn(
                                "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all shrink-0",
                                isSelected
                                  ? "bg-foreground text-background backdrop-blur-md"
                                  : "bg-foreground/[0.07] text-muted-foreground backdrop-blur-sm hover:bg-foreground/[0.12]"
                              )}
                            >
                              <span className="text-[13px]">{sector.name}</span>
                            </button>
                          );
                        })}
                      </div>
                      {/* Subcategory pills */}
                      {(() => {
                        const activeSector = availableSectors.find((s: any) => s.id === selectedSectorId);
                        const subs = (activeSector?.subcategories || []).filter((sub: any) =>
                          sub.items?.some((i: any) => i.is_active && (i as any).checklist_type === checklistType)
                        );
                        if (subs.length <= 1) return null;
                        return (
                          <div className="flex gap-1.5 overflow-x-auto pb-1 -mx-1 px-1 scrollbar-hide">
                            <button
                              onClick={() => setSelectedSubcategoryId(null)}
                              className={cn(
                                "px-2.5 py-1 rounded-full text-[11px] font-medium whitespace-nowrap transition-all shrink-0",
                                !selectedSubcategoryId
                                  ? "bg-primary/15 text-primary"
                                  : "bg-foreground/[0.05] text-muted-foreground hover:bg-foreground/[0.08]"
                              )}
                            >
                              Todos
                            </button>
                            {subs.map((sub: any) => (
                              <button
                                key={sub.id}
                                onClick={() => setSelectedSubcategoryId(sub.id)}
                                className={cn(
                                  "px-2.5 py-1 rounded-full text-[11px] font-medium whitespace-nowrap transition-all shrink-0",
                                  selectedSubcategoryId === sub.id
                                    ? "bg-primary/15 text-primary"
                                    : "bg-foreground/[0.05] text-muted-foreground hover:bg-foreground/[0.08]"
                                )}
                              >
                                {sub.name}
                              </button>
                            ))}
                          </div>
                        );
                      })()}
                    </div>
                  )}
                </div>
              );
            })()}

            {/* Content */}
            <div className="pt-3">
              {settingsMode ? (
                <div className="space-y-4">
                  <ChecklistSettings
                    sectors={sectors.filter((s: any) => settingsType === 'bonus' ? s.scope === 'bonus' : s.scope !== 'bonus')}
                    selectedType={settingsType}
                    onTypeChange={setSettingsType}
                    onAddSector={handleAddSector}
                    onUpdateSector={handleUpdateSector}
                    onDeleteSector={handleDeleteSector}
                    onReorderSectors={reorderSectors}
                    onAddSubcategory={handleAddSubcategory}
                    onUpdateSubcategory={handleUpdateSubcategory}
                    onDeleteSubcategory={handleDeleteSubcategory}
                    onReorderSubcategories={reorderSubcategories}
                    onAddItem={handleAddItem}
                    onUpdateItem={handleUpdateItem}
                    onDeleteItem={handleDeleteItem}
                    onReorderItems={reorderItems}
                  />
                  <TimerSettingsPanel checklistType={checklistType} />
                </div>
              ) : (
                <ChecklistView
                  sectors={(() => {
                    const base = sectors.filter((s: any) => checklistType === 'bonus' ? s.scope === 'bonus' : s.scope !== 'bonus');
                    if (viewMode === 'sector' && selectedSectorId && checklistType !== 'bonus') {
                      let filtered = base.filter((s: any) => s.id === selectedSectorId);
                      if (selectedSubcategoryId && filtered.length > 0) {
                        filtered = filtered.map((s: any) => ({
                          ...s,
                          subcategories: (s.subcategories || []).filter((sub: any) => sub.id === selectedSubcategoryId),
                        }));
                      }
                      return filtered;
                    }
                    return base;
                  })()}
                  checklistType={checklistType}
                  date={currentDate}
                  completions={completions}
                  isItemCompleted={isItemCompleted}
                  onToggleItem={handleToggleItem}
                  getCompletionProgress={(sectorId) => getCompletionProgress(sectorId, checklistType)}
                  currentUserId={user?.id}
                  isAdmin={isAdmin}
                  deadlinePassed={deadlinePassed}
                  onContestCompletion={contestCompletion}
                  onSplitCompletion={splitCompletion}
                  isTimerMode={isTimerMode}
                  getActiveTimer={getActiveTimer}
                  getUserActiveTimer={getUserActiveTimer}
                  onStartTimer={startTimer}
                  onFinishTimer={finishTimer}
                  onCancelTimer={cancelTimer}
                  validatePin={validatePin}
                  timeStats={timeStatsMap}
                  timerMinExecutions={timerSettings?.minExecutionsForStats ?? 3}
                  autoExpandAll={viewMode === 'sector' && checklistType !== 'bonus'}
                />
              )}
            </div>
          </div>
        </div>
      </div>

      <ChecklistReminderSheet
        open={reminderOpen}
        onOpenChange={setReminderOpen}
        checklistType={checklistType as 'abertura' | 'fechamento'}
        pendingCount={pendingCount}
      />
    </AppLayout>
  );
}
