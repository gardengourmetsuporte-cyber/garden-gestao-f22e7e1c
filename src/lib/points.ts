/**
 * FONTE ÚNICA DA VERDADE PARA PONTOS
 * 
 * Este arquivo centraliza toda a lógica de pontos do sistema:
 * - Cálculo de pontos ganhos/gastos/saldo
 * - Cores por quantidade de pontos (1-4)
 * - Utilitários de formatação
 * 
 * REGRA: Todos os componentes devem usar estas funções para garantir consistência.
 */

// =============================================================================
// TIPOS
// =============================================================================

export type PointsLevel = 1 | 2 | 3 | 4;

export interface PointsColors {
  /** Cor sólida HSL - usar para texto e ícones */
  color: string;
  /** Cor de fundo com transparência - usar para badges */
  bg: string;
  /** Cor de borda com transparência */
  border: string;
  /** Cor de glow para animações */
  glow: string;
}

export interface PointsSummary {
  earned: number;
  spent: number;
  balance: number;
}

// =============================================================================
// CONSTANTES DE COR - Tokens do Design System (index.css)
// =============================================================================

/**
 * Mapeia quantidade de pontos para cores HSL.
 * Estas cores são definidas como CSS variables em index.css:
 * --coin-1 (Ciano), --coin-2 (Amarelo), --coin-3 (Rosa), --coin-4 (Roxo)
 */
export function getPointsColors(points: number): PointsColors {
  const level = clampPoints(points);
  
  return {
    color: `hsl(var(--coin-${level}))`,
    bg: `hsl(var(--coin-${level}) / 0.18)`,
    border: `hsl(var(--coin-${level}) / 0.35)`,
    glow: `hsl(var(--coin-${level}-glow))`,
  };
}

/**
 * Cores para pontos de bônus (5, 10, 15, 20)
 */
export function getBonusPointsColors(points: number): PointsColors {
  const tier = points <= 5 ? 5 : points <= 10 ? 10 : points <= 15 ? 15 : 20;
  return {
    color: `hsl(var(--bonus-${tier}))`,
    bg: `hsl(var(--bonus-${tier}) / 0.18)`,
    border: `hsl(var(--bonus-${tier}) / 0.35)`,
    glow: `hsl(var(--bonus-${tier}-glow))`,
  };
}

/**
 * Garante que o valor de pontos está entre 1 e 4
 */
export function clampPoints(points: number): PointsLevel {
  const p = Math.round(Number(points) || 1);
  if (p <= 1) return 1;
  if (p === 2) return 2;
  if (p === 3) return 3;
  return 4;
}

// =============================================================================
// CÁLCULO DE PONTOS - Fonte única de verdade
// =============================================================================

/**
 * Calcula pontos ganhos a partir de completions.
 * REGRA: Soma points_awarded onde awarded_points = true
 */
export function calculateEarnedPoints(
  completions: Array<{ points_awarded: number; awarded_points?: boolean }>
): number {
  return completions
    .filter(c => c.awarded_points !== false)
    .reduce((sum, c) => sum + (c.points_awarded || 0), 0);
}

/**
 * Calcula pontos gastos a partir de redemptions.
 * REGRA: Soma points_spent de redemptions com status approved ou delivered
 */
export function calculateSpentPoints(
  redemptions: Array<{ points_spent: number; status: string }>
): number {
  return redemptions
    .filter(r => r.status === 'approved' || r.status === 'delivered')
    .reduce((sum, r) => sum + r.points_spent, 0);
}

/**
 * Calcula o resumo completo de pontos
 */
export function calculatePointsSummary(
  completions: Array<{ points_awarded: number; awarded_points?: boolean }>,
  redemptions: Array<{ points_spent: number; status: string }>
): PointsSummary {
  const earned = calculateEarnedPoints(completions);
  const spent = calculateSpentPoints(redemptions);
  return {
    earned,
    spent,
    balance: earned - spent,
  };
}

// =============================================================================
// FORMATAÇÃO
// =============================================================================

/**
 * Formata número de pontos para exibição
 */
export function formatPoints(points: number): string {
  return points.toLocaleString('pt-BR');
}

/**
 * Retorna texto descritivo para quantidade de pontos
 */
export function getPointsLabel(points: number): string {
  if (points === 0) return 'sem pontos';
  if (points === 1) return '1 ponto';
  return `${points} pontos`;
}
