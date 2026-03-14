import { useNavigate } from 'react-router-dom';
import { useUnit } from '@/contexts/UnitContext';
import { useAuth } from '@/contexts/AuthContext';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { AppIcon } from '@/components/ui/app-icon';
import gardenLogo from '@/assets/logo.png';
import type { DashboardStats } from '@/hooks/useDashboardStats';

interface DashboardContextBarProps {
  firstName: string;
  stats: DashboardStats;
}

export function DashboardContextBar({ firstName, stats }: DashboardContextBarProps) {
  const { isAdmin, isSuperAdmin } = useAuth();
  const navigate = useNavigate();
  const { activeUnit } = useUnit();

  const greeting = (() => {
    const h = new Date().getHours();
    if (h < 12) return 'Bom dia';
    if (h < 18) return 'Boa tarde';
    return 'Boa noite';
  })();

  const todayFormatted = format(new Date(), "EEEE, d 'de' MMMM", { locale: ptBR });
  const capitalizedDate = todayFormatted.charAt(0).toUpperCase() + todayFormatted.slice(1);

  return (
    <div
      className="relative -mx-4 lg:-mx-8 lg:-mt-6 px-5 pb-8 lg:px-8 lg:pt-10 lg:pb-10 overflow-hidden rounded-b-3xl"
      style={{
        marginTop: 'calc(-1 * (env(safe-area-inset-top, 0px) + 3rem + 1.25rem))',
        paddingTop: 'calc(env(safe-area-inset-top, 0px) + 3rem + 1.75rem)',
        background: `
          radial-gradient(circle 400px at 85% -15%, hsl(var(--primary) / 0.6) 0%, transparent 100%),
          radial-gradient(circle 300px at 15% 40%, hsl(var(--primary) / 0.3) 0%, transparent 100%),
          radial-gradient(circle 500px at 60% 60%, hsl(var(--primary) / 0.08) 0%, transparent 100%),
          linear-gradient(175deg, hsl(var(--primary) / 0.22) 0%, hsl(var(--background)) 65%)
        `,
      }}
    >
      {/* Top row: logo + greeting + edit button */}
      <div className="flex items-center gap-3.5 mb-5">
        <img
          src={gardenLogo}
          alt="Garden"
          className="w-12 h-12 rounded-full object-contain bg-primary/10 p-0.5"
        />
        <div className="flex-1">
          <p className="text-xs text-muted-foreground font-medium">{greeting},</p>
          <p className="text-base font-bold text-foreground tracking-tight">{firstName}</p>
        </div>
        {(isAdmin || isSuperAdmin) && (
          <button
            onClick={() => navigate('/settings?tab=appearance')}
            className="w-9 h-9 rounded-xl bg-foreground/10 backdrop-blur-sm flex items-center justify-center hover:bg-foreground/20 active:scale-95 transition-all"
            title="Editar empresa"
          >
            <AppIcon name="Pencil" size={16} className="text-foreground/70" />
          </button>
        )}
      </div>

      {/* Hero text — Spotify style */}
      <h1 className="font-display leading-[1.1] tracking-[-0.03em]">
        <span className="text-[28px] lg:text-[36px] font-extrabold text-foreground">
          Bem-vindo ao{' '}
        </span>
        <span className="text-[28px] lg:text-[36px] font-extrabold text-primary">
          Garden
        </span>
        <br />
        <span className="text-[28px] lg:text-[36px] font-extrabold text-foreground">
          {activeUnit?.name || 'Gestão'}
        </span>
      </h1>

      <p className="text-xs text-muted-foreground mt-3 font-medium">
        {capitalizedDate}
      </p>
    </div>
  );
}
