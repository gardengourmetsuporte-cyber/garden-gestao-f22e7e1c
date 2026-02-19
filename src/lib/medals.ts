/**
 * Sistema de Medalhas - Honrarias de prestígio
 */

import { differenceInMonths } from 'date-fns';

export type MedalTier = 'bronze' | 'silver' | 'gold' | 'platinum';

export interface Medal {
  id: string;
  title: string;
  description: string;
  tier: MedalTier;
  unlocked: boolean;
  bonusPoints: number;
}

export interface MedalData {
  hasEmployeeOfMonth?: boolean;
  admissionDate?: string | null;
  hasInventedRecipe?: boolean;
}

export function calculateMedals(data: MedalData): Medal[] {
  const monthsSinceAdmission = data.admissionDate
    ? differenceInMonths(new Date(), new Date(data.admissionDate))
    : 0;

  return [
    {
      id: 'employee_of_month',
      title: 'Funcionário do Mês',
      description: 'Reconhecido como o melhor do mês pelo gestor',
      tier: 'platinum',
      unlocked: data.hasEmployeeOfMonth ?? false,
      bonusPoints: 50,
    },
    {
      id: 'six_months',
      title: '6 Meses de Casa',
      description: 'Completou 6 meses na empresa',
      tier: 'gold',
      unlocked: !!data.admissionDate && monthsSinceAdmission >= 6,
      bonusPoints: 30,
    },
    {
      id: 'one_year',
      title: '1 Ano de Casa',
      description: 'Completou 1 ano na empresa',
      tier: 'platinum',
      unlocked: !!data.admissionDate && monthsSinceAdmission >= 12,
      bonusPoints: 75,
    },
    {
      id: 'inventor',
      title: 'Inventor',
      description: 'Criou uma receita oficial para o negócio',
      tier: 'gold',
      unlocked: data.hasInventedRecipe ?? false,
      bonusPoints: 40,
    },
  ];
}

export const TIER_CONFIG: Record<MedalTier, { label: string; color: string; bg: string; border: string; glow: string }> = {
  bronze: {
    label: 'Bronze',
    color: 'hsl(30 60% 50%)',
    bg: 'hsl(30 30% 14%)',
    border: 'hsl(30 50% 35%)',
    glow: '0 0 8px hsl(30 60% 50% / 0.2)',
  },
  silver: {
    label: 'Prata',
    color: 'hsl(220 15% 65%)',
    bg: 'hsl(220 15% 14%)',
    border: 'hsl(220 15% 40%)',
    glow: '0 0 8px hsl(220 15% 65% / 0.2)',
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
