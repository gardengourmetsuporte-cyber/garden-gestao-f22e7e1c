import { useState, useRef, useEffect, useCallback, forwardRef } from 'react';
import { createPortal } from 'react-dom';

import { AppIcon } from '@/components/ui/app-icon';
import { cn } from '@/lib/utils';
import { FinanceTab, TransactionType } from '@/types/finance';

interface FinanceBottomNavProps {
  activeTab: FinanceTab;
  onTabChange: (tab: FinanceTab) => void;
  onAddTransaction: (type: TransactionType) => void;
  variant?: 'business' | 'personal';
}

const tabs: { id: FinanceTab; icon: string; label: string }[] = [
  { id: 'home', icon: 'Home', label: 'Principal' },
  { id: 'transactions', icon: 'FileText', label: 'Transações' },
  { id: 'charts', icon: 'PieChart', label: 'Gráficos' },
  { id: 'more', icon: 'MoreHorizontal', label: 'Mais' },
];

export function FinanceBottomNav({ activeTab, onTabChange, onAddTransaction, variant = 'business' }: FinanceBottomNavProps) {
  const accentColor = variant === 'personal' ? 'hsl(160 60% 45%)' : 'hsl(var(--primary))';
  const [menuOpen, setMenuOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const tabRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const [pillStyle, setPillStyle] = useState<{ left: number; width: number } | null>(null);

  const handleAction = (type: TransactionType) => {
    setMenuOpen(false);
    onAddTransaction(type);
  };

  const activeKey = tabs.find(t => t.id === activeTab)?.id ?? null;

  const updatePill = useCallback(() => {
    if (!activeKey || !containerRef.current) {
      setPillStyle(null);
      return;
    }
    const activeEl = tabRefs.current[activeKey];
    if (!activeEl) { setPillStyle(null); return; }
    const containerRect = containerRef.current.getBoundingClientRect();
    const tabRect = activeEl.getBoundingClientRect();
    setPillStyle({
      left: tabRect.left - containerRect.left + (tabRect.width - 48) / 2,
      width: 48,
    });
  }, [activeKey]);

  useEffect(() => {
    updatePill();
    const t = setTimeout(updatePill, 100);
    window.addEventListener('resize', updatePill);
    return () => { window.removeEventListener('resize', updatePill); clearTimeout(t); };
  }, [updatePill]);

  const leftTabs = tabs.slice(0, 2);
  const rightTabs = tabs.slice(2, 4);

  return createPortal(
    <>
      {/* Overlay */}
      {menuOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm animate-fade-in"
          onClick={() => setMenuOpen(false)}
        />
      )}

      {/* Radial Menu */}
      {menuOpen && (
        <div className="fixed bottom-24 left-0 right-0 z-50 flex justify-center" style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
          <div className="flex items-end gap-5 mb-4">
            <button
              onClick={() => handleAction('income')}
              className="flex flex-col items-center gap-2 animate-scale-in"
              style={{ animationDelay: '0ms' }}
            >
              <div
                className="w-14 h-14 rounded-2xl flex items-center justify-center card-glass active:scale-90 transition-transform duration-150"
                style={{ boxShadow: '0 0 16px rgba(16, 185, 129, 0.2)' }}
              >
                <AppIcon name="ArrowUpCircle" size={28} className="text-emerald-400" />
              </div>
              <span className="text-[11px] font-semibold text-emerald-400">Receita</span>
            </button>

            <button
              onClick={() => handleAction('expense')}
              className="flex flex-col items-center gap-2 animate-scale-in -mt-4"
              style={{ animationDelay: '50ms' }}
            >
              <div
                className="w-14 h-14 rounded-2xl flex items-center justify-center card-glass active:scale-90 transition-transform duration-150"
                style={{ boxShadow: '0 0 16px rgba(239, 68, 68, 0.2)' }}
              >
                <AppIcon name="ArrowDownCircle" size={28} className="text-red-400" />
              </div>
              <span className="text-[11px] font-semibold text-red-400">Despesa</span>
            </button>

            <button
              onClick={() => handleAction('transfer')}
              className="flex flex-col items-center gap-2 animate-scale-in"
              style={{ animationDelay: '100ms' }}
            >
              <div
                className="w-14 h-14 rounded-2xl flex items-center justify-center card-glass active:scale-90 transition-transform duration-150"
                style={{ boxShadow: '0 0 16px rgba(6, 182, 212, 0.2)' }}
              >
                <AppIcon name="ArrowLeftRight" size={28} className="text-cyan-400" />
              </div>
              <span className="text-[11px] font-semibold text-cyan-400">Transf.</span>
            </button>
          </div>
        </div>
      )}

      <nav
        className="fixed bottom-0 left-0 right-0 lg:left-[260px] z-[60]"
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      >
        <div className="mx-4 mb-3 rounded-[28px] nav-bar-floating">
          <div ref={containerRef} className="flex items-center h-[64px] max-w-lg mx-auto relative px-1">
            {/* Highlight pill */}
            {pillStyle && (
              <div
                className="absolute nav-highlight-pill rounded-[14px]"
                style={{
                  background: `${accentColor}26`,
                  border: `1px solid ${accentColor}40`,
                  width: pillStyle.width,
                  height: '40px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  left: pillStyle.left,
                }}
              />
            )}

            {/* Left tabs */}
            {leftTabs.map(tab => (
              <FinTabButton
                key={tab.id}
                ref={(el) => { tabRefs.current[tab.id] = el; }}
                tab={tab}
                active={activeTab === tab.id}
                accentClass={variant === 'personal' ? 'text-emerald-500' : 'text-primary'}
                onClick={() => onTabChange(tab.id)}
              />
            ))}

            {/* Center FAB */}
            <div className="flex items-center justify-center" style={{ width: '20%' }}>
              <button
                onClick={() => setMenuOpen(!menuOpen)}
                className={cn(
                  "absolute -top-5 w-[52px] h-[52px] rounded-[18px] flex items-center justify-center transition-all duration-300",
                  menuOpen ? "rotate-45 scale-95" : "hover:scale-105 active:scale-90"
                )}
                style={{
                  background: variant === 'personal'
                    ? 'linear-gradient(135deg, hsl(160 60% 45%), hsl(160 60% 35%))'
                    : 'linear-gradient(135deg, hsl(var(--primary)), hsl(var(--primary) / 0.8))',
                  boxShadow: variant === 'personal'
                    ? '0 6px 24px hsl(160 60% 45% / 0.4)'
                    : '0 6px 24px hsl(var(--primary) / 0.4)',
                }}
              >
                <AppIcon name="Plus" size={26} className="relative z-10 text-primary-foreground" />
              </button>
            </div>

            {/* Right tabs */}
            {rightTabs.map(tab => (
              <FinTabButton
                key={tab.id}
                ref={(el) => { tabRefs.current[tab.id] = el; }}
                tab={tab}
                active={activeTab === tab.id}
                accentClass={variant === 'personal' ? 'text-emerald-500' : 'text-primary'}
                onClick={() => onTabChange(tab.id)}
              />
            ))}
          </div>
        </div>
      </nav>
    </>,
    document.body
  );
}

const FinTabButton = forwardRef<
  HTMLButtonElement,
  {
    tab: { id: string; icon: string; label: string };
    active: boolean;
    accentClass: string;
    onClick: () => void;
  }
>(({ tab, active, accentClass, onClick }, ref) => {
  return (
    <button
      ref={ref}
      onClick={onClick}
      className={cn(
        "flex flex-col items-center justify-center flex-1 h-full gap-0.5 transition-all relative z-10",
        active ? accentClass : "text-muted-foreground hover:text-foreground"
      )}
    >
      <div className={cn(active && "nav-icon-active")}>
        <AppIcon name={tab.icon} size={22} fill={active ? 1 : 0} />
      </div>
      <span className={cn("text-[10px]", active ? "font-semibold" : "font-normal text-muted-foreground")}>{tab.label}</span>
    </button>
  );
});

FinTabButton.displayName = 'FinTabButton';
