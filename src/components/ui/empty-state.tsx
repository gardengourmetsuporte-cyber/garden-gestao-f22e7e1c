import { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { AppIcon } from '@/components/ui/app-icon';
import { Button } from '@/components/ui/button';

interface EmptyStateProps {
  icon: string;
  title: string;
  subtitle?: string;
  actionLabel?: string;
  actionIcon?: string;
  onAction?: () => void;
  className?: string;
  children?: ReactNode;
  variant?: 'default' | 'compact' | 'hero';
  /** Semantic color accent: primary, success, warning, destructive */
  accent?: 'primary' | 'success' | 'warning' | 'destructive';
}

const accentMap = {
  primary: {
    bg: 'bg-primary/8',
    border: 'border-primary/15',
    text: 'text-primary/60',
    dot1: 'bg-primary/20',
    dot2: 'bg-primary/15',
    glow: 'hsl(var(--primary) / 0.2)',
  },
  success: {
    bg: 'bg-success/8',
    border: 'border-success/15',
    text: 'text-success/60',
    dot1: 'bg-success/20',
    dot2: 'bg-success/15',
    glow: 'hsl(var(--success) / 0.2)',
  },
  warning: {
    bg: 'bg-warning/8',
    border: 'border-warning/15',
    text: 'text-warning/60',
    dot1: 'bg-warning/20',
    dot2: 'bg-warning/15',
    glow: 'hsl(var(--warning) / 0.2)',
  },
  destructive: {
    bg: 'bg-destructive/8',
    border: 'border-destructive/15',
    text: 'text-destructive/60',
    dot1: 'bg-destructive/20',
    dot2: 'bg-destructive/15',
    glow: 'hsl(var(--destructive) / 0.2)',
  },
};

export function EmptyState({
  icon,
  title,
  subtitle,
  actionLabel,
  actionIcon,
  onAction,
  className,
  children,
  variant = 'default',
  accent = 'primary',
}: EmptyStateProps) {
  const a = accentMap[accent];

  return (
    <div className={cn(
      "flex flex-col items-center justify-center animate-fade-in",
      variant === 'compact' ? 'py-8' : variant === 'hero' ? 'py-20' : 'py-16',
      className
    )}>
      {/* Animated icon container */}
      <div className="relative mb-5">
        <div className={cn(
          "rounded-2xl flex items-center justify-center",
          variant === 'compact' ? 'w-14 h-14' : variant === 'hero' ? 'w-24 h-24' : 'w-20 h-20',
          a.bg, 'border', a.border
        )}>
          <AppIcon
            name={icon}
            size={variant === 'compact' ? 28 : variant === 'hero' ? 40 : 36}
            className={a.text}
            style={{ filter: `drop-shadow(0 0 8px ${a.glow})` }}
          />
        </div>
        {/* Decorative floating dots */}
        <div
          className={cn("absolute -top-1 -right-1 w-3 h-3 rounded-full animate-pulse", a.dot1)}
          style={{ animationDelay: '0.2s' }}
        />
        <div
          className={cn("absolute -bottom-1 -left-1 w-2 h-2 rounded-full animate-pulse", a.dot2)}
          style={{ animationDelay: '0.8s' }}
        />
      </div>

      <p className={cn(
        "font-bold text-foreground text-center font-display",
        variant === 'compact' ? 'text-sm' : variant === 'hero' ? 'text-lg' : 'text-base'
      )}
      style={{ letterSpacing: '-0.02em' }}
      >
        {title}
      </p>
      {subtitle && (
        <p className={cn(
          "text-sm text-muted-foreground mt-1.5 text-center max-w-[280px] leading-relaxed",
          variant === 'hero' && 'max-w-[320px]'
        )}>
          {subtitle}
        </p>
      )}
      {actionLabel && onAction && (
        <Button
          onClick={onAction}
          className="mt-5 rounded-xl gap-2 shadow-sm"
          size={variant === 'compact' ? 'sm' : 'default'}
        >
          {actionIcon && <AppIcon name={actionIcon} size={16} />}
          {actionLabel}
        </Button>
      )}
      {children}
    </div>
  );
}
