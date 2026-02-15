interface FrameProps {
  size: number;
  children: React.ReactNode;
}

export function MiticoFrame({ size, children }: FrameProps) {
  const frameSize = size * 1.55;
  const offset = (frameSize - size) / 2;

  return (
    <div className="relative" style={{ width: frameSize, height: frameSize }}>
      <svg
        className="absolute inset-0"
        width={frameSize}
        height={frameSize}
        viewBox="0 0 155 155"
        fill="none"
      >
        <defs>
          <filter id="mitico-glow">
            <feGaussianBlur stdDeviation="4" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <linearGradient id="mitico-rainbow" x1="0" y1="0" x2="1" y2="1" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="hsl(var(--neon-cyan))" />
            <stop offset="25%" stopColor="hsl(var(--neon-purple))" />
            <stop offset="50%" stopColor="hsl(var(--neon-amber))" />
            <stop offset="75%" stopColor="hsl(var(--neon-red))" />
            <stop offset="100%" stopColor="hsl(var(--neon-cyan))" />
          </linearGradient>
        </defs>
        {/* Rainbow ring */}
        <circle
          className="rank-mitico-ring"
          cx="77.5"
          cy="77.5"
          r="60"
          stroke="url(#mitico-rainbow)"
          strokeWidth="3"
          fill="none"
          opacity="0.6"
          filter="url(#mitico-glow)"
        />
        {/* Halo */}
        <ellipse
          className="rank-halo"
          cx="77.5"
          cy="12"
          rx="18"
          ry="6"
          stroke="hsl(var(--neon-purple))"
          strokeWidth="1.5"
          fill="none"
          opacity="0.5"
          filter="url(#mitico-glow)"
        />
        {/* Large left wing */}
        <g className="rank-wing rank-wing-left" filter="url(#mitico-glow)">
          <path
            d="M15 78 C8 55, -2 40, -5 25 C-6 18, 2 15, 6 22 C10 29, 8 45, 12 55 C10 42, 4 30, 3 20 C2 14, 9 14, 11 22 C13 30, 13 48, 15 60 Z"
            fill="hsl(var(--neon-purple))"
            opacity="0.4"
          />
          <path
            d="M17 74 C12 58, 5 48, 2 35 C0 28, 7 28, 9 34 C11 40, 12 55, 17 66 Z"
            fill="hsl(var(--neon-cyan))"
            opacity="0.25"
          />
        </g>
        {/* Large right wing */}
        <g className="rank-wing rank-wing-right" filter="url(#mitico-glow)">
          <path
            d="M140 78 C147 55, 157 40, 160 25 C161 18, 153 15, 149 22 C145 29, 147 45, 143 55 C145 42, 151 30, 152 20 C153 14, 146 14, 144 22 C142 30, 142 48, 140 60 Z"
            fill="hsl(var(--neon-purple))"
            opacity="0.4"
          />
          <path
            d="M138 74 C143 58, 150 48, 153 35 C155 28, 148 28, 146 34 C144 40, 143 55, 138 66 Z"
            fill="hsl(var(--neon-cyan))"
            opacity="0.25"
          />
        </g>
      </svg>
      <div className="absolute" style={{ top: offset, left: offset, width: size, height: size }}>
        {children}
      </div>
    </div>
  );
}
