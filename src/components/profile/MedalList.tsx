import * as React from 'react';
import { Medal, TIER_CONFIG, TIER_CONFIG_DARK, type MedalTier } from '@/lib/medals';
import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';

function useGetTier() {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';
  return (tier: MedalTier) => {
    const base = TIER_CONFIG[tier];
    if (isDark) { const d = TIER_CONFIG_DARK[tier]; return { ...base, color: d.color, bg: d.bg, border: d.border }; }
    return base;
  };
}

interface MedalListProps {
  medals: Medal[];
}

function StarIcon({ unlocked, color }: { unlocked: boolean; color: string }) {
  return (
    <svg viewBox="0 0 64 64" className={cn("w-16 h-16 drop-shadow-lg", unlocked && "animate-[medal-glow-pulse_3s_ease-in-out_infinite]")}>
      <defs>
        <radialGradient id="star-grad" cx="40%" cy="35%">
          <stop offset="0%" stopColor={unlocked ? 'hsl(45 100% 80%)' : `${color}90`} />
          <stop offset="100%" stopColor={color} />
        </radialGradient>
      </defs>
      <g className={cn(unlocked && "animate-[medal-spin_12s_linear_infinite]")} style={{ transformOrigin: '32px 32px' }}>
        {[0, 45, 90, 135, 180, 225, 270, 315].map(angle => (
          <line key={angle} x1="32" y1="6" x2="32" y2="12"
            stroke={unlocked ? 'hsl(45 90% 70%)' : `${color}60`}
            strokeWidth="1.5" strokeLinecap="round" opacity={unlocked ? 0.6 : 0.3}
            transform={`rotate(${angle} 32 32)`} />
        ))}
      </g>
      <polygon points="32,12 36.5,24 49,24 39,31 42,43 32,36 22,43 25,31 15,24 27.5,24"
        fill="url(#star-grad)" stroke={color} strokeWidth="1.2" opacity={unlocked ? 1 : 0.7} />
      {unlocked && <polygon points="32,12 36.5,24 49,24 39,31 42,43 32,36 22,43 25,31 15,24 27.5,24"
        fill="hsl(45 100% 90% / 0.2)" className="animate-[medal-sparkle_2s_ease-in-out_infinite]" />}
    </svg>
  );
}

function ShieldIcon({ unlocked, color }: { unlocked: boolean; color: string }) {
  return (
    <svg viewBox="0 0 64 64" className={cn("w-16 h-16 drop-shadow-lg", unlocked && "animate-[medal-glow-pulse_4s_ease-in-out_infinite]")}>
      <defs>
        <linearGradient id="shield-grad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={unlocked ? 'hsl(45 80% 70%)' : `${color}90`} />
          <stop offset="100%" stopColor={color} />
        </linearGradient>
      </defs>
      <path d="M32 6 L52 16 L52 34 Q52 50 32 58 Q12 50 12 34 L12 16 Z"
        fill="url(#shield-grad)" stroke={color} strokeWidth="1.5" opacity={unlocked ? 1 : 0.7} />
      <text x="32" y="40" textAnchor="middle" fontSize="22" fontWeight="800"
        fill={unlocked ? 'hsl(0 0% 100%)' : 'hsl(0 0% 85%)'}
        style={{ textShadow: unlocked ? `0 0 8px ${color}` : 'none' }}>6</text>
      {unlocked && <path d="M32 6 L52 16 L52 34 Q52 50 32 58 Q12 50 12 34 L12 16 Z"
        fill="hsl(45 100% 90% / 0.1)" className="animate-[medal-sparkle_3s_ease-in-out_infinite]" />}
    </svg>
  );
}

function CrownIcon({ unlocked, color }: { unlocked: boolean; color: string }) {
  return (
    <svg viewBox="0 0 64 64" className={cn("w-16 h-16 drop-shadow-lg", unlocked && "animate-[medal-glow-pulse_3.5s_ease-in-out_infinite]")}>
      <defs>
        <linearGradient id="crown-grad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor={unlocked ? 'hsl(190 90% 75%)' : `${color}80`} />
          <stop offset="50%" stopColor={unlocked ? 'hsl(280 70% 70%)' : `${color}90`} />
          <stop offset="100%" stopColor={color} />
        </linearGradient>
      </defs>
      <polygon points="8,46 14,18 26,30 32,10 38,30 50,18 56,46"
        fill="url(#crown-grad)" stroke={color} strokeWidth="1.5" strokeLinejoin="round" opacity={unlocked ? 1 : 0.7} />
      <rect x="8" y="46" width="48" height="6" rx="3"
        fill={color} opacity={unlocked ? 0.8 : 0.5} />
      <polygon points="32,16 36,24 32,32 28,24"
        fill={unlocked ? 'hsl(190 100% 85%)' : `${color}60`}
        className={cn(unlocked && "animate-[medal-sparkle_1.5s_ease-in-out_infinite]")} />
      {unlocked && <>
        <circle cx="20" cy="36" r="2" fill="hsl(45 100% 80% / 0.6)" className="animate-[medal-sparkle_2s_ease-in-out_infinite_0.3s]" />
        <circle cx="44" cy="36" r="2" fill="hsl(280 80% 80% / 0.6)" className="animate-[medal-sparkle_2s_ease-in-out_infinite_0.8s]" />
      </>}
    </svg>
  );
}

