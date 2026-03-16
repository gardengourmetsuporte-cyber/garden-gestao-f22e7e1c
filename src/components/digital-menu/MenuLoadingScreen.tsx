import gardenLogo from "@/assets/logo.png";

interface Props {
  message?: string;
  logoUrl?: string | null;
}

export function MenuLoadingScreen({ message = 'Carregando...', logoUrl }: Props) {
  const logo = logoUrl || gardenLogo;

  return (
    <div className="min-h-[100dvh] flex flex-col items-center justify-center bg-background gap-6">
      {/* Subtle glow */}
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[220px] h-[220px] rounded-full pointer-events-none opacity-25"
        style={{ background: 'radial-gradient(circle, hsl(var(--primary) / 0.35) 0%, transparent 70%)' }}
      />

      {/* Logo with spinner ring */}
      <div className="relative w-20 h-20 flex items-center justify-center">
        {/* Background track */}
        <div className="absolute inset-0 rounded-full border-2 border-primary/10" />

        {/* Rotating ring */}
        <div className="absolute inset-0 rounded-full border-2 border-primary border-t-transparent animate-[spin_1s_ease-in-out_infinite]" />

        {/* Logo */}
        <div className="relative w-14 h-14 rounded-full overflow-hidden bg-card border border-border/30 flex items-center justify-center shadow-[0_0_20px_hsl(var(--primary)/0.15)]">
          <img
            alt="Logo"
            className="w-full h-full object-cover"
            src={logo}
            fetchPriority="high"
            decoding="async"
          />
        </div>
      </div>

      {/* Message */}
      <p className="text-sm text-muted-foreground font-medium animate-pulse">
        {message}
      </p>
    </div>
  );
}
