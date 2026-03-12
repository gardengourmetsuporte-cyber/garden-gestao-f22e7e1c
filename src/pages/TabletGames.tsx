import { useState } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { AppIcon } from '@/components/ui/app-icon';
import { SnakeGame } from '@/components/games/SnakeGame';

export default function TabletGames() {
  const { unitId } = useParams<{ unitId: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const mesa = searchParams.get('mesa') || '1';
  const [activeGame, setActiveGame] = useState<string | null>(null);

  if (activeGame === 'snake') {
    return <SnakeGame onBack={() => setActiveGame(null)} unitId={unitId} />;
  }

  const games = [
    {
      id: 'snake',
      emoji: '🐍',
      title: 'Snake Garden',
      description: 'Coma lanches e batatas!',
      color: 'from-emerald-500/20 to-green-600/20',
      border: 'border-emerald-500/30',
    },
  ];

  return (
    <div className="h-[100dvh] bg-background flex flex-col">
      {/* Header */}
      <header className="flex items-center gap-3 px-5 pt-[max(env(safe-area-inset-top,12px),16px)] pb-3 shrink-0">
        <button
          onClick={() => navigate(`/tablet/${unitId}?mesa=${mesa}`)}
          className="w-9 h-9 rounded-xl bg-card border border-border/30 flex items-center justify-center hover:bg-secondary/50 transition-colors"
        >
          <AppIcon name="ArrowLeft" size={18} className="text-muted-foreground" />
        </button>
        <div>
          <h1 className="text-lg font-bold text-foreground">Jogos</h1>
          <p className="text-[11px] text-muted-foreground">Diversão na mesa</p>
        </div>
      </header>

      {/* Games grid */}
      <div className="flex-1 flex items-center justify-center px-6">
        <div className="grid grid-cols-2 gap-4 w-full max-w-[500px]">
          {games.map(game => (
            <button
              key={game.id}
              onClick={() => setActiveGame(game.id)}
              className={`flex flex-col items-center gap-3 p-6 rounded-3xl bg-gradient-to-br ${game.color} border ${game.border} hover:scale-[1.02] active:scale-[0.98] transition-all`}
            >
              <span className="text-5xl">{game.emoji}</span>
              <div className="text-center">
                <p className="text-sm font-bold text-foreground">{game.title}</p>
                <p className="text-[11px] text-muted-foreground">{game.description}</p>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
