import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { AppIcon } from '@/components/ui/app-icon';
import { Button } from '@/components/ui/button';

interface TourStep {
  title: string;
  description: string;
  icon: string;
  route?: string;
}

const TOUR_STEPS: TourStep[] = [
  { title: 'Dashboard', description: 'Visão geral do seu negócio: saldo, vendas, checklists e ranking.', icon: 'LayoutDashboard', route: '/' },
  { title: 'Financeiro', description: 'Controle receitas, despesas, contas bancárias e fluxo de caixa.', icon: 'DollarSign', route: '/finance' },
  { title: 'Estoque', description: 'Gerencie itens, faça lançamentos e receba alertas de estoque baixo.', icon: 'Package', route: '/inventory' },
  { title: 'Checklists', description: 'Tarefas de abertura e fechamento para manter a operação em dia.', icon: 'CheckCircle', route: '/checklists' },
  { title: 'Equipe', description: 'Cadastre funcionários, controle pagamentos, escalas e pontuação.', icon: 'Users', route: '/employees' },
  { title: 'Cardápio Digital', description: 'Configure seu cardápio, QR codes das mesas e receba pedidos.', icon: 'UtensilsCrossed', route: '/cardapio' },
  { title: 'Configurações', description: 'Personalize categorias, métodos de pagamento, convites e mais.', icon: 'Settings', route: '/settings' },
];

const TOUR_KEY = 'guided-tour-completed';
const TOUR_DB_KEY = 'guided_tour_completed';

export function GuidedTour() {
  const [step, setStep] = useState(0);
  const [visible, setVisible] = useState(false);
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    if (!user) return;

    // Check both localStorage AND database
    const localCompleted = localStorage.getItem(TOUR_KEY);
    if (localCompleted) return;

    // Check DB preference
    supabase
      .from('copilot_preferences')
      .select('id')
      .eq('user_id', user.id)
      .eq('key', TOUR_DB_KEY)
      .maybeSingle()
      .then(({ data }) => {
        if (data) {
          // Already completed in DB, sync localStorage
          localStorage.setItem(TOUR_KEY, 'true');
        } else {
          // Not completed — show tour after delay
          setTimeout(() => setVisible(true), 2000);
        }
      });
  }, [user]);

  const handleNext = () => {
    if (step < TOUR_STEPS.length - 1) {
      setStep(step + 1);
    } else {
      handleFinish();
    }
  };

  const handleFinish = () => {
    localStorage.setItem(TOUR_KEY, 'true');
    setVisible(false);

    // Persist to DB so it never shows again
    if (user) {
      supabase.from('copilot_preferences').insert({
        user_id: user.id,
        key: TOUR_DB_KEY,
        value: 'true',
        category: 'onboarding',
      }).then(() => {});
    }
  };

  const handleGoTo = () => {
    const route = TOUR_STEPS[step].route;
    if (route) navigate(route);
    handleNext();
  };

  if (!visible) return null;

  const current = TOUR_STEPS[step];
  const progress = ((step + 1) / TOUR_STEPS.length) * 100;

  return (
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in">
      <div className="w-full max-w-md mx-4 mb-4 sm:mb-0 bg-card rounded-2xl shadow-2xl border border-border/50 overflow-hidden">
        <div className="h-1 bg-secondary">
          <div className="h-full bg-primary transition-all duration-500" style={{ width: `${progress}%` }} />
        </div>
        <div className="p-6 text-center space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto">
            <AppIcon name={current.icon} size={32} className="text-primary" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-foreground">{current.title}</h3>
            <p className="text-sm text-muted-foreground mt-1">{current.description}</p>
          </div>
          <div className="flex items-center justify-center gap-1.5">
            {TOUR_STEPS.map((_, i) => (
              <div key={i} className={`w-2 h-2 rounded-full transition-all ${i === step ? 'bg-primary w-6' : i < step ? 'bg-primary/40' : 'bg-muted'}`} />
            ))}
          </div>
          <div className="flex gap-2">
            <Button variant="ghost" onClick={handleFinish} className="flex-1 text-xs">Pular tour</Button>
            <Button variant="outline" onClick={handleGoTo} className="flex-1 text-xs gap-1">
              <AppIcon name="ExternalLink" size={12} /> Visitar
            </Button>
            <Button onClick={handleNext} className="flex-1 text-xs">{step < TOUR_STEPS.length - 1 ? 'Próximo' : 'Concluir'}</Button>
          </div>
        </div>
      </div>
    </div>
  );
}

export function useResetTour() {
  const { user } = useAuth();
  return () => {
    localStorage.removeItem(TOUR_KEY);
    if (user) {
      supabase.from('copilot_preferences').delete().eq('user_id', user.id).eq('key', TOUR_DB_KEY).then(() => {});
    }
    window.location.reload();
  };
}
