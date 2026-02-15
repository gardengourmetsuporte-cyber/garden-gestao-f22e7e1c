interface FrameProps {
  size: number;
  children: React.ReactNode;
}

export function MestreFrame({ size, children }: FrameProps) {
  const frameSize = size * 1.5;
  const offset = (frameSize - size) / 2;

  return (
    <div className="relative" style={{ width: frameSize, height: frameSize }}>
      <svg
        className="absolute inset-0"
        width={frameSize}
        height={frameSize}
        viewBox="0 0 150 150"
        fill="none"
      >
        <defs>
          <filter id="mestre-glow">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <linearGradient id="mestre-gold" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="hsl(45 90% 55%)" />
            <stop offset="50%" stopColor="hsl(38 92% 50%)" />
            <stop offset="100%" stopColor="hsl(30 85% 45%)" />
          </linearGradient>
        </defs>
        {/* Main golden ring */}
        <circle
          cx="75"
          cy="75"
          r="58"
          stroke="url(#mestre-gold)"
          strokeWidth="3"
          fill="none"
          opacity="0.6"
          filter="url(#mestre-glow)"
        />
        {/* Crown */}
        <g className="rank-crown" filter="url(#mestre-glow)">
          <path
            d="M55 18 L60 8 L67 15 L75 4 L83 15 L90 8 L95 18 L90 22 L60 22 Z"
            fill="hsl(var(--neon-amber))"
            opacity="0.7"
          />
          {/* Crown jewel dots */}
          <circle cx="75" cy="9" r="1.5" fill="hsl(0 0% 100%)" opacity="0.8" />
          <circle cx="63" cy="13" r="1" fill="hsl(0 0% 100%)" opacity="0.5" />
          <circle cx="87" cy="13" r="1" fill="hsl(0 0% 100%)" opacity="0.5" />
        </g>
        {/* Orbit particles */}
        <circle className="rank-orbit-particle rank-orbit-1" cx="75" cy="10" r="2.5" fill="hsl(var(--neon-amber))" opacity="0.7" />
        <circle className="rank-orbit-particle rank-orbit-2" cx="75" cy="10" r="2" fill="hsl(var(--neon-amber))" opacity="0.5" />
        <circle className="rank-orbit-particle rank-orbit-3" cx="75" cy="10" r="1.5" fill="hsl(var(--neon-amber))" opacity="0.4" />
        {/* Shield bottom accent */}
        <path
          d="M60 130 L75 140 L90 130"
          stroke="hsl(var(--neon-amber))"
          strokeWidth="1.5"
          fill="none"
          opacity="0.3"
        />
      </svg>
      <div className="absolute" style={{ top: offset, left: offset, width: size, height: size }}>
        {children}
      </div>
    </div>
  );
}
