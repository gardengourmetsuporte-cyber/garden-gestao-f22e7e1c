import { useState, useEffect, useCallback, useRef } from 'react';
import { AppIcon } from '@/components/ui/app-icon';

interface Point { x: number; y: number; }

const GRID = 20;
const INITIAL_SPEED = 150;
const SPEED_INCREMENT = 3;
const MIN_SPEED = 60;

const FOOD_ITEMS = [
  { emoji: '🍔', points: 10, name: 'Hambúrguer' },
  { emoji: '🍟', points: 8, name: 'Batata Frita' },
  { emoji: '🌭', points: 7, name: 'Hot Dog' },
  { emoji: '🥤', points: 5, name: 'Refrigerante' },
  { emoji: '🍕', points: 12, name: 'Pizza' },
  { emoji: '🧁', points: 15, name: 'Cupcake' },
  { emoji: '🥪', points: 9, name: 'Sanduíche' },
  { emoji: '🍗', points: 11, name: 'Frango' },
];

const SNAKE_HEAD = '🟢';
const SNAKE_BODY_COLORS = [
  'hsl(142, 70%, 45%)',
  'hsl(142, 65%, 40%)',
  'hsl(142, 60%, 35%)',
  'hsl(142, 55%, 30%)',
];

type Direction = 'UP' | 'DOWN' | 'LEFT' | 'RIGHT';

function randomFood(snake: Point[]): { pos: Point; item: typeof FOOD_ITEMS[0] } {
  let pos: Point;
  do {
    pos = { x: Math.floor(Math.random() * GRID), y: Math.floor(Math.random() * GRID) };
  } while (snake.some(s => s.x === pos.x && s.y === pos.y));
  return { pos, item: FOOD_ITEMS[Math.floor(Math.random() * FOOD_ITEMS.length)] };
}

interface Props {
  onBack: () => void;
}

