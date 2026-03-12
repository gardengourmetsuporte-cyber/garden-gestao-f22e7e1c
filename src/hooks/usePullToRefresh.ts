import { useRef, useEffect, useCallback, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { hapticMedium } from '@/lib/native';

const THRESHOLD = 80;
const MAX_PULL = 120;

export function usePullToRefresh(queryKeys?: string[][]) {
  const queryClient = useQueryClient();
  const [pullDistance, setPullDistance] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const startY = useRef(0);
  const isPulling = useRef(false);
  const currentPull = useRef(0);

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
  }, [queryClient, queryKeys]);

  useEffect(() => {
    const el = document.scrollingElement || document.documentElement;
    let rafId = 0;

    const onTouchStart = (e: TouchEvent) => {
      if (el.scrollTop <= 0 && !refreshing) {
        startY.current = e.touches[0].clientY;
        isPulling.current = true;
      }
    };

    const onTouchMove = (e: TouchEvent) => {
      if (!isPulling.current) return;
      const dy = e.touches[0].clientY - startY.current;
      if (dy > 0) {
        currentPull.current = Math.min(dy * 0.5, MAX_PULL);
        cancelAnimationFrame(rafId);
        rafId = requestAnimationFrame(() => {
          setPullDistance(currentPull.current);
        });
      } else {
        isPulling.current = false;
        currentPull.current = 0;
        setPullDistance(0);
      }
    };

    const onTouchEnd = () => {
      if (!isPulling.current) return;
      isPulling.current = false;
      cancelAnimationFrame(rafId);
      if (currentPull.current >= THRESHOLD && !refreshing) {
        onRefresh();
      } else {
        currentPull.current = 0;
        setPullDistance(0);
      }
    };

    window.addEventListener('touchstart', onTouchStart, { passive: true });
    window.addEventListener('touchmove', onTouchMove, { passive: true });
    window.addEventListener('touchend', onTouchEnd, { passive: true });

    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener('touchstart', onTouchStart);
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('touchend', onTouchEnd);
    };
  }, [refreshing, onRefresh]);

  return { pulling: pullDistance > 0, pullDistance, refreshing, threshold: THRESHOLD };
}
