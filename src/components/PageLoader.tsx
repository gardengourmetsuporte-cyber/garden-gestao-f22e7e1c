import gardenLogo from "@/assets/logo.png";

export function PageLoader() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#0a1a12] relative">
      {/* Super subtle center glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[150px] h-[150px] bg-emerald-500/20 blur-[60px] rounded-full pointer-events-none" />

      <div className="relative w-16 h-16 flex items-center justify-center">
        {/* Background track */}
        <div className="absolute inset-0 rounded-full border-2 border-emerald-500/10" />

        {/* Rotating ring */}
        <div
          className="absolute inset-0 rounded-full border-2 border-emerald-500 border-t-transparent animate-[spin_1s_ease-in-out_infinite]"
        />

        {/* Circular Logo Mask */}
        <div className="relative w-12 h-12 rounded-full overflow-hidden bg-black/50 border border-white/5 flex items-center justify-center backdrop-blur-md shadow-[0_0_15px_rgba(16,185,129,0.2)]">
          <img
            alt="Garden Gestão"
            className="w-full h-full object-cover animate-pulse"
            src={gardenLogo}
            style={{ animationDuration: '2s' }}
          />
        </div>
      </div>
    </div>
  );
}
