import gardenLogo from "@/assets/logo.png";

export function PageLoader() {
  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center gap-5"
      style={{
        background: 'linear-gradient(135deg, hsl(224 45% 6%) 0%, hsl(220 70% 16%) 18%, hsl(234 75% 28%) 36%, hsl(220 65% 18%) 54%, hsl(228 55% 10%) 72%, hsl(234 75% 26%) 88%, hsl(224 45% 6%) 100%)',
        backgroundSize: '350% 350%',
        animation: 'navyCardFlow 12s ease-in-out infinite',
      }}
    >
      <div className="relative w-16 h-16">
        {/* Outer spinning ring */}
        <div
          className="absolute inset-0 rounded-full animate-spin"
          style={{
            border: '2px solid transparent',
            borderTopColor: 'hsl(220 80% 60%)',
            borderRightColor: 'hsl(220 80% 60% / 0.3)',
            animationDuration: '1.2s',
            filter: 'drop-shadow(0 0 6px hsl(220 80% 60% / 0.4))',
          }}
        />
        {/* Logo */}
        <div className="absolute inset-2 rounded-full overflow-hidden bg-white border border-white/20 flex items-center justify-center">
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
