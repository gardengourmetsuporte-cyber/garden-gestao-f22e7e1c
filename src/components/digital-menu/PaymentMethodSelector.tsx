import { AppIcon } from '@/components/ui/app-icon';
import type { PaymentBillingType } from './OnlinePaymentSheet';

type PaymentOption = 'presencial' | 'pix' | 'credit_card' | 'boleto';

interface Props {
  selected: PaymentOption;
  onChange: (option: PaymentOption) => void;
  asaasActive: boolean;
}

const options: { key: PaymentOption; label: string; icon: string; description: string; requiresAsaas: boolean }[] = [
  { key: 'presencial', label: 'Pagar na hora', icon: 'Banknote', description: 'Pague no local ao receber', requiresAsaas: false },
  { key: 'pix', label: 'Pix', icon: 'QrCode', description: 'Pagamento instantâneo', requiresAsaas: true },
  { key: 'credit_card', label: 'Cartão de Crédito', icon: 'CreditCard', description: 'Pague online com cartão', requiresAsaas: true },
  { key: 'boleto', label: 'Boleto', icon: 'FileText', description: 'Vencimento em 3 dias', requiresAsaas: true },
];

export function PaymentMethodSelector({ selected, onChange, asaasActive }: Props) {
  const visibleOptions = asaasActive ? options : options.filter(o => !o.requiresAsaas);

  return (
    <div className="space-y-2">
      <h3 className="text-sm font-bold text-foreground">Forma de pagamento</h3>
      <div className="space-y-1.5">
        {visibleOptions.map(opt => {
          const isSelected = selected === opt.key;
          return (
            <button
              key={opt.key}
              onClick={() => onChange(opt.key)}
              className={`w-full flex items-center gap-3 p-3 rounded-xl border transition-all active:scale-[0.98] text-left ${
                isSelected ? 'border-primary bg-primary/5' : 'border-border/40'
              }`}
            >
              <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
                isSelected ? 'bg-primary/10' : 'bg-muted'
              }`}>
                <AppIcon name={opt.icon as any} size={18} className={isSelected ? 'text-primary' : 'text-muted-foreground'} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-foreground">{opt.label}</p>
                <p className="text-[11px] text-muted-foreground">{opt.description}</p>
              </div>
              <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${
                isSelected ? 'border-primary bg-primary' : 'border-muted-foreground/30'
              }`}>
                {isSelected && <div className="w-2 h-2 rounded-full bg-primary-foreground" />}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function paymentOptionToBillingType(option: PaymentOption): PaymentBillingType | null {
  switch (option) {
    case 'pix': return 'PIX';
    case 'credit_card': return 'CREDIT_CARD';
    case 'boleto': return 'BOLETO';
    default: return null;
  }
}
