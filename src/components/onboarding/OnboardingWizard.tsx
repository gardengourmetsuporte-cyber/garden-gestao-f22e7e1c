import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useUnit } from '@/contexts/UnitContext';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Building2, Package, Wallet, ClipboardCheck, ChevronRight, Check, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import { DEFAULT_PAYMENT_SETTINGS } from '@/hooks/usePaymentSettings';

const BUSINESS_TEMPLATES = [
  { key: 'hamburgueria', label: '🍔 Hamburgueria', sectors: [
    { name: 'Cozinha', color: '#ef4444', subs: [{ name: 'Chapas e Grills', items: ['Limpar chapas', 'Verificar gás', 'Organizar insumos'] }, { name: 'Frituras', items: ['Trocar óleo', 'Limpar fritadeira'] }] },
    { name: 'Salão', color: '#3b82f6', subs: [{ name: 'Mesas', items: ['Limpar mesas', 'Repor guardanapos', 'Verificar condimentos'] }] },
    { name: 'Estoque', color: '#22c55e', subs: [{ name: 'Câmara Fria', items: ['Verificar temperatura', 'Conferir validades'] }] },
  ]},
  { key: 'pizzaria', label: '🍕 Pizzaria', sectors: [
    { name: 'Cozinha', color: '#ef4444', subs: [{ name: 'Forno', items: ['Acender forno', 'Limpar pedra', 'Preparar massa'] }, { name: 'Montagem', items: ['Repor ingredientes', 'Organizar bancada'] }] },
    { name: 'Atendimento', color: '#3b82f6', subs: [{ name: 'Balcão', items: ['Limpar vitrine', 'Conferir cardápio'] }] },
  ]},
  { key: 'cafeteria', label: '☕ Cafeteria', sectors: [
    { name: 'Bar', color: '#92400e', subs: [{ name: 'Máquinas', items: ['Ligar máquina de café', 'Purgar grupo', 'Calibrar moagem'] }, { name: 'Preparo', items: ['Repor leite', 'Verificar xaropes'] }] },
    { name: 'Vitrine', color: '#16a34a', subs: [{ name: 'Exposição', items: ['Montar vitrine', 'Etiquetar preços', 'Verificar validades'] }] },
  ]},
  { key: 'restaurante', label: '🍽️ Restaurante', sectors: [
    { name: 'Cozinha', color: '#ef4444', subs: [{ name: 'Preparo', items: ['Mise en place', 'Verificar estoque do dia'] }, { name: 'Limpeza', items: ['Higienizar bancadas', 'Lavar utensílios'] }] },
    { name: 'Salão', color: '#3b82f6', subs: [{ name: 'Ambiente', items: ['Arrumar mesas', 'Verificar iluminação', 'Conferir reservas'] }] },
  ]},
];

const DEFAULT_CATEGORIES = [
  { name: 'Carnes', color: '#ef4444', icon: 'Beef' },
  { name: 'Bebidas', color: '#3b82f6', icon: 'Wine' },
  { name: 'Hortifruti', color: '#22c55e', icon: 'Salad' },
  { name: 'Laticínios', color: '#f59e0b', icon: 'Milk' },
  { name: 'Descartáveis', color: '#8b5cf6', icon: 'Package' },
  { name: 'Limpeza', color: '#06b6d4', icon: 'SprayCan' },
];

interface OnboardingWizardProps {
  onComplete: () => void;
}

