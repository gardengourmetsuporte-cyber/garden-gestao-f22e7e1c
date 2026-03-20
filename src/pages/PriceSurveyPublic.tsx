import { useState, useEffect, useMemo, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { AppIcon } from '@/components/ui/app-icon';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface SurveyItem {
  id: string;
  name: string;
  unit_type: string;
  unit_price: number | null;
  category_id: string | null;
}

interface Category {
  id: string;
  name: string;
  color: string;
}

interface ItemResponse {
  has_item: boolean;
  unit_price: string;
  brand: string;
}

const VITE_SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;

export default function PriceSurveyPublic() {
  const { token } = useParams<{ token: string }>();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');
  const [surveyData, setSurveyData] = useState<any>(null);
  const [responses, setResponses] = useState<Record<string, ItemResponse>>({});
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;
    (async () => {
      try {
        const res = await fetch(`${VITE_SUPABASE_URL}/functions/v1/price-survey-public?token=${token}`);
        const data = await res.json();
        if (!res.ok) throw new Error(data.error);
        setSurveyData(data);

        const initial: Record<string, ItemResponse> = {};
        (data.items || []).forEach((item: SurveyItem) => {
          const existing = data.existingResponses?.find((r: any) => r.item_id === item.id);
          const lastPrice = data.lastPrices?.find((r: any) => r.item_id === item.id);
          initial[item.id] = {
            has_item: existing ? existing.has_item : !!lastPrice,
            unit_price: existing ? String(existing.unit_price || '') : lastPrice ? String(lastPrice.unit_price || '') : '',
            brand: existing?.brand || lastPrice?.brand || '',
          };
        });
        setResponses(initial);

        if (data.surveySupplierStatus === 'responded') {
          setSubmitted(true);
        }
      } catch (err: any) {
        setError(err.message || 'Erro ao carregar pesquisa');
      } finally {
        setLoading(false);
      }
    })();
  }, [token]);

  const categories: Category[] = surveyData?.categories || [];
  const items: SurveyItem[] = surveyData?.items || [];

  const filteredItems = useMemo(() => {
    let filtered = items;
    if (activeCategory) {
      filtered = filtered.filter(i => i.category_id === activeCategory);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      filtered = filtered.filter(i => i.name.toLowerCase().includes(q));
    }
    return filtered;
  }, [items, activeCategory, search]);

  const groupedItems = useMemo(() => {
    const groups: Record<string, { category: Category | null; items: SurveyItem[] }> = {};
    filteredItems.forEach(item => {
      const catId = item.category_id || 'sem-categoria';
      if (!groups[catId]) {
        const cat = categories.find(c => c.id === catId) || null;
        groups[catId] = { category: cat, items: [] };
      }
      groups[catId].items.push(item);
    });
    return Object.values(groups).sort((a, b) => {
      if (!a.category) return 1;
      if (!b.category) return -1;
      return a.category.name.localeCompare(b.category.name);
    });
  }, [filteredItems, categories]);

  const updateResponse = useCallback((itemId: string, field: keyof ItemResponse, value: any) => {
    setResponses(prev => ({
      ...prev,
      [itemId]: { ...prev[itemId], [field]: value },
    }));
  }, []);

  const markAll = useCallback(() => {
    setResponses(prev => {
      const next = { ...prev };
      items.forEach(item => {
        next[item.id] = { ...next[item.id], has_item: true };
      });
      return next;
    });
  }, [items]);

  const answeredCount = useMemo(() => {
    return Object.values(responses).filter(r => r.has_item && parseFloat(r.unit_price) > 0).length;
  }, [responses]);

  const handleSubmit = async () => {
    const payload = items.map(item => {
      const r = responses[item.id];
      return {
        item_id: item.id,
        has_item: r?.has_item ?? false,
        unit_price: parseFloat(r?.unit_price || '0') || 0,
        brand: r?.brand || '',
      };
    });

    setSubmitting(true);
    try {
      const res = await fetch(`${VITE_SUPABASE_URL}/functions/v1/price-survey-public?token=${token}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ responses: payload }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setSubmitted(true);
      toast.success('Respostas enviadas com sucesso!');
    } catch (err: any) {
      toast.error(err.message || 'Erro ao enviar');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <div className="text-center space-y-3">
          <AppIcon name="AlertCircle" size={48} className="text-destructive mx-auto" />
          <p className="text-lg font-semibold text-foreground">{error}</p>
        </div>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <div className="text-center space-y-4 max-w-sm">
          <div className="w-16 h-16 mx-auto bg-primary/15 rounded-full flex items-center justify-center">
            <AppIcon name="Check" size={32} className="text-primary" />
          </div>
          <h2 className="text-xl font-bold text-foreground">Respostas Enviadas!</h2>
          <p className="text-muted-foreground">Obrigado por participar da pesquisa de preços.</p>
          <Button variant="outline" onClick={() => setSubmitted(false)}>
            Editar Respostas
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-28">
      {/* Header */}
      <div className="bg-card border-b border-border sticky top-0 z-10 px-4 py-3 space-y-3">
        <div>
          <h1 className="text-lg font-bold text-foreground">{surveyData?.survey?.title || 'Pesquisa de Preços'}</h1>
          <p className="text-sm text-muted-foreground">{surveyData?.supplier?.name}</p>
        </div>

        {/* Search */}
        <div className="relative">
          <AppIcon name="Search" size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar item..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-9 h-9"
          />
        </div>

        {/* Category chips */}
        <div className="flex gap-2 overflow-x-auto pb-1 -mx-4 px-4 scrollbar-none">
          <button
            onClick={() => setActiveCategory(null)}
            className={cn(
              "shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-colors",
              !activeCategory ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground hover:bg-secondary/80"
            )}
          >
            Todos ({items.length})
          </button>
          {categories.map(cat => {
            const count = items.filter(i => i.category_id === cat.id).length;
            if (count === 0) return null;
            return (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(activeCategory === cat.id ? null : cat.id)}
                className={cn(
                  "shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-colors",
                  activeCategory === cat.id ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground hover:bg-secondary/80"
                )}
              >
                {cat.name} ({count})
              </button>
            );
          })}
        </div>
      </div>

      {/* Spacer */}
      <div className="pt-2" />

      {/* Items grouped by category */}
      <div className="px-4 pt-3 space-y-4">
        {groupedItems.map(group => (
          <div key={group.category?.id || 'no-cat'}>
            <div className="flex items-center gap-2 mb-2">
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: group.category?.color || '#94a3b8' }}
              />
              <span className="text-sm font-semibold text-foreground">
                {group.category?.name || 'Sem Categoria'}
              </span>
              <span className="text-xs text-muted-foreground">({group.items.length})</span>
            </div>

            <div className="space-y-2">
              {group.items.map(item => {
                const r = responses[item.id] || { has_item: false, unit_price: '', brand: '' };
                return (
                  <div
                    key={item.id}
                    className={cn(
                      "bg-card rounded-xl p-3 border transition-colors",
                      r.has_item ? "border-primary/40 bg-primary/5" : "border-border"
                    )}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">{item.name}</p>
                        <p className="text-xs text-muted-foreground">{item.unit_type}</p>
                      </div>
                      <Switch
                        checked={r.has_item}
                        onCheckedChange={v => updateResponse(item.id, 'has_item', v)}
                      />
                    </div>

                    {r.has_item && (
                      <div className="flex gap-2 animate-fade-in">
                        <div className="flex-1">
                          <label className="text-[10px] text-muted-foreground uppercase font-medium">Preço (R$)</label>
                          <Input
                            type="number"
                            inputMode="decimal"
                            step="0.01"
                            placeholder="0,00"
                            value={r.unit_price}
                            onChange={e => updateResponse(item.id, 'unit_price', e.target.value)}
                            className="h-8 text-sm mt-0.5"
                          />
                        </div>
                        <div className="flex-1">
                          <label className="text-[10px] text-muted-foreground uppercase font-medium">Marca</label>
                          <Input
                            placeholder="Opcional"
                            value={r.brand}
                            onChange={e => updateResponse(item.id, 'brand', e.target.value)}
                            className="h-8 text-sm mt-0.5"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}

        {filteredItems.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            <AppIcon name="Search" size={40} className="mx-auto mb-2 opacity-50" />
            <p>Nenhum item encontrado</p>
          </div>
        )}
      </div>

      {/* Bottom bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-card border-t border-border px-4 py-3 z-20">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-muted-foreground">
            {answeredCount} de {items.length} itens com preço
          </span>
          <div className="h-2 flex-1 mx-3 bg-secondary rounded-full overflow-hidden">
            <div
              className="h-full bg-primary rounded-full transition-all"
              style={{ width: `${items.length > 0 ? (answeredCount / items.length) * 100 : 0}%` }}
            />
          </div>
        </div>
        <Button
          className="w-full"
          disabled={submitting}
          onClick={handleSubmit}
        >
          {submitting ? 'Enviando...' : 'Enviar Respostas'}
        </Button>
      </div>
    </div>
  );
}
