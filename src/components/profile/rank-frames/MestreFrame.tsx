interface FrameProps {
  size: number;
  children: React.ReactNode;
}

export function MestreFrame({ size, children }: FrameProps) {
  const padding = 3.5;
  const frameSize = size + padding * 2;

  return (
    <div className="relative" style={{ width: frameSize, height: frameSize }}>
      <div
        className="absolute inset-0 rounded-full"
        style={{
          background: 'linear-gradient(135deg, hsl(45 90% 55%), hsl(38 92% 50%), hsl(30 85% 45%))',
          boxShadow: '0 0 10px hsl(var(--neon-amber) / 0.3)',
        }}
      />
      <div
        className="absolute rounded-full bg-background"
        style={{ top: 2.5, left: 2.5, right: 2.5, bottom: 2.5 }}
      />
      <div className="absolute" style={{ top: padding, left: padding, width: size, height: size }}>
        {children}
      </div>
    </div>
  );
}