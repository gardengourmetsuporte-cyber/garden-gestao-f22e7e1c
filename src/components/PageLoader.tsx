import gardenLogo from "@/assets/logo.png";

const particles = Array.from({ length: 6 }, (_, i) => i);

export function PageLoader() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-black">
      <div className="relative flex items-center justify-center">
        {/* Glow pulse */}
        <div className="absolute w-32 h-32 rounded-full animate-[loader-glow_2.5s_ease-in-out_infinite]" style={{ background: 'radial-gradient(circle, hsl(156 60% 35% / 0.25) 0%, transparent 70%)' }} />

        {/* Floating particles */}
        {particles.map((i) => (
          <span
            key={i}
            className="absolute w-1.5 h-1.5 rounded-full bg-emerald-400/40 animate-[loader-float_3s_ease-in-out_infinite]"
            style={{
              left: `${30 + i * 12}%`,
              bottom: '20%',
              animationDelay: `${i * 0.45}s`,
            }}
          />
        ))}

        {/* Logo with sway */}
        <img
          src={gardenLogo}
          alt="Garden"
          className="relative w-20 h-20 object-contain animate-[loader-sway_3s_ease-in-out_infinite]"
          style={{ transformOrigin: '50% 70%' }}
        />
      </div>
    </div>
  );
}
