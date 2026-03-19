import { useState, useEffect, useCallback, useRef } from 'react';
import { AppIcon } from '@/components/ui/app-icon';
import { useGameScore } from '@/hooks/useGameScore';
import { GameRanking } from './GameRanking';
import { Trophy } from 'lucide-react';

interface Props {
  onBack: () => void;
  unitId?: string;
}

const CARD_ITEMS = ['🍔', '🍟', '🍕', '🌭', '🥤', '🧁', '🍗', '🥪'];

interface Card {
  id: number;
  emoji: string;
  flipped: boolean;
  matched: boolean;
}

function shuffleArray<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function createBoard(pairs: number): Card[] {
  const items = CARD_ITEMS.slice(0, pairs);
  const doubled = [...items, ...items];
  return shuffleArray(doubled).map((emoji, i) => ({
    id: i,
    emoji,
    flipped: false,
    matched: false,
  }));
}

export function MemoryGame({ onBack, unitId }: Props) {
  const { saveScore } = useGameScore(unitId);
  const [showRanking, setShowRanking] = useState(false);
  const [cards, setCards] = useState<Card[]>(() => createBoard(8));
  const [selected, setSelected] = useState<number[]>([]);
  const [moves, setMoves] = useState(0);
  const [matches, setMatches] = useState(0);
  const [gameState, setGameState] = useState<'menu' | 'playing' | 'won'>('menu');
  const [timer, setTimer] = useState(0);
  const [bestTime, setBestTime] = useState(() => {
    try { return Number(localStorage.getItem('garden_memory_best') || '0'); } catch { return 0; }
  });
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const lockRef = useRef(false);

  const totalPairs = 8;

  const startGame = () => {
    setCards(createBoard(totalPairs));
    setSelected([]);
    setMoves(0);
    setMatches(0);
    setTimer(0);
    setGameState('playing');
  };

  useEffect(() => {
    if (gameState === 'playing') {
      timerRef.current = setInterval(() => setTimer(t => t + 1), 1000);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [gameState]);

  const handleCardClick = useCallback((id: number) => {
    if (lockRef.current) return;
    if (gameState !== 'playing') return;

    const card = cards.find(c => c.id === id);
    if (!card || card.flipped || card.matched) return;
    if (selected.includes(id)) return;

    const newCards = cards.map(c => c.id === id ? { ...c, flipped: true } : c);
    const newSelected = [...selected, id];
    setCards(newCards);
    setSelected(newSelected);

    if (newSelected.length === 2) {
      setMoves(m => m + 1);
      lockRef.current = true;
      const [a, b] = newSelected;
      const cardA = newCards.find(c => c.id === a)!;
      const cardB = newCards.find(c => c.id === b)!;

      if (cardA.emoji === cardB.emoji) {
        setTimeout(() => {
          setCards(prev => prev.map(c =>
            c.id === a || c.id === b ? { ...c, matched: true } : c
          ));
          const newMatches = matches + 1;
          setMatches(newMatches);
          setSelected([]);
          lockRef.current = false;

          if (newMatches === totalPairs) {
            const finalMoves = moves + 1;
            setGameState('won');
            if (timerRef.current) clearInterval(timerRef.current);
            if (!bestTime || timer < bestTime) {
              setBestTime(timer);
              try { localStorage.setItem('garden_memory_best', String(timer)); } catch {}
            }
            saveScore('memory', finalMoves, { time: timer });
          }
        }, 400);
      } else {
        setTimeout(() => {
          setCards(prev => prev.map(c =>
            c.id === a || c.id === b ? { ...c, flipped: false } : c
          ));
          setSelected([]);
          lockRef.current = false;
        }, 800);
      }
    }
  }, [cards, selected, gameState, matches, timer, bestTime]);

  const formatTime = (s: number) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`;

  return (
    <div className="h-[100dvh] bg-[hsl(25,10%,4%)] flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 pt-[max(env(safe-area-inset-top,8px),14px)] pb-1 shrink-0">
        <button onClick={onBack} className="w-10 h-10 rounded-2xl bg-white/[0.06] border border-white/[0.08] flex items-center justify-center active:scale-95 transition-transform">
          <AppIcon name="ArrowLeft" size={18} className="text-white/60" />
        </button>
        <div className="text-center">
          <h1 className="text-lg font-black text-white tracking-tight flex items-center gap-2">
            <span className="text-xl">🧠</span> Memory <span className="text-amber-400">Match</span>
          </h1>
        </div>
        <button onClick={() => setShowRanking(true)} className="w-10 h-10 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center active:scale-95 transition-transform">
          <Trophy size={18} className="text-amber-400" />
        </button>
      </div>

      {/* Score bar */}
      <div className="flex items-center justify-center gap-3 px-4 py-2 shrink-0">
        <div className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-amber-500/8 border border-amber-500/15">
          <span className="text-sm">🎯</span>
          <span className="text-sm text-amber-400 font-black tabular-nums">{moves} jogadas</span>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-blue-500/8 border border-blue-500/15">
          <span className="text-sm">⏱</span>
          <span className="text-sm text-blue-400 font-black tabular-nums">{formatTime(timer)}</span>
        </div>
        {bestTime > 0 && (
          <div className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-emerald-500/8 border border-emerald-500/15">
            <span className="text-sm">🏆</span>
            <span className="text-sm text-emerald-400 font-black tabular-nums">{formatTime(bestTime)}</span>
          </div>
        )}
      </div>

      {/* Game area — centered for tablet */}
      <div className="flex-1 flex items-center justify-center px-5 py-3 relative">
        <div className="relative w-full max-w-[700px]">
          {gameState === 'menu' && (
            <div className="flex flex-col items-center justify-center gap-7 py-12">
              <div className="text-7xl animate-pulse" style={{ animationDuration: '2s' }}>🧠</div>
              <div className="text-center space-y-2">
                <h2 className="text-3xl font-black text-white tracking-tight">Memory Match</h2>
                <p className="text-sm text-amber-300/60">Encontre os pares de lanches!</p>
              </div>
              <div className="flex flex-wrap justify-center gap-3">
                {CARD_ITEMS.slice(0, 6).map((e, i) => (
                  <span key={e} className="text-3xl animate-pulse" style={{ animationDelay: `${i * 0.3}s`, animationDuration: '2s' }}>{e}</span>
                ))}
              </div>
              <button
                onClick={startGame}
                className="px-10 py-4 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-400 text-white font-black text-base shadow-[0_8px_32px_hsla(38,90%,50%,0.35)] active:scale-95 transition-all hover:shadow-[0_8px_40px_hsla(38,90%,50%,0.5)]"
              >
                ▶ JOGAR
              </button>
            </div>
          )}

          {gameState !== 'menu' && (
            <div className="grid grid-cols-4 gap-3 max-w-[600px] mx-auto">
              {cards.map(card => (
                <button
                  key={card.id}
                  onClick={() => handleCardClick(card.id)}
                  className={`aspect-square rounded-2xl text-4xl md:text-5xl flex items-center justify-center font-bold transition-all duration-300 transform touch-manipulation ${
                    card.matched
                      ? 'bg-emerald-500/15 border-2 border-emerald-500/30 scale-[0.92] opacity-60'
                      : card.flipped
                      ? 'bg-amber-500/12 border-2 border-amber-500/25 scale-105 shadow-[0_0_20px_hsla(38,90%,50%,0.15)]'
                      : 'bg-white/[0.04] border-2 border-white/[0.08] hover:bg-white/[0.07] hover:border-white/15 active:scale-95'
                  }`}
                >
                  <span className={`transition-all duration-300 ${card.flipped || card.matched ? 'scale-100' : 'scale-75 opacity-30'}`}>
                    {card.flipped || card.matched ? card.emoji : '?'}
                  </span>
                </button>
              ))}
            </div>
          )}

          {/* Won overlay */}
          {gameState === 'won' && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 backdrop-blur-md rounded-3xl gap-5">
              <span className="text-6xl">🎉</span>
              <h2 className="text-2xl font-black text-white tracking-tight">Parabéns!</h2>
              <div className="text-center space-y-1">
                <p className="text-4xl font-black text-amber-400 tabular-nums">{moves} jogadas</p>
                <p className="text-sm text-white/40 font-semibold">em {formatTime(timer)}</p>
              </div>
              {timer <= bestTime && timer > 0 && (
                <div className="px-4 py-1.5 rounded-full bg-emerald-500/15 border border-emerald-500/25">
                  <p className="text-sm font-black text-emerald-400 animate-pulse">🏆 Novo recorde!</p>
                </div>
              )}
              <div className="flex gap-3 mt-1">
                <button onClick={onBack} className="px-6 py-3 rounded-2xl bg-white/[0.06] border border-white/[0.08] text-white font-bold text-sm active:scale-95 transition-all">
                  Sair
                </button>
                <button onClick={startGame} className="px-8 py-3 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-400 text-white font-black text-sm shadow-[0_6px_24px_hsla(38,90%,50%,0.3)] active:scale-95 transition-all">
                  Jogar de novo 🔄
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
      {showRanking && unitId && (
        <GameRanking unitId={unitId} gameType="memory" accentColor="amber" onClose={() => setShowRanking(false)} />
      )}
    </div>
  );
}
