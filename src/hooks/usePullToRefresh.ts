import { useRef, useEffect, useCallback, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { hapticMedium } from '@/lib/native';

const THRESHOLD = 80;
const MAX_PULL = 120;

export function usePullToRefresh(queryKeys?: string[][]) {
  const queryClient = useQueryClient();
  const [pulling, setPulling] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const startY = useRef(0);
  const isPulling = useRef(false);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    hapticMedium();
    if (queryKeys?.length) {
      await Promise.all(queryKeys.map(k => queryClient.invalidateQueries({ queryKey: k })));
    } else {
      await queryClient.invalidateQueries();
    }
    setRefreshing(false);
    setPullDistance(0);
    setPulling(false);
  }, [queryClient, queryKeys]);

  useEffect(() => {
    const el = document.scrollingElement || document.documentElement;

    const onTouchStart = (e: TouchEvent) => {
      if (el.scrollTop <= 0) {
        startY.current = e.touches[0].clientY;
        isPulling.current = true;
      }
    };

    const onTouchMove = (e: TouchEvent) => {
      if (!isPulling.current) return;
      const dy = e.touches[0].clientY - startY.current;
      if (dy > 0) {
        const clamped = Math.min(dy * 0.5, MAX_PULL);
        setPullDistance(clamped);
        setPulling(true);
        if (clamped >= THRESHOLD) {
          // Visual feedback at threshold
        }
      } else {
        isPulling.current = false;
        setPullDistance(0);
        setPulling(false);
      }
    };

    const onTouchEnd = () => {
      if (!isPulling.current) return;
      isPulling.current = false;
      if (pullDistance >= THRESHOLD && !refreshing) {
        onRefresh();
      } else {
        setPullDistance(0);
        setPulling(false);
      }
    };

    window.addEventListener('touchstart', onTouchStart, { passive: true });
    window.addEventListener('touchmove', onTouchMove, { passive: true });
    window.addEventListener('touchend', onTouchEnd, { passive: true });

    return () => {
      window.removeEventListener('touchstart', onTouchStart);
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('touchend', onTouchEnd);
    };
  }, [pullDistance, refreshing, onRefresh]);

  return { pulling, pullDistance, refreshing, threshold: THRESHOLD };
}
