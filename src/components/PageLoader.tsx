import gardenLogo from "@/assets/logo.png";

export function PageLoader() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-black relative overflow-hidden">
      {/* Radial ambient background */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 60% 50% at 50% 45%, hsl(156 50% 12% / 0.5) 0%, transparent 70%)",
        }}
      />

      {/* Morphing glow blob behind logo */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-44 h-44 pointer-events-none loader-blob" />

      {/* Orbiting ring */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-36 h-36 rounded-full border border-emerald-500/15 loader-orbit-ring" />

      {/* Orbiting dot */}
      <div className="absolute top-1/2 left-1/2 w-36 h-36 -translate-x-1/2 -translate-y-1/2 loader-orbit-dot">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_12px_hsl(156_72%_50%/0.8)]" />
      </div>

      {/* Logo container */}
      <div className="relative z-10 flex flex-col items-center gap-6">
        <div className="w-24 h-24 rounded-[1.75rem] overflow-hidden flex items-center justify-center loader-logo-entrance bg-white shadow-[0_0_60px_hsl(156_60%_40%/0.25),0_20px_50px_rgba(0,0,0,0.6)]">
          <img
            src={gardenLogo}
            alt="Garden"
            className="w-[85%] h-[85%] object-contain"
          />
        </div>

        {/* Progress bar */}
        <div className="w-20 h-[3px] rounded-full bg-white/10 overflow-hidden">
          <div className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-emerald-300 loader-progress" />
        </div>
      </div>
    </div>
  );
}
