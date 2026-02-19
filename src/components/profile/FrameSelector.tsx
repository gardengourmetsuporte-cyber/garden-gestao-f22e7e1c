import { useState } from 'react';
import { RANK_FRAMES } from './rank-frames';
import { getRank } from '@/lib/ranks';
import { cn } from '@/lib/utils';
import { AppIcon } from '@/components/ui/app-icon';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { DefaultAvatar } from './DefaultAvatar';

const ALL_RANKS = [
  'Iniciante', 'Aprendiz', 'Dedicado', 'Veterano',
  'Mestre', 'Lenda', 'Mítico', 'Imortal',
];

const RANK_MIN_POINTS: Record<string, number> = {
  'Iniciante': 0,
  'Aprendiz': 10,
  'Dedicado': 25,
  'Veterano': 50,
  'Mestre': 100,
  'Lenda': 300,
  'Mítico': 750,
  'Imortal': 1500,
};

interface FrameSelectorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  earnedPoints: number;
  selectedFrame: string | null;
  onSelectFrame: (frame: string | null) => void;
  avatarUrl?: string | null;
  fullName: string;
  userId?: string;
}

export function FrameSelector({
  open, onOpenChange, earnedPoints, selectedFrame, onSelectFrame,
  avatarUrl, fullName, userId,
}: FrameSelectorProps) {
  const currentRank = getRank(earnedPoints);
  const [pending, setPending] = useState<string | null | undefined>(undefined);

  const effectiveSelection = pending !== undefined ? pending : selectedFrame;

  const isUnlocked = (rankTitle: string) => {
    const minPts = RANK_MIN_POINTS[rankTitle] ?? Infinity;
    return earnedPoints >= minPts;
  };

  const handleSelect = (rankTitle: string | null) => {
    setPending(rankTitle);
  };

  const handleConfirm = () => {
    onSelectFrame(pending !== undefined ? pending : selectedFrame);
    setPending(undefined);
    onOpenChange(false);
  };

  const previewAvatar = (
    <div className="rounded-full overflow-hidden flex items-center justify-center bg-card border border-border/30" style={{ width: 48, height: 48 }}>
      {avatarUrl ? (
        <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
      ) : (
        <DefaultAvatar name={fullName} size={48} userId={userId} />
      )}
    </div>
  );

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="max-h-[85vh]">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <AppIcon name="Sparkles" size={20} className="text-primary" />
            Escolher Moldura
          </SheetTitle>
        </SheetHeader>

        <div className="space-y-4 mt-4">
          {/* Auto option */}
          <button
            onClick={() => handleSelect(null)}
            className={cn(
              "w-full flex items-center gap-3 p-3 rounded-xl border transition-all",
              effectiveSelection === null
                ? "border-primary bg-primary/10"
                : "border-border/30 hover:border-border"
            )}
          >
            <div className="relative" style={{ width: 64, height: 64 }}>
              {(() => {
                const Frame = RANK_FRAMES[currentRank.title];
                return Frame ? <Frame size={48}>{previewAvatar}</Frame> : previewAvatar;
              })()}
            </div>
            <div className="text-left flex-1">
              <p className="text-sm font-semibold text-foreground">Automático</p>
              <p className="text-xs text-muted-foreground">Usa a moldura do seu elo atual ({currentRank.title})</p>
            </div>
            {effectiveSelection === null && (
              <AppIcon name="Check" size={18} className="text-primary shrink-0" />
            )}
          </button>

          {/* Frame grid */}
          <div className="grid grid-cols-4 gap-3">
            {ALL_RANKS.map(rankTitle => {
              const unlocked = isUnlocked(rankTitle);
              const Frame = RANK_FRAMES[rankTitle];
              const isSelected = effectiveSelection === rankTitle;

              return (
                <button
                  key={rankTitle}
                  disabled={!unlocked}
                  onClick={() => handleSelect(rankTitle)}
                  className={cn(
                    "flex flex-col items-center gap-1.5 p-2 rounded-xl border transition-all",
                    isSelected
                      ? "border-primary bg-primary/10"
                      : unlocked
                        ? "border-border/30 hover:border-border active:scale-95"
                        : "border-border/10 opacity-40 grayscale"
                  )}
                >
                  <div className="relative" style={{ width: 52, height: 52, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {Frame ? (
                      <Frame size={36}>
                        <div className="rounded-full overflow-hidden bg-card border border-border/30" style={{ width: 36, height: 36 }}>
                          {avatarUrl ? (
                            <img src={avatarUrl} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <DefaultAvatar name={fullName} size={36} userId={userId} />
                          )}
                        </div>
                      </Frame>
                    ) : (
                      <div className="rounded-full overflow-hidden bg-card border border-border/30" style={{ width: 36, height: 36 }}>
                        <DefaultAvatar name={fullName} size={36} userId={userId} />
                      </div>
                    )}
                    {!unlocked && (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <AppIcon name="Lock" size={16} className="text-muted-foreground" />
                      </div>
                    )}
                  </div>
                  <span className="text-[10px] font-medium text-muted-foreground leading-tight">{rankTitle}</span>
                  <span className="text-[9px] text-muted-foreground/60">{RANK_MIN_POINTS[rankTitle]} pts</span>
                </button>
              );
            })}
          </div>

          {/* Confirm button */}
          {pending !== undefined && (
            <button
              onClick={handleConfirm}
              className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-semibold text-sm active:scale-[0.98] transition-transform"
            >
              Confirmar Moldura
            </button>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
