import { useNavigate } from "react-router-dom";
import { AppIcon } from "@/components/ui/app-icon";

interface PlanCheckoutDialogProps {
  plan: {
    id: string;
    name: string;
    monthly: number;
    yearly: number;
    features: string[];
  };
  yearly: boolean;
  onClose: () => void;
}

export function PlanCheckoutDialog({ plan, yearly, onClose }: PlanCheckoutDialogProps) {
  const navigate = useNavigate();
  const price = yearly ? plan.yearly : plan.monthly;
  const billing = yearly ? "yearly" : "monthly";

  const handleStart = () => {
    navigate(`/auth?plan=${plan.id}&billing=${billing}`);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md card-surface p-6 space-y-5 animate-slide-up">
        <button onClick={onClose} className="absolute top-4 right-4 text-muted-foreground hover:text-foreground">
          <AppIcon name="X" size={20} />
        </button>

        <div>
          <h3 className="text-xl font-bold text-foreground">Plano {plan.name}</h3>
          <div className="flex items-baseline gap-1 mt-2">
            <span className="text-3xl font-extrabold text-foreground">R$ {price}</span>
            <span className="text-muted-foreground text-sm">/mês</span>
            {yearly && (
              <span className="ml-2 text-xs font-semibold px-2 py-0.5 rounded-full" style={{ background: "hsl(var(--primary) / 0.12)", color: "hsl(var(--primary))" }}>
                -20%
              </span>
            )}
          </div>
        </div>

        <ul className="space-y-2.5 border-y border-border/40 py-4">
          {plan.features.slice(0, 5).map((f) => (
            <li key={f} className="flex items-center gap-2.5 text-sm text-muted-foreground">
              <AppIcon name="Check" size={16} className="shrink-0 text-success" />
              {f}
            </li>
          ))}
          {plan.features.length > 5 && (
            <li className="text-xs text-muted-foreground/60 pl-6">+ {plan.features.length - 5} recursos inclusos</li>
          )}
        </ul>

        <div className="space-y-3">
          <button
            onClick={handleStart}
            className="w-full h-12 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-all hover:scale-[1.01] active:scale-[0.98]"
            style={{
              background: "var(--gradient-brand)",
              color: "white",
              boxShadow: "0 4px 16px hsl(156 50% 18% / 0.3)",
            }}
          >
            Começar 14 dias grátis
            <AppIcon name="ArrowRight" size={16} />
          </button>

          <div className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground/60">
            <AppIcon name="Shield" size={12} />
            <span>Sem cartão de crédito • Cancele quando quiser</span>
          </div>
        </div>
      </div>
    </div>
  );
}
