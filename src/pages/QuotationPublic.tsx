import { useState, useEffect, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { Toaster as Sonner } from '@/components/ui/sonner';
import { AppIcon } from '@/components/ui/app-icon';

interface LastPrice {
  supplier_id: string;
  item_id: string;
  unit_price: number;
  brand: string | null;
  last_quoted_at: string;
}

interface QuotationData {
  quotation_supplier_id: string;
  supplier_id: string;
  supplier_name: string;
  supplier_has_phone: boolean;
  quotation_title: string;
  quotation_status: string;
  deadline: string | null;
  unit_name: string;
  supplier_status: string;
  items: { id: string; quantity: number; item: { id: string; name: string; unit_type: string } }[];
  existing_prices: { quotation_item_id: string; unit_price: number; brand: string | null; round: number }[];
  contested_item_ids: string[];
  last_prices: LastPrice[];
}

const SESSION_KEY = 'supplier_session';

function getSession(): { supplierId: string; supplierName: string; expiresAt: number } | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const s = JSON.parse(raw);
    if (s.expiresAt < Date.now()) {
      localStorage.removeItem(SESSION_KEY);
      return null;
    }
    return s;
  } catch { return null; }
}

function saveSession(supplierId: string, supplierName: string) {
  localStorage.setItem(SESSION_KEY, JSON.stringify({
    supplierId,
    supplierName,
    expiresAt: Date.now() + 90 * 24 * 60 * 60 * 1000, // 90 days
  }));
}

