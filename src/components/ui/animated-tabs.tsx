import { useRef, useEffect, useState, ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface AnimatedTab {
  key: string;
  label: string;
  icon?: ReactNode;
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

  return (
    <div
      ref={containerRef}
      className={cn(
        "relative flex bg-muted/50 rounded-2xl p-1 border border-border",
        isCompact ? "overflow-x-auto scrollbar-none" : "overflow-hidden",
        className
      )}
    >
      {/* Animated slider indicator */}
      <div
        className="absolute top-1 bottom-1 rounded-xl bg-emerald-500/10 shadow-sm shadow-emerald-500/10 border border-emerald-500/20 will-change-transform"
        style={{
          left: indicator.left,
          width: indicator.width,
          transition: 'left 0.3s cubic-bezier(0.16,1,0.3,1), width 0.3s cubic-bezier(0.16,1,0.3,1)',
        }}
      />

      {tabs.map((tab) => (
        <button
          key={tab.key}
          ref={(el) => { if (el) tabRefs.current.set(tab.key, el); }}
          onClick={() => { navigator.vibrate?.(10); onTabChange(tab.key); }}
          className={cn(
            "relative flex items-center justify-center gap-1.5 py-3 rounded-xl text-sm font-medium z-10 transition-colors duration-200",
            isCompact ? "min-w-0 shrink-0 px-3 flex-1" : "flex-1 px-1",
            "min-h-[44px]",
            activeTab === tab.key ? 'text-emerald-400' : 'text-muted-foreground'
          )}
        >
          {tab.icon}
          <span className={cn(isCompact ? "whitespace-nowrap" : "truncate")}>{tab.label}</span>
          {tab.badge !== undefined && tab.badge > 0 && (
            <span className={cn(
              "min-w-[18px] h-[18px] px-1 rounded-full text-[10px] font-bold flex items-center justify-center shrink-0",
              activeTab === tab.key
                ? "bg-emerald-500/15 text-emerald-400"
                : "bg-muted text-muted-foreground"
            )}>
              {tab.badge > 99 ? '99+' : tab.badge}
            </span>
          )}
        </button>
      ))}
    </div>
  );
}
