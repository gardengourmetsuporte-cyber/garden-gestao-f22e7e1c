import gardenLogo from "@/assets/logo.png";

interface PageLoaderProps {
  logoUrl?: string;
}

export function PageLoader({ logoUrl }: PageLoaderProps) {
  const logo = logoUrl || gardenLogo;
  return (
    <div className="min-h-screen flex flex-col items-center justify-center relative bg-background">
      {/* Super subtle center glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[200px] h-[200px] rounded-full pointer-events-none" style={{ background: 'radial-gradient(circle, hsl(var(--primary) / 0.15) 0%, transparent 70%)' }} />

      <div className="relative w-16 h-16 flex items-center justify-center">
        {/* Background track */}
        <div className="absolute inset-0 rounded-full border-2 border-primary/10" />

        {/* Rotating ring */}
        <div
          className="absolute inset-0 rounded-full border-2 border-primary border-t-transparent animate-[spin_1s_ease-in-out_infinite]"
        />

        {/* Circular Logo Mask */}
        <div className="relative w-12 h-12 rounded-full overflow-hidden bg-background/50 border border-border/5 flex items-center justify-center backdrop-blur-md" style={{ boxShadow: '0 0 15px hsl(var(--primary) / 0.2)' }}>
          <img
            alt="Logo"
            className="w-full h-full object-cover animate-pulse"
            src={logo}
            style={{ animationDuration: '2s' }}
          />
        </div>
      </div>
    </div>
  );
}
