import { Medal, TIER_CONFIG } from '@/lib/medals';
import { cn } from '@/lib/utils';

interface MedalListProps {
  medals: Medal[];
}

/* ── SVG Medal Icons with unique animations ── */

function StarIcon({ unlocked, color }: { unlocked: boolean; color: string }) {
  return (
    <svg viewBox="0 0 48 48" className={cn("w-12 h-12", unlocked && "animate-[medal-glow-pulse_3s_ease-in-out_infinite]")}>
      <defs>
        <radialGradient id="star-grad" cx="40%" cy="35%">
          <stop offset="0%" stopColor={unlocked ? 'hsl(45 100% 75%)' : 'hsl(215 10% 30%)'} />
          <stop offset="100%" stopColor={unlocked ? color : 'hsl(215 10% 18%)'} />
        </radialGradient>
      </defs>
      {/* Rays */}
      <g className={cn(unlocked && "animate-[medal-spin_12s_linear_infinite]")} style={{ transformOrigin: '24px 24px' }}>
        {[0, 45, 90, 135, 180, 225, 270, 315].map(angle => (
          <line
            key={angle}
            x1="24" y1="6" x2="24" y2="10"
            stroke={unlocked ? 'hsl(45 90% 65%)' : 'hsl(215 10% 25%)'}
            strokeWidth="1.5"
            strokeLinecap="round"
            opacity={unlocked ? 0.7 : 0.2}
            transform={`rotate(${angle} 24 24)`}
          />
        ))}
      </g>
      {/* Star body */}
      <polygon
        points="24,10 27.5,19 37,19 29.5,25 32,34 24,28.5 16,34 18.5,25 11,19 20.5,19"
        fill="url(#star-grad)"
        stroke={unlocked ? color : 'hsl(215 10% 25%)'}
        strokeWidth="1"
      />
      {unlocked && (
        <polygon
          points="24,10 27.5,19 37,19 29.5,25 32,34 24,28.5 16,34 18.5,25 11,19 20.5,19"
          fill="hsl(45 100% 90% / 0.15)"
          className="animate-[medal-sparkle_2s_ease-in-out_infinite]"
        />
      )}
    </svg>
  );
}

function ShieldIcon({ unlocked, color }: { unlocked: boolean; color: string }) {
  return (
    <svg viewBox="0 0 48 48" className={cn("w-12 h-12", unlocked && "animate-[medal-glow-pulse_4s_ease-in-out_infinite]")}>
      <defs>
        <linearGradient id="shield-grad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={unlocked ? 'hsl(45 80% 65%)' : 'hsl(215 10% 28%)'} />
          <stop offset="100%" stopColor={unlocked ? color : 'hsl(215 10% 16%)'} />
        </linearGradient>
      </defs>
      <path
        d="M24 6 L38 14 L38 28 Q38 38 24 44 Q10 38 10 28 L10 14 Z"
        fill="url(#shield-grad)"
        stroke={unlocked ? color : 'hsl(215 10% 25%)'}
        strokeWidth="1.2"
      />
      <text
        x="24" y="30"
        textAnchor="middle"
        fontSize="16"
        fontWeight="800"
        fill={unlocked ? 'hsl(0 0% 100%)' : 'hsl(215 10% 35%)'}
        style={{ textShadow: unlocked ? `0 0 6px ${color}` : 'none' }}
      >
        6
      </text>
      {unlocked && (
        <path
          d="M24 6 L38 14 L38 28 Q38 38 24 44 Q10 38 10 28 L10 14 Z"
          fill="hsl(45 100% 90% / 0.1)"
          className="animate-[medal-sparkle_3s_ease-in-out_infinite]"
        />
      )}
    </svg>
  );
}

function CrownIcon({ unlocked, color }: { unlocked: boolean; color: string }) {
  return (
    <svg viewBox="0 0 48 48" className={cn("w-12 h-12", unlocked && "animate-[medal-glow-pulse_3.5s_ease-in-out_infinite]")}>
      <defs>
        <linearGradient id="crown-grad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor={unlocked ? 'hsl(190 90% 75%)' : 'hsl(215 10% 28%)'} />
          <stop offset="50%" stopColor={unlocked ? 'hsl(280 70% 70%)' : 'hsl(215 10% 22%)'} />
          <stop offset="100%" stopColor={unlocked ? 'hsl(45 90% 65%)' : 'hsl(215 10% 16%)'} />
        </linearGradient>
      </defs>
      {/* Crown */}
      <polygon
        points="8,34 12,16 20,24 24,10 28,24 36,16 40,34"
        fill="url(#crown-grad)"
        stroke={unlocked ? color : 'hsl(215 10% 25%)'}
        strokeWidth="1.2"
        strokeLinejoin="round"
      />
      <rect x="8" y="34" width="32" height="5" rx="2"
        fill={unlocked ? color : 'hsl(215 10% 22%)'}
        opacity={unlocked ? 0.8 : 0.4}
      />
      {/* Diamond */}
      <polygon
        points="24,15 27,20 24,25 21,20"
        fill={unlocked ? 'hsl(190 100% 85%)' : 'hsl(215 10% 30%)'}
        className={cn(unlocked && "animate-[medal-sparkle_1.5s_ease-in-out_infinite]")}
      />
      {unlocked && (
        <>
          <circle cx="16" cy="28" r="1.5" fill="hsl(45 100% 80% / 0.6)" className="animate-[medal-sparkle_2s_ease-in-out_infinite_0.3s]" />
          <circle cx="32" cy="28" r="1.5" fill="hsl(280 80% 80% / 0.6)" className="animate-[medal-sparkle_2s_ease-in-out_infinite_0.8s]" />
        </>
      )}
    </svg>
  );
}

