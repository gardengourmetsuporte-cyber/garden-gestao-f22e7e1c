import { Medal, TIER_CONFIG } from '@/lib/medals';
import { cn } from '@/lib/utils';

interface MedalListProps {
  medals: Medal[];
}

export function MedalList({ medals }: MedalListProps) {
  const unlocked = medals.filter(m => m.unlocked);

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold text-foreground px-1">
        Medalhas ({unlocked.length}/{medals.length})
      </h3>
      <div className="grid grid-cols-4 gap-2">
        {medals.map(m => {
          const tier = TIER_CONFIG[m.tier];
          return (
            <div
              key={m.id}
              className={cn(
                "flex flex-col items-center gap-1 p-2 rounded-xl transition-all",
                !m.unlocked && "opacity-35"
              )}
              style={{
                background: m.unlocked ? tier.bg : 'transparent',
                border: m.unlocked ? `1px solid ${tier.border}` : '1px solid hsl(215 20% 18%)',
                boxShadow: m.unlocked ? tier.glow : 'none',
              }}
            >
              {/* Medal seal */}
              <div
                className={cn(
                  "w-10 h-10 rounded-full flex items-center justify-center text-lg",
                  m.unlocked && "medal-shine"
                )}
                style={{
                  background: m.unlocked
                    ? `radial-gradient(circle at 35% 35%, ${tier.color}, ${tier.border})`
                    : 'hsl(215 15% 15%)',
                  border: `2px solid ${m.unlocked ? tier.color : 'hsl(215 15% 22%)'}`,
                  boxShadow: m.unlocked ? `inset 0 -2px 4px hsl(0 0% 0% / 0.3), 0 0 8px ${tier.color}40` : 'none',
                }}
              >
                {m.icon}
              </div>
              <p className="text-[9px] font-semibold text-center leading-tight text-foreground">
                {m.title}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