export function OnboardingWizard({ onComplete }: OnboardingWizardProps) {
  const { user } = useAuth();
  const { refetchUnits } = useUnit();
  const [step, setStep] = useState(0);
  const [unitName, setUnitName] = useState('');
  const [selectedCategories, setSelectedCategories] = useState<string[]>(DEFAULT_CATEGORIES.map(c => c.name));
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const steps = [
    { icon: Building2, title: 'Sua Unidade', desc: 'Dê um nome ao seu negócio' },
    { icon: Package, title: 'Categorias de Estoque', desc: 'Selecione as categorias iniciais' },
    { icon: Wallet, title: 'Pagamentos', desc: 'Meios de pagamento configurados' },
    { icon: ClipboardCheck, title: 'Checklist Modelo', desc: 'Escolha um template do seu segmento' },
  ];

  const toggleCategory = (name: string) => {
    setSelectedCategories(prev =>
      prev.includes(name) ? prev.filter(n => n !== name) : [...prev, name]
    );
  };

  const handleFinish = async () => {
    if (!user) return;
    setIsSubmitting(true);

    try {
      // 1. Create unit
      const slug = unitName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
      const { data: unitData, error: unitError } = await supabase
        .from('units')
        .insert({ name: unitName, slug: slug || 'principal', created_by: user.id })
        .select()
        .single();
      if (unitError) throw unitError;

      const unitId = unitData.id;

      // Assign user to unit as owner
      await supabase.from('user_units').insert({
        user_id: user.id,
        unit_id: unitId,
        is_default: true,
        role: 'owner',
      });

      // 2. Create stock categories
      const categoriesToInsert = DEFAULT_CATEGORIES
        .filter(c => selectedCategories.includes(c.name))
        .map((c, i) => ({ ...c, sort_order: i, unit_id: unitId }));
      if (categoriesToInsert.length > 0) {
        await supabase.from('categories').insert(categoriesToInsert);
      }

      // 3. Payment settings (auto-created by hook on first access)
      const paymentInserts = DEFAULT_PAYMENT_SETTINGS.map(s => ({
        ...s,
        user_id: user.id,
        unit_id: unitId,
      }));
      await supabase.from('payment_method_settings' as any).insert(paymentInserts as any);

      // 4. Checklist template
      if (selectedTemplate) {
        const template = BUSINESS_TEMPLATES.find(t => t.key === selectedTemplate);
        if (template) {
          for (let si = 0; si < template.sectors.length; si++) {
            const sector = template.sectors[si];
            const { data: sectorData } = await supabase
              .from('checklist_sectors')
              .insert({ name: sector.name, color: sector.color, sort_order: si, unit_id: unitId })
              .select()
              .single();
            if (!sectorData) continue;

            for (let subi = 0; subi < sector.subs.length; subi++) {
              const sub = sector.subs[subi];
              const { data: subData } = await supabase
                .from('checklist_subcategories')
                .insert({ sector_id: sectorData.id, name: sub.name, sort_order: subi, unit_id: unitId })
                .select()
                .single();
              if (!subData) continue;

              const itemsToInsert = sub.items.map((name, ii) => ({
                subcategory_id: subData.id,
                name,
                sort_order: ii,
                checklist_type: 'abertura' as const,
                unit_id: unitId,
              }));
              await supabase.from('checklist_items').insert(itemsToInsert);
            }
          }
        }
      }

      // Mark onboarding complete
      localStorage.setItem('garden_onboarding_done', 'true');
      await refetchUnits();
      toast.success('Tudo pronto! Bem-vindo ao Garden 🌱');
      onComplete();
    } catch (err: any) {
      console.error('Onboarding error:', err);
      toast.error('Erro no setup: ' + (err.message || 'tente novamente'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const canAdvance = () => {
    if (step === 0) return unitName.trim().length >= 2;
    return true;
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        {/* Progress */}
        <div className="flex items-center gap-1 justify-center mb-2">
          {steps.map((_, i) => (
            <div
              key={i}
              className={cn(
                'h-1.5 rounded-full transition-all duration-300',
                i <= step ? 'bg-primary w-8' : 'bg-muted w-4'
              )}
            />
          ))}
        </div>

        {/* Header */}
        <div className="text-center space-y-1">
          <div className="mx-auto w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center mb-3">
            {(() => { const Icon = steps[step].icon; return <Icon className="w-6 h-6 text-primary" />; })()}
          </div>
          <h2 className="text-xl font-bold text-foreground">{steps[step].title}</h2>
          <p className="text-sm text-muted-foreground">{steps[step].desc}</p>
        </div>

        {/* Step Content */}
        <Card className="p-5">
          {step === 0 && (
            <div className="space-y-4">
              <Input
                placeholder="Ex: Burger House, Café Central..."
                value={unitName}
                onChange={(e) => setUnitName(e.target.value)}
                className="text-center text-lg"
                autoFocus
              />
              <p className="text-xs text-muted-foreground text-center">
                Você poderá adicionar mais unidades depois.
              </p>
            </div>
          )}

          {step === 1 && (
            <div className="grid grid-cols-2 gap-2">
              {DEFAULT_CATEGORIES.map(cat => (
                <button
                  key={cat.name}
                  onClick={() => toggleCategory(cat.name)}
                  className={cn(
                    'flex items-center gap-2 p-3 rounded-xl border-2 text-sm font-medium transition-all',
                    selectedCategories.includes(cat.name)
                      ? 'border-primary bg-primary/10 text-foreground'
                      : 'border-border bg-card text-muted-foreground'
                  )}
                >
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: cat.color }} />
                  {cat.name}
                  {selectedCategories.includes(cat.name) && <Check className="w-3 h-3 ml-auto text-primary" />}
                </button>
              ))}
            </div>
          )}

          {step === 2 && (
            <div className="space-y-3 text-center">
              <div className="flex flex-wrap gap-2 justify-center">
                {DEFAULT_PAYMENT_SETTINGS.map(pm => (
                  <span key={pm.method_key} className="px-3 py-1.5 rounded-full bg-secondary text-xs font-medium text-foreground">
                    {pm.method_name}
                  </span>
                ))}
              </div>
              <p className="text-xs text-muted-foreground">
                Taxas e prazos padrão serão aplicados. Personalize depois em Configurações.
              </p>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-2">
              {BUSINESS_TEMPLATES.map(t => (
                <button
                  key={t.key}
                  onClick={() => setSelectedTemplate(t.key === selectedTemplate ? null : t.key)}
                  className={cn(
                    'w-full flex items-center gap-3 p-3 rounded-xl border-2 text-left transition-all',
                    selectedTemplate === t.key
                      ? 'border-primary bg-primary/10'
                      : 'border-border bg-card'
                  )}
                >
                  <span className="text-xl">{t.label.split(' ')[0]}</span>
                  <div className="flex-1">
                    <span className="font-medium text-sm">{t.label.split(' ').slice(1).join(' ')}</span>
                    <span className="block text-[11px] text-muted-foreground">
                      {t.sectors.length} setores, {t.sectors.reduce((a, s) => a + s.subs.reduce((b, sub) => b + sub.items.length, 0), 0)} itens
                    </span>
                  </div>
                  {selectedTemplate === t.key && <Check className="w-4 h-4 text-primary" />}
                </button>
              ))}
              <p className="text-xs text-muted-foreground text-center pt-1">
                Opcional — você pode criar seus próprios checklists depois.
              </p>
            </div>
          )}
        </Card>

        {/* Navigation */}
        <div className="flex gap-3">
          {step > 0 && (
            <Button variant="outline" className="flex-1" onClick={() => setStep(s => s - 1)}>
              Voltar
            </Button>
          )}
          {step < steps.length - 1 ? (
            <Button
              className="flex-1"
              onClick={() => setStep(s => s + 1)}
              disabled={!canAdvance()}
            >
              Próximo <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          ) : (
            <Button
              className="flex-1"
              onClick={handleFinish}
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Configurando...' : (
                <>
                  <Sparkles className="w-4 h-4 mr-1" /> Começar!
                </>
              )}
            </Button>
          )}
        </div>

        {/* Skip */}
        {step > 0 && step < steps.length - 1 && (
          <button
            onClick={() => setStep(s => s + 1)}
            className="text-xs text-muted-foreground mx-auto block hover:text-foreground transition-colors"
          >
            Pular esta etapa
          </button>
        )}
      </div>
    </div>
  );
}
