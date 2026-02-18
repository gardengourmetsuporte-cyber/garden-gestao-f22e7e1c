import { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { AppIcon } from '@/components/ui/app-icon';
import { Button } from '@/components/ui/button';

interface EmptyStateProps {
  icon: string;
  title: string;
  subtitle?: string;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
  children?: ReactNode;
}

export function EmptyState({ icon, title, subtitle, actionLabel, onAction, className, children }: EmptyStateProps) {
  return (
    <div className={cn("flex flex-col items-center justify-center py-16 animate-fade-in", className)}>
      <div className="w-16 h-16 rounded-2xl bg-muted/60 flex items-center justify-center mb-4">
        <AppIcon name={icon} size={32} className="text-muted-foreground" />
      </div>
      <p className="font-semibold text-foreground text-center">{title}</p>
      {subtitle && (
        <p className="text-sm text-muted-foreground mt-1 text-center max-w-xs">{subtitle}</p>
      )}
      {actionLabel && onAction && (
        <Button variant="outline" onClick={onAction} className="mt-4 rounded-xl">
          {actionLabel}
        </Button>
      )}
      {children}
    </div>
  );
}
