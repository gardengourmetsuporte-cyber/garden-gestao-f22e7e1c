import { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';

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
        "text-muted-foreground"
      )}
      style={{ width: '20%' }}
    >
      <div
        className="relative"
        style={{
          transform: bouncing ? 'scale(0.85)' : (active ? 'scale(1.1)' : 'scale(1)'),
          transition: bouncing ? 'transform 60ms ease-in' : 'transform 200ms cubic-bezier(0.34, 1.56, 0.64, 1)',
        }}
      >
        <AppIcon name={tab.icon} size={22} fill={active ? 1 : 0} weight={active ? 600 : 400} className={active ? 'tab-icon-galaxy' : ''} />
      </div>
      <span className={cn("text-[10px]", active ? "font-semibold tab-icon-galaxy-text" : "font-normal")}>{tab.label}</span>
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
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleTabChange = useCallback((tab: FinanceTab) => {
    if (tab === 'home' && activeTab === 'home') {
      navigate('/');
      return;
    }
    onTabChange(tab);
  }, [activeTab, onTabChange, navigate]);

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
        <div className="fixed bottom-28 left-0 right-0 z-50 flex justify-center" style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
          <div className="flex items-end gap-8">
            <button onClick={() => handleAction('income')} className="flex flex-col items-center gap-2 animate-scale-in" style={{ animationDelay: '0ms' }}>
              <div className="w-14 h-14 rounded-full flex items-center justify-center active:scale-90 transition-transform duration-150 shadow-lg" style={{ background: 'hsl(var(--color-income))' }}>
                <AppIcon name="ArrowUpCircle" size={26} fill={1} style={{ color: 'white' }} />
              </div>
              <span className="text-[11px] font-bold" style={{ color: 'hsl(var(--color-income))' }}>Receita</span>
            </button>
            <button onClick={() => handleAction('expense')} className="flex flex-col items-center gap-2 animate-scale-in" style={{ animationDelay: '50ms' }}>
              <div className="w-14 h-14 rounded-full flex items-center justify-center active:scale-90 transition-transform duration-150 shadow-lg" style={{ background: 'hsl(var(--color-expense))' }}>
                <AppIcon name="ArrowDownCircle" size={26} fill={1} style={{ color: 'white' }} />
              </div>
              <span className="text-[11px] font-bold" style={{ color: 'hsl(var(--color-expense))' }}>Despesa</span>
            </button>
            <button onClick={() => handleAction('transfer')} className="flex flex-col items-center gap-2 animate-scale-in" style={{ animationDelay: '100ms' }}>
              <div className="w-14 h-14 rounded-full flex items-center justify-center active:scale-90 transition-transform duration-150 shadow-lg" style={{ background: 'hsl(var(--color-transfer))' }}>
                <AppIcon name="ArrowLeftRight" size={24} fill={1} style={{ color: 'white' }} />
              </div>
              <span className="text-[11px] font-bold" style={{ color: 'hsl(var(--color-transfer))' }}>Transf.</span>
            </button>
          </div>
        </div>
      )}

      <nav
        className="fixed bottom-0 left-0 right-0 lg:left-[260px] z-[60]"
      >
        {/* Top neon glow — 3-layer animated */}
        <div className="absolute top-0 left-[8%] right-[8%] h-[1px]" style={{ background: 'linear-gradient(90deg, transparent, hsl(var(--primary) / 0.9), hsl(var(--accent) / 0.7), hsl(var(--primary) / 0.9), transparent)', backgroundSize: '200% 100%', animation: 'headerGlowShift 4s ease-in-out infinite' }} />
        <div className="absolute -top-[1px] left-[3%] right-[3%] h-[4px] blur-[6px]" style={{ background: 'linear-gradient(90deg, transparent, hsl(var(--primary) / 0.6), hsl(var(--accent) / 0.4), hsl(var(--primary) / 0.6), transparent)', backgroundSize: '200% 100%', animation: 'headerGlowShift 4s ease-in-out infinite' }} />
        <div className="absolute -top-[3px] left-[12%] right-[12%] h-[8px] blur-[12px]" style={{ background: 'linear-gradient(90deg, transparent, hsl(var(--primary) / 0.35), hsl(var(--accent) / 0.25), hsl(var(--primary) / 0.35), transparent)', backgroundSize: '200% 100%', animation: 'headerGlowShift 4s ease-in-out infinite' }} />

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
              <FinanceTabButton key={tab.id} tab={tab} active={activeTab === tab.id} onTabChange={handleTabChange} />
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
                  boxShadow: '0 4px 20px hsl(234 89% 67% / 0.15), 0 8px 32px hsl(0 0% 0% / 0.1), 0 0 0 1px hsl(234 50% 80% / 0.2)',
                }}
              >
                <AppIcon name="Plus" size={26} className="relative z-10" style={{ color: 'hsl(234 40% 30%)' }} />
              </button>
            </div>

            {/* Right tabs */}
            {tabs.slice(2, 4).map(tab => (
              <FinanceTabButton key={tab.id} tab={tab} active={activeTab === tab.id} onTabChange={handleTabChange} />
            ))}
          </div>
        </div>
      </nav>
    </>,
    document.body
  );
}
