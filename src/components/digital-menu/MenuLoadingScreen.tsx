import gardenLogo from '@/assets/logo.png';

interface Props {
  message?: string;
}

export function MenuLoadingScreen({ message = 'Carregando...' }: Props) {
  return (
    <div className="min-h-[100dvh] bg-background flex flex-col items-center justify-center gap-3">
       <div className="w-10 h-10 rounded-full overflow-hidden bg-white/90 shadow-md flex items-center justify-center animate-pulse" style={{ animationDuration: '2s' }}>
         <img src={gardenLogo} alt="Garden" className="w-full h-full object-contain p-1.5" />
       </div>
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
