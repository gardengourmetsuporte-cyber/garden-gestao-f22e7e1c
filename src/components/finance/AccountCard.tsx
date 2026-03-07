import { AppIcon } from '@/components/ui/app-icon';
import { FinanceAccount } from '@/types/finance';
import { cn } from '@/lib/utils';
import { matchBankBrand, WALLET_BRAND } from '@/lib/bankBrands';

interface AccountCardProps {
  account: FinanceAccount;
  onClick?: () => void;
}

function BankAvatar({ account }: { account: FinanceAccount }) {
  const isWallet = account.type === 'wallet';
  const brand = isWallet ? WALLET_BRAND : matchBankBrand(account.name);

  if (brand) {
    return (
      <div
        className="w-11 h-11 rounded-2xl flex items-center justify-center font-bold text-xs shrink-0 shadow-lg"
        style={{ background: brand.bgColor, color: brand.textColor }}
      >
        {brand.abbr}
      </div>
    );
  }

  const typeIcons: Record<string, string> = { bank: 'Landmark', credit_card: 'CreditCard', wallet: 'Wallet' };
  const iconName = typeIcons[account.type] || 'Wallet';

  return (
    <div
      className="w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 shadow-lg"
      style={{ background: account.color }}
    >
      <AppIcon name={iconName} size={20} className="text-white" />
    </div>
  );
}

export function AccountCard({ account, onClick }: AccountCardProps) {
  const isNegative = account.balance < 0;
  const isWallet = account.type === 'wallet';
  const brand = isWallet ? WALLET_BRAND : matchBankBrand(account.name);
  const brandColor = brand?.bgColor || account.color;

  const typeLabel = account.type === 'wallet' ? 'Carteira' : account.type === 'bank' ? 'Banco' : 'Cartão';

  return (
    <button
      onClick={onClick}
      className={cn(
        "flex items-center gap-3.5 p-3.5 rounded-2xl w-full text-left relative overflow-hidden transition-all duration-200",
        "bg-card border border-border/40 hover:border-border/70",
        onClick && "hover:shadow-lg cursor-pointer active:scale-[0.98]"
      )}
    >
      {/* Subtle brand accent on left edge */}
      <div
        className="absolute left-0 top-3 bottom-3 w-[3px] rounded-full"
        style={{ background: brandColor }}
      />

      <BankAvatar account={account} />

      <div className="flex-1 min-w-0 pl-0.5">
        <p className="font-semibold text-sm truncate text-foreground font-display" style={{ letterSpacing: '-0.01em' }}>
          {account.name}
        </p>
        <p className="text-[11px] text-muted-foreground mt-0.5">{typeLabel}</p>
      </div>

      <div className="text-right shrink-0">
        <p className={cn(
          "font-bold text-sm tabular-nums",
          isNegative ? "text-destructive" : "text-foreground"
        )}>
          {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(account.balance)}
        </p>
      </div>

      {onClick && (
        <AppIcon name="ChevronRight" size={16} className="text-muted-foreground/50 shrink-0" />
      )}
    </button>
  );
}
