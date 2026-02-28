import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface PageTransitionProps {
  children: ReactNode;
  className?: string;
}

/**
 * Lightweight wrapper — no animation to avoid flicker/double-render bugs.
 * The previous implementation used key={pathname} + displayChildren state
 * which caused React to unmount/remount the entire page tree on navigation,
 * destroying open Sheets/Drawers and causing visible "open-close-open" glitches.
 */
export function PageTransition({ children, className }: PageTransitionProps) {
  return (
    <div className={cn(className)}>
      {children}
    </div>
  );
}
