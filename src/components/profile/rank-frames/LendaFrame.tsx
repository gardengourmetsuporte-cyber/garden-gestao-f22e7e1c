interface FrameProps {
  size: number;
  children: React.ReactNode;
}

export function LendaFrame({ size, children }: FrameProps) {
  const padding = 3.5;
  const frameSize = size + padding * 2;

  return (
    <div className="relative" style={{ width: frameSize, height: frameSize }}>
      <div
        className="absolute inset-0 rounded-full animate-spin"
        style={{
          background: 'conic-gradient(from 0deg, hsl(var(--neon-red)), hsl(var(--neon-amber)), hsl(var(--neon-red)))',
          animationDuration: '4s',
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