import { useState } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { AppIcon } from '@/components/ui/app-icon';
import { cn } from '@/lib/utils';
import { useBonusPoints } from '@/hooks/useBonusPoints';

interface BonusPointSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  employeeName: string;
  employeeUserId: string;
}

const POINT_OPTIONS = [5, 10, 15, 20, 25];

export function BonusPointSheet({ open, onOpenChange, employeeName, employeeUserId }: BonusPointSheetProps) {
  const [points, setPoints] = useState(10);
  const [reason, setReason] = useState('');
  const { awardManualBonus, isAwarding } = useBonusPoints();

  const handleSubmit = () => {
    if (!reason.trim()) return;
    awardManualBonus(
      { targetUserId: employeeUserId, points, reason: reason.trim() },
      { onSuccess: () => { setReason(''); setPoints(10); onOpenChange(false); } }
    );
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="rounded-t-2xl">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <AppIcon name="Award" size={20} className="text-primary" />
            Dar Bônus para {employeeName}
          </SheetTitle>
        </SheetHeader>

        <div className="space-y-4 mt-4">
          {/* Points selector */}
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-2 block">Pontos</label>
            <div className="flex gap-2">
              {POINT_OPTIONS.map(p => (
                <button
                  key={p}
                  onClick={() => setPoints(p)}
                  className={cn(
                    "flex-1 py-2.5 rounded-xl text-sm font-bold transition-all",
                    points === p
                      ? "bg-primary text-primary-foreground shadow-lg"
                      : "bg-secondary text-muted-foreground hover:bg-secondary/80"
                  )}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>

          {/* Reason */}
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-2 block">Motivo</label>
            <Textarea
              value={reason}
              onChange={e => setReason(e.target.value)}
              placeholder="Ex: Resolveu problema do cliente sem ser solicitado"
              className="min-h-[80px]"
            />
          </div>

          <Button
            onClick={handleSubmit}
            disabled={!reason.trim() || isAwarding}
            className="w-full"
          >
            <AppIcon name="Award" size={16} className="mr-2" />
            Conceder {points} pontos bônus
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
