import { DMUnit } from '@/hooks/useDigitalMenu';
import { AppIcon } from '@/components/ui/app-icon';

interface Props {
  unit: DMUnit | null;
}

export function MenuLanding({ unit }: Props) {
  if (!unit) return null;

  const info = unit.store_info;
  const logoUrl = info?.logo_url;
  const cuisineType = info?.cuisine_type;
  const city = info?.city;

  // Simple open/closed check
  const isOpen = (() => {
    if (!info?.opening_hours?.length) return true; // default open if no hours set
    const now = new Date();
    const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    return info.opening_hours.some(h => currentTime >= h.open && currentTime <= h.close);
  })();

  return (
    <div className="relative">
      {/* Cover gradient */}
      <div className="h-32 bg-gradient-to-b from-primary/20 to-background" />

      {/* Unit info */}
      <div className="px-4 -mt-12 flex flex-col items-center text-center">
        <div className="w-20 h-20 rounded-2xl bg-card border-4 border-background shadow-lg overflow-hidden flex items-center justify-center">
          {logoUrl ? (
            <img src={logoUrl} alt={unit.name} className="w-full h-full object-cover" />
          ) : (
            <AppIcon name="Store" size={32} className="text-muted-foreground" />
          )}
        </div>

        <h1 className="text-xl font-bold text-foreground mt-3">{unit.name}</h1>

        <div className="flex items-center gap-2 mt-1.5">
          {cuisineType && (
            <span className="text-xs text-muted-foreground">{cuisineType}</span>
          )}
          {cuisineType && city && <span className="text-muted-foreground/40">•</span>}
          {city && (
            <span className="text-xs text-muted-foreground">{city}</span>
          )}
        </div>

        <div className={`mt-2 inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${
          isOpen 
            ? 'bg-success/15 text-[hsl(var(--success))]' 
            : 'bg-destructive/15 text-destructive'
        }`}>
          <span className={`w-2 h-2 rounded-full ${isOpen ? 'bg-[hsl(var(--success))]' : 'bg-destructive'}`} />
          {isOpen ? 'Aberto agora' : 'Fechado'}
        </div>
      </div>
    </div>
  );
}
