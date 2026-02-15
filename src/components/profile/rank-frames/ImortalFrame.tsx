interface FrameProps {
  size: number;
  children: React.ReactNode;
}

export function ImortalFrame({ size, children }: FrameProps) {
  const frameSize = size * 1.6;
  const offset = (frameSize - size) / 2;

  return (
    <div className="relative" style={{ width: frameSize, height: frameSize }}>
      <svg
        className="absolute inset-0"
        width={frameSize}
        height={frameSize}
        viewBox="0 0 160 160"
        fill="none"
      >
        <defs>
          <filter id="imortal-glow">
            <feGaussianBlur stdDeviation="4.5" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <linearGradient id="imortal-prisma" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="hsl(200 90% 75%)" />
            <stop offset="33%" stopColor="hsl(280 80% 75%)" />
            <stop offset="66%" stopColor="hsl(340 80% 75%)" />
            <stop offset="100%" stopColor="hsl(60 80% 75%)" />
          </linearGradient>
          <linearGradient id="imortal-diamond" x1="0.5" y1="0" x2="0.5" y2="1">
            <stop offset="0%" stopColor="hsl(200 80% 85%)" />
            <stop offset="100%" stopColor="hsl(260 60% 80%)" />
          </linearGradient>
        </defs>
        {/* Prismatic outer ring */}
        <circle
          className="rank-imortal-ring"
          cx="80"
          cy="80"
          r="65"
          stroke="url(#imortal-prisma)"
          strokeWidth="2.5"
          fill="none"
          opacity="0.5"
          filter="url(#imortal-glow)"
        />
        {/* Inner shimmer ring */}
        <circle
          className="rank-imortal-inner"
          cx="80"
          cy="80"
          r="58"
          stroke="url(#imortal-diamond)"
          strokeWidth="1"
          fill="none"
          opacity="0.3"
          strokeDasharray="6 3"
        />
        {/* Diamond wing left */}
        <g className="rank-wing rank-wing-left" filter="url(#imortal-glow)">
          <path
            d="M12 80 C5 55, -8 35, -10 18 C-11 10, -2 8, 2 16 C6 24, 3 42, 8 55 C5 38, -2 22, -3 12 C-4 6, 4 6, 6 14 C8 22, 8 45, 12 62 Z"
            fill="url(#imortal-diamond)"
            opacity="0.4"
          />
          <path
            d="M14 76 C8 58, -1 44, -4 28 C-6 20, 3 20, 5 28 C7 36, 8 55, 14 68 Z"
            fill="hsl(200 80% 80%)"
            opacity="0.25"
          />
        </g>
        {/* Diamond wing right */}
        <g className="rank-wing rank-wing-right" filter="url(#imortal-glow)">
          <path
            d="M148 80 C155 55, 168 35, 170 18 C171 10, 162 8, 158 16 C154 24, 157 42, 152 55 C155 38, 162 22, 163 12 C164 6, 156 6, 154 14 C152 22, 152 45, 148 62 Z"
            fill="url(#imortal-diamond)"
            opacity="0.4"
          />
          <path
            d="M146 76 C152 58, 161 44, 164 28 C166 20, 157 20, 155 28 C153 36, 152 55, 146 68 Z"
            fill="hsl(200 80% 80%)"
            opacity="0.25"
          />
        </g>
        {/* Floating crystals */}
        <g className="rank-crystal rank-crystal-1">
          <polygon points="80,2 83,10 80,8 77,10" fill="hsl(200 80% 80%)" opacity="0.7" />
        </g>
        <g className="rank-crystal rank-crystal-2">
          <polygon points="25,30 28,36 25,34 22,36" fill="hsl(280 80% 75%)" opacity="0.5" />
        </g>
        <g className="rank-crystal rank-crystal-3">
          <polygon points="135,30 138,36 135,34 132,36" fill="hsl(340 80% 75%)" opacity="0.5" />
        </g>
        <g className="rank-crystal rank-crystal-4">
          <polygon points="80,155 83,149 80,151 77,149" fill="hsl(60 80% 75%)" opacity="0.4" />
        </g>
        {/* Aura particles */}
        <circle className="rank-aura-particle rank-aura-1" cx="30" cy="20" r="1.5" fill="hsl(200 80% 80%)" opacity="0.5" />
        <circle className="rank-aura-particle rank-aura-2" cx="130" cy="20" r="1.5" fill="hsl(280 80% 75%)" opacity="0.5" />
        <circle className="rank-aura-particle rank-aura-3" cx="80" cy="158" r="1.5" fill="hsl(340 80% 75%)" opacity="0.4" />
      </svg>
      <div className="absolute" style={{ top: offset, left: offset, width: size, height: size }}>
        {children}
      </div>
    </div>
  );
}
