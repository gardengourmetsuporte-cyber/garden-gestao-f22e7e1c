import { useState } from 'react';
import { Loader2 } from 'lucide-react';
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
  const accentColor = variant === 'personal' ? 'hsl(160 60% 45%)' : 'hsl(var(--neon-cyan))';
  const accentGlow = variant === 'personal' ? 'hsl(160 60% 45% / 0.5)' : 'hsl(var(--neon-cyan) / 0.5)';
  const accentGlow2 = variant === 'personal' ? 'hsl(160 60% 45% / 0.2)' : 'hsl(var(--neon-cyan) / 0.2)';
  const [menuOpen, setMenuOpen] = useState(false);

  const handleAction = (type: TransactionType) => {
    setMenuOpen(false);
    onAddTransaction(type);
  };

  return (
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
      <div className="fixed bottom-20 left-0 right-0 z-50 flex justify-center" style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
          <div className="flex items-end gap-6 mb-4">
          {/* Income */}
          <button
            onClick={() => handleAction('income')}
            className="flex flex-col items-center gap-2 animate-scale-in"
            style={{ animationDelay: '0ms' }}
          >
            <div
              className="w-14 h-14 rounded-full flex items-center justify-center bg-card border-2 border-emerald-500/50 active:scale-90 transition-transform duration-150 shadow-lg"
              style={{ boxShadow: '0 0 16px rgba(16, 185, 129, 0.3)' }}
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
              className="w-14 h-14 rounded-full flex items-center justify-center bg-card border-2 border-red-500/50 active:scale-90 transition-transform duration-150 shadow-lg"
              style={{ boxShadow: '0 0 16px rgba(239, 68, 68, 0.3)' }}
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
              className="w-14 h-14 rounded-full flex items-center justify-center bg-card border-2 border-cyan-500/50 active:scale-90 transition-transform duration-150 shadow-lg"
              style={{ boxShadow: '0 0 16px rgba(6, 182, 212, 0.3)' }}
            >
              <AppIcon name="ArrowLeftRight" size={28} className="text-cyan-400" />
            </div>
            <span className="text-[11px] font-semibold text-cyan-400">Transf.</span>
          </button>
        </div>
        </div>
      )}

      <nav className="fixed bottom-0 left-0 right-0 lg:left-[260px] z-40 bg-card/90 backdrop-blur-2xl border-t border-border/15" style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
        {/* Top glow line */}
        <div className="h-px bg-gradient-to-r from-transparent via-primary/25 to-transparent" />
        <div className="flex items-center justify-around h-16 max-w-lg mx-auto relative">
          {/* Animated pill indicator */}
          <div
            className="absolute bottom-1 h-[3px] rounded-full nav-pill-indicator"
              style={{
              background: accentColor,
              boxShadow: `0 0 14px ${accentGlow}, 0 0 28px ${accentGlow2}`,
              width: '24px',
              left: `calc(${
                activeTab === 'home' ? '12.5%' :
                activeTab === 'transactions' ? '31.25%' :
                activeTab === 'charts' ? '68.75%' :
                '87.5%'
              } - 12px)`,
            }}
          />
          {/* Left tabs */}
          {tabs.slice(0, 2).map(tab => (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={cn(
                "flex flex-col items-center justify-center flex-1 h-full gap-1 transition-all",
                activeTab === tab.id
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <div className={cn(activeTab === tab.id && "nav-icon-active")}>
                <AppIcon name={tab.icon} size={24} style={activeTab === tab.id ? { filter: 'drop-shadow(0 0 6px hsl(217 91% 60% / 0.6))' } : undefined} />
              </div>
              <span className="text-[10px] font-medium">{tab.label}</span>
            </button>
          ))}

          {/* Center FAB */}
          <div className="flex-1 flex items-center justify-center">
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className={cn(
                "absolute -top-6 w-14 h-14 rounded-full flex items-center justify-center transition-all duration-300",
                menuOpen ? "rotate-45 scale-95" : "hover:scale-105 active:scale-95"
              )}
            >
              {/* Neon rotating border */}
              <div className={cn("absolute inset-0 rounded-full", variant === 'personal' ? 'fab-neon-border-personal' : 'fab-neon-border')} />
              {/* Inner background */}
              <div className="absolute inset-[2px] rounded-full bg-card" />
              {/* Icon */}
              <AppIcon name="Plus" size={32} className="relative z-10" style={{ color: accentColor }} />
            </button>
          </div>

          {/* Right tabs */}
          {tabs.slice(2, 5).map(tab => (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={cn(
                "flex flex-col items-center justify-center flex-1 h-full gap-1 transition-all",
                activeTab === tab.id
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <div className={cn(activeTab === tab.id && "nav-icon-active")}>
                <AppIcon name={tab.icon} size={24} style={activeTab === tab.id ? { filter: 'drop-shadow(0 0 6px hsl(217 91% 60% / 0.6))' } : undefined} />
              </div>
              <span className="text-[10px] font-medium">{tab.label}</span>
            </button>
          ))}
        </div>
      </nav>
    </>
  );
}
