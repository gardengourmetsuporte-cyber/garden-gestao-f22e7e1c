interface FrameProps {
  size: number;
  children: React.ReactNode;
}

export function VeteranoFrame({ size, children }: FrameProps) {
  const frameSize = size * 1.45;
  const offset = (frameSize - size) / 2;

  return (
    <div className="relative" style={{ width: frameSize, height: frameSize }}>
      <svg
        className="absolute inset-0"
        width={frameSize}
        height={frameSize}
        viewBox="0 0 145 145"
        fill="none"
      >
        <defs>
          <filter id="veterano-glow">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        {/* Main ring */}
        <circle
          cx="72.5"
          cy="72.5"
          r="55"
          stroke="hsl(var(--neon-purple))"
          strokeWidth="2.5"
          fill="none"
          opacity="0.4"
          filter="url(#veterano-glow)"
        />
        {/* Outer decorative ring */}
        <circle
          cx="72.5"
          cy="72.5"
          r="62"
          stroke="hsl(var(--neon-purple))"
          strokeWidth="0.8"
          fill="none"
          opacity="0.2"
          strokeDasharray="8 4"
        />
        {/* Left wing */}
        <g className="rank-wing rank-wing-left" filter="url(#veterano-glow)">
          <path
            d="M15 72 C10 55, 2 45, 0 35 C-1 28, 5 25, 10 30 C15 35, 12 50, 15 60 Z"
            fill="hsl(var(--neon-purple))"
            opacity="0.45"
          />
          <path
            d="M18 68 C14 58, 8 50, 5 42 C3 37, 8 36, 11 40 C14 44, 14 56, 18 64 Z"
            fill="hsl(var(--neon-purple))"
            opacity="0.3"
          />
        </g>
        {/* Right wing */}
        <g className="rank-wing rank-wing-right" filter="url(#veterano-glow)">
          <path
            d="M130 72 C135 55, 143 45, 145 35 C146 28, 140 25, 135 30 C130 35, 133 50, 130 60 Z"
            fill="hsl(var(--neon-purple))"
            opacity="0.45"
          />
          <path
            d="M127 68 C131 58, 137 50, 140 42 C142 37, 137 36, 134 40 C131 44, 131 56, 127 64 Z"
            fill="hsl(var(--neon-purple))"
            opacity="0.3"
          />
        </g>
      </svg>
      <div className="absolute" style={{ top: offset, left: offset, width: size, height: size }}>
        {children}
      </div>
    </div>
  );
}
