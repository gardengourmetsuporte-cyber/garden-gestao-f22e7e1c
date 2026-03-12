import { useState, useMemo, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { AppIcon } from '@/components/ui/app-icon';
import { formatCurrency } from '@/lib/format';
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

  // Persist mesa on first load from URL param
  useEffect(() => {
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
        id: 'conta',
        icon: 'Receipt',
        label: 'Minha Conta',
        subtitle: 'Pedidos e fechamento',
        onClick: () => navigate(`/tablet/${unitId}/bill?mesa=${mesa}`),
      },
      {
        id: 'roleta',
        icon: 'Dices',
        label: 'Roleta da Sorte',
        subtitle: 'Gire e ganhe prêmios!',
        onClick: () => navigate(`/gamification/${unitId}?mesa=${mesa}`),
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
    return (
      <div className="h-[100dvh] bg-background flex flex-col items-center justify-center gap-5">
        <div className="w-20 h-20 rounded-full bg-white shadow-lg flex items-center justify-center p-3 animate-pulse" style={{ animationDuration: '2s' }}>
          <img src={gardenLogo} alt="Garden" className="w-full h-full object-contain" />
        </div>
        <p className="text-sm font-semibold text-foreground">Carregando...</p>
      </div>
    );
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

  return (
    <div className="fixed inset-0 bg-black overflow-hidden select-none">
      {/* ─── Full-screen Hero Background ─── */}
      <img
        src={bannerUrl || tabletHero}
        alt="Hero"
        className="absolute inset-0 w-full h-full object-cover"
      />
      {/* Gradient overlays */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-black/10" />
      <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-transparent to-transparent" />

      {/* ─── Top bar: Mesa (center) + Pedido (right) ─── */}
      <div className="absolute top-0 left-0 right-0 z-20 flex items-center justify-between px-5 pt-[env(safe-area-inset-top,12px)] pb-2"
        style={{ paddingTop: 'max(env(safe-area-inset-top, 0px), 12px)' }}
      >
        {/* Spacer for centering */}
        <div className="w-[120px]" />

        {/* Mesa badge - centered */}
        <button
          onClick={() => { if (hasPin) setShowConfig(true); }}
          className="flex items-center gap-2 px-5 py-2.5 rounded-full border border-white/20 bg-black/40 backdrop-blur-xl hover:bg-white/10 transition-colors"
        >
          <AppIcon name="TableBar" size={16} className="text-white/70" />
          <span className="text-sm font-bold text-white">Mesa {mesa || '?'}</span>
          {hasPin && <AppIcon name="Lock" size={12} className="text-white/40" />}
        </button>

        {/* Right actions */}
        <div className="w-[120px] flex justify-end gap-2">
          <button
            onClick={() => navigate(`/tablet/${unitId}/bill?mesa=${mesa}`)}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-full border border-white/20 bg-black/40 backdrop-blur-xl hover:bg-white/10 transition-colors"
          >
            <AppIcon name="ShoppingBag" size={16} className="text-white/70" />
            <span className="text-xs font-bold text-white">Pedido</span>
          </button>
        </div>
      </div>

      {/* ─── Full-height Sidebar Menu (left) ─── */}
      <div
        className="absolute left-0 top-0 bottom-0 z-10 w-[300px] flex flex-col"
        style={{
          paddingTop: 'max(env(safe-area-inset-top, 0px), 0px)',
          paddingBottom: 'max(env(safe-area-inset-bottom, 0px), 0px)',
          paddingLeft: 'max(env(safe-area-inset-left, 0px), 0px)',
        }}
      >
        <div className="flex-1 flex flex-col bg-black/60 backdrop-blur-2xl border-r border-white/[0.08] overflow-hidden">
          {/* Logo & Brand - centered */}
          <div className="flex flex-col items-center px-6 pt-8 pb-5">
            <div className="w-20 h-20 rounded-2xl overflow-hidden border border-white/15 bg-white/10 backdrop-blur-sm flex items-center justify-center shadow-lg mb-4">
              {logoUrl ? (
                <img src={logoUrl} alt={unit?.name} className="w-full h-full object-cover" />
              ) : (
                <img src={gardenLogo} alt="Garden" className="w-14 h-14 object-contain" />
              )}
            </div>
            <h1 className="text-lg font-bold text-white leading-tight text-center">{unit?.name || 'Bem-vindo'}</h1>
            <p className="text-[11px] text-white/40 mt-1">Mesa {mesa || '?'}</p>
          </div>

          {/* Divider */}
          <div className="mx-5 h-px bg-white/[0.08]" />

          {/* Menu items */}
          <div className="flex-1 overflow-y-auto px-3 py-3" style={{ scrollbarWidth: 'none' }}>
            <div className="space-y-1">
              {menuItems.map(item => (
                <button
                  key={item.id}
                  onClick={item.onClick}
                  className="w-full flex items-center gap-3.5 px-4 py-3.5 rounded-2xl text-left hover:bg-white/[0.08] active:bg-white/[0.12] transition-colors group"
                >
                  <div className="w-10 h-10 rounded-xl bg-white/[0.08] flex items-center justify-center shrink-0 group-hover:bg-white/[0.14] transition-colors">
                    <AppIcon name={item.icon} size={20} className="text-white/80" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-white/90">{item.label}</p>
                    <p className="text-[11px] text-white/40 leading-tight mt-0.5">{item.subtitle}</p>
                  </div>
                  <AppIcon name="ChevronRight" size={16} className="text-white/20 group-hover:text-white/40 transition-colors shrink-0" />
                </button>
              ))}
            </div>
          </div>

          {/* Footer */}
          <div className="px-4 py-3 border-t border-white/[0.06]">
            <p className="text-[9px] text-white/25 text-center font-medium">
              uma experiência <span className="font-bold text-white/40">Garden</span>
            </p>
          </div>
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
