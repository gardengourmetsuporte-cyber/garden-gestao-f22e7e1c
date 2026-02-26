import { ReactNode, useRef, useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';

interface PageTransitionProps {
  children: ReactNode;
  className?: string;
}

/**
 * Lightweight CSS-only page transition wrapper.
 * Uses `animate-page-enter` on route change for a smooth fade+slide effect.
 * No external library needed.
 */
export function PageTransition({ children, className }: PageTransitionProps) {
  const location = useLocation();
  const [renderKey, setRenderKey] = useState(location.pathname);
  const prevPath = useRef(location.pathname);

  useEffect(() => {
    if (prevPath.current !== location.pathname) {
      prevPath.current = location.pathname;
      setRenderKey(location.pathname);
    }
  }, [location.pathname]);

  return (
    <div
      key={renderKey}
      className={cn("animate-page-enter", className)}
    >
      {children}
    </div>
  );
}
