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
            const finalMoves = moves + 1; // current move
            setGameState('won');
            if (timerRef.current) clearInterval(timerRef.current);
            if (!bestTime || timer < bestTime) {
              setBestTime(timer);
              try { localStorage.setItem('garden_memory_best', String(timer)); } catch {}
            }
            // Save to ranking (fewer moves = better)
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
    <div className="h-[100dvh] bg-[hsl(25,15%,5%)] flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-[max(env(safe-area-inset-top,8px),12px)] pb-2 shrink-0">
        <button onClick={onBack} className="w-9 h-9 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center">
          <AppIcon name="ArrowLeft" size={18} className="text-white/70" />
        </button>
        <div className="text-center">
          <h1 className="text-base font-bold text-white flex items-center gap-1.5">
            🧠 Memory <span className="text-amber-400">Match</span>
          </h1>
        </div>
        <button onClick={() => setShowRanking(true)} className="w-9 h-9 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center">
          <Trophy size={18} className="text-amber-400" />
        </button>
      </div>

      {/* Score bar */}
      <div className="flex items-center justify-center gap-4 px-4 py-2 shrink-0">
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/20">
          <span className="text-xs text-amber-400 font-bold">🎯 {moves} jogadas</span>
        </div>
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20">
          <span className="text-xs text-blue-400 font-bold">⏱ {formatTime(timer)}</span>
        </div>
        {bestTime > 0 && (
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">
            <span className="text-xs text-emerald-400 font-bold">🏆 {formatTime(bestTime)}</span>
          </div>
        )}
      </div>

      {/* Game area */}
      <div className="flex-1 flex items-center justify-center px-4 relative">
        <div className="relative w-full max-w-[500px]">
          {gameState === 'menu' && (
            <div className="flex flex-col items-center justify-center gap-6 py-12">
              <span className="text-6xl">🧠</span>
              <h2 className="text-2xl font-black text-white">Memory Match</h2>
              <p className="text-sm text-amber-300/80">Encontre os pares de lanches!</p>
              <div className="flex flex-wrap justify-center gap-2">
                {CARD_ITEMS.slice(0, 6).map(e => (
                  <span key={e} className="text-2xl animate-pulse" style={{ animationDelay: `${Math.random() * 2}s` }}>{e}</span>
                ))}
              </div>
              <button
                onClick={startGame}
                className="px-8 py-3.5 rounded-2xl bg-amber-500 hover:bg-amber-400 text-white font-bold text-base shadow-lg shadow-amber-500/30 active:scale-95 transition-all"
              >
                Jogar! 🎮
              </button>
            </div>
          )}

          {gameState !== 'menu' && (
            <div className="grid grid-cols-4 gap-2.5">
              {cards.map(card => (
                <button
                  key={card.id}
                  onClick={() => handleCardClick(card.id)}
                  className={`aspect-square rounded-2xl text-3xl sm:text-4xl flex items-center justify-center font-bold transition-all duration-300 transform ${
                    card.matched
                      ? 'bg-emerald-500/20 border-2 border-emerald-500/40 scale-95 opacity-70'
                      : card.flipped
                      ? 'bg-amber-500/15 border-2 border-amber-500/30 scale-105 shadow-lg shadow-amber-500/20'
                      : 'bg-white/5 border-2 border-white/10 hover:bg-white/10 hover:border-white/20 active:scale-95'
                  }`}
                >
                  {card.flipped || card.matched ? card.emoji : '?'}
                </button>
              ))}
            </div>
          )}

          {/* Won overlay */}
          {gameState === 'won' && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 backdrop-blur-sm rounded-2xl gap-4">
              <span className="text-5xl">🎉</span>
              <h2 className="text-xl font-black text-white">Parabéns!</h2>
              <div className="text-center space-y-1">
                <p className="text-3xl font-black text-amber-400">{moves} jogadas</p>
                <p className="text-sm text-white/60">em {formatTime(timer)}</p>
              </div>
              {timer <= bestTime && timer > 0 && (
                <p className="text-sm font-bold text-emerald-400 animate-pulse">🏆 Novo recorde!</p>
              )}
              <div className="flex gap-3 mt-2">
                <button onClick={onBack} className="px-5 py-2.5 rounded-xl bg-white/10 border border-white/10 text-white font-semibold text-sm">
                  Sair
                </button>
                <button onClick={startGame} className="px-6 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-white font-bold text-sm shadow-lg shadow-amber-500/30 active:scale-95 transition-all">
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
