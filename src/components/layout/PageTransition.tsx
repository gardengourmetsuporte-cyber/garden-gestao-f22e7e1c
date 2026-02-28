import { ReactNode, useRef, useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';

interface PageTransitionProps {
  children: ReactNode;
  className?: string;
}

export function PageTransition({ children, className }: PageTransitionProps) {
  const location = useLocation();
  const [animClass, setAnimClass] = useState('');
  const prevPathRef = useRef(location.pathname);

  useEffect(() => {
    if (prevPathRef.current === location.pathname) return;
    prevPathRef.current = location.pathname;

    setAnimClass('page-enter-fade');
    const timer = setTimeout(() => setAnimClass(''), 300);
    return () => clearTimeout(timer);
  }, [location.pathname]);

  return (
    <div className={cn(animClass, className)}>
      {children}
    </div>
  );
}
