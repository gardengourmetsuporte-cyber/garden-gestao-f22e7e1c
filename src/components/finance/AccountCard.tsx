import { Wallet, Landmark, CreditCard } from 'lucide-react';
import { FinanceAccount } from '@/types/finance';
import { cn } from '@/lib/utils';

interface AccountCardProps {
  account: FinanceAccount;
  onClick?: () => void;
}

const iconMap: Record<string, typeof Wallet> = {
  Wallet: Wallet,
  Landmark: Landmark,
  CreditCard: CreditCard,
};

export function AccountCard({ account, onClick }: AccountCardProps) {
  const Icon = iconMap[account.icon] || Wallet;
  const isNegative = account.balance < 0;

  return (
    <button
      onClick={onClick}
      className={cn(
        "flex items-center gap-3 p-3 rounded-xl bg-card border transition-all w-full text-left",
        onClick && "hover:bg-secondary/50 cursor-pointer"
      )}
    >
      <div
        className="w-10 h-10 rounded-full flex items-center justify-center"
        style={{ backgroundColor: account.color + '20' }}
      >
        <Icon className="w-5 h-5" style={{ color: account.color }} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-medium truncate">{account.name}</p>
        <p className="text-xs text-muted-foreground capitalize">{account.type}</p>
      </div>
      <p className={cn(
        "font-semibold tabular-nums",
        isNegative ? "text-destructive" : "text-foreground"
      )}>
        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(account.balance)}
      </p>
    </button>
  );
}
