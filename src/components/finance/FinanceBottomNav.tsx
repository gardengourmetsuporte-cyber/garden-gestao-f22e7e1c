import { useState } from 'react';
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

  const handleAction = (type: TransactionType) => {
    setMenuOpen(false);
    onAddTransaction(type);
  };

  // Calculate active tab index (accounting for FAB in center)
  const allSlots = [tabs[0], tabs[1], '__fab__' as any, tabs[2], tabs[3]];
  const activeSlotIdx = activeTab === 'home' ? 0 : activeTab === 'transactions' ? 1 : activeTab === 'charts' ? 3 : 4;

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
            {/* Income */}
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

            {/* Expense */}
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

            {/* Transfer */}
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
        <div
          className="mx-4 mb-3 rounded-[28px] glass-border"
          style={{
            background: 'hsl(var(--card) / 0.7)',
            backdropFilter: 'blur(40px)',
            WebkitBackdropFilter: 'blur(40px)',
            boxShadow: 'var(--shadow-floating)',
          }}
        >
          <div className="flex items-center justify-around h-[60px] max-w-lg mx-auto relative px-2">
            {/* Highlight pill */}
            <div
              className="absolute nav-highlight-pill rounded-2xl"
              style={{
                background: `${accentColor}15`,
                border: `1px solid ${accentColor}20`,
                width: '48px',
                height: '40px',
                top: '50%',
                transform: 'translateY(-50%)',
                left: `calc(${((activeSlotIdx + 0.5) / 5) * 100}% - 24px)`,
              }}
            />

            {/* Left tabs */}
            {tabs.slice(0, 2).map(tab => (
              <button
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                className={cn(
                  "flex flex-col items-center justify-center flex-1 h-full gap-0.5 transition-all relative z-10",
                  activeTab === tab.id ? "text-primary" : "text-muted-foreground hover:text-foreground"
                )}
              >
                <div className={cn(activeTab === tab.id && "nav-icon-active")}>
                  <AppIcon name={tab.icon} size={22} />
                </div>
                {activeTab === tab.id && <span className="text-[10px] font-semibold">{tab.label}</span>}
              </button>
            ))}

            {/* Center FAB */}
            <div className="flex-1 flex items-center justify-center">
              <button
                onClick={() => setMenuOpen(!menuOpen)}
                className={cn(
                  "absolute -top-4 w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-300",
                  menuOpen ? "rotate-45 scale-95" : "hover:scale-105 active:scale-90"
                )}
                style={{
                  background: variant === 'personal'
                    ? 'linear-gradient(135deg, hsl(160 60% 45%), hsl(160 60% 35%))'
                    : 'linear-gradient(135deg, hsl(var(--primary)), hsl(var(--primary) / 0.8))',
                  boxShadow: variant === 'personal'
                    ? '0 4px 16px hsl(160 60% 45% / 0.35)'
                    : '0 4px 16px hsl(var(--primary) / 0.35)',
                }}
              >
                <AppIcon name="Plus" size={26} className="relative z-10 text-primary-foreground" />
              </button>
            </div>

            {/* Right tabs */}
            {tabs.slice(2, 4).map(tab => (
              <button
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                className={cn(
                  "flex flex-col items-center justify-center flex-1 h-full gap-0.5 transition-all relative z-10",
                  activeTab === tab.id ? "text-primary" : "text-muted-foreground hover:text-foreground"
                )}
              >
                <div className={cn(activeTab === tab.id && "nav-icon-active")}>
                  <AppIcon name={tab.icon} size={22} />
                </div>
                {activeTab === tab.id && <span className="text-[10px] font-semibold">{tab.label}</span>}
              </button>
            ))}
          </div>
        </div>
      </nav>
    </>,
    document.body
  );
}
