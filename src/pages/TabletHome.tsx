import { useState, useMemo, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { AppIcon } from '@/components/ui/app-icon';
import { formatCurrency } from '@/lib/format';
import { MenuLoadingScreen } from '@/components/digital-menu/MenuLoadingScreen';
import { SnakeGame } from '@/components/games/SnakeGame';
import { MemoryGame } from '@/components/games/MemoryGame';
import gardenLogo from '@/assets/logo.png';
import tabletHero from '@/assets/tablet-hero.jpg';

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

const TABLET_MESA_KEY = 'tablet_mesa_config';
const TABLET_PIN_KEY = 'tablet_admin_pin';
const TABLET_UNIT_KEY = 'tablet_unit_id';

function getStoredMesa(): string | null {
  try { return localStorage.getItem(TABLET_MESA_KEY); } catch { return null; }
}
function setStoredMesa(mesa: string) {
  try { localStorage.setItem(TABLET_MESA_KEY, mesa); } catch {}
}
function getStoredPin(): string | null {
  try { return localStorage.getItem(TABLET_PIN_KEY); } catch { return null; }
}
function setStoredPin(pin: string) {
  try { localStorage.setItem(TABLET_PIN_KEY, pin); } catch {}
}

// ─── Table Config Dialog ───
function TableConfigDialog({
  currentMesa,
  onConfirm,
  onCancel,
  requirePin,
}: {
  currentMesa: string;
  onConfirm: (mesa: string, pin: string) => void;
  onCancel?: () => void;
  requirePin: boolean;
}) {
  const [mesa, setMesa] = useState(currentMesa);
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');

  const handleConfirm = () => {
    if (!mesa || Number(mesa) < 1) { setError('Informe o número da mesa'); return; }
    if (requirePin) {
      const stored = getStoredPin();
      if (stored && pin !== stored) { setError('Senha incorreta'); return; }
    }
    if (pin && pin.length >= 4) setStoredPin(pin);
    onConfirm(mesa, pin);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="bg-card rounded-3xl shadow-2xl border border-border/30 w-full max-w-md mx-6 p-8 animate-in zoom-in-95 fade-in duration-200">
        <h2 className="text-xl font-bold text-foreground text-center mb-6">Configurar Mesa</h2>

        <div className="grid grid-cols-2 gap-4 mb-6">
          <div>
            <label className="text-xs font-semibold text-muted-foreground mb-1.5 block">Número da Mesa</label>
            <input
              type="number"
              min={1}
              value={mesa}
              onChange={e => { setMesa(e.target.value); setError(''); }}
              className="w-full h-12 rounded-xl bg-secondary/50 border border-border/40 px-4 text-lg font-bold text-foreground text-center focus:outline-none focus:ring-2 focus:ring-primary/50"
              autoFocus
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-muted-foreground mb-1.5 block">
              {requirePin ? 'Senha de admin' : 'Criar senha (4+ dígitos)'}
            </label>
            <input
              type="password"
              inputMode="numeric"
              maxLength={8}
              value={pin}
              onChange={e => { setPin(e.target.value); setError(''); }}
              placeholder={requirePin ? '••••' : 'Opcional'}
              className="w-full h-12 rounded-xl bg-secondary/50 border border-border/40 px-4 text-lg font-bold text-foreground text-center focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
          </div>
        </div>

        {error && (
          <p className="text-xs text-destructive text-center mb-4 font-medium">{error}</p>
        )}

        <div className="flex gap-3">
          {onCancel && (
            <button
              onClick={onCancel}
              className="flex-1 h-12 rounded-xl border border-border/40 text-foreground font-semibold text-sm hover:bg-secondary/50 transition-colors"
            >
              Cancelar
            </button>
          )}
          <button
            onClick={handleConfirm}
            className="flex-1 h-12 rounded-xl bg-primary text-primary-foreground font-bold text-sm hover:bg-primary/90 transition-colors"
          >
            Confirmar
          </button>
        </div>
      </div>
    </div>
  );
}

export default function TabletHome() {
  const { unitId } = useParams<{ unitId: string }>();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const mesaParam = searchParams.get('mesa');
  const storedMesa = getStoredMesa();
  const hasPin = !!getStoredPin();

  // Determine initial mesa: URL param → stored → null (show config)
  const initialMesa = mesaParam || storedMesa || null;
  const [mesa, setMesa] = useState<string | null>(initialMesa);
  const [showConfig, setShowConfig] = useState(!initialMesa);
  const [activeGame, setActiveGame] = useState<string | null>(null);

  // Persist mesa and unitId on first load
  useEffect(() => {
    if (unitId) {
      try { localStorage.setItem(TABLET_UNIT_KEY, unitId); } catch {}
    }
    if (mesaParam && !storedMesa) {
      setStoredMesa(mesaParam);
      setMesa(mesaParam);
    }
  }, [mesaParam, storedMesa]);

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
        Promise.resolve(supabase.from('units').select('name, store_info').eq('id', unitId).single()),
        Promise.resolve(supabase
          .from('rodizio_settings')
          .select('is_active, price, description, time_limit_minutes')
          .eq('unit_id', unitId)
          .eq('is_active', true)
          .maybeSingle()),
      ]));

      if (unitRes.error) throw unitRes.error;
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
    if (!mesa) return [];
    return [
      ...(rodizio?.is_active ? [{
        id: 'rodizio',
        icon: 'AllInclusive',
        label: 'Rodízio',
        subtitle: `${formatCurrency(rodizio.price)} • ${rodizio.time_limit_minutes}min`,
        onClick: () => navigate(`/tablet/${unitId}/rodizio?mesa=${mesa}`),
      }] : []),
      {
        id: 'cardapio',
        icon: 'Restaurant',
        label: 'Cardápio',
        subtitle: 'Menu completo',
        onClick: () => navigate(`/tablet/${unitId}/menu?mesa=${mesa}`),
      },
      {
        id: 'jogos',
        icon: 'SportsEsports',
        label: 'Jogos',
        subtitle: 'Diversão na mesa',
        onClick: () => setActiveGame('select'),
      },
      {
        id: 'mural',
        icon: 'Newspaper',
        label: 'Mural da Casa',
        subtitle: 'Novidades e avisos',
        onClick: () => {},
      },
      {
        id: 'avalie',
        icon: 'Star',
        label: 'Avalie o Local',
        subtitle: 'Deixe sua opinião',
        onClick: () => {},
      },
    ];
  }, [mesa, navigate, rodizio, unitId]);

  const handleConfigConfirm = (newMesa: string) => {
    setStoredMesa(newMesa);
    setMesa(newMesa);
    setShowConfig(false);
    // Update URL without reload
    setSearchParams({ mesa: newMesa }, { replace: true });
  };

  // ─── Loading ───
  if (isLoading) {
    return <MenuLoadingScreen message="Carregando..." />;
  }

  // ─── Error ───
  if (isError) {
    return (
      <div className="h-[100dvh] bg-background flex flex-col items-center justify-center gap-4 px-6 text-center">
        <AppIcon name="WifiOff" size={34} className="text-destructive" />
        <div>
          <p className="text-base font-bold text-foreground">Falha ao abrir o tablet</p>
          <p className="text-sm text-muted-foreground mt-1">{(error as Error)?.message || 'Erro de conexão'}</p>
        </div>
        <button onClick={() => refetch()} className="h-10 px-4 rounded-xl bg-primary text-primary-foreground text-sm font-semibold">
          Tentar novamente
        </button>
      </div>
    );
  }

  const logoUrl = unit?.store_info?.logo_url;
  const bannerUrl = unit?.store_info?.banner_url;

  // ─── Active Game ───
  if (activeGame === 'snake') {
    return <SnakeGame onBack={() => setActiveGame(null)} />;
  }
  if (activeGame === 'memory') {
    return <MemoryGame onBack={() => setActiveGame(null)} />;
  }

  // ─── Game Selection View ───
  const GAMES = [
    {
      id: 'snake',
      emoji: '🐍',
      title: 'Snake Garden',
      description: 'Coma lanches e fique enorme!',
      gradient: 'from-emerald-600/25 to-emerald-900/40',
      border: 'border-emerald-500/30',
      shadow: 'shadow-emerald-500/10',
    },
    {
      id: 'memory',
      emoji: '🧠',
      title: 'Memory Garden',
      description: 'Encontre os pares de lanches!',
      gradient: 'from-amber-600/25 to-amber-900/40',
      border: 'border-amber-500/30',
      shadow: 'shadow-amber-500/10',
    },
  ];

  return (
    <div className="fixed inset-0 bg-black overflow-hidden select-none flex">
      {/* ─── Left Sidebar ─── */}
      <aside className="relative z-20 w-[340px] md:w-[400px] lg:w-[420px] h-full flex flex-col bg-background/95 backdrop-blur-xl border-r border-border/20">
        {/* Mesa badge - top */}
        <div className="px-6 pt-[max(env(safe-area-inset-top,12px),16px)] pb-3 flex justify-center">
          <button
            onClick={() => setShowConfig(true)}
            className="flex items-center gap-2 px-5 py-2 rounded-full border border-border/40 bg-card/60 backdrop-blur-sm hover:bg-card transition-colors"
          >
            <AppIcon name="TableBar" size={15} className="text-primary" />
            <span className="text-sm font-bold text-foreground">Mesa {mesa || '?'}</span>
            <AppIcon name="ChevronDown" size={13} className="text-muted-foreground" />
          </button>
        </div>

        {/* Logo & Brand */}
        <div className="flex flex-col items-center px-6 pt-2 pb-3">
          <div className="w-16 h-16 md:w-18 md:h-18 rounded-full overflow-hidden border-2 border-primary/20 bg-white shadow-lg flex items-center justify-center shrink-0">
            {logoUrl ? (
              <img src={logoUrl} alt={unit?.name} className="w-full h-full object-cover" />
            ) : (
              <img src={gardenLogo} alt="Garden" className="w-full h-full object-contain p-2" />
            )}
          </div>
          <h1 className="text-base md:text-lg font-bold text-foreground leading-tight text-center mt-2">{unit?.name || 'Bem-vindo'}</h1>
        </div>

        {/* Divider */}
        <div className="mx-6 h-px bg-border/30" />

        {/* Menu items - centered grid */}
        <div className="flex-1 flex items-center justify-center px-5 overflow-hidden">
          <div className="grid grid-cols-2 gap-3 w-full max-w-[360px]">
            {menuItems.map(item => (
              <button
                key={item.id}
                onClick={item.onClick}
                className="flex flex-col items-center gap-2 p-5 rounded-2xl bg-card/50 border border-border/20 hover:bg-card hover:border-primary/20 active:scale-[0.97] transition-all group"
              >
                <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/15 transition-colors">
                  <AppIcon name={item.icon} size={24} className="text-primary" />
                </div>
                <div className="text-center">
                  <p className="text-sm font-bold text-foreground">{item.label}</p>
                  <p className="text-[10px] text-muted-foreground leading-tight mt-0.5">{item.subtitle}</p>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-border/20">
          <p className="text-[10px] text-muted-foreground/50 text-center font-medium tracking-wide">
            uma experiência <span className="font-bold text-muted-foreground/70">Garden</span>
          </p>
        </div>
      </aside>

      {/* ─── Right Hero Area ─── */}
      <div className="flex-1 relative">
        <img
          src={bannerUrl || tabletHero}
          alt="Hero"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black/30 via-transparent to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />

        {/* Pedido + Minha Conta - top right */}
        <div className="absolute top-0 right-0 z-10 pr-5 pt-[max(env(safe-area-inset-top,12px),16px)] flex items-center gap-2">
          <button
            onClick={() => navigate(`/tablet/${unitId}/bill?mesa=${mesa}`)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-full border border-white/20 bg-black/40 backdrop-blur-xl hover:bg-white/10 transition-colors"
          >
            <AppIcon name="Receipt" size={16} className="text-white/80" />
            <span className="text-sm font-bold text-white">Minha Conta</span>
          </button>
          <button
            onClick={() => navigate(`/tablet/${unitId}/bill?mesa=${mesa}`)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-full border border-white/20 bg-black/40 backdrop-blur-xl hover:bg-white/10 transition-colors"
          >
            <AppIcon name="ShoppingBag" size={16} className="text-white/80" />
            <span className="text-sm font-bold text-white">Pedido</span>
          </button>
        </div>
      </div>

      {/* ─── Table Config Dialog ─── */}
      {showConfig && (
        <TableConfigDialog
          currentMesa={mesa || '1'}
          onConfirm={handleConfigConfirm}
          onCancel={mesa ? () => setShowConfig(false) : undefined}
          requirePin={hasPin}
        />
      )}
    </div>
  );
}
