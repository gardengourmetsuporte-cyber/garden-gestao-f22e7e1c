/**
 * Sistema de Medalhas - Apenas medalhas realmente especiais
 */

export type MedalTier = 'gold' | 'platinum';

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
  hasEmployeeOfMonth?: boolean;
  hasPerfectDay?: boolean;
}

export function calculateMedals(data: MedalData): Medal[] {
  return [
    {
      id: 'employee_of_month',
      title: 'Funcionário do Mês',
      description: 'Reconhecido como o melhor do mês pelo gestor',
      icon: '🏆',
      tier: 'platinum',
      unlocked: data.hasEmployeeOfMonth ?? false,
    },
    {
      id: 'perfect_day',
      title: 'Dia Perfeito',
      description: 'Completou 100% das tarefas em um único dia',
      icon: '⭐',
      tier: 'gold',
      unlocked: data.hasPerfectDay ?? false,
    },
  ];
}

export const TIER_CONFIG: Record<MedalTier, { label: string; color: string; bg: string; border: string; glow: string }> = {
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
