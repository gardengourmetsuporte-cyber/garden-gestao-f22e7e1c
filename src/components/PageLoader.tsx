import gardenLogo from "@/assets/logo.png";

export function PageLoader() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center relative bg-background">
      {/* Super subtle center glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[200px] h-[200px] rounded-full pointer-events-none opacity-30" style={{ background: 'radial-gradient(circle, hsl(var(--primary) / 0.3) 0%, transparent 70%)' }} />

      <div className="relative w-16 h-16 flex items-center justify-center">
        {/* Background track */}
        <div className="absolute inset-0 rounded-full border-2 border-primary/10" />

        {/* Rotating ring */}
        <div className="absolute inset-0 rounded-full border-2 border-primary border-t-transparent animate-[spin_1s_ease-in-out_infinite]" />

        {/* Circular Logo Mask */}
        <div className="relative w-12 h-12 rounded-full overflow-hidden bg-card border border-border/30 flex items-center justify-center backdrop-blur-md shadow-[0_0_15px_hsl(var(--primary)/0.15)]">
          <img
            alt="Garden Gestão"
            className="w-full h-full object-cover animate-pulse"
            src={gardenLogo}
            style={{ animationDuration: '2s' }}
            fetchPriority="high"
            decoding="async"
          />
        </div>
      </div>
    </div>
  );
}