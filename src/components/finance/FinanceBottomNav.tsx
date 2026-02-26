import { useState, useRef, useEffect, useCallback } from 'react';
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
  const [menuOpen, setMenuOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const tabRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const [pillStyle, setPillStyle] = useState<{ left: number; width: number } | null>(null);

  const handleAction = (type: TransactionType) => {
    setMenuOpen(false);
    onAddTransaction(type);
  };

  const updatePill = useCallback(() => {
    if (!containerRef.current) return;
    const activeEl = tabRefs.current[activeTab];
    if (!activeEl) { setPillStyle(null); return; }
    const containerRect = containerRef.current.getBoundingClientRect();
    const tabRect = activeEl.getBoundingClientRect();
    setPillStyle({
      left: tabRect.left - containerRect.left + (tabRect.width - 48) / 2,
      width: 48,
    });
  }, [activeTab]);

  useEffect(() => {
    updatePill();
    const t = setTimeout(updatePill, 100);
    window.addEventListener('resize', updatePill);
    return () => { window.removeEventListener('resize', updatePill); clearTimeout(t); };
  }, [updatePill]);

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
            <button onClick={() => handleAction('income')} className="flex flex-col items-center gap-2 animate-scale-in" style={{ animationDelay: '0ms' }}>
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center card-glass active:scale-90 transition-transform duration-150" style={{ boxShadow: '0 0 16px rgba(16, 185, 129, 0.2)' }}>
                <AppIcon name="ArrowUpCircle" size={28} className="text-emerald-400" />
              </div>
              <span className="text-[11px] font-semibold text-emerald-400">Receita</span>
            </button>
            <button onClick={() => handleAction('expense')} className="flex flex-col items-center gap-2 animate-scale-in -mt-4" style={{ animationDelay: '50ms' }}>
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center card-glass active:scale-90 transition-transform duration-150" style={{ boxShadow: '0 0 16px rgba(239, 68, 68, 0.2)' }}>
                <AppIcon name="ArrowDownCircle" size={28} className="text-red-400" />
              </div>
              <span className="text-[11px] font-semibold text-red-400">Despesa</span>
            </button>
            <button onClick={() => handleAction('transfer')} className="flex flex-col items-center gap-2 animate-scale-in" style={{ animationDelay: '100ms' }}>
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center card-glass active:scale-90 transition-transform duration-150" style={{ boxShadow: '0 0 16px rgba(6, 182, 212, 0.2)' }}>
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
        <div
          className="mx-3 mb-3 rounded-[24px]"
          style={{
            background: 'hsl(220 20% 7% / 0.92)',
            backdropFilter: 'blur(24px)',
            WebkitBackdropFilter: 'blur(24px)',
            border: '1px solid hsl(0 0% 100% / 0.08)',
            boxShadow: '0 -4px 32px hsl(0 0% 0% / 0.4), 0 -1px 8px hsl(0 0% 0% / 0.2)',
          }}
        >
          <div ref={containerRef} className="flex items-center h-[70px] max-w-lg mx-auto relative px-1">
            {/* Highlight pill */}
            {pillStyle && (
              <div
                className="absolute nav-highlight-pill rounded-[14px]"
                style={{
                  background: `hsl(var(--primary) / 0.12)`,
                  border: `1px solid hsl(var(--primary) / 0.2)`,
                  width: pillStyle.width,
                  height: '42px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  left: pillStyle.left,
                  willChange: 'left',
                }}
              />
            )}

            {/* Left tabs */}
            {tabs.slice(0, 2).map(tab => (
              <button
                key={tab.id}
                ref={(el) => { tabRefs.current[tab.id] = el; }}
                onClick={() => { navigator.vibrate?.(10); onTabChange(tab.id); }}
                className={cn(
                  "flex flex-col items-center justify-center flex-1 h-full gap-0.5 transition-all relative z-10 active:scale-90",
                  activeTab === tab.id ? "text-foreground" : "text-muted-foreground"
                )}
              >
                <div className={cn("transition-transform duration-300", activeTab === tab.id && "scale-110")}>
                  <AppIcon name={tab.icon} size={22} fill={activeTab === tab.id ? 1 : 0} weight={activeTab === tab.id ? 600 : 400} />
                </div>
                <span className={cn("text-[10px]", activeTab === tab.id ? "font-semibold" : "font-normal")}>{tab.label}</span>
              </button>
            ))}

            {/* Center FAB */}
            <div className="flex-1 flex items-center justify-center">
              <button
                onClick={() => { navigator.vibrate?.(10); setMenuOpen(!menuOpen); }}
                className={cn(
                  "absolute -top-5 w-[55px] h-[55px] rounded-[18px] flex items-center justify-center transition-all duration-300",
                  menuOpen ? "rotate-45 scale-95" : "hover:scale-105 active:scale-90"
                )}
                style={{
                  background: variant === 'personal'
                    ? 'linear-gradient(135deg, hsl(160 60% 45%), hsl(160 60% 35%))'
                    : 'linear-gradient(135deg, hsl(var(--primary)), hsl(262 80% 55%))',
                  boxShadow: variant === 'personal'
                    ? '0 8px 24px hsl(160 60% 45% / 0.4)'
                    : '0 8px 24px hsl(262 80% 55% / 0.4), 0 2px 8px hsl(var(--primary) / 0.3)',
                }}
              >
                <AppIcon name="Plus" size={28} className="relative z-10 text-primary-foreground" />
              </button>
            </div>

            {/* Right tabs */}
            {tabs.slice(2, 4).map(tab => (
              <button
                key={tab.id}
                ref={(el) => { tabRefs.current[tab.id] = el; }}
                onClick={() => { navigator.vibrate?.(10); onTabChange(tab.id); }}
                className={cn(
                  "flex flex-col items-center justify-center flex-1 h-full gap-0.5 transition-all relative z-10 active:scale-90",
                  activeTab === tab.id ? "text-foreground" : "text-muted-foreground"
                )}
              >
                <div className={cn("transition-transform duration-300", activeTab === tab.id && "scale-110")}>
                  <AppIcon name={tab.icon} size={22} fill={activeTab === tab.id ? 1 : 0} weight={activeTab === tab.id ? 600 : 400} />
                </div>
                <span className={cn("text-[10px]", activeTab === tab.id ? "font-semibold" : "font-normal")}>{tab.label}</span>
              </button>
            ))}
          </div>
        </div>
      </nav>
    </>,
    document.body
  );
}
