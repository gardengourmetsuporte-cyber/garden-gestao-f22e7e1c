import { useState } from 'react';
import { Home, FileText, Plus, PieChart, MoreHorizontal, ArrowUpCircle, ArrowDownCircle, ArrowLeftRight, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { FinanceTab, TransactionType } from '@/types/finance';

interface FinanceBottomNavProps {
  activeTab: FinanceTab;
  onTabChange: (tab: FinanceTab) => void;
  onAddTransaction: (type: TransactionType) => void;
}

const tabs: { id: FinanceTab; icon: typeof Home; label: string }[] = [
  { id: 'home', icon: Home, label: 'Principal' },
  { id: 'transactions', icon: FileText, label: 'Transações' },
  { id: 'charts', icon: PieChart, label: 'Gráficos' },
  { id: 'more', icon: MoreHorizontal, label: 'Mais' },
];

export function FinanceBottomNav({ activeTab, onTabChange, onAddTransaction }: FinanceBottomNavProps) {
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
              <ArrowUpCircle className="w-7 h-7 text-emerald-400" />
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
              <ArrowDownCircle className="w-7 h-7 text-red-400" />
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
              <ArrowLeftRight className="w-7 h-7 text-cyan-400" />
            </div>
            <span className="text-[11px] font-semibold text-cyan-400">Transf.</span>
          </button>
        </div>
        </div>
      )}

      <nav className="fixed bottom-0 left-0 right-0 lg:left-72 z-40 bg-card/90 backdrop-blur-2xl border-t border-border/15" style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
        {/* Top glow line */}
        <div className="h-px bg-gradient-to-r from-transparent via-primary/25 to-transparent" />
        <div className="flex items-center justify-around h-16 max-w-lg mx-auto relative">
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
              <tab.icon className="w-6 h-6" />
              <span className="text-[10px] font-medium">{tab.label}</span>
              {activeTab === tab.id && (
                <div className="absolute bottom-1 w-5 h-0.5 rounded-full bg-primary" style={{ boxShadow: '0 0 8px hsl(217 91% 60% / 0.5)' }} />
              )}
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
              <div className="absolute inset-0 rounded-full fab-neon-border" />
              {/* Inner background */}
              <div className="absolute inset-[2px] rounded-full bg-card" />
              {/* Icon */}
              <Plus className="w-8 h-8 text-[hsl(var(--neon-cyan))] relative z-10" />
            </button>
          </div>

          {/* Right tabs */}
          {tabs.slice(2).map(tab => (
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
              <tab.icon className="w-6 h-6" />
              <span className="text-[10px] font-medium">{tab.label}</span>
              {activeTab === tab.id && (
                <div className="absolute bottom-1 w-5 h-0.5 rounded-full bg-primary" style={{ boxShadow: '0 0 8px hsl(217 91% 60% / 0.5)' }} />
              )}
            </button>
          ))}
        </div>
      </nav>
    </>
  );
}
