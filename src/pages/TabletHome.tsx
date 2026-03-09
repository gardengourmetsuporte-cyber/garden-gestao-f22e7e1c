import { useMemo } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { AppIcon } from '@/components/ui/app-icon';
import { formatCurrency } from '@/lib/format';
import gardenLogo from '@/assets/logo.png';

interface StoreInfo {
  logo_url?: string;
  banner_url?: string;
  name?: string;
}

interface RodizioSettings {
  is_active: boolean;
  price: number;
  description: string;
  time_limit_minutes: number;
}

export default function TabletHome() {
  const { unitId } = useParams<{ unitId: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const mesa = searchParams.get('mesa') || '1';

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['tablet-home', unitId],
    queryFn: async () => {
      if (!unitId) return { unit: null, rodizio: null as RodizioSettings | null };

      const withTimeout = <T,>(promise: Promise<T>, ms = 12000) =>
        Promise.race<T>([
          promise,
          new Promise<T>((_, reject) => setTimeout(() => reject(new Error('Timeout ao carregar página')), ms)),
        ]);

      const [unitRes, rodizioRes] = await withTimeout(Promise.all([
        supabase.from('units').select('name, store_info').eq('id', unitId).single(),
        supabase
          .from('rodizio_settings')
          .select('is_active, price, description, time_limit_minutes')
          .eq('unit_id', unitId)
          .eq('is_active', true)
          .maybeSingle(),
      ]));

      if (unitRes.error) throw unitRes.error;
      if (rodizioRes.error) throw rodizioRes.error;

      return {
        unit: (unitRes.data as { name: string; store_info: StoreInfo | null }) ?? null,
        rodizio: (rodizioRes.data as RodizioSettings | null) ?? null,
      };
    },
    enabled: !!unitId,
    staleTime: 3 * 60 * 1000,
    gcTime: 15 * 60 * 1000,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    retry: 1,
  });

  const unit = data?.unit ?? null;
  const rodizio = data?.rodizio ?? null;

  const menuItems = useMemo(() => {
    return [
      {
        id: 'cardapio',
        icon: 'Restaurant',
        label: 'Cardápio',
        subtitle: 'Veja nosso menu completo',
        color: 'hsl(var(--primary))',
        bgColor: 'hsl(var(--primary) / 0.1)',
        onClick: () => navigate(`/tablet/${unitId}/menu?mesa=${mesa}`),
      },
      ...(rodizio?.is_active ? [{
        id: 'rodizio',
        icon: 'AllInclusive',
        label: 'Rodízio',
        subtitle: `${formatCurrency(rodizio.price)} • ${rodizio.time_limit_minutes}min`,
        color: 'hsl(45 100% 50%)',
        bgColor: 'hsl(45 100% 50% / 0.1)',
        onClick: () => navigate(`/tablet/${unitId}/rodizio?mesa=${mesa}`),
      }] : []),
      {
        id: 'mural',
        icon: 'Newspaper',
        label: 'Mural da Casa',
        subtitle: 'Novidades e avisos',
        color: 'hsl(var(--accent-foreground))',
        bgColor: 'hsl(var(--accent) / 0.5)',
        onClick: () => {},
      },
      {
        id: 'avalie',
        icon: 'Star',
        label: 'Avalie o Local',
        subtitle: 'Deixe sua avaliação',
        color: 'hsl(45 100% 50%)',
        bgColor: 'hsl(45 100% 50% / 0.1)',
        onClick: () => {},
      },
      {
        id: 'jogos',
        icon: 'Gamepad2',
        label: 'Jogos',
        subtitle: 'Divirta-se enquanto espera',
        color: 'hsl(280 80% 60%)',
        bgColor: 'hsl(280 80% 60% / 0.1)',
        onClick: () => {},
      },
      {
        id: 'conta',
        icon: 'User',
        label: 'Minha Conta',
        subtitle: 'Seus dados e pedidos',
        color: 'hsl(var(--muted-foreground))',
        bgColor: 'hsl(var(--secondary))',
        onClick: () => {},
      },
    ];
  }, [mesa, navigate, rodizio, unitId]);

  if (isLoading) {
    return (
      <div className="min-h-[100dvh] bg-background flex flex-col items-center justify-center gap-5">
        <div className="w-20 h-20 rounded-2xl bg-white shadow-lg flex items-center justify-center p-3 animate-pulse" style={{ animationDuration: '2s' }}>
          <img src={gardenLogo} alt="Garden" className="w-full h-full object-contain" />
        </div>
        <p className="text-sm font-semibold text-foreground">Carregando...</p>
      </div>
    );
  }

  const logoUrl = unit?.store_info?.logo_url;

  return (
    <div className="min-h-[100dvh] bg-background flex flex-col">
      <header className="flex flex-col items-center pt-10 pb-6 px-6">
        <div className="w-24 h-24 rounded-3xl overflow-hidden border-2 border-border/30 bg-white flex items-center justify-center shadow-lg mb-4">
          {logoUrl ? (
            <img src={logoUrl} alt={unit?.name} className="w-full h-full object-cover" />
          ) : (
            <img src={gardenLogo} alt="Garden" className="w-16 h-16 object-contain" />
          )}
        </div>
        <h1 className="text-2xl font-bold text-foreground">{unit?.name || 'Bem-vindo'}</h1>
        <p className="text-sm text-muted-foreground mt-1">Mesa {mesa}</p>
      </header>

      <main className="flex-1 px-6 pb-10">
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 max-w-2xl mx-auto">
          {menuItems.map(item => (
            <button
              key={item.id}
              onClick={item.onClick}
              className="flex flex-col items-center gap-3 p-6 rounded-3xl bg-card border border-border/30 hover:border-primary/30 active:scale-[0.97] transition-all shadow-sm"
            >
              <div
                className="w-16 h-16 rounded-2xl flex items-center justify-center"
                style={{ backgroundColor: item.bgColor }}
              >
                <AppIcon name={item.icon} size={28} style={{ color: item.color }} />
              </div>
              <div className="text-center">
                <p className="text-sm font-bold text-foreground">{item.label}</p>
                <p className="text-[11px] text-muted-foreground mt-0.5 leading-tight">{item.subtitle}</p>
              </div>
            </button>
          ))}
        </div>
      </main>
    </div>
  );
}

