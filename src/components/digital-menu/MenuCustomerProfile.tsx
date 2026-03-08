import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { AppIcon } from '@/components/ui/app-icon';
import { toast } from 'sonner';
import gardenLogo from '@/assets/logo.png';

interface Props {
  unitName?: string;
  logoUrl?: string;
  defaultName?: string;
  defaultEmail?: string;
  onComplete: (data: { name: string; phone: string; birthday: string | null }) => Promise<void> | void;
  onBack?: () => void;
}

export function MenuCustomerProfile({ unitName, logoUrl, defaultName, defaultEmail, onComplete, onBack }: Props) {
  const [name, setName] = useState(defaultName || '');
  const [phone, setPhone] = useState('');
  const [birthday, setBirthday] = useState('');
  const [saving, setSaving] = useState(false);

  const formatPhone = (val: string) => {
    const digits = val.replace(/\D/g, '').slice(0, 11);
    if (digits.length <= 2) return digits;
    if (digits.length <= 7) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
  };

  const formatBirthday = (val: string) => {
    const digits = val.replace(/\D/g, '').slice(0, 8);
    if (digits.length <= 2) return digits;
    if (digits.length <= 4) return `${digits.slice(0, 2)}/${digits.slice(2)}`;
    return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`;
  };

  const handleSubmit = async () => {
    if (!name.trim()) { toast.error('Informe seu nome'); return; }
    const phoneDigits = phone.replace(/\D/g, '');
    if (phoneDigits.length < 10) { toast.error('Informe um celular válido'); return; }

    let birthdayISO: string | null = null;
    if (birthday) {
      const parts = birthday.split('/');
      if (parts.length === 3 && parts[2].length === 4) {
        birthdayISO = `${parts[2]}-${parts[1]}-${parts[0]}`;
      }
    }

    setSaving(true);
    try {
      await onComplete({ name: name.trim(), phone: phoneDigits, birthday: birthdayISO });
    } catch {
      // error handled by parent
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center animate-in fade-in duration-200">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onBack} />

      {/* Sheet */}
      <div className="relative w-full max-w-md bg-background rounded-t-3xl sm:rounded-3xl shadow-2xl border border-border/40 animate-in slide-in-from-bottom-8 duration-300 max-h-[90dvh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center h-14 border-b border-border/20 shrink-0 px-4">
          {onBack && (
            <button onClick={onBack} className="w-9 h-9 flex items-center justify-center -ml-2">
              <AppIcon name="ArrowLeft" size={22} className="text-foreground" />
            </button>
          )}
          <div className="flex-1 flex justify-center pr-9">
            <div className="w-12 h-12 -mb-3 rounded-xl overflow-hidden border border-border/30 bg-card flex items-center justify-center p-1.5 shadow-sm">
              {logoUrl ? (
                <img src={logoUrl} alt={unitName || 'Logo'} className="w-full h-full object-contain" />
              ) : (
                <img src={gardenLogo} alt="Garden" className="w-full h-full object-contain" />
              )}
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="px-6 pt-8 pb-8">
          <div className="w-full max-w-md mx-auto">
            <h2 className="text-xl font-bold text-foreground text-center mb-2">
              Complete seu cadastro
            </h2>
            <p className="text-sm text-muted-foreground text-center mb-6 leading-relaxed">
              Estes dados nos ajudam a personalizar sua experiência.
            </p>

            <div className="space-y-5">
              {/* Name */}
              <div>
                <label className="block text-sm font-semibold text-foreground mb-2">
                  Nome e sobrenome
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="Seu nome completo"
                  className="w-full h-12 px-4 rounded-lg border border-border bg-background text-foreground placeholder-muted-foreground text-base focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors"
                />
              </div>

              {/* Birthday */}
              <div>
                <label className="block text-sm font-semibold text-foreground mb-2">
                  Data de nascimento <span className="font-normal text-muted-foreground">(Opcional)</span>
                </label>
                <input
                  type="text"
                  value={birthday}
                  onChange={e => setBirthday(formatBirthday(e.target.value))}
                  placeholder="__/__/____"
                  inputMode="numeric"
                  className="w-full h-12 px-4 rounded-lg border border-border bg-background text-foreground placeholder-muted-foreground text-base focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors"
                />
              </div>

              {/* Phone */}
              <div>
                <label className="block text-sm font-semibold text-foreground mb-2">
                  Número do seu celular
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={e => setPhone(formatPhone(e.target.value))}
                  placeholder="(00) 00000-0000"
                  inputMode="tel"
                  className="w-full h-12 px-4 rounded-lg border border-border bg-background text-foreground placeholder-muted-foreground text-base focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors"
                />
                <p className="text-xs text-muted-foreground mt-1.5">
                  Usaremos para te atualizar sobre o status do seu pedido.
                </p>
              </div>
            </div>

            {/* Terms */}
            <p className="text-xs text-muted-foreground mt-5 leading-relaxed">
              Ao prosseguir, você concorda com os Termos de Serviço e Política de Uso de Dados.
            </p>

            {/* Submit */}
            <Button
              className="w-full h-14 mt-4 rounded-xl text-base font-semibold"
              onClick={handleSubmit}
              disabled={saving}
            >
              {saving ? (
                <AppIcon name="Loader2" size={20} className="animate-spin mr-2" />
              ) : null}
              Continuar
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
