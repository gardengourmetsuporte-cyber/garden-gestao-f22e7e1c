import { DMUnit } from '@/hooks/useDigitalMenu';
import { AppIcon } from '@/components/ui/app-icon';

interface Props {
  unit: DMUnit | null;
}

export function MenuLanding({ unit }: Props) {
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
      <div className="h-44 w-full overflow-hidden relative">
        {bannerUrl ? (
          <img src={bannerUrl} alt="Banner" className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-primary/30 via-primary/10 to-background" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent" />
      </div>

      {/* Logo + Info */}
      <div className="px-4 -mt-14 relative z-10">
        <div className="flex items-end gap-3">
          <div className="w-24 h-24 rounded-2xl bg-card border-[3px] border-background shadow-xl overflow-hidden flex items-center justify-center shrink-0">
            {logoUrl ? (
              <img src={logoUrl} alt={unit.name} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full bg-secondary flex items-center justify-center">
                <AppIcon name="Store" size={36} className="text-muted-foreground" />
              </div>
            )}
          </div>
          <div className="pb-1 min-w-0">
            <h1 className="text-xl font-bold text-foreground truncate">{unit.name}</h1>
            {cuisineType && (
              <p className="text-xs text-muted-foreground mt-0.5">{cuisineType}</p>
            )}
          </div>
        </div>

        {/* Status + Meta */}
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold ${
            isOpen
              ? 'bg-[hsl(var(--neon-green)/0.12)] text-[hsl(var(--neon-green))]'
              : 'bg-destructive/12 text-destructive'
          }`}>
            <span className={`w-2 h-2 rounded-full ${isOpen ? 'bg-[hsl(var(--neon-green))] animate-pulse' : 'bg-destructive'}`} />
            {isOpen ? 'Aberto agora' : 'Fechado'}
          </div>

          {currentHours && (
            <span className="text-[11px] text-muted-foreground flex items-center gap-1">
              <AppIcon name="Clock" size={12} />
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
            <AppIcon name="MapPin" size={12} className="shrink-0" />
            {[address, city].filter(Boolean).join(' • ')}
          </p>
        )}
      </div>
    </div>
  );
}
