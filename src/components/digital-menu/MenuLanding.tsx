import { DMUnit } from '@/hooks/useDigitalMenu';
import { AppIcon } from '@/components/ui/app-icon';
import gardenLogo from '@/assets/logo.png';

interface Props {
  unit: DMUnit | null;
  unitInitials?: string;
}

export function MenuLanding({ unit, unitInitials = '?' }: Props) {
  if (!unit) return null;

  const info = unit.store_info;
  const logoUrl = info?.logo_url;
  const bannerUrl = info?.banner_url;
  const cuisineType = info?.cuisine_type;
  const city = info?.city;
  const address = info?.address;
  const deliveryTime = info?.delivery_time;

  const isOpen = (() => {
    if (!info?.opening_hours?.length) return true;
    const now = new Date();
    const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    return info.opening_hours.some(h => currentTime >= h.open && currentTime <= h.close);
  })();

  const currentHours = info?.opening_hours?.length
    ? info.opening_hours.map(h => `${h.open} – ${h.close}`).join(' | ')
    : null;

  return (
    <div className="relative">
      {/* Banner */}
      <div className="h-44 md:h-56 w-full overflow-hidden relative">
        {bannerUrl ? (
          <img src={bannerUrl} alt="Banner" className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full" style={{
            background: 'linear-gradient(180deg, hsl(var(--primary) / 0.18) 0%, hsl(var(--primary) / 0.06) 50%, hsl(var(--background)) 100%)',
          }} />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent" />
      </div>

      {/* Logo + Info */}
      <div className="px-5 md:px-8 -mt-14 relative z-10">
        <div className="flex items-end gap-4">
          {/* Logo container */}
          <div className="w-[88px] h-[88px] md:w-24 md:h-24 rounded-2xl bg-card border-[3px] border-background shadow-xl overflow-hidden flex items-center justify-center shrink-0">
            {logoUrl ? (
              <img src={logoUrl} alt={unit.name} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full bg-white flex items-center justify-center p-2.5">
                <img src={gardenLogo} alt="Garden" className="w-full h-full object-contain" />
              </div>
            )}
          </div>
          <div className="pb-1.5 min-w-0">
            <h1 className="text-lg md:text-2xl font-bold text-foreground leading-tight">{unit.name}</h1>
            {cuisineType && (
              <p className="text-xs text-muted-foreground mt-0.5">{cuisineType}</p>
            )}
          </div>
        </div>

        {/* Status + Meta */}
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold ${
            isOpen
              ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
              : 'bg-destructive/10 text-destructive'
          }`}>
            <span className={`w-2 h-2 rounded-full ${isOpen ? 'bg-emerald-500 animate-pulse' : 'bg-destructive'}`} />
            {isOpen ? 'Aberto agora' : 'Fechado'}
          </div>

          {currentHours && (
            <span className="text-[11px] text-muted-foreground flex items-center gap-1">
              <AppIcon name="Schedule" size={12} />
              {currentHours}
            </span>
          )}

          {deliveryTime && (
            <span className="text-[11px] text-muted-foreground flex items-center gap-1">
              <AppIcon name="Timer" size={12} />
              {deliveryTime}
            </span>
          )}
        </div>

        {/* Address */}
        {(city || address) && (
          <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
            <AppIcon name="LocationOn" size={13} className="shrink-0" />
            {[address, city].filter(Boolean).join(' • ')}
          </p>
        )}
      </div>
    </div>
  );
}
