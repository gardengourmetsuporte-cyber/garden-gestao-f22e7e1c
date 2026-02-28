import gardenLogo from "@/assets/logo.png";

export function PageLoader() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background relative overflow-hidden">
      {/* Super subtle center glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[250px] h-[250px] bg-primary/10 blur-[80px] rounded-full pointer-events-none" />

      <div className="relative z-10 flex flex-col items-center gap-6">
        <div className="relative w-16 h-16 flex items-center justify-center">
          {/* Outer glow ring */}
          <div className="absolute inset-0 rounded-full border border-primary/20 animate-[spin_3s_linear_infinite]" />
          <div className="absolute inset-[-4px] rounded-full border-t border-primary/40 animate-[spin_2s_ease-in-out_infinite]" />

          <img
            alt="Garden Gestão"
            className="w-10 h-10 object-contain drop-shadow-[0_0_8px_rgba(16,185,129,0.5)] animate-pulse"
            src={gardenLogo}
            style={{ animationDuration: '2s' }}
          />
        </div>

        <div className="flex flex-col items-center">
          <p className="text-xs font-medium text-foreground tracking-widest uppercase opacity-80" style={{ letterSpacing: '0.15em' }}>Garden</p>
          <div className="mt-3 flex gap-1">
            <div className="w-1 h-1 rounded-full bg-primary/60 animate-bounce" style={{ animationDelay: '0ms' }} />
            <div className="w-1 h-1 rounded-full bg-primary/60 animate-bounce" style={{ animationDelay: '150ms' }} />
            <div className="w-1 h-1 rounded-full bg-primary/60 animate-bounce" style={{ animationDelay: '300ms' }} />
          </div>
        </div>
      </div>
    </div>
  );
}
