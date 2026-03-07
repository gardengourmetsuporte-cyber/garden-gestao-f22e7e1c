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
  const brand = isWallet ? WALLET_BRAND : matchBankBrand(account.name);

  if (brand) {
    return (
      <div className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-xs shrink-0 bg-white/20 backdrop-blur-sm text-white">
        {brand.abbr}
      </div>
    );
  }

  const typeIcons: Record<string, string> = { bank: 'Landmark', credit_card: 'CreditCard', wallet: 'Wallet' };
  const iconName = typeIcons[account.type] || 'Wallet';

  return (
    <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 bg-white/20 backdrop-blur-sm">
      <AppIcon name={iconName} size={20} className="text-white" />
    </div>
  );
}

export function AccountCard({ account, onClick }: AccountCardProps) {
  const isNegative = account.balance < 0;
  const isWallet = account.type === 'wallet';
  const brand = isWallet ? WALLET_BRAND : matchBankBrand(account.name);
  const brandColor = brand?.bgColor || account.color;

  return (
    <button
      onClick={onClick}
      className={cn(
        "flex items-center gap-3 p-3 rounded-xl border border-white/[0.06] transition-all duration-200 w-full text-left relative overflow-hidden",
        onClick && "hover:brightness-110 cursor-pointer active:scale-[0.98]"
      )}
      style={{
        background: brandColor,
      }}
    >
      <BankAvatar account={account} />
      <div className="flex-1 min-w-0 relative z-10">
        <p className="font-semibold truncate font-display text-white" style={{ letterSpacing: '-0.01em' }}>{account.name}</p>
        <p className="text-xs text-white/70 capitalize">{account.type === 'wallet' ? 'Carteira' : account.type === 'bank' ? 'Banco' : 'Cartão'}</p>
      </div>
      <p className={cn(
        "font-semibold tabular-nums relative z-10",
        isNegative ? "text-red-200" : "text-white"
      )}>
        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(account.balance)}
      </p>
      {onClick && <AppIcon name="ChevronRight" size={16} className="text-white/70 shrink-0 relative z-10" />}
    </button>
  );
}
