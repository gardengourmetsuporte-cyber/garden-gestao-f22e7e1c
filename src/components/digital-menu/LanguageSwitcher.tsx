import { useState } from 'react';
import { MenuLocale, getMenuLocale, setMenuLocale, LOCALE_LABELS } from '@/lib/i18n';
import { Globe } from 'lucide-react';

interface Props {
  onChange?: () => void;
}

export function LanguageSwitcher({ onChange }: Props) {
  const [locale, setLocale] = useState<MenuLocale>(getMenuLocale());
  const [open, setOpen] = useState(false);

  const handleSelect = (l: MenuLocale) => {
    setMenuLocale(l);
    setLocale(l);
    setOpen(false);
    onChange?.();
  };

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-card/90 backdrop-blur-sm text-foreground text-xs font-medium border border-border/50 shadow-sm hover:bg-card transition-colors"
      >
        <Globe className="w-3.5 h-3.5" />
        {LOCALE_LABELS[locale]}
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-1 bg-white rounded-lg shadow-lg border z-50 overflow-hidden min-w-[80px]">
          {(Object.keys(LOCALE_LABELS) as MenuLocale[]).map((l) => (
            <button
              key={l}
              onClick={() => handleSelect(l)}
              className={`block w-full text-left px-3 py-2 text-sm hover:bg-muted transition-colors ${
                l === locale ? 'bg-primary/10 font-semibold text-primary' : 'text-foreground'
              }`}
            >
              {LOCALE_LABELS[l]}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
