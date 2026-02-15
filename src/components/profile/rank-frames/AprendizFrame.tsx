interface FrameProps {
  size: number;
  children: React.ReactNode;
}

export function AprendizFrame({ size, children }: FrameProps) {
  const frameSize = size * 1.25;
  const offset = (frameSize - size) / 2;

  return (
    <div className="relative" style={{ width: frameSize, height: frameSize }}>
      <svg
        className="absolute inset-0 rank-frame-aprendiz"
        width={frameSize}
        height={frameSize}
        viewBox="0 0 120 120"
        fill="none"
      >
        <defs>
          <filter id="aprendiz-glow">
            <feGaussianBlur stdDeviation="2" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        {/* Main ring */}
        <circle
          cx="60"
          cy="60"
          r="52"
          stroke="hsl(var(--neon-green))"
          strokeWidth="2"
          opacity="0.5"
          filter="url(#aprendiz-glow)"
        />
        {/* Left leaf */}
        <path
          className="rank-leaf rank-leaf-left"
          d="M18 60 C18 48, 8 42, 4 50 C0 58, 10 64, 18 60Z"
          fill="hsl(var(--neon-green))"
          opacity="0.5"
          filter="url(#aprendiz-glow)"
        />
        {/* Right leaf */}
        <path
          className="rank-leaf rank-leaf-right"
          d="M102 60 C102 48, 112 42, 116 50 C120 58, 110 64, 102 60Z"
          fill="hsl(var(--neon-green))"
          opacity="0.5"
          filter="url(#aprendiz-glow)"
        />
      </svg>
      <div className="absolute" style={{ top: offset, left: offset, width: size, height: size }}>
        {children}
      </div>
    </div>
  );
}
