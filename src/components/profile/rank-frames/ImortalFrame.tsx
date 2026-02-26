interface FrameProps {
  size: number;
  children: React.ReactNode;
}

export function ImortalFrame({ size, children }: FrameProps) {
  const padding = 4;
  const frameSize = size + padding * 2;

  return (
    <div className="relative" style={{ width: frameSize, height: frameSize }}>
      <div
        className="absolute inset-0 rounded-full animate-spin"
        style={{
          background: 'conic-gradient(from 0deg, hsl(200 90% 75%), hsl(280 80% 75%), hsl(340 80% 75%), hsl(60 80% 75%), hsl(200 90% 75%))',
          animationDuration: '2.5s',
          boxShadow: '0 0 16px hsl(200 80% 80% / 0.35), 0 0 32px hsl(280 80% 75% / 0.15)',
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