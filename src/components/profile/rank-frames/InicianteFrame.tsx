interface FrameProps {
  size: number;
  children: React.ReactNode;
}

export function InicianteFrame({ size, children }: FrameProps) {
  const padding = 3;
  const frameSize = size + padding * 2;

  return (
    <div className="relative" style={{ width: frameSize, height: frameSize }}>
      <div
        className="absolute inset-0 rounded-full"
        style={{
          background: 'hsl(var(--border))',
          opacity: 0.5,
        }}
      />
      <div
        className="absolute rounded-full bg-background"
        style={{ top: 1.5, left: 1.5, right: 1.5, bottom: 1.5 }}
      />
      <div className="absolute" style={{ top: padding, left: padding, width: size, height: size }}>
        {children}
      </div>
    </div>
  );
}