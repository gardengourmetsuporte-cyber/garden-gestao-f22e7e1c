import { useNavigate } from 'react-router-dom';
import { AppIcon } from '@/components/ui/app-icon';
import { MODULE_REQUIRED_PLAN, PLANS } from '@/lib/plans';

interface UpgradeWallProps {
  moduleKey: string;
  moduleLabel: string;
}

export function UpgradeWall({ moduleKey, moduleLabel }: UpgradeWallProps) {
  const navigate = useNavigate();
  const requiredPlan = MODULE_REQUIRED_PLAN[moduleKey] || 'pro';
  const plan = PLANS.find(p => p.id === requiredPlan);

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-6 text-center animate-fade-in">
      <div
        className="w-20 h-20 rounded-full flex items-center justify-center mb-6"
        style={{
          background: 'hsl(var(--primary) / 0.1)',
          border: '2px solid hsl(var(--primary) / 0.3)',
          boxShadow: '0 0 30px hsl(var(--primary) / 0.15)',
        }}
      >
        <AppIcon name="Lock" size={36} className="text-primary" />
      </div>

      <h2 className="text-2xl font-bold text-foreground mb-2">
        {moduleLabel}
      </h2>
      <p className="text-muted-foreground text-sm max-w-xs mb-6">
        Este recurso está disponível no plano <span className="font-semibold text-primary">{plan?.name || 'Premium'}</span>.
        Desbloqueie para acessar funcionalidades avançadas.
      </p>

      {plan && (
        <div className="mb-6 text-left w-full max-w-xs">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
            O que você ganha:
          </p>
          <ul className="space-y-2">
            {plan.features.slice(0, 5).map(f => (
              <li key={f} className="flex items-center gap-2 text-sm text-muted-foreground">
                <AppIcon name="Check" size={14} className="shrink-0" style={{ color: 'hsl(var(--neon-green))' }} />
                {f}
              </li>
            ))}
          </ul>
        </div>
      )}

      <button
        onClick={() => navigate('/plans')}
        className="h-12 px-8 rounded-xl font-semibold text-sm transition-all hover:scale-[1.02] active:scale-[0.98]"
        style={{
          background: 'linear-gradient(135deg, hsl(var(--primary)), hsl(var(--neon-cyan)))',
          color: 'white',
          boxShadow: '0 0 20px hsl(var(--neon-cyan) / 0.3)',
        }}
      >
        Ver Planos
      </button>
    </div>
  );
}
