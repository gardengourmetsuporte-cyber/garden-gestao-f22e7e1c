import { useState, useRef, useCallback, ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface SwipeableTab {
  key: string;
  label: string;
  icon?: ReactNode;
  badge?: number;
  content: ReactNode;
}

interface SwipeableTabsProps {
  tabs: SwipeableTab[];
  activeTab?: string;
  onTabChange?: (key: string) => void;
  className?: string;
}

export function SwipeableTabs({ tabs, activeTab, onTabChange, className }: SwipeableTabsProps) {
  const [internalActive, setInternalActive] = useState(tabs[0]?.key || '');
  const currentKey = activeTab ?? internalActive;
  const currentIndex = tabs.findIndex(t => t.key === currentKey);
  
  const containerRef = useRef<HTMLDivElement>(null);
  const touchStart = useRef<{ x: number; y: number; time: number } | null>(null);
  const [offsetX, setOffsetX] = useState(0);
  const [isSwiping, setIsSwiping] = useState(false);

  const changeTab = useCallback((key: string) => {
    if (onTabChange) onTabChange(key);
    else setInternalActive(key);
  }, [onTabChange]);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    touchStart.current = {
      x: e.touches[0].clientX,
      y: e.touches[0].clientY,
      time: Date.now(),
    };
    setIsSwiping(false);
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!touchStart.current) return;
    const dx = e.touches[0].clientX - touchStart.current.x;
    const dy = e.touches[0].clientY - touchStart.current.y;

    // Only swipe if horizontal movement dominates
    if (!isSwiping && Math.abs(dx) > 10 && Math.abs(dx) > Math.abs(dy) * 1.5) {
      setIsSwiping(true);
    }

    if (isSwiping) {
      e.preventDefault();
      // Dampen at edges
      const atEdge = (currentIndex === 0 && dx > 0) || (currentIndex === tabs.length - 1 && dx < 0);
      setOffsetX(atEdge ? dx * 0.2 : dx);
    }
  }, [isSwiping, currentIndex, tabs.length]);

  const handleTouchEnd = useCallback(() => {
    if (!touchStart.current) return;

    if (isSwiping && Math.abs(offsetX) > 60) {
      if (offsetX < 0 && currentIndex < tabs.length - 1) {
        changeTab(tabs[currentIndex + 1].key);
      } else if (offsetX > 0 && currentIndex > 0) {
        changeTab(tabs[currentIndex - 1].key);
      }
    }

    touchStart.current = null;
    setOffsetX(0);
    setIsSwiping(false);
  }, [isSwiping, offsetX, currentIndex, tabs, changeTab]);

  return (
    <div className={cn("space-y-4", className)}>
      {/* Tab Bar */}
      <div className="tab-command">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => changeTab(tab.key)}
            className={cn(
              "tab-command-item relative",
              tab.key === currentKey ? "tab-command-active" : "tab-command-inactive"
            )}
          >
            {tab.icon && <span className="shrink-0">{tab.icon}</span>}
            <span>{tab.label}</span>
            {tab.badge !== undefined && tab.badge > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-destructive text-destructive-foreground text-[10px] flex items-center justify-center font-bold">
                {tab.badge}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Swipeable Content */}
      <div
        ref={containerRef}
        className="overflow-hidden touch-pan-y"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <div
          className="flex transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]"
          style={{
            width: `${tabs.length * 100}%`,
            transform: `translateX(calc(-${(currentIndex * 100) / tabs.length}% + ${offsetX}px))`,
            transitionDuration: isSwiping ? '0ms' : '300ms',
          }}
        >
          {tabs.map((tab) => (
            <div
              key={tab.key}
              className="w-full shrink-0"
              style={{ width: `${100 / tabs.length}%` }}
            >
              {tab.content}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
