import { useState, useEffect, useCallback, useRef } from 'react';
import { AppIcon } from '@/components/ui/app-icon';

interface Point { x: number; y: number; }

const GRID = 20;
const INITIAL_SPEED = 150;
const SPEED_INCREMENT = 3;
const MIN_SPEED = 60;

const FOOD_ITEMS = [
  { color: '#FF6B35', points: 10, name: 'Hambúrguer', shape: 'burger' },
  { color: '#FFD700', points: 8, name: 'Batata Frita', shape: 'fries' },
  { color: '#FF4444', points: 7, name: 'Hot Dog', shape: 'hotdog' },
  { color: '#00BFFF', points: 5, name: 'Refrigerante', shape: 'drink' },
  { color: '#FF6347', points: 12, name: 'Pizza', shape: 'pizza' },
  { color: '#FF69B4', points: 15, name: 'Cupcake', shape: 'cupcake' },
  { color: '#F4A460', points: 9, name: 'Sanduíche', shape: 'sandwich' },
  { color: '#CD853F', points: 11, name: 'Frango', shape: 'chicken' },
];

type Direction = 'UP' | 'DOWN' | 'LEFT' | 'RIGHT';

function randomFood(snake: Point[]): { pos: Point; item: typeof FOOD_ITEMS[0] } {
  let pos: Point;
  do {
    pos = { x: Math.floor(Math.random() * GRID), y: Math.floor(Math.random() * GRID) };
  } while (snake.some(s => s.x === pos.x && s.y === pos.y));
  return { pos, item: FOOD_ITEMS[Math.floor(Math.random() * FOOD_ITEMS.length)] };
}