export default function QuotationPublic() {
  const { token } = useParams<{ token: string }>();
  const [data, setData] = useState<QuotationData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [generalNotes, setGeneralNotes] = useState('');
  const [priceInputs, setPriceInputs] = useState<Record<string, { unit_price: string; brand: string; notes: string }>>({});

  // Auth state
  const [needsLogin, setNeedsLogin] = useState(false);
  const [phoneInput, setPhoneInput] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [authenticated, setAuthenticated] = useState(false);

  useEffect(() => {
    if (!token) return;
    const baseUrl = import.meta.env.VITE_SUPABASE_URL;
    fetch(`${baseUrl}/functions/v1/quotation-public?token=${token}`)
      .then(r => r.json())
      .then(d => {
        if (d.error) { setError(d.error); return; }
        setData(d);

        // Check if login needed
        const session = getSession();
        if (d.supplier_has_phone) {
          if (session && session.supplierId === d.supplier_id) {
            setAuthenticated(true);
          } else {
            setNeedsLogin(true);
          }
        } else {
          // No phone on file, skip login
          setAuthenticated(true);
        }

        // Pre-fill existing prices
        const inputs: Record<string, { unit_price: string; brand: string; notes: string }> = {};
        d.items.forEach((item: any) => {
          const existing = d.existing_prices?.find((p: any) => p.quotation_item_id === item.id);
          inputs[item.id] = {
            unit_price: existing ? String(existing.unit_price) : '',
            brand: existing?.brand || '',
            notes: '',
          };
        });
        setPriceInputs(inputs);
      })
      .catch(() => setError('Erro ao carregar cotação'))
      .finally(() => setLoading(false));
  }, [token]);

  // Map inventory item_id -> last price
  const lastPriceMap = useMemo(() => {
    if (!data?.last_prices) return {};
    const map: Record<string, LastPrice> = {};
    data.last_prices.forEach(lp => { map[lp.item_id] = lp; });
    return map;
  }, [data?.last_prices]);

  const handleVerifyPhone = async () => {
    if (!token || !phoneInput.trim()) return;
    setVerifying(true);
    try {
      const baseUrl = import.meta.env.VITE_SUPABASE_URL;
      const res = await fetch(
        `${baseUrl}/functions/v1/quotation-public?token=${token}&action=verify-phone&phone=${encodeURIComponent(phoneInput.trim())}`
      );
      const result = await res.json();
      if (result.valid) {
        saveSession(result.supplier_id, result.supplier_name);
        setAuthenticated(true);
        setNeedsLogin(false);
        toast.success(`Bem-vindo, ${result.supplier_name}!`);
      } else {
        toast.error('Telefone não corresponde ao cadastro deste fornecedor.');
      }
    } catch {
      toast.error('Erro ao verificar telefone.');
    } finally {
      setVerifying(false);
    }
  };

  const handleRepeatLastPrices = () => {
    if (!data) return;
    let filled = 0;
    const newInputs = { ...priceInputs };
    data.items.forEach(item => {
      const lp = lastPriceMap[item.item.id];
      if (lp) {
        newInputs[item.id] = {
          ...newInputs[item.id],
          unit_price: String(lp.unit_price),
          brand: lp.brand || newInputs[item.id]?.brand || '',
        };
        filled++;
      }
    });
    setPriceInputs(newInputs);
    toast.success(`${filled} ${filled === 1 ? 'item preenchido' : 'itens preenchidos'} com últimos preços`);
  };

  const handleSubmit = async () => {
    if (!data) return;
    setSubmitting(true);
    try {
      const baseUrl = import.meta.env.VITE_SUPABASE_URL;
      const prices = Object.entries(priceInputs)
        .filter(([_, v]) => v.unit_price && Number(v.unit_price) > 0)
        .map(([quotation_item_id, v]) => ({
          quotation_item_id,
          unit_price: Number(v.unit_price),
          brand: v.brand || null,
          notes: v.notes || null,
        }));

      const res = await fetch(`${baseUrl}/functions/v1/quotation-public?token=${token}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          quotation_supplier_id: data.quotation_supplier_id,
          prices,
          general_notes: generalNotes,
        }),
      });

      const result = await res.json();
      if (result.error) throw new Error(result.error);
      setSubmitted(true);
      toast.success('Cotação enviada com sucesso!');
    } catch (err: any) {
      toast.error(err.message || 'Erro ao enviar');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <AppIcon name="Loader2" className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <div className="text-center space-y-2">
          <p className="text-lg font-semibold text-destructive">Link inválido</p>
          <p className="text-sm text-muted-foreground">{error || 'Cotação não encontrada'}</p>
        </div>
      </div>
    );
  }

  // Login screen
  if (needsLogin && !authenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Sonner />
        <div className="w-full max-w-sm space-y-6">
          <div className="text-center space-y-2">
            <div className="w-16 h-16 mx-auto rounded-2xl bg-primary/10 flex items-center justify-center">
              <AppIcon name="Store" className="w-8 h-8 text-primary" />
            </div>
            <h1 className="text-xl font-bold text-foreground">{data.quotation_title || 'Cotação de Preços'}</h1>
            <p className="text-sm text-muted-foreground">
              Para acessar, informe o telefone cadastrado do fornecedor.
            </p>
          </div>

          <div className="space-y-3">
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Telefone</label>
              <Input
                type="tel"
                placeholder="(11) 99999-9999"
                value={phoneInput}
                onChange={e => setPhoneInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleVerifyPhone()}
                className="rounded-xl text-center text-lg tracking-wider"
              />
            </div>
            <Button
              onClick={handleVerifyPhone}
              disabled={verifying || phoneInput.trim().length < 10}
              className="w-full h-12 rounded-xl"
            >
              {verifying ? (
                <AppIcon name="Loader2" className="w-5 h-5 animate-spin" />
              ) : (
                'Entrar'
              )}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (submitted || (data.supplier_status === 'responded' && data.existing_prices.length > 0 && data.quotation_status !== 'contested')) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Sonner />
        <div className="text-center space-y-3">
          <div className="w-16 h-16 mx-auto rounded-full bg-success/10 flex items-center justify-center">
            <AppIcon name="CheckCircle2" className="w-8 h-8 text-success" />
          </div>
          <p className="text-xl font-bold text-foreground">Cotação Enviada!</p>
          <p className="text-sm text-muted-foreground">
            Obrigado por enviar seus preços. Entraremos em contato em breve.
          </p>
        </div>
      </div>
    );
  }

  const isContested = data.supplier_status === 'contested';
  const filledCount = Object.values(priceInputs).filter(v => v.unit_price && Number(v.unit_price) > 0).length;
  const hasLastPrices = Object.keys(lastPriceMap).length > 0;

  return (
    <div className="min-h-screen bg-background">
      <Sonner />
      {/* Header */}
      <header className="bg-card border-b border-border p-4 sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <AppIcon name="Store" className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h1 className="font-bold text-lg">{data.quotation_title || 'Cotação de Preços'}</h1>
            <p className="text-xs text-muted-foreground">{data.unit_name}</p>
          </div>
        </div>
        {data.deadline && (
          <div className="flex items-center gap-1.5 mt-2 text-xs text-muted-foreground">
            <AppIcon name="Clock" className="w-3.5 h-3.5" />
            Prazo: {new Date(data.deadline).toLocaleDateString('pt-BR')}
          </div>
        )}
        {isContested && (
          <div className="mt-2 p-2 rounded-lg bg-orange-500/10 border border-orange-500/20">
            <p className="text-xs font-medium text-orange-600">
              ⚠️ Alguns itens receberam preços mais competitivos. Revise abaixo os itens destacados.
            </p>
          </div>
        )}
      </header>

      {/* Repeat last prices button */}
      {hasLastPrices && (
        <div className="p-4 pb-0">
          <Button
            variant="outline"
            onClick={handleRepeatLastPrices}
            className="w-full rounded-xl border-dashed gap-2"
          >
            <AppIcon name="RotateCcw" className="w-4 h-4" />
            Usar últimos preços ({Object.keys(lastPriceMap).length} itens)
          </Button>
        </div>
      )}

      {/* Items */}
      <div className="p-4 space-y-3 pb-32">
        {data.items.map(item => {
          const isContestedItem = data.contested_item_ids.includes(item.id);
          const input = priceInputs[item.id] || { unit_price: '', brand: '', notes: '' };
          const lastPrice = lastPriceMap[item.item.id];

          return (
            <div
              key={item.id}
              className={`p-4 rounded-2xl border transition-all ${
                isContestedItem
                  ? 'bg-orange-50 border-orange-200 dark:bg-orange-500/5 dark:border-orange-500/20'
                  : 'bg-card border-border'
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <div>
                  <p className="font-semibold text-foreground">{item.item.name}</p>
                  <p className="text-xs text-muted-foreground">
                    ×{item.quantity} {item.item.unit_type}
                  </p>
                </div>
                <div className="flex items-center gap-1.5">
                  {lastPrice && (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary font-medium">
                      Último: R$ {Number(lastPrice.unit_price).toFixed(2)}
                    </span>
                  )}
                  {isContestedItem && (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-orange-500/10 text-orange-500 font-medium">
                      Revisar
                    </span>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">
                    Preço/{item.item.unit_type === 'unidade' ? 'un' : item.item.unit_type}
                  </label>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0,00"
                    value={input.unit_price}
                    onChange={e => setPriceInputs(prev => ({
                      ...prev,
                      [item.id]: { ...prev[item.id], unit_price: e.target.value },
                    }))}
                    className="rounded-xl"
                  />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Marca (opcional)</label>
                  <Input
                    placeholder="Ex: Fugini, Cica..."
                    value={input.brand}
                    onChange={e => setPriceInputs(prev => ({
                      ...prev,
                      [item.id]: { ...prev[item.id], brand: e.target.value },
                    }))}
                    className="rounded-xl"
                  />
                </div>
              </div>
            </div>
          );
        })}

        {/* General notes */}
        <div className="p-4 rounded-2xl border border-border bg-card">
          <label className="text-xs text-muted-foreground mb-1 block">Observações gerais (opcional)</label>
          <Textarea
            placeholder="Prazo de entrega, condições de pagamento..."
            value={generalNotes}
            onChange={e => setGeneralNotes(e.target.value)}
            className="rounded-xl min-h-[80px]"
          />
        </div>
      </div>

      {/* Submit button */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-background/80 backdrop-blur-lg border-t border-border">
        <Button
          onClick={handleSubmit}
          disabled={submitting || filledCount === 0}
          className="w-full h-12 rounded-xl shadow-lg shadow-primary/20 text-base"
        >
          {submitting ? (
            <AppIcon name="Loader2" className="w-5 h-5 animate-spin" />
          ) : (
            `Enviar Cotação (${filledCount}/${data.items.length} itens)`
          )}
        </Button>
      </div>
    </div>
  );
}
