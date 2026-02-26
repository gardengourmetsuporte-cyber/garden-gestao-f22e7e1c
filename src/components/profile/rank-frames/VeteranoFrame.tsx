interface FrameProps {
  size: number;
  children: React.ReactNode;
}

export function VeteranoFrame({ size, children }: FrameProps) {
  const padding = 3;
  const frameSize = size + padding * 2;

  return (
    <div className="relative" style={{ width: frameSize, height: frameSize }}>
      <div
        className="absolute inset-0 rounded-full"
        style={{
          background: 'linear-gradient(135deg, hsl(var(--neon-purple)), hsl(260 70% 55%))',
          boxShadow: '0 0 8px hsl(var(--neon-purple) / 0.25)',
        }}
      />
      <div
        className="absolute rounded-full bg-background"
        style={{ top: 2, left: 2, right: 2, bottom: 2 }}
      />
      <div className="absolute" style={{ top: padding, left: padding, width: size, height: size }}>
        {children}
      </div>
    </div>
  );
}