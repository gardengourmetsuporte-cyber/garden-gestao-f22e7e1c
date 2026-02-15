interface FrameProps {
  size: number;
  children: React.ReactNode;
}

export function LendaFrame({ size, children }: FrameProps) {
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
          <filter id="lenda-glow">
            <feGaussianBlur stdDeviation="3.5" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <linearGradient id="lenda-fire" x1="0" y1="1" x2="0" y2="0">
            <stop offset="0%" stopColor="hsl(var(--neon-red))" />
            <stop offset="60%" stopColor="hsl(var(--neon-amber))" />
            <stop offset="100%" stopColor="hsl(45 100% 70%)" />
          </linearGradient>
        </defs>
        {/* Main ring */}
        <circle
          cx="75"
          cy="75"
          r="57"
          stroke="hsl(var(--neon-red))"
          strokeWidth="2.5"
          fill="none"
          opacity="0.5"
          filter="url(#lenda-glow)"
        />
        {/* Flame left */}
        <g className="rank-flame rank-flame-left" filter="url(#lenda-glow)">
          <path
            d="M20 75 C16 60, 8 55, 10 42 C12 35, 18 40, 16 50 C14 55, 20 58, 18 65 Z"
            fill="url(#lenda-fire)"
            opacity="0.55"
          />
          <path
            d="M22 80 C18 68, 12 62, 14 52 C15 47, 20 50, 19 56 C18 60, 22 64, 21 72 Z"
            fill="url(#lenda-fire)"
            opacity="0.35"
          />
        </g>
        {/* Flame right */}
        <g className="rank-flame rank-flame-right" filter="url(#lenda-glow)">
          <path
            d="M130 75 C134 60, 142 55, 140 42 C138 35, 132 40, 134 50 C136 55, 130 58, 132 65 Z"
            fill="url(#lenda-fire)"
            opacity="0.55"
          />
          <path
            d="M128 80 C132 68, 138 62, 136 52 C135 47, 130 50, 131 56 C132 60, 128 64, 129 72 Z"
            fill="url(#lenda-fire)"
            opacity="0.35"
          />
        </g>
        {/* Flame top */}
        <g className="rank-flame rank-flame-top" filter="url(#lenda-glow)">
          <path
            d="M75 18 C68 12, 66 4, 70 0 C73 -2, 75 3, 75 8 C75 3, 77 -2, 80 0 C84 4, 82 12, 75 18 Z"
            fill="url(#lenda-fire)"
            opacity="0.6"
          />
        </g>
        {/* Spikes */}
        <path d="M75 10 L77 16 L75 14 L73 16 Z" fill="hsl(var(--neon-red))" opacity="0.4" />
        <path d="M20 40 L26 42 L24 44 Z" fill="hsl(var(--neon-red))" opacity="0.3" />
        <path d="M130 40 L124 42 L126 44 Z" fill="hsl(var(--neon-red))" opacity="0.3" />
      </svg>
      <div className="absolute" style={{ top: offset, left: offset, width: size, height: size }}>
        {children}
      </div>
    </div>
  );
}
