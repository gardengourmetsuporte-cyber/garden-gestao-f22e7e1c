import gardenLogo from '@/assets/logo.png';

interface Props {
  message?: string;
}

export function MenuLoadingScreen({ message = 'Carregando cardápio...' }: Props) {
  return (
    <div className="min-h-[100dvh] bg-background flex flex-col items-center justify-center gap-5">
      <div className="w-20 h-20 rounded-2xl bg-white shadow-lg flex items-center justify-center p-3 animate-pulse" style={{ animationDuration: '2s' }}>
        <img src={gardenLogo} alt="Garden" className="w-full h-full object-contain" />
      </div>
      <div className="flex flex-col items-center gap-1.5">
        <p className="text-sm font-semibold text-foreground">{message}</p>
        <div className="flex gap-1 mt-2">
          <span className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: '0ms' }} />
          <span className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: '150ms' }} />
          <span className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: '300ms' }} />
        </div>
      </div>
    </div>
  );
}
