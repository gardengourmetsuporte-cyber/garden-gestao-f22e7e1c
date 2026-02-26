import { ReactNode, Children, cloneElement, isValidElement } from 'react';
import { cn } from '@/lib/utils';

interface StaggerChildrenProps {
  children: ReactNode;
  className?: string;
  /** Animation class to apply to each child */
  animation?: string;
  /** Base delay in ms between each child */
  delayMs?: number;
}

/**
 * Wraps each child with a staggered animation delay.
 * Uses CSS `animation-delay` for zero-JS overhead.
 */
export function StaggerChildren({
  children,
  className,
  animation = 'animate-spring-in',
  delayMs = 60,
}: StaggerChildrenProps) {
  return (
    <div className={className}>
      {Children.map(children, (child, index) => {
        if (!isValidElement(child)) return child;
        return cloneElement(child as React.ReactElement<any>, {
          className: cn((child as any).props?.className, animation),
          style: {
            ...(child as any).props?.style,
            animationDelay: `${index * delayMs}ms`,
            animationFillMode: 'both',
          },
        });
      })}
    </div>
  );
}
