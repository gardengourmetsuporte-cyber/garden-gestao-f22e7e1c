/**
 * Sistema de Conquistas - Calculado no frontend a partir de dados existentes
 */

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string; // emoji
  unlocked: boolean;
}

interface AchievementData {
  totalCompletions: number;
  earnedPoints: number;
  totalRedemptions: number;
}

const ACHIEVEMENT_DEFS: { id: string; title: string; description: string; icon: string; check: (d: AchievementData) => boolean }[] = [
  { id: 'first_task', title: 'Primeiro Passo', description: 'Completou a primeira tarefa', icon: '🎯', check: d => d.totalCompletions >= 1 },
  { id: 'tasks_10', title: 'Fiel Escudeiro', description: '10 tarefas completadas', icon: '🛡️', check: d => d.totalCompletions >= 10 },
  { id: 'tasks_50', title: 'Incansável', description: '50 tarefas completadas', icon: '⚡', check: d => d.totalCompletions >= 50 },
  { id: 'tasks_100', title: 'Centurião', description: '100 tarefas completadas', icon: '🏛️', check: d => d.totalCompletions >= 100 },
  { id: 'first_redemption', title: 'Colecionador', description: 'Resgatou primeira recompensa', icon: '🎁', check: d => d.totalRedemptions >= 1 },
  { id: 'points_10', title: 'Aprendiz', description: 'Alcançou 10 pontos', icon: '🌱', check: d => d.earnedPoints >= 10 },
  { id: 'points_25', title: 'Dedicado', description: 'Alcançou 25 pontos', icon: '💎', check: d => d.earnedPoints >= 25 },
  { id: 'points_50', title: 'Veterano', description: 'Alcançou 50 pontos', icon: '🔮', check: d => d.earnedPoints >= 50 },
  { id: 'points_100', title: 'Mestre', description: 'Alcançou 100 pontos', icon: '👑', check: d => d.earnedPoints >= 100 },
  { id: 'points_200', title: 'Lenda', description: 'Alcançou 200 pontos', icon: '🔥', check: d => d.earnedPoints >= 200 },
  { id: 'points_500', title: 'Mítico', description: 'Alcançou 500 pontos', icon: '🌟', check: d => d.earnedPoints >= 500 },
];

export function calculateAchievements(data: AchievementData): Achievement[] {
  return ACHIEVEMENT_DEFS.map(def => ({
    id: def.id,
    title: def.title,
    description: def.description,
    icon: def.icon,
    unlocked: def.check(data),
  }));
}
