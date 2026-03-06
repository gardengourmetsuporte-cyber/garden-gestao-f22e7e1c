import { useState, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';

import { AppIcon } from '@/components/ui/app-icon';
import { cn } from '@/lib/utils';
import { FinanceTab, TransactionType } from '@/types/finance';

function FinanceTabButton({ tab, active, onTabChange }: { tab: { id: FinanceTab; icon: string; label: string }; active: boolean; onTabChange: (tab: FinanceTab) => void }) {
  const [bouncing, setBouncing] = useState(false);
  const handledByPointer = useRef(false);

  const handleTap = () => {
    navigator.vibrate?.(10);
    setBouncing(true);
    setTimeout(() => {
      setBouncing(false);
      onTabChange(tab.id);
    }, 150);
  };

  return (
    <button
      onPointerDown={(e) => {
        if (e.pointerType === 'mouse') return;
        e.preventDefault();
        handledByPointer.current = true;
        handleTap();
      }}
      onClick={() => {
        if (handledByPointer.current) {
          handledByPointer.current = false;
          return;
        }
        handleTap();
      }}
      className={cn(
        "flex flex-col items-center justify-center h-full gap-0.5 relative",
        "text-muted-foreground"
      )}
      style={{ width: '20%' }}
    >
      {/* Active bump */}
      <div
        className={cn(
          "absolute left-1/2 -translate-x-1/2 bottom-full pointer-events-none transition-all ease-[cubic-bezier(0.34,1.56,0.64,1)]",
          active ? "w-14 h-3.5 opacity-100 duration-400" : "w-8 h-0 opacity-0 duration-200"
        )}
      >
        <div className="w-full h-full bg-background rounded-t-[14px]" />
      </div>

      {/* Icon */}
      <div
        className="relative"
        style={{
          transform: bouncing
            ? 'scale(0.82) translateY(1px)'
            : active
              ? 'scale(1.12) translateY(-2px)'
              : 'scale(1)',
          transition: bouncing
            ? 'transform 100ms cubic-bezier(0.2, 0, 0, 1)'
            : 'transform 400ms cubic-bezier(0.34, 1.56, 0.64, 1)',
        }}
      >
        {/* Ambient glow */}
        <div
          className={cn(
            "absolute inset-0 rounded-full transition-all duration-500",
            active ? "opacity-100 scale-[2.2]" : "opacity-0 scale-100"
          )}
          style={{
            background: active ? 'radial-gradient(circle, hsl(var(--primary) / 0.12) 0%, transparent 70%)' : 'none',
          }}
        />
        <AppIcon name={tab.icon} size={22} fill={active ? 1 : 0} weight={active ? 600 : 400} className={cn("relative z-10 transition-colors duration-300", active ? 'text-primary' : '')} />
      </div>
      <span className={cn("text-[10px] transition-all duration-300", active ? "font-semibold text-primary translate-y-[-1px]" : "font-normal")}>{tab.label}</span>
    </button>
  );
}

interface FinanceBottomNavProps {
  activeTab: FinanceTab;
  onTabChange: (tab: FinanceTab) => void;
  onAddTransaction: (type: TransactionType) => void;
  onReceiptCapture?: () => void;
  variant?: 'business' | 'personal';
}

const tabs: { id: FinanceTab; icon: string; label: string }[] = [
  { id: 'home', icon: 'Home', label: 'Início' },
  { id: 'transactions', icon: 'FileText', label: 'Transações' },
  { id: 'charts', icon: 'ChartPie', label: 'Gráficos' },
  { id: 'more', icon: 'MoreHorizontal', label: 'Mais' },
];

export function FinanceBottomNav({ activeTab, onTabChange, onAddTransaction, onReceiptCapture, variant = 'business' }: FinanceBottomNavProps) {
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleTabChange = useCallback((tab: FinanceTab) => {
    if (tab === activeTab) {
      if (tab === 'home') {
        navigate('/');
        return;
      }
      const scrollable = document.querySelector('[data-scroll-container]')
        || document.querySelector('.flex-1.overflow-y-auto')
        || document.querySelector('main');
      if (scrollable && scrollable.scrollTop > 0) {
        scrollable.scrollTo({ top: 0, behavior: 'smooth' });
      } else {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
      return;
    }
    onTabChange(tab);
  }, [activeTab, onTabChange, navigate]);

  const handleAction = (type: TransactionType) => {
    setMenuOpen(false);
    onAddTransaction(type);
  };

  const handleReceipt = () => {
    setMenuOpen(false);
    onReceiptCapture?.();
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
              <span className="text-[11px] font-bold text-white">Receita</span>
            </button>
            <button onClick={() => handleAction('expense')} className="flex flex-col items-center gap-2 animate-scale-in" style={{ animationDelay: '50ms' }}>
              <div className="w-14 h-14 rounded-full flex items-center justify-center active:scale-90 transition-transform duration-150 shadow-lg" style={{ background: 'hsl(var(--color-expense))' }}>
                <AppIcon name="ArrowDownCircle" size={26} fill={1} style={{ color: 'white' }} />
              </div>
              <span className="text-[11px] font-bold text-white">Despesa</span>
            </button>
            <button onClick={() => handleAction('transfer')} className="flex flex-col items-center gap-2 animate-scale-in" style={{ animationDelay: '100ms' }}>
              <div className="w-14 h-14 rounded-full flex items-center justify-center active:scale-90 transition-transform duration-150 shadow-lg" style={{ background: 'hsl(var(--color-transfer))' }}>
                <AppIcon name="ArrowLeftRight" size={24} fill={1} style={{ color: 'white' }} />
              </div>
              <span className="text-[11px] font-bold text-white">Transf.</span>
            </button>
            {onReceiptCapture && (
              <button onClick={handleReceipt} className="flex flex-col items-center gap-2 animate-scale-in" style={{ animationDelay: '150ms' }}>
                <div className="w-14 h-14 rounded-full flex items-center justify-center active:scale-90 transition-transform duration-150 shadow-lg bg-muted-foreground">
                  <AppIcon name="Camera" size={24} fill={1} style={{ color: 'white' }} />
                </div>
                <span className="text-[11px] font-bold text-white">Comprov.</span>
              </button>
            )}
          </div>
        </div>
      )}

      <nav className="fixed bottom-0 left-0 right-0 lg:hidden z-50">
        {/* Top separator with ambient glow */}
        <div className="absolute top-0 left-0 right-0 h-px">
          <div className="absolute inset-0 bg-border/8" />
          <div className="absolute left-1/2 -translate-x-1/2 w-32 h-px bg-primary/20 blur-sm" />
        </div>

        <div
          className="relative bg-background"
          style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
        >
          {/* FAB */}
          <div className="absolute left-1/2 -translate-x-1/2 -top-[22px] z-20">
            <div className="fab-cradle-ring">
              <button
                onClick={() => { navigator.vibrate?.(10); setMenuOpen(!menuOpen); }}
                 className={cn(
                  "w-[44px] h-[44px] rounded-full flex items-center justify-center transition-all duration-300 fab-contextual-glow",
                  menuOpen ? "rotate-45 scale-95" : "hover:scale-[1.08] active:scale-[0.92]"
                )}
              >
                <AppIcon name="Plus" size={20} className="relative z-10 text-white" />
              </button>
            </div>
          </div>

          <div className="flex items-center h-[64px] max-w-lg mx-auto relative z-10 tabbar-notch-shell overflow-visible">
            {tabs.slice(0, 2).map(tab => (
              <FinanceTabButton key={tab.id} tab={tab} active={activeTab === tab.id} onTabChange={handleTabChange} />
            ))}

            <div style={{ width: '20%' }} />

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
