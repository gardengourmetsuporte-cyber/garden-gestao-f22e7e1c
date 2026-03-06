import { subDays } from 'date-fns';
import { AppLayout } from '@/components/layout/AppLayout';
import { ChecklistView } from '@/components/checklists/ChecklistView';
import { ChecklistSettings } from '@/components/checklists/ChecklistSettings';
import { AppIcon } from '@/components/ui/app-icon';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { getDeadlineInfo } from '@/lib/checklistTiming';
import { TimerSettingsPanel } from '@/components/checklists/TimerSettingsPanel';
import { UnifiedDateStrip } from '@/components/ui/unified-date-strip';
import { ChecklistTypeCard, ChecklistBonusCard } from '@/components/checklists/ChecklistTypeCards';
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

  const today = new Date();
  const days = Array.from({ length: 30 }, (_, i) => subDays(today, 20 - i));

  const reminderBtn = isAdmin && checklistType !== 'bonus' ? (() => {
    const progress = checklistType === 'abertura' ? getTypeProgress.abertura : getTypeProgress.fechamento;
    if (progress.percent === 100 || progress.total === 0) return null;
    return (
      <button
        onClick={handleSendReminder}
        disabled={sendingReminder}
        title="Lembrar equipe de completar o checklist"
        className={cn(
          "w-6 h-6 rounded-full flex items-center justify-center transition-all shrink-0",
          "hover:bg-amber-500/10 active:scale-95",
          sendingReminder && "opacity-60 pointer-events-none"
        )}
      >
        <AppIcon name="notifications" size={14} fill={0} className={cn("text-muted-foreground/60", sendingReminder && "animate-bounce text-amber-500")} />
      </button>
    );
  })() : null;

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
              <UnifiedDateStrip days={days} selectedDate={selectedDate} onSelectDate={setSelectedDate} trailing={reminderBtn} />
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

            {/* Bonus Card */}
            <ChecklistBonusCard
              isSelected={checklistType === 'bonus'}
              onSelect={() => setChecklistType('bonus')}
              settingsMode={settingsMode} isAdmin={isAdmin}
              deadlineSettings={deadlineSettings}
              updateDeadline={updateDeadline} removeDeadline={removeDeadline} isSavingDeadline={isSavingDeadline}
            />

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
                  sectors={sectors.filter((s: any) => checklistType === 'bonus' ? s.scope === 'bonus' : s.scope !== 'bonus')}
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
                />
              )}
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
