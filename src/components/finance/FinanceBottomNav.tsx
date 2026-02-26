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
              <button
                key={tab.id}
                onClick={() => { navigator.vibrate?.(10); onTabChange(tab.id); }}
                className={cn(
                  "flex flex-col items-center justify-center h-full gap-0.5 transition-all relative z-10",
                  activeTab === tab.id ? "text-primary" : "text-muted-foreground"
                )}
                style={{ width: '20%' }}
              >
                <div
                  className={cn("relative transition-transform duration-300", activeTab === tab.id && "scale-110")}
                  style={activeTab === tab.id ? { filter: 'drop-shadow(0 0 8px hsl(var(--primary) / 0.6))' } : undefined}
                >
                  <AppIcon name={tab.icon} size={22} fill={activeTab === tab.id ? 1 : 0} weight={activeTab === tab.id ? 600 : 400} />
                </div>
                <span className={cn("text-[10px]", activeTab === tab.id ? "font-semibold" : "font-normal")}>{tab.label}</span>
              </button>
            ))}

            {/* Center FAB "+" — round, same as main */}
            <div className="flex items-center justify-center" style={{ width: '20%' }}>
              <button
                onClick={() => { navigator.vibrate?.(10); setMenuOpen(!menuOpen); }}
                className={cn(
                  "absolute -top-7 w-[56px] h-[56px] rounded-full flex items-center justify-center transition-all duration-300",
                  menuOpen ? "rotate-45 scale-95" : "hover:scale-105 active:scale-90"
                )}
                style={{
                  background: variant === 'personal'
                    ? 'linear-gradient(135deg, hsl(160 60% 45%), hsl(160 60% 35%))'
                    : 'var(--gradient-brand)',
                  boxShadow: variant === 'personal'
                    ? '0 0 24px hsl(160 60% 45% / 0.5), 0 4px 12px hsl(0 0% 0% / 0.5)'
                    : 'var(--shadow-glow), 0 4px 12px hsl(0 0% 0% / 0.5)',
                }}
              >
                <AppIcon name="Plus" size={28} className="relative z-10 text-primary-foreground" />
              </button>
            </div>

            {/* Right tabs */}
            {tabs.slice(2, 4).map(tab => (
              <button
                key={tab.id}
                onClick={() => { navigator.vibrate?.(10); onTabChange(tab.id); }}
                className={cn(
                  "flex flex-col items-center justify-center h-full gap-0.5 transition-all relative z-10",
                  activeTab === tab.id ? "text-primary" : "text-muted-foreground"
                )}
                style={{ width: '20%' }}
              >
                <div
                  className={cn("relative transition-transform duration-300", activeTab === tab.id && "scale-110")}
                  style={activeTab === tab.id ? { filter: 'drop-shadow(0 0 8px hsl(var(--primary) / 0.6))' } : undefined}
                >
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