function FlaskIcon({ unlocked, color }: { unlocked: boolean; color: string }) {
  return (
    <svg viewBox="0 0 48 48" className="w-12 h-12">
      <defs>
        <linearGradient id="flask-grad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={unlocked ? 'hsl(45 80% 70%)' : 'hsl(215 10% 28%)'} />
          <stop offset="100%" stopColor={unlocked ? color : 'hsl(215 10% 16%)'} />
        </linearGradient>
      </defs>
      {/* Flask body */}
      <path
        d="M20 8 L20 20 L10 38 Q9 40 11 41 L37 41 Q39 40 38 38 L28 20 L28 8 Z"
        fill="url(#flask-grad)"
        stroke={unlocked ? color : 'hsl(215 10% 25%)'}
        strokeWidth="1.2"
      />
      {/* Cap */}
      <rect x="18" y="6" width="12" height="3" rx="1.5"
        fill={unlocked ? color : 'hsl(215 10% 25%)'}
      />
      {/* Liquid */}
      <path
        d="M14 32 Q18 29 24 32 Q30 35 34 32 L38 38 Q39 40 37 41 L11 41 Q9 40 10 38 Z"
        fill={unlocked ? `${color}80` : 'hsl(215 10% 20%)'}
        className={cn(unlocked && "animate-[medal-glow-pulse_2.5s_ease-in-out_infinite]")}
      />
      {/* Sparkles */}
      {unlocked && (
        <>
          <circle cx="18" cy="14" r="1" fill="hsl(45 100% 80%)" className="animate-[medal-sparkle_1.8s_ease-in-out_infinite]" />
          <circle cx="26" cy="11" r="0.8" fill="hsl(45 100% 80%)" className="animate-[medal-sparkle_1.8s_ease-in-out_infinite_0.5s]" />
          <circle cx="30" cy="16" r="1.2" fill="hsl(45 100% 80%)" className="animate-[medal-sparkle_1.8s_ease-in-out_infinite_1s]" />
        </>
      )}
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
      {/* Keyframes */}
      <style>{`
        @keyframes medal-spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes medal-sparkle {
          0%, 100% { opacity: 0.3; }
          50% { opacity: 1; }
        }
        @keyframes medal-glow-pulse {
          0%, 100% { filter: drop-shadow(0 0 2px currentColor); }
          50% { filter: drop-shadow(0 0 8px currentColor); }
        }
      `}</style>

      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-foreground px-1">
          Medalhas ({unlocked.length}/{medals.length})
        </h3>
        <div className="grid grid-cols-2 gap-3">
          {medals.map(m => {
            const tier = TIER_CONFIG[m.tier];
            const IconComp = MEDAL_ICONS[m.id];
            return (
              <div
                key={m.id}
                className={cn(
                  "relative flex flex-col items-center gap-2 p-4 rounded-2xl transition-all overflow-hidden",
                  !m.unlocked && "opacity-40",
                  m.unlocked && "animate-glow-border"
                )}
                style={{
                  background: m.unlocked
                    ? `linear-gradient(145deg, ${tier.bg}, hsl(215 15% 10%))`
                    : 'hsl(215 15% 10%)',
                  border: m.unlocked
                    ? `1.5px solid ${tier.border}`
                    : '1.5px solid hsl(215 20% 18%)',
                  boxShadow: m.unlocked ? tier.glow : 'none',
                }}
              >
                {/* Decorative corner glow */}
                {m.unlocked && (
                  <div
                    className="absolute -top-6 -right-6 w-16 h-16 rounded-full blur-xl opacity-30"
                    style={{ background: tier.color }}
                  />
                )}

                {/* Icon */}
                {IconComp ? (
                  <IconComp unlocked={m.unlocked} color={tier.color} />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center text-lg">?</div>
                )}

                {/* Title */}
                <p className="text-xs font-bold text-center leading-tight text-foreground">
                  {m.title}
                </p>

                {/* Description */}
                <p className="text-[10px] text-center leading-tight text-muted-foreground line-clamp-2">
                  {m.description}
                </p>

                {/* Points */}
                <span
                  className="text-[11px] font-extrabold tracking-wide"
                  style={{ color: m.unlocked ? tier.color : 'hsl(215 15% 30%)' }}
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
