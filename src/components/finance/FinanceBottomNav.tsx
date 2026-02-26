import { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';

import { AppIcon } from '@/components/ui/app-icon';
import { cn } from '@/lib/utils';
import { FinanceTab, TransactionType } from '@/types/finance';

function FinanceTabButton({ tab, active, onTabChange }: { tab: { id: FinanceTab; icon: string; label: string }; active: boolean; onTabChange: (tab: FinanceTab) => void }) {
  const [bouncing, setBouncing] = useState(false);

  const handleTap = () => {
    navigator.vibrate?.(10);
    setBouncing(true);
    setTimeout(() => {
      setBouncing(false);
      onTabChange(tab.id);
    }, 120);
  };

  return (
    <button
      onClick={handleTap}
      className={cn(
        "flex flex-col items-center justify-center h-full gap-0.5 relative z-10",
        active ? "text-primary" : "text-muted-foreground"
      )}
      style={{ width: '20%' }}
    >
      <div
        className="relative"
        style={{
          transform: bouncing ? 'scale(0.85)' : (active ? 'scale(1.1)' : 'scale(1)'),
          transition: bouncing ? 'transform 60ms ease-in' : 'transform 200ms cubic-bezier(0.34, 1.56, 0.64, 1)',
          ...(active ? { filter: 'drop-shadow(0 0 8px hsl(var(--primary) / 0.6))' } : {}),
        }}
      >
        <AppIcon name={tab.icon} size={22} fill={active ? 1 : 0} weight={active ? 600 : 400} />
      </div>
      <span className={cn("text-[10px]", active ? "font-semibold" : "font-normal")}>{tab.label}</span>
    </button>
  );
}

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

  const handleAction = (type: TransactionType) => {
    setMenuOpen(false);
    onAddTransaction(type);
  };

  return createPortal(
    <>
      {menuOpen && (
        <div className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm animate-fade-in" onClick={() => setMenuOpen(false)} />
      )}

      {menuOpen && (
        <div className="fixed bottom-24 left-0 right-0 z-50 flex justify-center" style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
          <div className="flex items-end gap-5 mb-4">
            <button onClick={() => handleAction('income')} className="flex flex-col items-center gap-2 animate-scale-in" style={{ animationDelay: '0ms' }}>
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center card-glass active:scale-90 transition-transform duration-150" style={{ boxShadow: '0 0 16px hsl(var(--color-income) / 0.25)' }}>
                <AppIcon name="ArrowUpCircle" size={28} style={{ color: 'hsl(var(--color-income))' }} />
              </div>
              <span className="text-[11px] font-semibold" style={{ color: 'hsl(var(--color-income))' }}>Receita</span>
            </button>
            <button onClick={() => handleAction('expense')} className="flex flex-col items-center gap-2 animate-scale-in -mt-4" style={{ animationDelay: '50ms' }}>
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center card-glass active:scale-90 transition-transform duration-150" style={{ boxShadow: '0 0 16px hsl(var(--color-expense) / 0.25)' }}>
                <AppIcon name="ArrowDownCircle" size={28} style={{ color: 'hsl(var(--color-expense))' }} />
              </div>
              <span className="text-[11px] font-semibold" style={{ color: 'hsl(var(--color-expense))' }}>Despesa</span>
            </button>
            <button onClick={() => handleAction('transfer')} className="flex flex-col items-center gap-2 animate-scale-in" style={{ animationDelay: '100ms' }}>
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center card-glass active:scale-90 transition-transform duration-150" style={{ boxShadow: '0 0 16px hsl(var(--color-transfer) / 0.25)' }}>
                <AppIcon name="ArrowLeftRight" size={28} style={{ color: 'hsl(var(--color-transfer))' }} />
              </div>
              <span className="text-[11px] font-semibold" style={{ color: 'hsl(var(--color-transfer))' }}>Transf.</span>
            </button>
          </div>
        </div>
      )}

      <nav
        className="fixed bottom-0 left-0 right-0 lg:left-[260px] z-[60]"
      >
        {/* Top neon glow line — same as main bar */}
        <div className="absolute top-0 left-[8%] right-[8%] h-[1px]" style={{ background: 'linear-gradient(90deg, transparent, hsl(var(--primary) / 0.9), hsl(var(--accent) / 0.7), hsl(var(--primary) / 0.9), transparent)' }} />
        <div className="absolute -top-[1px] left-[3%] right-[3%] h-[4px] blur-[6px]" style={{ background: 'linear-gradient(90deg, transparent, hsl(var(--primary) / 0.6), hsl(var(--accent) / 0.4), hsl(var(--primary) / 0.6), transparent)' }} />
        <div className="absolute -top-[3px] left-[12%] right-[12%] h-[8px] blur-[12px]" style={{ background: 'linear-gradient(90deg, transparent, hsl(var(--primary) / 0.35), hsl(var(--accent) / 0.25), hsl(var(--primary) / 0.35), transparent)' }} />

        {/* Bar background — full width, edge to edge, same as main */}
        <div
          className="relative"
          style={{
            background: 'hsl(var(--background))',
            paddingBottom: 'env(safe-area-inset-bottom)',
          }}
        >
          <div className="flex items-center h-[68px] max-w-lg mx-auto relative">
            {/* Left tabs */}
            {tabs.slice(0, 2).map(tab => (
              <FinanceTabButton key={tab.id} tab={tab} active={activeTab === tab.id} onTabChange={onTabChange} />
            ))}

            {/* Center FAB "+" — matches global bar style */}
            <div className="flex items-center justify-center" style={{ width: '20%' }}>
              <div
                className="absolute -top-8 w-[68px] h-[68px] rounded-full"
                style={{
                  background: 'radial-gradient(circle, hsl(var(--primary) / 0.35) 0%, hsl(var(--primary) / 0.1) 50%, transparent 70%)',
                  filter: 'blur(8px)',
                }}
              />
              <button
                onClick={() => { navigator.vibrate?.(10); setMenuOpen(!menuOpen); }}
                className={cn(
                  "absolute -top-7 w-[60px] h-[60px] rounded-full flex items-center justify-center transition-all duration-200 fab-gradient",
                  menuOpen ? "rotate-45 scale-95" : "hover:scale-[1.08] active:scale-[0.92]"
                )}
                style={{
                  boxShadow: '0 4px 20px hsl(var(--primary) / 0.5), 0 8px 32px hsl(var(--primary) / 0.3)',
                }}
              >
                <AppIcon name="Plus" size={26} className="relative z-10" style={{ color: 'white' }} />
              </button>
            </div>

            {/* Right tabs */}
            {tabs.slice(2, 4).map(tab => (
              <FinanceTabButton key={tab.id} tab={tab} active={activeTab === tab.id} onTabChange={onTabChange} />
            ))}
          </div>
        </div>
      </nav>
    </>,
    document.body
  );
}