function drawFoodShape(ctx: CanvasRenderingContext2D, x: number, y: number, cell: number, item: typeof FOOD_ITEMS[0]) {
  const cx = x + cell / 2;
  const cy = y + cell / 2;
  const r = cell * 0.32;

  // Glow
  const glow = ctx.createRadialGradient(cx, cy, 0, cx, cy, cell * 0.7);
  glow.addColorStop(0, item.color + '40');
  glow.addColorStop(1, 'transparent');
  ctx.fillStyle = glow;
  ctx.beginPath();
  ctx.arc(cx, cy, cell * 0.7, 0, Math.PI * 2);
  ctx.fill();

  // Main circle
  const grad = ctx.createRadialGradient(cx - r * 0.3, cy - r * 0.3, 0, cx, cy, r);
  grad.addColorStop(0, item.color);
  grad.addColorStop(1, shadeColor(item.color, -30));
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fill();

  // Highlight
  ctx.fillStyle = 'rgba(255,255,255,0.35)';
  ctx.beginPath();
  ctx.arc(cx - r * 0.2, cy - r * 0.2, r * 0.35, 0, Math.PI * 2);
  ctx.fill();

  // Points text
  ctx.fillStyle = 'white';
  ctx.font = `bold ${cell * 0.22}px system-ui, sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(`+${item.points}`, cx, cy + r + cell * 0.14);
}

function shadeColor(color: string, percent: number): string {
  const num = parseInt(color.replace('#', ''), 16);
  const amt = Math.round(2.55 * percent);
  const R = Math.max(0, Math.min(255, (num >> 16) + amt));
  const G = Math.max(0, Math.min(255, ((num >> 8) & 0x00FF) + amt));
  const B = Math.max(0, Math.min(255, (num & 0x0000FF) + amt));
  return `rgb(${R},${G},${B})`;
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

    // Background
    ctx.fillStyle = 'hsl(150, 12%, 7%)';
    ctx.fillRect(0, 0, size, size);

    // Grid dots (subtle)
    ctx.fillStyle = 'hsla(150, 10%, 20%, 0.3)';
    for (let i = 0; i < GRID; i++) {
      for (let j = 0; j < GRID; j++) {
        ctx.beginPath();
        ctx.arc(i * cell + cell / 2, j * cell + cell / 2, 1, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // Food
    const food = foodRef.current;
    drawFoodShape(ctx, food.pos.x * cell, food.pos.y * cell, cell, food.item);

    // Snake
    const snake = snakeRef.current;
    snake.forEach((seg, i) => {
      const progress = i / Math.max(snake.length - 1, 1);
      const hue = 142;
      const lightness = 50 - progress * 18;
      const saturation = 75 - progress * 15;

      if (i === 0) {
        // Head glow
        const headGlow = ctx.createRadialGradient(
          seg.x * cell + cell / 2, seg.y * cell + cell / 2, cell * 0.2,
          seg.x * cell + cell / 2, seg.y * cell + cell / 2, cell * 0.9
        );
        headGlow.addColorStop(0, `hsla(${hue}, 80%, 50%, 0.2)`);
        headGlow.addColorStop(1, 'transparent');
        ctx.fillStyle = headGlow;
        ctx.fillRect(seg.x * cell - cell * 0.3, seg.y * cell - cell * 0.3, cell * 1.6, cell * 1.6);

        // Head body
        const headGrad = ctx.createLinearGradient(
          seg.x * cell, seg.y * cell,
          seg.x * cell + cell, seg.y * cell + cell
        );
        headGrad.addColorStop(0, `hsl(${hue}, 80%, 52%)`);
        headGrad.addColorStop(1, `hsl(${hue}, 75%, 38%)`);
        ctx.fillStyle = headGrad;
        ctx.beginPath();
        ctx.roundRect(seg.x * cell + 1, seg.y * cell + 1, cell - 2, cell - 2, cell * 0.35);
        ctx.fill();

        // Head shine
        ctx.fillStyle = 'hsla(142, 80%, 70%, 0.15)';
        ctx.beginPath();
        ctx.roundRect(seg.x * cell + 3, seg.y * cell + 3, cell * 0.45, cell * 0.35, cell * 0.2);
        ctx.fill();

        // Eyes
        const eyeSize = cell * 0.11;
        const eyeOffsets = getEyeOffsets(dirRef.current, cell);
        
        // Eye whites
        ctx.fillStyle = 'white';
        ctx.beginPath();
        ctx.arc(seg.x * cell + cell / 2 + eyeOffsets[0].x, seg.y * cell + cell / 2 + eyeOffsets[0].y, eyeSize, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(seg.x * cell + cell / 2 + eyeOffsets[1].x, seg.y * cell + cell / 2 + eyeOffsets[1].y, eyeSize, 0, Math.PI * 2);
        ctx.fill();

        // Pupils
        ctx.fillStyle = '#111';
        const pd = getPupilDirection(dirRef.current, cell * 0.04);
        ctx.beginPath();
        ctx.arc(seg.x * cell + cell / 2 + eyeOffsets[0].x + pd.x, seg.y * cell + cell / 2 + eyeOffsets[0].y + pd.y, eyeSize * 0.55, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(seg.x * cell + cell / 2 + eyeOffsets[1].x + pd.x, seg.y * cell + cell / 2 + eyeOffsets[1].y + pd.y, eyeSize * 0.55, 0, Math.PI * 2);
        ctx.fill();
      } else {
        // Body segment
        const bodyGrad = ctx.createRadialGradient(
          seg.x * cell + cell / 2, seg.y * cell + cell / 2, 0,
          seg.x * cell + cell / 2, seg.y * cell + cell / 2, cell * 0.5
        );
        bodyGrad.addColorStop(0, `hsl(${hue}, ${saturation}%, ${lightness + 5}%)`);
        bodyGrad.addColorStop(1, `hsl(${hue}, ${saturation}%, ${lightness - 5}%)`);
        ctx.fillStyle = bodyGrad;
        
        const gap = 1.5;
        ctx.beginPath();
        ctx.roundRect(seg.x * cell + gap, seg.y * cell + gap, cell - gap * 2, cell - gap * 2, cell * 0.3);
        ctx.fill();

        // Scale pattern
        if (i % 2 === 0) {
          ctx.fillStyle = `hsla(${hue}, 50%, ${lightness + 12}%, 0.12)`;
          ctx.beginPath();
          ctx.arc(seg.x * cell + cell * 0.35, seg.y * cell + cell * 0.35, cell * 0.12, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    });

    // Border
    ctx.strokeStyle = 'hsla(142, 50%, 30%, 0.6)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(1, 1, size - 2, size - 2, 12);
    ctx.stroke();
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

    if (head.x < 0 || head.x >= GRID || head.y < 0 || head.y >= GRID) { endGame(); return; }
    if (snake.some(s => s.x === head.x && s.y === head.y)) { endGame(); return; }

    snake.unshift(head);

    const food = foodRef.current;
    if (head.x === food.pos.x && head.y === food.pos.y) {
      scoreRef.current += food.item.points;
      setScore(scoreRef.current);
      setLastFood(`${food.item.name} +${food.item.points}`);
      setTimeout(() => setLastFood(''), 1200);
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
    return () => { if (gameLoopRef.current) cancelAnimationFrame(gameLoopRef.current); };
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

  // Touch
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
        const w = containerRef.current.clientWidth - 32; // px-4 padding
        const h = containerRef.current.clientHeight - 16;
        const s = Math.min(w, h, 600);
        setCanvasSize(Math.max(Math.floor(s / GRID) * GRID, GRID * 10));
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
    <div className="h-[100dvh] bg-[hsl(150,12%,5%)] flex flex-col overflow-hidden">
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
      <div className="flex items-center justify-center gap-4 px-4 py-2 shrink-0">
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">
          <span className="text-xs text-emerald-400 font-bold">⭐ {score}</span>
        </div>
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/20">
          <span className="text-xs text-amber-400 font-bold">🏆 {highScore}</span>
        </div>
        {lastFood && (
          <span className="text-xs font-bold text-emerald-300 animate-bounce">{lastFood}</span>
        )}
      </div>

      {/* Game area */}
      <div ref={containerRef} className="flex-1 flex items-center justify-center px-4 relative">
        <div className="relative">
          <canvas
            ref={canvasRef}
            width={canvasSize}
            height={canvasSize}
            className="rounded-2xl"
            style={{ boxShadow: '0 0 40px hsla(142, 50%, 30%, 0.15), inset 0 0 20px hsla(142, 50%, 20%, 0.05)' }}
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
          />

          {/* Menu overlay */}
          {gameState === 'menu' && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/75 backdrop-blur-sm rounded-2xl gap-5">
              <span className="text-6xl">🐍</span>
              <h2 className="text-2xl font-black text-white">Snake Garden</h2>
              <p className="text-sm text-emerald-300/80">Coma os lanches e fique enorme!</p>
              <button
                onClick={startGame}
                className="px-8 py-3.5 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-white font-bold text-base shadow-lg shadow-emerald-500/30 active:scale-95 transition-all"
              >
                Jogar! 🎮
              </button>
              <p className="text-[11px] text-white/40">Deslize ou use as setas para mover</p>
            </div>
          )}

          {/* Game over */}
          {gameState === 'gameover' && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 backdrop-blur-sm rounded-2xl gap-4">
              <span className="text-5xl">😵</span>
              <h2 className="text-xl font-black text-white">Game Over!</h2>
              <p className="text-3xl font-black text-emerald-400">{score}</p>
              <p className="text-xs text-white/50">pontos</p>
              {score >= highScore && score > 0 && (
                <p className="text-sm font-bold text-amber-400 animate-pulse">🏆 Novo recorde!</p>
              )}
              <div className="flex gap-3 mt-2">
                <button onClick={onBack} className="px-5 py-2.5 rounded-xl bg-white/10 border border-white/10 text-white font-semibold text-sm">
                  Sair
                </button>
                <button onClick={startGame} className="px-6 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-white font-bold text-sm shadow-lg shadow-emerald-500/30 active:scale-95 transition-all">
                  Jogar de novo 🔄
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* D-Pad */}
      {gameState === 'playing' && (
        <div className="shrink-0 flex justify-center pb-[max(env(safe-area-inset-bottom,8px),12px)] pt-2">
          <div className="relative w-[150px] h-[150px]">
            {(['UP', 'DOWN', 'LEFT', 'RIGHT'] as Direction[]).map(d => {
              const pos = {
                UP: 'top-0 left-1/2 -translate-x-1/2',
                DOWN: 'bottom-0 left-1/2 -translate-x-1/2',
                LEFT: 'left-0 top-1/2 -translate-y-1/2',
                RIGHT: 'right-0 top-1/2 -translate-y-1/2',
              }[d];
              const icon = {
                UP: 'KeyboardArrowUp',
                DOWN: 'KeyboardArrowDown',
                LEFT: 'KeyboardArrowLeft',
                RIGHT: 'KeyboardArrowRight',
              }[d];
              return (
                <button
                  key={d}
                  onTouchStart={() => changeDir(d)}
                  onMouseDown={() => changeDir(d)}
                  className={`absolute ${pos} w-12 h-12 rounded-xl bg-white/6 border border-white/10 flex items-center justify-center active:bg-emerald-500/20 transition-colors`}
                >
                  <AppIcon name={icon} size={24} className="text-white/50" />
                </button>
              );
            })}
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
