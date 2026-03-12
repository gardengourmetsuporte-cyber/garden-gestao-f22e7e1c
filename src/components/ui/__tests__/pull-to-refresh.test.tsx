import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { PullToRefreshIndicator } from '../pull-to-refresh';

describe('PullToRefreshIndicator', () => {
  it('renders nothing when pullDistance=0 and not refreshing', () => {
    const { container } = render(
      <PullToRefreshIndicator pullDistance={0} refreshing={false} threshold={60} />
    );
    expect(container.firstChild).toBeNull();
  });

  it('renders spinner when refreshing', () => {
    const { container } = render(
      <PullToRefreshIndicator pullDistance={0} refreshing={true} threshold={60} />
    );
    expect(container.querySelector('.animate-spin')).toBeTruthy();
  });

  it('renders arrow when pulling', () => {
    const { container } = render(
      <PullToRefreshIndicator pullDistance={30} refreshing={false} threshold={60} />
    );
    expect(container.querySelector('svg')).toBeTruthy();
  });
});
