import { describe, it, expect } from 'vitest';
import { planSatisfies, MODULE_REQUIRED_PLAN, PLANS } from '@/lib/plans';
import type { PlanTier } from '@/lib/plans';

describe('planSatisfies', () => {
  it('free satisfies free', () => {
    expect(planSatisfies('free', 'free')).toBe(true);
  });

  it('pro satisfies free and pro', () => {
    expect(planSatisfies('pro', 'free')).toBe(true);
    expect(planSatisfies('pro', 'pro')).toBe(true);
  });

  it('pro does not satisfy business', () => {
    expect(planSatisfies('pro', 'business')).toBe(false);
  });

  it('business satisfies all tiers', () => {
    expect(planSatisfies('business', 'free')).toBe(true);
    expect(planSatisfies('business', 'pro')).toBe(true);
    expect(planSatisfies('business', 'business')).toBe(true);
  });

  it('free does not satisfy pro or business', () => {
    expect(planSatisfies('free', 'pro')).toBe(false);
    expect(planSatisfies('free', 'business')).toBe(false);
  });
});

describe('MODULE_REQUIRED_PLAN', () => {
  it('has pro modules mapped correctly', () => {
    const proModules = ['finance', 'cash-closing', 'recipes', 'employees', 'ranking', 'rewards', 'personal-finance'];
    proModules.forEach(mod => {
      expect(MODULE_REQUIRED_PLAN[mod]).toBe('pro');
    });
  });

  it('has business modules mapped correctly', () => {
    const businessModules = ['marketing', 'copilot', 'menu-admin', 'whatsapp', 'pdv', 'deliveries'];
    businessModules.forEach(mod => {
      expect(MODULE_REQUIRED_PLAN[mod]).toBe('business');
    });
  });

  it('pro plan satisfies all pro module requirements', () => {
    Object.entries(MODULE_REQUIRED_PLAN)
      .filter(([, plan]) => plan === 'pro')
      .forEach(([mod, plan]) => {
        expect(planSatisfies('pro', plan)).toBe(true);
      });
  });

  it('free plan does not satisfy any module requirement', () => {
    Object.values(MODULE_REQUIRED_PLAN).forEach(plan => {
      expect(planSatisfies('free', plan)).toBe(false);
    });
  });
});

describe('PLANS', () => {
  it('has pro and business plans defined', () => {
    expect(PLANS).toHaveLength(2);
    expect(PLANS.map(p => p.id)).toEqual(['pro', 'business']);
  });

  it('yearly price is less than monthly', () => {
    PLANS.forEach(plan => {
      expect(plan.yearly).toBeLessThan(plan.monthly);
    });
  });

  it('each plan has features', () => {
    PLANS.forEach(plan => {
      expect(plan.features.length).toBeGreaterThan(0);
    });
  });
});
