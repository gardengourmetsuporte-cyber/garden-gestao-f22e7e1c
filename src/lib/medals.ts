/**
 * Sistema de Medalhas - Feitos únicos calculados no frontend
 */

export type MedalTier = 'bronze' | 'silver' | 'gold' | 'platinum';

export interface Medal {
  id: string;
  title: string;
  description: string;
  icon: string;
  tier: MedalTier;
  unlocked: boolean;
}

export interface MedalData {
  completions: Array<{ completed_at: string; item_id: string }>;
}

const HOUR = (dateStr: string) => new Date(dateStr).getHours();

function uniqueDays(completions: MedalData['completions']): string[] {
  const days = new Set(completions.map(c => c.completed_at.slice(0, 10)));
  return Array.from(days).sort();
}

function longestStreak(completions: MedalData['completions']): number {
  const days = uniqueDays(completions);
  if (days.length === 0) return 0;
  let max = 1, current = 1;
  for (let i = 1; i < days.length; i++) {
    const prev = new Date(days[i - 1]);
    const curr = new Date(days[i]);
    const diff = (curr.getTime() - prev.getTime()) / (1000 * 60 * 60 * 24);
    if (diff === 1) {
      current++;
      max = Math.max(max, current);
    } else {
      current = 1;
    }
  }
  return max;
}

function hasEarlyBird(completions: MedalData['completions']): boolean {
  return completions.some(c => HOUR(c.completed_at) < 7);
}

function maxCompletionsInHour(completions: MedalData['completions']): number {
  if (completions.length === 0) return 0;
  const sorted = [...completions].sort((a, b) => a.completed_at.localeCompare(b.completed_at));
  let max = 1;
  for (let i = 0; i < sorted.length; i++) {
    const start = new Date(sorted[i].completed_at).getTime();
    let count = 1;
    for (let j = i + 1; j < sorted.length; j++) {
      const t = new Date(sorted[j].completed_at).getTime();
      if (t - start <= 3600000) count++;
      else break;
    }
    max = Math.max(max, count);
  }
  return max;
}

function uniqueItemsInOneDay(completions: MedalData['completions']): number {
  const byDay: Record<string, Set<string>> = {};
  for (const c of completions) {
    const day = c.completed_at.slice(0, 10);
    if (!byDay[day]) byDay[day] = new Set();
    byDay[day].add(c.item_id);
  }
  return Math.max(0, ...Object.values(byDay).map(s => s.size));
}

const MEDAL_DEFS: { id: string; title: string; description: string; icon: string; tier: MedalTier; check: (d: MedalData) => boolean }[] = [
  { id: 'early_bird', title: 'Madrugador', description: 'Completou tarefa antes das 7h', icon: '🌅', tier: 'bronze', check: d => hasEarlyBird(d.completions) },
  { id: 'streak_3', title: 'Constante', description: '3 dias seguidos completando tarefas', icon: '🔗', tier: 'bronze', check: d => longestStreak(d.completions) >= 3 },
  { id: 'streak_7', title: 'Sequência de Fogo', description: '7 dias seguidos completando tarefas', icon: '🔥', tier: 'silver', check: d => longestStreak(d.completions) >= 7 },
  { id: 'streak_30', title: 'Imbatível', description: '30 dias seguidos completando tarefas', icon: '⚡', tier: 'platinum', check: d => longestStreak(d.completions) >= 30 },
  { id: 'speed_5', title: 'Velocista', description: '5 tarefas em 1 hora', icon: '🏎️', tier: 'silver', check: d => maxCompletionsInHour(d.completions) >= 5 },
  { id: 'multi_10', title: 'Multitarefa', description: '10+ itens diferentes no mesmo dia', icon: '🎯', tier: 'gold', check: d => uniqueItemsInOneDay(d.completions) >= 10 },
  { id: 'days_30', title: 'Veterano de Campo', description: 'Ativo em 30+ dias diferentes', icon: '📅', tier: 'gold', check: d => uniqueDays(d.completions).length >= 30 },
  { id: 'days_100', title: 'Centenário', description: 'Ativo em 100+ dias diferentes', icon: '🏆', tier: 'platinum', check: d => uniqueDays(d.completions).length >= 100 },
];

export function calculateMedals(data: MedalData): Medal[] {
  return MEDAL_DEFS.map(def => ({
    id: def.id,
    title: def.title,
    description: def.description,
    icon: def.icon,
    tier: def.tier,
    unlocked: def.check(data),
  }));
}

export const TIER_CONFIG: Record<MedalTier, { label: string; color: string; bg: string; border: string; glow: string }> = {
  bronze: {
    label: 'Bronze',
    color: 'hsl(30 60% 55%)',
    bg: 'hsl(30 40% 15%)',
    border: 'hsl(30 50% 35%)',
    glow: 'none',
  },
  silver: {
    label: 'Prata',
    color: 'hsl(210 15% 72%)',
    bg: 'hsl(210 15% 16%)',
    border: 'hsl(210 15% 40%)',
    glow: '0 0 6px hsl(210 15% 72% / 0.2)',
  },
  gold: {
    label: 'Ouro',
    color: 'hsl(45 90% 58%)',
    bg: 'hsl(45 40% 14%)',
    border: 'hsl(45 70% 40%)',
    glow: '0 0 10px hsl(45 90% 58% / 0.25)',
  },
  platinum: {
    label: 'Platina',
    color: 'hsl(190 80% 70%)',
    bg: 'hsl(190 30% 14%)',
    border: 'hsl(190 60% 40%)',
    glow: '0 0 14px hsl(190 80% 70% / 0.3)',
  },
};
