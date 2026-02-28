import { ReactNode, useRef, useEffect, useState, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';

interface PageTransitionProps {
  children: ReactNode;
  className?: string;
}

/**
 * Modern page transition inspired by Linear / iOS.
 * - Smooth crossfade with subtle directional slide
 * - Uses View Transition API when available for native-like feel
 * - Falls back to CSS animation
 */

// Route hierarchy for directional transitions
const routeDepth: Record<string, number> = {
  '/': 0,
  '/auth': 0,
  '/landing': 0,
  '/checklists': 1,
  '/finance': 1,
  '/inventory': 1,
  '/agenda': 1,
  '/employees': 1,
  '/orders': 1,
  '/customers': 1,
  '/cash-closing': 1,
  '/recipes': 1,
  '/rewards': 1,
  '/ranking': 1,
  '/marketing': 1,
  '/copilot': 1,
  '/whatsapp': 1,
  '/cardapio': 1,
  '/settings': 1,
  '/plans': 1,
  '/calendar': 1,
};

function getDepth(path: string): number {
  // Exact match first
  if (routeDepth[path] !== undefined) return routeDepth[path];
  // Check prefix for nested routes like /profile/me
  const base = '/' + path.split('/').filter(Boolean)[0];
  if (routeDepth[base] !== undefined) return routeDepth[base] + 1;
  return 2;
}

export function PageTransition({ children, className }: PageTransitionProps) {
  const location = useLocation();
  const [displayChildren, setDisplayChildren] = useState(children);
  const [transitionClass, setTransitionClass] = useState('page-enter-fade');
  const prevPathRef = useRef(location.pathname);
  const isFirstRender = useRef(true);

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      prevPathRef.current = location.pathname;
      return;
    }

    if (prevPathRef.current === location.pathname) return;

    const prevDepth = getDepth(prevPathRef.current);
    const nextDepth = getDepth(location.pathname);
    prevPathRef.current = location.pathname;

    // Determine direction
    const goingDeeper = nextDepth > prevDepth;
    const goingBack = nextDepth < prevDepth;

    // Pick transition class
    const enterClass = goingDeeper
      ? 'page-enter-forward'
      : goingBack
        ? 'page-enter-back'
        : 'page-enter-fade';

    setTransitionClass(enterClass);
    setDisplayChildren(children);
  }, [location.pathname, children]);

  // Also update children when they change on the same route
  useEffect(() => {
    if (prevPathRef.current === location.pathname) {
      setDisplayChildren(children);
    }
  }, [children, location.pathname]);

  return (
    <div
      key={location.pathname}
      className={cn(transitionClass, className)}
    >
      {displayChildren}
    </div>
  );
}
