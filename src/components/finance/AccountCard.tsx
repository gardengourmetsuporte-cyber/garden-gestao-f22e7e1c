import { AppIcon } from '@/components/ui/app-icon';
import { FinanceAccount } from '@/types/finance';
import { cn } from '@/lib/utils';
import { matchBankBrand, WALLET_BRAND } from '@/lib/bankBrands';
import { ICON_MAP } from '@/lib/iconMap';

interface AccountCardProps {
  account: FinanceAccount;
  onClick?: () => void;
}

function BankAvatar({ account }: { account: FinanceAccount }) {
  const isWallet = account.type === 'wallet';
  const brand = isWallet
    ? WALLET_BRAND
    : matchBankBrand(account.name);

  if (brand) {
    return (
      <div
        className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-xs shrink-0 shadow-sm"
        style={{ backgroundColor: brand.bgColor, color: brand.textColor }}
      >
        {brand.abbr}
      </div>
    );
  }

  // Fallback: use icon field mapped to AppIcon
  const iconName = account.icon || 'Wallet';

  return (
    <div
      className="w-10 h-10 rounded-full flex items-center justify-center shrink-0"
      style={{ backgroundColor: account.color + '20' }}
    >
      <AppIcon name={iconName} size={20} style={{ color: account.color }} />
    </div>
  );
}

export function AccountCard({ account, onClick }: AccountCardProps) {
  const isNegative = account.balance < 0;

  return (
    <button
      onClick={onClick}
      className={cn(
        "flex items-center gap-3 p-3 rounded-xl bg-card border border-border/40 transition-all duration-200 w-full text-left",
        onClick && "hover:bg-secondary/50 cursor-pointer active:scale-[0.98]"
      )}
    >
      <BankAvatar account={account} />
      <div className="flex-1 min-w-0">
        <p className="font-semibold truncate font-display" style={{ letterSpacing: '-0.01em' }}>{account.name}</p>
        <p className="text-xs text-muted-foreground capitalize">{account.type === 'wallet' ? 'Carteira' : account.type === 'bank' ? 'Banco' : 'Cartão'}</p>
      </div>
      <p className={cn(
        "font-semibold tabular-nums",
        isNegative ? "text-destructive" : "text-foreground"
      )}>
        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(account.balance)}
      </p>
      {onClick && <AppIcon name="ChevronRight" size={16} className="text-muted-foreground shrink-0" />}
    </button>
  );
}
