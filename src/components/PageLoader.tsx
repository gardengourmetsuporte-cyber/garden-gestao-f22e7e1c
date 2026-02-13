export function PageLoader() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background gap-5">
      <div className="relative w-16 h-16">
        {/* Outer spinning ring */}
        <div
          className="absolute inset-0 rounded-full animate-spin"
          style={{
            border: '2px solid transparent',
            borderTopColor: 'hsl(var(--neon-cyan))',
            borderRightColor: 'hsl(var(--neon-cyan) / 0.3)',
            animationDuration: '1.2s',
            filter: 'drop-shadow(0 0 6px hsl(var(--neon-cyan) / 0.4))',
          }}
        />
        {/* Logo */}
        <div className="absolute inset-2 rounded-full overflow-hidden bg-card border border-border/30">
          <img
            alt="Logo"
            className="w-full h-full object-contain"
            src="/lovable-uploads/de20fd02-0c1c-4431-a4da-9c4611d2eb0e.jpg"
          />
        </div>
      </div>
      <p className="text-xs text-muted-foreground font-medium tracking-wider uppercase animate-pulse">
        Carregando...
      </p>
    </div>
  );
}
