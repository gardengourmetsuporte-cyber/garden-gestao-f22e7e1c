/**
 * Sistema de Conquistas - Calculado no frontend a partir de dados existentes
 * Simplificado: nomes claros, sem redundância com ranks
 */

export type AchievementRarity = 'common' | 'rare' | 'epic' | 'legendary';
export type AchievementCategory = 'tasks' | 'points' | 'redemptions';

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  unlocked: boolean;
  rarity: AchievementRarity;
  category: AchievementCategory;
  current: number;
  target: number;
}

export interface AchievementData {
  totalCompletions: number;
  earnedPoints: number;
  totalRedemptions: number;
}

const ACHIEVEMENT_DEFS: {
  id: string;
  title: string;
  description: string;
  icon: string;
  rarity: AchievementRarity;
  category: AchievementCategory;
  target: number;
  getValue: (d: AchievementData) => number;
}[] = [
  // Tasks - nomes de ação/feito
  { id: 'first_task', title: 'Primeiro Passo', description: 'Complete 1 tarefa', icon: '🎯', rarity: 'common', category: 'tasks', target: 1, getValue: d => d.totalCompletions },
  { id: 'tasks_10', title: 'Engrenagem', description: 'Complete 10 tarefas', icon: '⚙️', rarity: 'common', category: 'tasks', target: 10, getValue: d => d.totalCompletions },
  { id: 'tasks_50', title: 'Operador', description: 'Complete 50 tarefas', icon: '🛡️', rarity: 'rare', category: 'tasks', target: 50, getValue: d => d.totalCompletions },
  { id: 'tasks_100', title: 'Centurião', description: 'Complete 100 tarefas', icon: '🏛️', rarity: 'rare', category: 'tasks', target: 100, getValue: d => d.totalCompletions },
  { id: 'tasks_500', title: 'Incansável', description: 'Complete 500 tarefas', icon: '💪', rarity: 'epic', category: 'tasks', target: 500, getValue: d => d.totalCompletions },
  { id: 'tasks_1000', title: 'Máquina', description: 'Complete 1000 tarefas', icon: '🤖', rarity: 'legendary', category: 'tasks', target: 1000, getValue: d => d.totalCompletions },

  // Points - nomes distintos dos ranks
  { id: 'points_10', title: 'Semente', description: 'Acumule 10 pontos', icon: '🌱', rarity: 'common', category: 'points', target: 10, getValue: d => d.earnedPoints },
  { id: 'points_50', title: 'Faísca', description: 'Acumule 50 pontos', icon: '✨', rarity: 'rare', category: 'points', target: 50, getValue: d => d.earnedPoints },
  { id: 'points_100', title: 'Forja', description: 'Acumule 100 pontos', icon: '🔨', rarity: 'rare', category: 'points', target: 100, getValue: d => d.earnedPoints },
  { id: 'points_500', title: 'Vulcão', description: 'Acumule 500 pontos', icon: '🌋', rarity: 'epic', category: 'points', target: 500, getValue: d => d.earnedPoints },
  { id: 'points_1000', title: 'Supernova', description: 'Acumule 1000 pontos', icon: '💫', rarity: 'legendary', category: 'points', target: 1000, getValue: d => d.earnedPoints },

  // Redemptions
  { id: 'first_redemption', title: 'Primeiro Resgate', description: 'Resgate 1 recompensa', icon: '🎁', rarity: 'common', category: 'redemptions', target: 1, getValue: d => d.totalRedemptions },
  { id: 'redemptions_5', title: 'Colecionador', description: 'Resgate 5 recompensas', icon: '🛍️', rarity: 'rare', category: 'redemptions', target: 5, getValue: d => d.totalRedemptions },
  { id: 'redemptions_15', title: 'Entusiasta', description: 'Resgate 15 recompensas', icon: '🏬', rarity: 'epic', category: 'redemptions', target: 15, getValue: d => d.totalRedemptions },
];

export function calculateAchievements(data: AchievementData): Achievement[] {
  return ACHIEVEMENT_DEFS.map(def => {
    const current = def.getValue(data);
    return {
      id: def.id,
      title: def.title,
      description: def.description,
      icon: def.icon,
      rarity: def.rarity,
      category: def.category,
      current: Math.min(current, def.target),
      target: def.target,
      unlocked: current >= def.target,
    };
  });
}

export const RARITY_CONFIG: Record<AchievementRarity, { label: string; gradient: string; border: string; glow: string }> = {
  common: {
    label: 'Comum',
    gradient: 'linear-gradient(135deg, hsl(215 20% 14%), hsl(215 20% 18%))',
    border: 'hsl(215 20% 25%)',
    glow: 'none',
  },
  rare: {
    label: 'Raro',
    gradient: 'linear-gradient(135deg, hsl(217 40% 14%), hsl(217 50% 20%))',
    border: 'hsl(217 70% 45%)',
    glow: '0 0 8px hsl(217 70% 45% / 0.2)',
  },
  epic: {
    label: 'Épico',
    gradient: 'linear-gradient(135deg, hsl(280 30% 14%), hsl(280 40% 20%))',
    border: 'hsl(280 70% 55%)',
    glow: '0 0 10px hsl(280 70% 55% / 0.25)',
  },
  legendary: {
    label: 'Lendário',
    gradient: 'linear-gradient(135deg, hsl(38 40% 12%), hsl(38 50% 18%))',
    border: 'hsl(38 80% 55%)',
    glow: '0 0 14px hsl(38 80% 55% / 0.3)',
  },
};

export const CATEGORY_LABELS: Record<AchievementCategory, string> = {
  tasks: '⚔️ Tarefas',
  points: '⭐ Pontos',
  redemptions: '🎁 Resgates',
};
