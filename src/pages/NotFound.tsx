import { useLocation } from "react-router-dom";
import { useEffect } from "react";
import { AlertTriangle } from "lucide-react";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-6">
      <div className="text-center max-w-sm">
        <div
          className="w-20 h-20 rounded-2xl mx-auto mb-6 flex items-center justify-center"
          style={{
            background: 'linear-gradient(135deg, hsl(var(--neon-amber) / 0.15), hsl(var(--neon-amber) / 0.05))',
            border: '1px solid hsl(var(--neon-amber) / 0.25)',
            boxShadow: '0 0 30px hsl(var(--neon-amber) / 0.1)',
          }}
        >
          <AlertTriangle className="w-9 h-9" style={{ color: 'hsl(var(--neon-amber))' }} />
        </div>
        <h1
          className="text-6xl font-black tracking-tighter mb-2"
          style={{
            background: 'linear-gradient(135deg, hsl(var(--neon-amber)), hsl(var(--neon-red)))',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}
        >
          404
        </h1>
        <p className="text-foreground font-semibold text-lg mb-1">Página não encontrada</p>
        <p className="text-muted-foreground text-sm mb-8">
          O endereço <code className="px-1.5 py-0.5 rounded bg-secondary text-xs font-mono">{location.pathname}</code> não existe.
        </p>
        <a
          href="/"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold transition-all active:scale-95"
          style={{
            background: 'linear-gradient(135deg, hsl(var(--primary) / 0.15), hsl(var(--neon-cyan) / 0.08))',
            border: '1px solid hsl(var(--neon-cyan) / 0.25)',
            color: 'hsl(var(--neon-cyan))',
            boxShadow: '0 0 20px hsl(var(--neon-cyan) / 0.1)',
          }}
        >
          Voltar ao Dashboard
        </a>
      </div>
    </div>
  );
};

export default NotFound;
