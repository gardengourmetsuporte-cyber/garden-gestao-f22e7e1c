/**
 * Sistema de Elos - Lista de progressão baseada em pontos ganhos
 * Reutiliza os ranks de ranks.ts para exibir a progressão completa
 */

import { getRank, getNextRank } from './ranks';

export interface EloTier {
  title: string;
  minPoints: number;
  color: string;
  unlocked: boolean;
  isCurrent: boolean;
  progress: number; // 0-100
}

// Definição dos 8 elos em ordem crescente
const ELO_TIERS: { title: string; min: number }[] = [
  { title: 'Iniciante', min: 0 },
  { title: 'Aprendiz', min: 10 },
  { title: 'Dedicado', min: 25 },
  { title: 'Veterano', min: 50 },
  { title: 'Mestre', min: 100 },
  { title: 'Lenda', min: 300 },
  { title: 'Mítico', min: 750 },
  { title: 'Imortal', min: 1500 },
];

const ELO_COLORS: Record<string, string> = {
  'Iniciante': 'hsl(var(--muted-foreground))',
  'Aprendiz': 'hsl(var(--neon-green))',
  'Dedicado': 'hsl(var(--neon-cyan))',
  'Veterano': 'hsl(var(--neon-purple))',
  'Mestre': 'hsl(var(--neon-amber))',
  'Lenda': 'hsl(var(--neon-red))',
  'Mítico': 'hsl(280 80% 65%)',
  'Imortal': 'hsl(200 80% 80%)',
};

export function getEloList(earnedPoints: number): EloTier[] {
  const currentRank = getRank(earnedPoints);

  return ELO_TIERS.map((tier, i) => {
    const nextMin = i < ELO_TIERS.length - 1 ? ELO_TIERS[i + 1].min : tier.min;
    const unlocked = earnedPoints >= tier.min;
    const isCurrent = currentRank.title === tier.title;

    let progress = 0;
    if (unlocked) {
      progress = 100;
    } else {
      // Progress towards this tier from previous tier
      const prevMin = i > 0 ? ELO_TIERS[i - 1].min : 0;
      const range = tier.min - prevMin;
      progress = range > 0 ? Math.round(((earnedPoints - prevMin) / range) * 100) : 0;
      progress = Math.max(0, Math.min(99, progress));
    }

    return {
      title: tier.title,
      minPoints: tier.min,
      color: ELO_COLORS[tier.title] || 'hsl(var(--muted-foreground))',
      unlocked,
      isCurrent,
      progress,
    };
  });
}

// Keep backward-compatible exports for any remaining references
export type AchievementData = { totalCompletions: number; earnedPoints: number; totalRedemptions: number };
export type Achievement = EloTier;
export function calculateAchievements(data: AchievementData): EloTier[] {
  return getEloList(data.earnedPoints);
}
