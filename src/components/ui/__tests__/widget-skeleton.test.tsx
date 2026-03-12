import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import {
  FinanceSkeleton,
  QuickStatsSkeleton,
  LeaderboardSkeleton,
  CalendarSkeleton,
  GenericWidgetSkeleton,
} from '../widget-skeleton';

describe('Skeleton components', () => {
  it.each([
    ['FinanceSkeleton', FinanceSkeleton],
    ['QuickStatsSkeleton', QuickStatsSkeleton],
    ['LeaderboardSkeleton', LeaderboardSkeleton],
    ['CalendarSkeleton', CalendarSkeleton],
    ['GenericWidgetSkeleton', GenericWidgetSkeleton],
  ])('%s renders without crash', (_, Component) => {
    const { container } = render(<Component />);
    expect(container.firstChild).toBeTruthy();
  });
});