function FlaskIcon({ unlocked, color }: { unlocked: boolean; color: string }) {
  return (
    <svg viewBox="0 0 64 64" className="w-16 h-16 drop-shadow-lg">
      <defs>
        <linearGradient id="flask-grad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={unlocked ? 'hsl(45 80% 70%)' : `${color}90`} />
          <stop offset="100%" stopColor={color} />
        </linearGradient>
      </defs>
      <path d="M26 8 L26 26 L12 52 Q10 56 14 56 L50 56 Q54 56 52 52 L38 26 L38 8 Z"
        fill="url(#flask-grad)" stroke={color} strokeWidth="1.5" opacity={unlocked ? 1 : 0.7} />
      <rect x="23" y="5" width="18" height="4" rx="2" fill={color} opacity={unlocked ? 1 : 0.7} />
      <path d="M17 44 Q24 40 32 44 Q40 48 47 44 L52 52 Q54 56 50 56 L14 56 Q10 56 12 52 Z"
        fill={`${color}80`}
        className={cn(unlocked && "animate-[medal-glow-pulse_2.5s_ease-in-out_infinite]")} />
      {unlocked && <>
        <circle cx="24" cy="16" r="1.5" fill="hsl(45 100% 80%)" className="animate-[medal-sparkle_1.8s_ease-in-out_infinite]" />
        <circle cx="35" cy="13" r="1" fill="hsl(45 100% 80%)" className="animate-[medal-sparkle_1.8s_ease-in-out_infinite_0.5s]" />
        <circle cx="40" cy="20" r="1.8" fill="hsl(45 100% 80%)" className="animate-[medal-sparkle_1.8s_ease-in-out_infinite_1s]" />
      </>}
    </svg>
  );
}

const MEDAL_ICONS: Record<string, React.FC<{ unlocked: boolean; color: string }>> = {
  employee_of_month: StarIcon,
  six_months: ShieldIcon,
  one_year: CrownIcon,
  inventor: FlaskIcon,
};

const MEDAL_DESCRIPTIONS: Record<string, string> = {
  employee_of_month: 'Reconhecido como o melhor do mês',
  six_months: 'Completou 6 meses na empresa',
  one_year: 'Completou 1 ano na empresa',
  inventor: 'Criou uma receita oficial',
};

export function MedalList({ medals }: MedalListProps) {
  const getTier = useGetTier();
  const unlockedCount = medals.filter(m => m.unlocked).length;

  return (
    <>
      <style>{`
        @keyframes medal-spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes medal-sparkle {
          0%, 100% { opacity: 0.2; }
          50% { opacity: 1; }
        }
        @keyframes medal-glow-pulse {
          0%, 100% { filter: drop-shadow(0 0 3px currentColor); }
          50% { filter: drop-shadow(0 0 12px currentColor); }
        }
        @keyframes medal-shine {
          0% { transform: translateX(-100%) skewX(-15deg); }
          100% { transform: translateX(300%) skewX(-15deg); }
        }
      `}</style>

      <div className="space-y-3">
        {/* Header */}
        <div className="flex items-center justify-between px-1">
          <h3 className="text-sm font-semibold text-foreground">Medalhas</h3>
          <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-primary/10 text-primary">
            {unlockedCount}/{medals.length} conquistadas
          </span>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-2 gap-3">
          {medals.map(m => {
            const tier = getTier(m.tier);
            const IconComp = MEDAL_ICONS[m.id];
            const desc = MEDAL_DESCRIPTIONS[m.id] || m.description;

            return (
              <div
                key={m.id}
                className="relative flex flex-col items-center gap-2 p-4 rounded-2xl overflow-hidden transition-all"
                style={{
                  background: m.unlocked
                    ? `linear-gradient(145deg, ${tier.bg} 0%, hsl(var(--card)) 100%)`
                    : 'hsl(var(--card))',
                  border: `1px solid ${m.unlocked ? tier.border : 'hsl(var(--border) / 0.4)'}`,
                  boxShadow: m.unlocked ? `${tier.glow}, inset 0 1px 0 ${tier.color}20` : 'none',
                }}
              >
                {/* Shine sweep on unlocked */}
                {m.unlocked && (
                  <div
                    className="absolute inset-0 pointer-events-none"
                    style={{
                      background: `linear-gradient(105deg, transparent 40%, ${tier.color}12 50%, transparent 60%)`,
                      animation: 'medal-shine 6s ease-in-out infinite',
                    }}
                  />
                )}


                {/* Icon */}
                <div className={cn("relative mt-1", !m.unlocked && "grayscale opacity-50")}>
                  {m.unlocked && (
                    <div
                      className="absolute inset-0 rounded-full blur-xl opacity-25 scale-150 pointer-events-none"
                      style={{ background: tier.color }}
                    />
                  )}
                  {IconComp ? (
                    <IconComp unlocked={m.unlocked} color={tier.color} />
                  ) : (
                    <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center text-2xl">?</div>
                  )}
                </div>

                {/* Title */}
                <p className={cn(
                  "text-xs font-bold text-center leading-tight",
                  m.unlocked ? "text-foreground" : "text-muted-foreground"
                )}>
                  {m.title}
                </p>

                {/* Description */}
                <p className="text-[9px] text-muted-foreground/70 text-center leading-tight px-1">
                  {desc}
                </p>

                {/* Points badge */}
                {m.unlocked ? (
                  <div
                    className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold mt-0.5"
                    style={{ background: `${tier.color}18`, color: tier.color }}
                  >
                    +{m.bonusPoints} pts
                  </div>
                ) : (
                  <div className="flex items-center gap-1 text-[10px] text-muted-foreground/50 mt-0.5">
                    <span>🔒</span>
                    <span>+{m.bonusPoints} pts</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
}
