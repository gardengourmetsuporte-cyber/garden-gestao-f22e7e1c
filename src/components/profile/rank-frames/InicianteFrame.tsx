interface FrameProps {
  size: number;
  children: React.ReactNode;
}

export function InicianteFrame({ size, children }: FrameProps) {
  const frameSize = size * 1.15;
  const offset = (frameSize - size) / 2;

  return (
    <div className="relative" style={{ width: frameSize, height: frameSize }}>
      <svg
        className="absolute inset-0"
        width={frameSize}
        height={frameSize}
        viewBox="0 0 100 100"
        fill="none"
      >
        <circle
          cx="50"
          cy="50"
          r="46"
          stroke="hsl(var(--border))"
          strokeWidth="1.5"
          opacity="0.6"
        />
      </svg>
      <div className="absolute" style={{ top: offset, left: offset, width: size, height: size }}>
        {children}
      </div>
    </div>
  );
}
