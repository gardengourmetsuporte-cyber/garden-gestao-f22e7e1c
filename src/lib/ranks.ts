/**
 * Sistema de Rankings - Títulos e Molduras por Pontos Ganhos
 * Inspirado no sistema de elos do League of Legends
 */

export interface RankInfo {
  level: number;
  title: string;
  /** CSS color string */
  color: string;
  /** CSS border color */
  borderColor: string;
  /** CSS glow/shadow */
  glow: string;
  /** CSS border width */
  borderWidth: number;
  /** Whether to animate the border */
  animated: boolean;
}

const RANKS: { min: number; info: Omit<RankInfo, 'level'> }[] = [
  {
    min: 500,
    info: {
      title: 'Mítico',
      color: 'hsl(280 80% 65%)',
      borderColor: 'rainbow',
      glow: '0 0 16px hsl(280 80% 65% / 0.5), 0 0 32px hsl(190 90% 55% / 0.3)',
      borderWidth: 3,
      animated: true,
    },
  },
  {
    min: 200,
    info: {
      title: 'Lenda',
      color: 'hsl(var(--neon-red))',
      borderColor: 'hsl(var(--neon-red))',
      glow: '0 0 14px hsl(var(--neon-red) / 0.5)',
      borderWidth: 3,
      animated: true,
    },
  },
  {
    min: 100,
    info: {
      title: 'Mestre',
      color: 'hsl(var(--neon-amber))',
      borderColor: 'hsl(var(--neon-amber))',
      glow: '0 0 12px hsl(var(--neon-amber) / 0.4)',
      borderWidth: 3,
      animated: false,
    },
  },
  {
    min: 50,
    info: {
      title: 'Veterano',
      color: 'hsl(var(--neon-purple))',
      borderColor: 'hsl(var(--neon-purple))',
      glow: '0 0 10px hsl(var(--neon-purple) / 0.35)',
      borderWidth: 2,
      animated: false,
    },
  },
  {
    min: 25,
    info: {
      title: 'Dedicado',
      color: 'hsl(var(--neon-cyan))',
      borderColor: 'hsl(var(--neon-cyan))',
      glow: '0 0 8px hsl(var(--neon-cyan) / 0.3)',
      borderWidth: 2,
      animated: false,
    },
  },
  {
    min: 10,
    info: {
      title: 'Aprendiz',
      color: 'hsl(var(--neon-green))',
      borderColor: 'hsl(var(--neon-green))',
      glow: '0 0 6px hsl(var(--neon-green) / 0.25)',
      borderWidth: 2,
      animated: false,
    },
  },
  {
    min: 0,
    info: {
      title: 'Iniciante',
      color: 'hsl(var(--muted-foreground))',
      borderColor: 'hsl(var(--border))',
      glow: 'none',
      borderWidth: 2,
      animated: false,
    },
  },
];

/**
 * Retorna informações de ranking baseadas nos pontos ganhos
 */
export function getRank(earnedPoints: number): RankInfo {
  const idx = RANKS.findIndex(r => earnedPoints >= r.min);
  const rank = RANKS[idx >= 0 ? idx : RANKS.length - 1];
  return { level: RANKS.length - (idx >= 0 ? idx : RANKS.length - 1), ...rank.info };
}

/**
 * Retorna o próximo rank e pontos necessários, ou null se já é Mítico
 */
export function getNextRank(earnedPoints: number): { title: string; pointsNeeded: number } | null {
  const idx = RANKS.findIndex(r => earnedPoints >= r.min);
  if (idx <= 0) return null; // already max
  const next = RANKS[idx - 1];
  return { title: next.info.title, pointsNeeded: next.min - earnedPoints };
}
