import { useState, useEffect, useRef, useCallback } from 'react';
import { Input } from '@/components/ui/input';
import { AppIcon } from '@/components/ui/app-icon';
import { cn } from '@/lib/utils';

interface PDVDeliveryAddressProps {
  value: string;
  onChange: (fullAddress: string) => void;
}

interface ViaCepResult {
  cep: string;
  logradouro: string;
  bairro: string;
  localidade: string;
  uf: string;
  erro?: boolean;
}

interface NominatimResult {
  display_name: string;
  place_id: number;
  lat: string;
  lon: string;
}

export function PDVDeliveryAddress({ value, onChange }: PDVDeliveryAddressProps) {
  const [mode, setMode] = useState<'search' | 'cep'>('search');
  const [street, setStreet] = useState('');
  const [number, setNumber] = useState('');
  const [complement, setComplement] = useState('');
  const [neighborhood, setNeighborhood] = useState('');
  const [reference, setReference] = useState('');
  const [cep, setCep] = useState('');
  const [suggestions, setSuggestions] = useState<NominatimResult[]>([]);
  const [loadingCep, setLoadingCep] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();
  const containerRef = useRef<HTMLDivElement>(null);

  // Build full address and notify parent
  const buildAddress = useCallback((s: string, n: string, comp: string, neigh: string, ref: string) => {
    const parts = [s, n && `nº ${n}`, comp, neigh].filter(Boolean);
    let full = parts.join(', ');
    if (ref) full += ` (Ref: ${ref})`;
    onChange(full);
  }, [onChange]);

  // Parse initial value on mount
  useEffect(() => {
    if (value && !street) {
      setStreet(value);
    }
  }, []);

  // Cache user location for proximity bias
  const userLocationRef = useRef<{ lat: number; lon: number } | null>(null);
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          userLocationRef.current = { lat: pos.coords.latitude, lon: pos.coords.longitude };
        },
        () => { /* ignore errors */ },
        { timeout: 5000, maximumAge: 300000 }
      );
    }
  }, []);

  // Nominatim autocomplete with proximity sorting
  useEffect(() => {
    if (mode !== 'search' || street.length < 4) {
      setSuggestions([]);
      return;
    }

    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      try {
        const q = encodeURIComponent(street);
        const loc = userLocationRef.current;
        // Build viewbox around user location (~30km radius) for proximity bias
        const viewboxParam = loc
          ? `&viewbox=${loc.lon - 0.3},${loc.lat + 0.3},${loc.lon + 0.3},${loc.lat - 0.3}`
          : '';
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${q}&countrycodes=br&limit=8${viewboxParam}&addressdetails=0`,
          { headers: { 'Accept-Language': 'pt-BR' } }
        );
        let data: NominatimResult[] = await res.json();
        // Sort by distance to user if available
        if (loc && data.length > 1) {
          data.sort((a, b) => {
            const distA = Math.hypot(parseFloat(a.lat) - loc.lat, parseFloat(a.lon) - loc.lon);
            const distB = Math.hypot(parseFloat(b.lat) - loc.lat, parseFloat(b.lon) - loc.lon);
            return distA - distB;
          });
          data = data.slice(0, 5);
        }
        setSuggestions(data);
        setShowSuggestions(data.length > 0);
      } catch {
        setSuggestions([]);
      }
    }, 400);

    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [street, mode]);

  // CEP lookup
  const handleCepSearch = useCallback(async (cepValue: string) => {
    const clean = cepValue.replace(/\D/g, '');
    if (clean.length !== 8) return;

    setLoadingCep(true);
    try {
      const res = await fetch(`https://viacep.com.br/ws/${clean}/json/`);
      const data: ViaCepResult = await res.json();
      if (!data.erro && data.logradouro) {
        setStreet(data.logradouro);
        setNeighborhood(data.bairro || '');
        buildAddress(data.logradouro, number, complement, data.bairro || '', reference);
      }
    } catch { /* ignore */ }
    setLoadingCep(false);
  }, [number, complement, reference, buildAddress]);

  const selectSuggestion = (s: NominatimResult) => {
    // Clean display_name: remove country and zip portions
    const parts = s.display_name.split(',').map(p => p.trim());
    // Take first 3-4 meaningful parts
    const meaningful = parts.slice(0, 4).join(', ');
    setStreet(meaningful);
    setShowSuggestions(false);
    setSuggestions([]);
    buildAddress(meaningful, number, complement, neighborhood, reference);
  };

  // Close suggestions on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Format CEP as 00000-000
  const formatCep = (val: string) => {
    const clean = val.replace(/\D/g, '').slice(0, 8);
    return clean.length > 5 ? `${clean.slice(0, 5)}-${clean.slice(5)}` : clean;
  };

  return (
    <div ref={containerRef} className="space-y-1.5">
      {/* Mode toggle */}
      <div className="flex gap-1">
        <button
          onClick={() => setMode('search')}
          className={cn(
            'flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-medium transition-all',
            mode === 'search' ? 'bg-primary/15 text-primary' : 'bg-secondary/50 text-muted-foreground'
          )}
        >
          <AppIcon name="Search" size={10} />
          Buscar
        </button>
        <button
          onClick={() => setMode('cep')}
          className={cn(
            'flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-medium transition-all',
            mode === 'cep' ? 'bg-primary/15 text-primary' : 'bg-secondary/50 text-muted-foreground'
          )}
        >
          <AppIcon name="MapPin" size={10} />
          CEP
        </button>
      </div>

      {mode === 'cep' && (
        <div className="flex gap-1.5">
          <div className="relative w-28">
            <Input
              placeholder="CEP"
              value={cep}
              onChange={e => {
                const formatted = formatCep(e.target.value);
                setCep(formatted);
                if (formatted.replace(/\D/g, '').length === 8) handleCepSearch(formatted);
              }}
              className="h-8 text-xs rounded-xl pr-7"
              inputMode="numeric"
            />
            {loadingCep && (
              <AppIcon name="Loader2" size={12} className="absolute right-2 top-1/2 -translate-y-1/2 animate-spin text-muted-foreground" />
            )}
          </div>
        </div>
      )}

      {/* Street with autocomplete */}
      <div className="relative">
        <div className="relative">
          <AppIcon name="MapPin" size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Rua, Av, Travessa..."
            value={street}
            onChange={e => {
              setStreet(e.target.value);
              buildAddress(e.target.value, number, complement, neighborhood, reference);
            }}
            onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
            className="h-8 text-xs rounded-xl pl-7"
          />
        </div>

        {/* Suggestions dropdown */}
        {showSuggestions && suggestions.length > 0 && (
          <div className="absolute z-50 w-full mt-1 bg-popover border border-border rounded-xl shadow-lg overflow-hidden">
            {suggestions.map(s => (
              <button
                key={s.place_id}
                onClick={() => selectSuggestion(s)}
                className="w-full text-left px-3 py-2 text-[11px] text-foreground hover:bg-secondary/50 transition-colors flex items-start gap-2 border-b border-border/30 last:border-0"
              >
                <AppIcon name="MapPin" size={11} className="text-primary shrink-0 mt-0.5" />
                <span className="line-clamp-2">{s.display_name}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Number + Complement */}
      <div className="flex gap-1.5">
        <Input
          placeholder="Nº"
          value={number}
          onChange={e => {
            setNumber(e.target.value);
            buildAddress(street, e.target.value, complement, neighborhood, reference);
          }}
          className="h-8 text-xs w-16 rounded-xl"
          inputMode="numeric"
        />
        <Input
          placeholder="Complemento (apto, bloco...)"
          value={complement}
          onChange={e => {
            setComplement(e.target.value);
            buildAddress(street, number, e.target.value, neighborhood, reference);
          }}
          className="h-8 text-xs flex-1 rounded-xl"
        />
      </div>

      {/* Neighborhood + Reference */}
      <div className="flex gap-1.5">
        <Input
          placeholder="Bairro"
          value={neighborhood}
          onChange={e => {
            setNeighborhood(e.target.value);
            buildAddress(street, number, complement, e.target.value, reference);
          }}
          className="h-8 text-xs flex-1 rounded-xl"
        />
        <Input
          placeholder="Ponto de referência"
          value={reference}
          onChange={e => {
            setReference(e.target.value);
            buildAddress(street, number, complement, neighborhood, e.target.value);
          }}
          className="h-8 text-xs flex-1 rounded-xl"
        />
      </div>
    </div>
  );
}
