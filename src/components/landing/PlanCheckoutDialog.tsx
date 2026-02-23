import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { X, Check, ArrowRight, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

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
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const price = yearly ? plan.yearly : plan.monthly;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (plan.id === "free") {
      navigate(`/auth?plan=${plan.id}&billing=${yearly ? "yearly" : "monthly"}`);
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("stripe-checkout", {
        body: {
          planId: plan.id,
          billing: yearly ? "yearly" : "monthly",
          email,
        },
      });

      if (error) throw error;
      if (!data?.url) throw new Error("URL de checkout não retornada");

      window.location.href = data.url;
    } catch (err: any) {
      console.error("Stripe checkout error:", err);
      toast.error("Erro ao iniciar pagamento. Tente novamente.");
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div
        className="relative w-full max-w-md rounded-2xl p-6 space-y-6 animate-slide-up"
        style={{
          background: "hsl(var(--card))",
          border: "1px solid hsl(var(--neon-cyan) / 0.25)",
          boxShadow: "0 0 60px hsl(var(--neon-cyan) / 0.15), var(--shadow-elevated)",
        }}
      >
        <button onClick={onClose} className="absolute top-4 right-4 text-muted-foreground hover:text-foreground">
          <X className="w-5 h-5" />
        </button>

        <div>
          <h3 className="text-xl font-bold text-foreground">Plano {plan.name}</h3>
          <p className="text-muted-foreground text-sm mt-1">
            R$ {price}/mês {yearly && <span className="text-xs" style={{ color: "hsl(var(--neon-green))" }}>(anual -20%)</span>}
          </p>
        </div>

        <ul className="space-y-2 border-y border-border/40 py-4">
          {plan.features.slice(0, 5).map((f) => (
            <li key={f} className="flex items-center gap-2 text-sm text-muted-foreground">
              <Check className="w-4 h-4 shrink-0" style={{ color: "hsl(var(--neon-green))" }} />
              {f}
            </li>
          ))}
          {plan.features.length > 5 && (
            <li className="text-xs text-muted-foreground/70">+ {plan.features.length - 5} recursos inclusos</li>
          )}
        </ul>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-sm text-muted-foreground font-medium">Nome</label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Seu nome"
              required
              className="mt-1 h-11 bg-secondary/30 border-border/30"
            />
          </div>
          <div>
            <label className="text-sm text-muted-foreground font-medium">Email</label>
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="seu@email.com"
              required
              className="mt-1 h-11 bg-secondary/30 border-border/30"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full h-12 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-all hover:scale-[1.01] active:scale-[0.98] disabled:opacity-70 disabled:pointer-events-none"
            style={{
              background: "linear-gradient(135deg, hsl(var(--primary)), hsl(var(--neon-cyan)))",
              color: "white",
              boxShadow: "0 0 20px hsl(var(--neon-cyan) / 0.3)",
            }}
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Redirecionando...
              </>
            ) : (
              <>
                {plan.id === "free" ? "Criar conta grátis" : "Ir para pagamento"}
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
