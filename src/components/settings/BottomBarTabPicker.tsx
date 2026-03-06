import { useState, useEffect } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { AppIcon } from '@/components/ui/app-icon';
import { cn } from '@/lib/utils';
import { ALL_MODULES } from '@/lib/modules';
import { useBottomBarTabs } from '@/hooks/useBottomBarTabs';
import { useUserModules } from '@/hooks/useAccessLevels';

const EXCLUDED_KEYS = ['dashboard', 'settings'];
const PINNED_COUNT = 2;

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function BottomBarTabPicker({ open, onOpenChange }: Props) {
  const { pinnedKeys, setPinnedTabs } = useBottomBarTabs();
  const { hasAccess } = useUserModules();
  const [selected, setSelected] = useState<string[]>(pinnedKeys);

  // Sync when opening
  useEffect(() => {
    if (open) setSelected(pinnedKeys);
  }, [open, pinnedKeys]);

  const availableModules = ALL_MODULES.filter(
    m => !EXCLUDED_KEYS.includes(m.key) && hasAccess(m.key)
  );

  const toggle = (key: string) => {
    setSelected(prev => {
      let next: string[];
      if (prev.includes(key)) {
        next = prev.filter(k => k !== key);
      } else if (prev.length >= PINNED_COUNT) {
        // Replace oldest
        next = [...prev.slice(1), key];
      } else {
        next = [...prev, key];
      }
      // Apply in real-time
      if (next.length === PINNED_COUNT) {
        setPinnedTabs(next);
      }
      return next;
    });
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="rounded-t-2xl max-h-[85vh]">
        <SheetHeader>
          <SheetTitle>Personalizar barra inferior</SheetTitle>
        </SheetHeader>

        <p className="text-sm text-muted-foreground mt-1 mb-4">
          Escolha {PINNED_COUNT} módulos para acesso rápido na barra inferior.
        </p>

        <div className="grid grid-cols-3 gap-2 overflow-y-auto max-h-[50vh] pb-4">
          {availableModules.map(mod => {
            const isSelected = selected.includes(mod.key);
            return (
              <button
                key={mod.key}
                onClick={() => toggle(mod.key)}
                className={cn(
                  "flex flex-col items-center gap-2 py-4 px-2 rounded-2xl transition-all active:scale-95 border touch-manipulation",
                  isSelected
                    ? "border-primary/60 bg-primary/10"
                    : "border-border/30 bg-[#0a1a10]/40 hover:bg-[#0a1a10]/60"
                )}
              >
                <div className={cn(
                  "w-10 h-10 rounded-xl flex items-center justify-center",
                  isSelected ? "bg-primary/15" : "bg-muted/30"
                )}>
                  <AppIcon
                    name={mod.icon}
                    size={20}
                    fill={isSelected ? 1 : 0}
                    className={isSelected ? "text-primary" : "text-foreground/60"}
                  />
                </div>
                <span className={cn(
                  "text-[11px] font-medium text-center leading-tight",
                  isSelected ? "text-primary" : "text-foreground/70"
                )}>
                  {mod.label}
                </span>
              </button>
            );
          })}
        </div>

        <div className="text-center text-xs text-muted-foreground">
          {selected.length}/{PINNED_COUNT} selecionados
        </div>
      </SheetContent>
    </Sheet>
  );
}
