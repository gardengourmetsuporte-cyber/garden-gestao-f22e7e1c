import { Medal, TIER_CONFIG } from '@/lib/medals';
import { cn } from '@/lib/utils';

interface MedalListProps {
  medals: Medal[];
}

function StarIcon({ unlocked, color }: { unlocked: boolean; color: string }) {
  return (
    <svg viewBox="0 0 64 64" className={cn("w-20 h-20 drop-shadow-lg", unlocked && "animate-[medal-glow-pulse_3s_ease-in-out_infinite]")}>
      <defs>
        <radialGradient id="star-grad" cx="40%" cy="35%">
          <stop offset="0%" stopColor={unlocked ? 'hsl(45 100% 80%)' : 'hsl(215 10% 30%)'} />
          <stop offset="100%" stopColor={unlocked ? color : 'hsl(215 10% 18%)'} />
        </radialGradient>
      </defs>
      <g className={cn(unlocked && "animate-[medal-spin_12s_linear_infinite]")} style={{ transformOrigin: '32px 32px' }}>
        {[0, 45, 90, 135, 180, 225, 270, 315].map(angle => (
          <line key={angle} x1="32" y1="6" x2="32" y2="12"
            stroke={unlocked ? 'hsl(45 90% 70%)' : 'hsl(215 10% 25%)'}
            strokeWidth="1.5" strokeLinecap="round" opacity={unlocked ? 0.6 : 0.15}
            transform={`rotate(${angle} 32 32)`} />
        ))}
      </g>
      <polygon points="32,12 36.5,24 49,24 39,31 42,43 32,36 22,43 25,31 15,24 27.5,24"
        fill="url(#star-grad)" stroke={unlocked ? color : 'hsl(215 10% 25%)'} strokeWidth="1.2" />
      {unlocked && <polygon points="32,12 36.5,24 49,24 39,31 42,43 32,36 22,43 25,31 15,24 27.5,24"
        fill="hsl(45 100% 90% / 0.2)" className="animate-[medal-sparkle_2s_ease-in-out_infinite]" />}
    </svg>
  );
}

function ShieldIcon({ unlocked, color }: { unlocked: boolean; color: string }) {
  return (
    <svg viewBox="0 0 64 64" className={cn("w-20 h-20 drop-shadow-lg", unlocked && "animate-[medal-glow-pulse_4s_ease-in-out_infinite]")}>
      <defs>
        <linearGradient id="shield-grad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={unlocked ? 'hsl(45 80% 70%)' : 'hsl(215 10% 28%)'} />
          <stop offset="100%" stopColor={unlocked ? color : 'hsl(215 10% 16%)'} />
        </linearGradient>
      </defs>
      <path d="M32 6 L52 16 L52 34 Q52 50 32 58 Q12 50 12 34 L12 16 Z"
        fill="url(#shield-grad)" stroke={unlocked ? color : 'hsl(215 10% 25%)'} strokeWidth="1.5" />
      <text x="32" y="40" textAnchor="middle" fontSize="22" fontWeight="800"
        fill={unlocked ? 'hsl(0 0% 100%)' : 'hsl(215 10% 35%)'}
        style={{ textShadow: unlocked ? `0 0 8px ${color}` : 'none' }}>6</text>
      {unlocked && <path d="M32 6 L52 16 L52 34 Q52 50 32 58 Q12 50 12 34 L12 16 Z"
        fill="hsl(45 100% 90% / 0.1)" className="animate-[medal-sparkle_3s_ease-in-out_infinite]" />}
    </svg>
  );
}

function CrownIcon({ unlocked, color }: { unlocked: boolean; color: string }) {
  return (
    <svg viewBox="0 0 64 64" className={cn("w-20 h-20 drop-shadow-lg", unlocked && "animate-[medal-glow-pulse_3.5s_ease-in-out_infinite]")}>
      <defs>
        <linearGradient id="crown-grad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor={unlocked ? 'hsl(190 90% 75%)' : 'hsl(215 10% 28%)'} />
          <stop offset="50%" stopColor={unlocked ? 'hsl(280 70% 70%)' : 'hsl(215 10% 22%)'} />
          <stop offset="100%" stopColor={unlocked ? 'hsl(45 90% 65%)' : 'hsl(215 10% 16%)'} />
        </linearGradient>
      </defs>
      <polygon points="8,46 14,18 26,30 32,10 38,30 50,18 56,46"
        fill="url(#crown-grad)" stroke={unlocked ? color : 'hsl(215 10% 25%)'} strokeWidth="1.5" strokeLinejoin="round" />
      <rect x="8" y="46" width="48" height="6" rx="3"
        fill={unlocked ? color : 'hsl(215 10% 22%)'} opacity={unlocked ? 0.8 : 0.4} />
      <polygon points="32,16 36,24 32,32 28,24"
        fill={unlocked ? 'hsl(190 100% 85%)' : 'hsl(215 10% 30%)'}
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
    <svg viewBox="0 0 64 64" className="w-20 h-20 drop-shadow-lg">
      <defs>
        <linearGradient id="flask-grad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={unlocked ? 'hsl(45 80% 70%)' : 'hsl(215 10% 28%)'} />
          <stop offset="100%" stopColor={unlocked ? color : 'hsl(215 10% 16%)'} />
        </linearGradient>
      </defs>
      <path d="M26 8 L26 26 L12 52 Q10 56 14 56 L50 56 Q54 56 52 52 L38 26 L38 8 Z"
        fill="url(#flask-grad)" stroke={unlocked ? color : 'hsl(215 10% 25%)'} strokeWidth="1.5" />
      <rect x="23" y="5" width="18" height="4" rx="2" fill={unlocked ? color : 'hsl(215 10% 25%)'} />
      <path d="M17 44 Q24 40 32 44 Q40 48 47 44 L52 52 Q54 56 50 56 L14 56 Q10 56 12 52 Z"
        fill={unlocked ? `${color}80` : 'hsl(215 10% 20%)'}
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

export function MedalList({ medals }: MedalListProps) {
  const unlocked = medals.filter(m => m.unlocked);

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
      `}</style>

      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-foreground px-1">
          Medalhas ({unlocked.length}/{medals.length})
        </h3>
        <div className="grid grid-cols-2 gap-4">
          {medals.map(m => {
            const tier = TIER_CONFIG[m.tier];
            const IconComp = MEDAL_ICONS[m.id];
            return (
              <div
                key={m.id}
                className={cn(
                  "flex flex-col items-center gap-1 pt-3 pb-2 transition-all",
                  !m.unlocked && "opacity-50 grayscale-[60%]"
                )}
              >
                {/* Floating medal icon — no card background */}
                <div className="relative">
                  {m.unlocked && (
                    <div
                      className="absolute inset-0 rounded-full blur-2xl opacity-25 -z-10 scale-125"
                      style={{ background: tier.color }}
                    />
                  )}
                  {IconComp ? (
                    <IconComp unlocked={m.unlocked} color={tier.color} />
                  ) : (
                    <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center text-2xl">?</div>
                  )}
                </div>

                {/* Title */}
                <p className="text-xs font-bold text-center leading-tight text-foreground mt-1">
                  {m.title}
                </p>

                {/* Points badge */}
                <span
                  className="text-[11px] font-extrabold tracking-wide"
                  style={{ color: m.unlocked ? tier.color : 'hsl(215 15% 28%)' }}
                >
                  +{m.bonusPoints} pts
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
}
