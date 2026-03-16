import { useRef, useEffect, useState, ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface AnimatedTab {
  key: string;
  label: string;
  icon?: ReactNode;
  iconGradient?: string;
  badge?: number;
}

interface AnimatedTabsProps {
  tabs: AnimatedTab[];
  activeTab: string;
  onTabChange: (key: string) => void;
  className?: string;
}

export function AnimatedTabs({ tabs, activeTab, onTabChange, className }: AnimatedTabsProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const tabRefs = useRef<Map<string, HTMLButtonElement>>(new Map());
  const [indicator, setIndicator] = useState({ left: 0, width: 0 });

  useEffect(() => {
    const el = tabRefs.current.get(activeTab);
    const container = containerRef.current;
    if (el && container) {
      const containerRect = container.getBoundingClientRect();
      const elRect = el.getBoundingClientRect();
      setIndicator({
        left: elRect.left - containerRect.left,
        width: elRect.width,
      });
    }
  }, [activeTab, tabs]);

  const isCompact = tabs.length >= 4;
  const hideIcons = tabs.length >= 6;

  return (
    <div
      ref={containerRef}
      className={cn(
        "relative flex bg-muted/50 rounded-2xl p-1 border border-border/30",
        isCompact ? "overflow-x-auto scrollbar-none" : "overflow-hidden",
        className
      )}
    >
      {/* Animated slider indicator */}
      <div
        className="absolute top-1 bottom-1 rounded-xl bg-primary/10 shadow-sm shadow-primary/10 border border-primary/20 will-change-transform"
        style={{
          left: indicator.left,
          width: indicator.width,
          transition: 'left 0.3s cubic-bezier(0.16,1,0.3,1), width 0.3s cubic-bezier(0.16,1,0.3,1)',
        }}
      />

      {tabs.map((tab) => {
        const isActive = activeTab === tab.key;
        return (
          <button
            key={tab.key}
            ref={(el) => { if (el) tabRefs.current.set(tab.key, el); }}
            onClick={() => { navigator.vibrate?.(10); onTabChange(tab.key); }}
            className={cn(
              "relative flex flex-col items-center justify-center gap-0.5 py-1.5 rounded-xl font-semibold z-10 transition-all duration-200",
              isCompact ? "min-w-0 shrink-0 px-2 flex-1" : "flex-1 px-1",
              "min-h-[44px]",
              hideIcons ? "text-[11px]" : "text-[11px]",
              isActive ? 'text-primary' : 'text-muted-foreground'
            )}
          >
            {tab.icon && !hideIcons && (
              <div
                className={cn(
                  "w-7 h-7 rounded-full flex items-center justify-center shrink-0 transition-all duration-300 shadow-sm",
                  !isActive && "opacity-40 saturate-0"
                )}
                style={{ background: tab.iconGradient || 'hsl(var(--primary))' }}
              >
                <span className="text-white flex items-center justify-center">{tab.icon}</span>
              </div>
            )}
            <span className={cn("leading-tight", isCompact ? "whitespace-nowrap" : "truncate")}>{tab.label}</span>
            {tab.badge !== undefined && tab.badge > 0 && (
              <span className={cn(
                "absolute top-1.5 right-1/2 translate-x-4 min-w-[16px] h-[16px] px-1 rounded-full text-[9px] font-bold flex items-center justify-center shrink-0",
                isActive
                  ? "bg-primary/15 text-primary"
                  : "bg-muted text-muted-foreground"
              )}>
                {tab.badge > 99 ? '99+' : tab.badge}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
