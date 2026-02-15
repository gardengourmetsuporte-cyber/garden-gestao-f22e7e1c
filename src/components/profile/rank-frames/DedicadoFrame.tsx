interface FrameProps {
  size: number;
  children: React.ReactNode;
}

export function DedicadoFrame({ size, children }: FrameProps) {
  const frameSize = size * 1.3;
  const offset = (frameSize - size) / 2;

  return (
    <div className="relative" style={{ width: frameSize, height: frameSize }}>
      <svg
        className="absolute inset-0"
        width={frameSize}
        height={frameSize}
        viewBox="0 0 130 130"
        fill="none"
      >
        <defs>
          <filter id="dedicado-glow">
            <feGaussianBlur stdDeviation="2.5" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        {/* Hexagonal shield frame */}
        <polygon
          className="rank-hex-pulse"
          points="65,8 115,35 115,95 65,122 15,95 15,35"
          stroke="hsl(var(--neon-cyan))"
          strokeWidth="2"
          fill="none"
          opacity="0.5"
          filter="url(#dedicado-glow)"
        />
        {/* Top point accent */}
        <path
          className="rank-hex-tip"
          d="M65 2 L72 14 L65 10 L58 14 Z"
          fill="hsl(var(--neon-cyan))"
          opacity="0.7"
          filter="url(#dedicado-glow)"
        />
        {/* Bottom point accent */}
        <path
          className="rank-hex-tip"
          d="M65 128 L72 116 L65 120 L58 116 Z"
          fill="hsl(var(--neon-cyan))"
          opacity="0.4"
        />
        {/* Inner subtle ring */}
        <circle
          cx="65"
          cy="65"
          r="50"
          stroke="hsl(var(--neon-cyan))"
          strokeWidth="0.8"
          opacity="0.2"
        />
      </svg>
      <div className="absolute" style={{ top: offset, left: offset, width: size, height: size }}>
        {children}
      </div>
    </div>
  );
}
