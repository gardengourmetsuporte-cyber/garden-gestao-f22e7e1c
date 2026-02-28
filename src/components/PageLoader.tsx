import gardenLogo from "@/assets/logo.png";

export function PageLoader() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-5 bg-background relative overflow-hidden">
      {/* Ambient Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] bg-primary/10 blur-[100px] rounded-full pointer-events-none" />

      <div className="card-surface p-8 flex flex-col items-center justify-center gap-6 relative z-10 min-w-[200px] shadow-2xl">
        <div className="relative w-20 h-20 flex items-center justify-center">
          {/* Outer glow pulse */}
          <div className="absolute inset-0 rounded-full bg-primary/20 animate-ping" style={{ animationDuration: '2s' }} />

          {/* Inner spinning ring */}
          <div
            className="absolute inset-x-0 inset-y-0 rounded-full animate-spin"
            style={{
              border: '2px solid transparent',
              borderTopColor: 'hsl(var(--primary))',
              borderRightColor: 'hsl(var(--primary) / 0.3)',
              animationDuration: '1s',
              filter: 'drop-shadow(0 0 8px hsl(var(--primary) / 0.5))',
            }}
          />
          {/* Logo container */}
          <div className="relative w-14 h-14 rounded-full overflow-hidden bg-black/40 border border-white/10 flex items-center justify-center backdrop-blur-xl">
            <img
              alt="Garden Gestão"
              className="w-8 h-8 object-contain"
              src={gardenLogo}
            />
          </div>
        </div>
        <div className="text-center">
          <p className="text-sm font-bold text-foreground font-display tracking-tight">Carregando...</p>
          <p className="text-[10px] text-muted-foreground mt-1">Preparando o seu ambiente</p>
        </div>
      </div>
    </div>
  );
}
