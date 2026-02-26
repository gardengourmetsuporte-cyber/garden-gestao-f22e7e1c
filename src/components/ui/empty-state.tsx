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
  variant?: 'default' | 'compact';
}

export function EmptyState({ icon, title, subtitle, actionLabel, actionIcon, onAction, className, children, variant = 'default' }: EmptyStateProps) {
  return (
    <div className={cn(
      "flex flex-col items-center justify-center animate-fade-in",
      variant === 'compact' ? 'py-8' : 'py-16',
      className
    )}>
      {/* Animated icon container */}
      <div className="relative mb-5">
        <div className={cn(
          "rounded-2xl flex items-center justify-center",
          variant === 'compact' ? 'w-14 h-14' : 'w-20 h-20',
          "bg-primary/8 border border-primary/15"
        )}>
          <AppIcon
            name={icon}
            size={variant === 'compact' ? 28 : 36}
            className="text-primary/60"
            style={{ filter: 'drop-shadow(0 0 8px hsl(var(--primary) / 0.2))' }}
          />
        </div>
        {/* Decorative floating dots */}
        <div
          className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-primary/20 animate-pulse"
          style={{ animationDelay: '0.2s' }}
        />
        <div
          className="absolute -bottom-1 -left-1 w-2 h-2 rounded-full bg-primary/15 animate-pulse"
          style={{ animationDelay: '0.8s' }}
        />
      </div>

      <p className={cn(
        "font-bold text-foreground text-center",
        variant === 'compact' ? 'text-sm' : 'text-base'
      )}>
        {title}
      </p>
      {subtitle && (
        <p className="text-sm text-muted-foreground mt-1.5 text-center max-w-[280px] leading-relaxed">
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
