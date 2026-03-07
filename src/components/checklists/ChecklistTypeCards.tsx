import { ChecklistType } from '@/types/database';
import { AppIcon } from '@/components/ui/app-icon';
import { cn } from '@/lib/utils';
import { getDeadlineInfo } from '@/lib/checklistTiming';
import { DeadlineSettingPopover } from '@/components/checklists/DeadlineSettingPopover';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

interface TypeCardProps {
  type: 'abertura' | 'fechamento';
  icon: string;
  label: string;
  progress: { completed: number; total: number; percent: number };
  isSelected: boolean;
  onSelect: () => void;
  settingsMode: boolean;
  isAdmin: boolean;
  deadlineLabel: string;
  deadlinePassed: boolean;
  currentDate: string;
  deadlineSettings: any[];
  updateDeadline: any;
  removeDeadline: any;
  isSavingDeadline: boolean;
  closingType: ChecklistType | null;
  onManualClose: (type: ChecklistType) => void;
  gradientColors: string;
}

export function ChecklistTypeCard({
  type, icon, label, progress, isSelected, onSelect,
  settingsMode, isAdmin, deadlineLabel, deadlinePassed,
  currentDate, deadlineSettings, updateDeadline, removeDeadline, isSavingDeadline,
  closingType, onManualClose, gradientColors,
}: TypeCardProps) {
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onSelect}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onSelect(); } }}
      className={cn(
        "relative overflow-hidden rounded-2xl p-4 text-left transition-all duration-300",
        isSelected
          ? "finance-hero-card checklist-gradient-slow ring-0 scale-[1.02]"
          : "ring-1 ring-border/40 hover:ring-border bg-card/60 opacity-70 hover:opacity-90"
      )}
    >
      {settingsMode && isAdmin && (
        <DeadlineSettingPopover
          type={type}
          currentSetting={deadlineSettings.find((s: any) => s.checklist_type === type) || null}
          onSave={updateDeadline}
          onRemove={removeDeadline}
          isSaving={isSavingDeadline}
        />
      )}
      <div className="flex items-center gap-3 mb-3">
        <AppIcon
          name={progress.percent === 100 ? 'check_circle' : icon}
          size={22}
          fill={progress.percent === 100 ? 1 : 0}
          className={cn(
            "transition-colors",
            progress.percent === 100 ? "text-success" : isSelected ? "text-foreground" : "text-muted-foreground"
          )}
        />
        <h3 className="text-base font-bold font-display text-foreground" style={{ letterSpacing: '-0.02em' }}>{label}</h3>
      </div>
      {!settingsMode && (
        <div className="space-y-1.5">
          <div className={cn("w-full h-1.5 rounded-full overflow-hidden", isSelected ? "bg-white/15" : "bg-secondary/60")}>
            <div
              className="h-full rounded-full transition-all duration-700 ease-out"
              style={{
                width: `${progress.percent}%`,
                background: progress.percent === 100 ? 'hsl(var(--success))' : gradientColors,
              }}
            />
          </div>
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-muted-foreground">
              {progress.completed}/{progress.total}
              {deadlineLabel && (
                <span className={cn("ml-1", deadlinePassed ? "text-destructive/70" : "")}>
                  · {deadlinePassed ? 'Encerrado' : deadlineLabel}
                </span>
              )}
            </span>
            <span className={cn(
              "text-sm font-black",
              progress.percent === 100 ? "text-success" : type === 'abertura' ? "text-orange-500" : "text-primary"
            )}>
              {progress.percent}%
            </span>
          </div>
        </div>
      )}
      {isSelected && progress.percent < 100 && !settingsMode && (
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <div
              role="button"
              onPointerDown={(e) => e.stopPropagation()}
              onClick={(e) => e.stopPropagation()}
              className="absolute top-2 right-2 w-7 h-7 rounded-full bg-destructive/15 hover:bg-destructive/25 flex items-center justify-center transition-colors cursor-pointer"
            >
              <AppIcon name="Power" size={14} className="text-destructive" />
            </div>
          </AlertDialogTrigger>
          <AlertDialogContent onClick={(e) => e.stopPropagation()}>
            <AlertDialogHeader>
              <AlertDialogTitle>Encerrar {label}?</AlertDialogTitle>
              <AlertDialogDescription>
                {progress.total - progress.completed} tarefa(s) pendente(s) serão marcadas como <strong>não concluídas</strong>. Essa ação não pode ser desfeita.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => onManualClose(type)}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                {closingType === type ? 'Encerrando...' : 'Encerrar'}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
      {isSelected && progress.percent === 100 && (
        <div className="absolute top-2 right-2 w-2 h-2 rounded-full bg-success animate-pulse" />
      )}
    </div>
  );
}

interface BonusCardProps {
  isSelected: boolean;
  onSelect: () => void;
  settingsMode: boolean;
  isAdmin: boolean;
  deadlineSettings: any[];
  updateDeadline: any;
  removeDeadline: any;
  isSavingDeadline: boolean;
  hasActiveItems?: boolean;
}

export function ChecklistBonusCard({
  isSelected, onSelect, settingsMode, isAdmin,
  deadlineSettings, updateDeadline, removeDeadline, isSavingDeadline,
  hasActiveItems = true,
}: BonusCardProps) {
  return (
    <button
      onClick={onSelect}
      className={cn(
        "relative w-full overflow-hidden rounded-2xl p-5 text-left transition-all duration-300",
        isSelected
          ? "finance-hero-card checklist-gradient-slow ring-0 scale-[1.01] shadow-xl"
          : "bg-card hover:shadow-lg"
      )}
      style={!isSelected ? { border: '1px solid hsl(160 60% 45% / 0.15)' } : undefined}
    >
      {settingsMode && isAdmin && (
        <DeadlineSettingPopover
          type="bonus"
          currentSetting={deadlineSettings.find((s: any) => s.checklist_type === 'bonus') || null}
          onSave={updateDeadline}
          onRemove={removeDeadline}
          isSaving={isSavingDeadline}
        />
      )}
      <div className="flex items-center gap-4">
        <div className={cn(
          "w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-all duration-300",
          isSelected ? "bg-emerald-500/15" : "bg-emerald-500/10"
        )}>
          <AppIcon name="Zap" size={22} fill={isSelected ? 1 : 0} className="transition-colors" style={{ color: 'hsl(160 70% 45%)' }} />
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h3 className="text-base font-black font-display text-foreground" style={{ letterSpacing: '-0.02em' }}>Bônus</h3>
            <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full" style={{
              color: isSelected ? 'hsl(160 84% 70%)' : 'hsl(160 84% 50%)',
              background: isSelected ? 'hsl(160 84% 39% / 0.2)' : 'hsl(160 84% 39% / 0.12)',
            }}>
              Extra pts
            </span>
          </div>
          <p className="text-xs mt-0.5 text-muted-foreground">
            {!hasActiveItems ? 'Nenhuma tarefa ativa — invisível para equipe' : 'Tarefas exclusivas para mais pontos ⚡'}
          </p>
        </div>
        <AppIcon name="ChevronRight" size={18} className="text-muted-foreground" />
      </div>
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          opacity: isSelected ? 0.3 : 0.2,
          background: 'linear-gradient(105deg, transparent 40%, hsl(160 84% 39% / 0.15) 45%, hsl(var(--neon-cyan) / 0.1) 55%, transparent 60%)',
          backgroundSize: '200% 100%',
          animation: 'shimmer 120s ease-in-out infinite',
        }}
      />
    </button>
  );
}
