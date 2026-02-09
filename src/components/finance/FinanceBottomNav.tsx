import { Home, FileText, Plus, PieChart, MoreHorizontal } from 'lucide-react';
import { cn } from '@/lib/utils';
import { FinanceTab } from '@/types/finance';

interface FinanceBottomNavProps {
  activeTab: FinanceTab;
  onTabChange: (tab: FinanceTab) => void;
  onAddPress: () => void;
}

const tabs: { id: FinanceTab; icon: typeof Home; label: string }[] = [
  { id: 'home', icon: Home, label: 'Principal' },
  { id: 'transactions', icon: FileText, label: 'Transações' },
  { id: 'charts', icon: PieChart, label: 'Gráficos' },
  { id: 'more', icon: MoreHorizontal, label: 'Mais' },
];

export function FinanceBottomNav({ activeTab, onTabChange, onAddPress }: FinanceBottomNavProps) {
  return (
    <nav className="fixed bottom-0 left-0 right-0 lg:left-72 z-40 bg-card border-t shadow-lg" style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
      <div className="flex items-center justify-around h-16 max-w-lg mx-auto relative">
        {/* Left tabs */}
        {tabs.slice(0, 2).map(tab => (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={cn(
              "flex flex-col items-center justify-center flex-1 h-full gap-0.5 transition-colors",
              activeTab === tab.id
                ? "text-primary"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <tab.icon className="w-5 h-5" />
            <span className="text-[10px] font-medium">{tab.label}</span>
          </button>
        ))}

        {/* Center FAB */}
        <div className="flex-1 flex items-center justify-center">
          <button
            onClick={onAddPress}
            className="absolute -top-6 w-14 h-14 rounded-full bg-gradient-to-br from-primary to-primary/80 
              text-primary-foreground shadow-lg shadow-primary/30 
              flex items-center justify-center 
              hover:scale-105 active:scale-95 transition-all"
          >
            <Plus className="w-7 h-7" />
          </button>
        </div>

        {/* Right tabs */}
        {tabs.slice(2).map(tab => (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={cn(
              "flex flex-col items-center justify-center flex-1 h-full gap-0.5 transition-colors",
              activeTab === tab.id
                ? "text-primary"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <tab.icon className="w-5 h-5" />
            <span className="text-[10px] font-medium">{tab.label}</span>
          </button>
        ))}
      </div>
    </nav>
  );
}
