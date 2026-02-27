import gardenLogo from "@/assets/logo.png";

export function PageLoader() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-5 bg-background">
      <div className="relative w-16 h-16">
        {/* Outer spinning ring */}
        <div
          className="absolute inset-0 rounded-full animate-spin"
          style={{
          border: '2px solid transparent',
            borderTopColor: 'hsl(215 50% 24%)',
            borderRightColor: 'hsl(215 50% 24% / 0.3)',
            animationDuration: '1.2s',
            filter: 'drop-shadow(0 0 6px hsl(215 50% 24% / 0.4))',
          }}
        />
        {/* Logo */}
        <div className="absolute inset-2 rounded-full overflow-hidden bg-white dark:bg-white/10 border border-border/20 flex items-center justify-center">
          <img
            alt="Garden Gestão"
            className="w-full h-full object-contain rounded-full p-1"
            src={gardenLogo}
          />
        </div>
      </div>
    </div>
  );
}