export function SnakeGame({ onBack }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [gameState, setGameState] = useState<'menu' | 'playing' | 'gameover'>('menu');
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(() => {
    try { return Number(localStorage.getItem('garden_snake_high') || '0'); } catch { return 0; }
  });
  const [lastFood, setLastFood] = useState('');

  const snakeRef = useRef<Point[]>([{ x: 10, y: 10 }]);
  const dirRef = useRef<Direction>('RIGHT');
  const nextDirRef = useRef<Direction>('RIGHT');
  const foodRef = useRef(randomFood([{ x: 10, y: 10 }]));
  const speedRef = useRef(INITIAL_SPEED);
  const scoreRef = useRef(0);
  const gameLoopRef = useRef<number | null>(null);
  const lastTimeRef = useRef(0);

  const cellSize = useRef(0);

  const drawGame = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const size = canvas.width;
    const cell = size / GRID;
    cellSize.current = cell;

    // Background - dark grid
    ctx.fillStyle = 'hsl(140, 15%, 8%)';
    ctx.fillRect(0, 0, size, size);

    // Grid lines (subtle)
    ctx.strokeStyle = 'hsl(140, 10%, 12%)';
    ctx.lineWidth = 0.5;
    for (let i = 0; i <= GRID; i++) {
      ctx.beginPath();
      ctx.moveTo(i * cell, 0);
      ctx.lineTo(i * cell, size);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(0, i * cell);
      ctx.lineTo(size, i * cell);
      ctx.stroke();
    }

    // Food
    const food = foodRef.current;
    ctx.font = `${cell * 0.75}px serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    // Food glow
    const gradient = ctx.createRadialGradient(
      food.pos.x * cell + cell / 2, food.pos.y * cell + cell / 2, 0,
      food.pos.x * cell + cell / 2, food.pos.y * cell + cell / 2, cell
    );
    gradient.addColorStop(0, 'hsla(45, 100%, 60%, 0.15)');
    gradient.addColorStop(1, 'transparent');
    ctx.fillStyle = gradient;
    ctx.fillRect(food.pos.x * cell - cell / 2, food.pos.y * cell - cell / 2, cell * 2, cell * 2);

    ctx.fillText(food.item.emoji, food.pos.x * cell + cell / 2, food.pos.y * cell + cell / 2);

    // Snake
    const snake = snakeRef.current;
    snake.forEach((seg, i) => {
      const colorIdx = Math.min(i, SNAKE_BODY_COLORS.length - 1);

      if (i === 0) {
        // Head - larger with glow
        const headGrad = ctx.createRadialGradient(
          seg.x * cell + cell / 2, seg.y * cell + cell / 2, 0,
          seg.x * cell + cell / 2, seg.y * cell + cell / 2, cell * 0.8
        );
        headGrad.addColorStop(0, 'hsl(142, 80%, 55%)');
        headGrad.addColorStop(1, 'hsl(142, 70%, 35%)');
        ctx.fillStyle = headGrad;

        const r = cell * 0.45;
        ctx.beginPath();
        ctx.roundRect(seg.x * cell + cell * 0.05, seg.y * cell + cell * 0.05, cell * 0.9, cell * 0.9, r);
        ctx.fill();

        // Eyes
        const eyeSize = cell * 0.12;
        ctx.fillStyle = 'white';
        const eyeOffsets = getEyeOffsets(dirRef.current, cell);
        ctx.beginPath();
        ctx.arc(seg.x * cell + cell / 2 + eyeOffsets[0].x, seg.y * cell + cell / 2 + eyeOffsets[0].y, eyeSize, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(seg.x * cell + cell / 2 + eyeOffsets[1].x, seg.y * cell + cell / 2 + eyeOffsets[1].y, eyeSize, 0, Math.PI * 2);
        ctx.fill();

        // Pupils
        ctx.fillStyle = '#111';
        const pupilOff = cell * 0.04;
        const pd = getPupilDirection(dirRef.current, pupilOff);
        ctx.beginPath();
        ctx.arc(seg.x * cell + cell / 2 + eyeOffsets[0].x + pd.x, seg.y * cell + cell / 2 + eyeOffsets[0].y + pd.y, eyeSize * 0.55, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(seg.x * cell + cell / 2 + eyeOffsets[1].x + pd.x, seg.y * cell + cell / 2 + eyeOffsets[1].y + pd.y, eyeSize * 0.55, 0, Math.PI * 2);
        ctx.fill();
      } else {
        // Body
        ctx.fillStyle = SNAKE_BODY_COLORS[colorIdx];
        const gap = cell * 0.08;
        const r = cell * 0.35;
        ctx.beginPath();
        ctx.roundRect(seg.x * cell + gap, seg.y * cell + gap, cell - gap * 2, cell - gap * 2, r);
        ctx.fill();

        // Subtle pattern on body
        ctx.fillStyle = 'hsla(142, 50%, 60%, 0.1)';
        ctx.beginPath();
        ctx.roundRect(seg.x * cell + gap + 2, seg.y * cell + gap + 2, (cell - gap * 2) / 2, (cell - gap * 2) / 2, r / 2);
        ctx.fill();
      }
    });

    // Border glow
    ctx.strokeStyle = 'hsl(142, 60%, 25%)';
    ctx.lineWidth = 2;
    ctx.strokeRect(0, 0, size, size);
  }, []);

  const gameLoop = useCallback((timestamp: number) => {
    if (gameState !== 'playing') return;

    if (timestamp - lastTimeRef.current < speedRef.current) {
      gameLoopRef.current = requestAnimationFrame(gameLoop);
      return;
    }
    lastTimeRef.current = timestamp;

    dirRef.current = nextDirRef.current;

    const snake = [...snakeRef.current];
    const head = { ...snake[0] };

    switch (dirRef.current) {
      case 'UP': head.y--; break;
      case 'DOWN': head.y++; break;
      case 'LEFT': head.x--; break;
      case 'RIGHT': head.x++; break;
    }

    // Wall collision
    if (head.x < 0 || head.x >= GRID || head.y < 0 || head.y >= GRID) {
      endGame();
      return;
    }

    // Self collision
    if (snake.some(s => s.x === head.x && s.y === head.y)) {
      endGame();
      return;
    }

    snake.unshift(head);

    // Food collision
    const food = foodRef.current;
    if (head.x === food.pos.x && head.y === food.pos.y) {
      scoreRef.current += food.item.points;
      setScore(scoreRef.current);
      setLastFood(food.item.emoji + ' +' + food.item.points);
      setTimeout(() => setLastFood(''), 1000);
      foodRef.current = randomFood(snake);
      speedRef.current = Math.max(MIN_SPEED, speedRef.current - SPEED_INCREMENT);
    } else {
      snake.pop();
    }

    snakeRef.current = snake;
    drawGame();
    gameLoopRef.current = requestAnimationFrame(gameLoop);
  }, [gameState, drawGame]);

  const endGame = () => {
    setGameState('gameover');
    if (scoreRef.current > highScore) {
      setHighScore(scoreRef.current);
      try { localStorage.setItem('garden_snake_high', String(scoreRef.current)); } catch {}
    }
  };

  const startGame = () => {
    snakeRef.current = [{ x: 10, y: 10 }];
    dirRef.current = 'RIGHT';
    nextDirRef.current = 'RIGHT';
    foodRef.current = randomFood([{ x: 10, y: 10 }]);
    speedRef.current = INITIAL_SPEED;
    scoreRef.current = 0;
    setScore(0);
    setLastFood('');
    setGameState('playing');
  };

  useEffect(() => {
    if (gameState === 'playing') {
      gameLoopRef.current = requestAnimationFrame(gameLoop);
    }
    return () => {
      if (gameLoopRef.current) cancelAnimationFrame(gameLoopRef.current);
    };
  }, [gameState, gameLoop]);

  useEffect(() => {
    if (gameState !== 'playing') return;

    const handleKey = (e: KeyboardEvent) => {
      const dir = dirRef.current;
      switch (e.key) {
        case 'ArrowUp': case 'w': if (dir !== 'DOWN') nextDirRef.current = 'UP'; break;
        case 'ArrowDown': case 's': if (dir !== 'UP') nextDirRef.current = 'DOWN'; break;
        case 'ArrowLeft': case 'a': if (dir !== 'RIGHT') nextDirRef.current = 'LEFT'; break;
        case 'ArrowRight': case 'd': if (dir !== 'LEFT') nextDirRef.current = 'RIGHT'; break;
      }
    };

    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [gameState]);

  // Touch controls
  const touchStart = useRef<{ x: number; y: number } | null>(null);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStart.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!touchStart.current) return;
    const dx = e.changedTouches[0].clientX - touchStart.current.x;
    const dy = e.changedTouches[0].clientY - touchStart.current.y;
    const dir = dirRef.current;

    if (Math.abs(dx) > Math.abs(dy)) {
      if (dx > 20 && dir !== 'LEFT') nextDirRef.current = 'RIGHT';
      else if (dx < -20 && dir !== 'RIGHT') nextDirRef.current = 'LEFT';
    } else {
      if (dy > 20 && dir !== 'UP') nextDirRef.current = 'DOWN';
      else if (dy < -20 && dir !== 'DOWN') nextDirRef.current = 'UP';
    }
    touchStart.current = null;
  };

  const changeDir = (newDir: Direction) => {
    const dir = dirRef.current;
    if (newDir === 'UP' && dir !== 'DOWN') nextDirRef.current = 'UP';
    if (newDir === 'DOWN' && dir !== 'UP') nextDirRef.current = 'DOWN';
    if (newDir === 'LEFT' && dir !== 'RIGHT') nextDirRef.current = 'LEFT';
    if (newDir === 'RIGHT' && dir !== 'LEFT') nextDirRef.current = 'RIGHT';
  };

  // Canvas sizing
  const containerRef = useRef<HTMLDivElement>(null);
  const [canvasSize, setCanvasSize] = useState(400);

  useEffect(() => {
    const resize = () => {
      if (containerRef.current) {
        const w = containerRef.current.clientWidth;
        const h = containerRef.current.clientHeight;
        const s = Math.min(w, h - 120, 600);
        setCanvasSize(Math.floor(s / GRID) * GRID);
      }
    };
    resize();
    window.addEventListener('resize', resize);
    return () => window.removeEventListener('resize', resize);
  }, []);

  useEffect(() => {
    if (gameState === 'menu') drawGame();
  }, [canvasSize, gameState, drawGame]);

  return (
    <div className="h-[100dvh] bg-[hsl(140,15%,5%)] flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-[max(env(safe-area-inset-top,8px),12px)] pb-2 shrink-0">
        <button onClick={onBack} className="w-9 h-9 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center">
          <AppIcon name="ArrowLeft" size={18} className="text-white/70" />
        </button>
        <div className="text-center">
          <h1 className="text-base font-bold text-white flex items-center gap-1.5">
            🐍 Snake <span className="text-emerald-400">Garden</span>
          </h1>
        </div>
        <div className="w-9" />
      </div>

      {/* Score bar */}
      <div className="flex items-center justify-center gap-6 px-4 py-2 shrink-0">
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">
          <span className="text-xs text-emerald-400 font-bold">🍔 {score}</span>
        </div>
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/20">
          <span className="text-xs text-amber-400 font-bold">🏆 {highScore}</span>
        </div>
        {lastFood && (
          <span className="text-sm font-bold text-emerald-300 animate-bounce">{lastFood}</span>
        )}
      </div>

      {/* Game area */}
      <div ref={containerRef} className="flex-1 flex items-center justify-center px-4 relative">
        <div className="relative">
          <canvas
            ref={canvasRef}
            width={canvasSize}
            height={canvasSize}
            className="rounded-2xl shadow-2xl shadow-emerald-900/30"
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
          />

          {/* Menu overlay */}
          {gameState === 'menu' && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/70 backdrop-blur-sm rounded-2xl gap-6">
              <div className="text-center">
                <span className="text-6xl block mb-3">🐍</span>
                <h2 className="text-2xl font-black text-white">Snake Garden</h2>
                <p className="text-sm text-emerald-300/80 mt-1">Coma lanches e fique enorme!</p>
              </div>
              <div className="flex flex-wrap justify-center gap-2 px-8">
                {FOOD_ITEMS.slice(0, 6).map(f => (
                  <span key={f.emoji} className="text-2xl animate-pulse" style={{ animationDelay: `${Math.random() * 2}s` }}>{f.emoji}</span>
                ))}
              </div>
              <button
                onClick={startGame}
                className="px-8 py-3.5 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-white font-bold text-base shadow-lg shadow-emerald-500/30 active:scale-95 transition-all"
              >
                Jogar! 🎮
              </button>
              <p className="text-[11px] text-white/40">Deslize ou use as setas para mover</p>
            </div>
          )}

          {/* Game over overlay */}
          {gameState === 'gameover' && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 backdrop-blur-sm rounded-2xl gap-4">
              <span className="text-5xl">😵</span>
              <h2 className="text-xl font-black text-white">Game Over!</h2>
              <div className="text-center">
                <p className="text-3xl font-black text-emerald-400">{score}</p>
                <p className="text-xs text-white/50 mt-1">pontos</p>
              </div>
              {score >= highScore && score > 0 && (
                <p className="text-sm font-bold text-amber-400 animate-pulse">🏆 Novo recorde!</p>
              )}
              <div className="flex gap-3 mt-2">
                <button
                  onClick={onBack}
                  className="px-5 py-2.5 rounded-xl bg-white/10 border border-white/10 text-white font-semibold text-sm"
                >
                  Sair
                </button>
                <button
                  onClick={startGame}
                  className="px-6 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-white font-bold text-sm shadow-lg shadow-emerald-500/30 active:scale-95 transition-all"
                >
                  Jogar de novo 🔄
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* D-Pad controls */}
      {gameState === 'playing' && (
        <div className="shrink-0 flex justify-center pb-[max(env(safe-area-inset-bottom,8px),12px)] pt-2">
          <div className="relative w-[160px] h-[160px]">
            {/* Up */}
            <button
              onTouchStart={() => changeDir('UP')}
              onMouseDown={() => changeDir('UP')}
              className="absolute top-0 left-1/2 -translate-x-1/2 w-14 h-14 rounded-2xl bg-white/8 border border-white/10 flex items-center justify-center active:bg-emerald-500/20 transition-colors"
            >
              <AppIcon name="KeyboardArrowUp" size={28} className="text-white/60" />
            </button>
            {/* Down */}
            <button
              onTouchStart={() => changeDir('DOWN')}
              onMouseDown={() => changeDir('DOWN')}
              className="absolute bottom-0 left-1/2 -translate-x-1/2 w-14 h-14 rounded-2xl bg-white/8 border border-white/10 flex items-center justify-center active:bg-emerald-500/20 transition-colors"
            >
              <AppIcon name="KeyboardArrowDown" size={28} className="text-white/60" />
            </button>
            {/* Left */}
            <button
              onTouchStart={() => changeDir('LEFT')}
              onMouseDown={() => changeDir('LEFT')}
              className="absolute left-0 top-1/2 -translate-y-1/2 w-14 h-14 rounded-2xl bg-white/8 border border-white/10 flex items-center justify-center active:bg-emerald-500/20 transition-colors"
            >
              <AppIcon name="KeyboardArrowLeft" size={28} className="text-white/60" />
            </button>
            {/* Right */}
            <button
              onTouchStart={() => changeDir('RIGHT')}
              onMouseDown={() => changeDir('RIGHT')}
              className="absolute right-0 top-1/2 -translate-y-1/2 w-14 h-14 rounded-2xl bg-white/8 border border-white/10 flex items-center justify-center active:bg-emerald-500/20 transition-colors"
            >
              <AppIcon name="KeyboardArrowRight" size={28} className="text-white/60" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function getEyeOffsets(dir: Direction, cell: number): [{ x: number; y: number }, { x: number; y: number }] {
  const off = cell * 0.18;
  switch (dir) {
    case 'UP': return [{ x: -off, y: -off }, { x: off, y: -off }];
    case 'DOWN': return [{ x: -off, y: off }, { x: off, y: off }];
    case 'LEFT': return [{ x: -off, y: -off }, { x: -off, y: off }];
    case 'RIGHT': return [{ x: off, y: -off }, { x: off, y: off }];
  }
}

function getPupilDirection(dir: Direction, off: number): { x: number; y: number } {
  switch (dir) {
    case 'UP': return { x: 0, y: -off };
    case 'DOWN': return { x: 0, y: off };
    case 'LEFT': return { x: -off, y: 0 };
    case 'RIGHT': return { x: off, y: 0 };
  }
}
