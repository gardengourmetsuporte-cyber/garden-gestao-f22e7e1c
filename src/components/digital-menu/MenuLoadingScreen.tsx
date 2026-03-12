import gardenLogo from '@/assets/logo.png';

interface Props {
  message?: string;
}

export function MenuLoadingScreen({ message = 'Carregando...' }: Props) {
  return (
    <div className="min-h-[100dvh] bg-background flex flex-col items-center justify-center gap-3">
      <div className="flex flex-col items-center gap-1">
        <p className="text-xs font-medium text-muted-foreground">{message}</p>
        <div className="flex gap-1 mt-1">
          <span className="w-1.5 h-1.5 rounded-full bg-primary/60 animate-bounce" style={{ animationDelay: '0ms' }} />
          <span className="w-1.5 h-1.5 rounded-full bg-primary/60 animate-bounce" style={{ animationDelay: '150ms' }} />
          <span className="w-1.5 h-1.5 rounded-full bg-primary/60 animate-bounce" style={{ animationDelay: '300ms' }} />
        </div>
      </div>
    </div>
  );
}
