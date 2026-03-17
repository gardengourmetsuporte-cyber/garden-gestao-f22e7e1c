import { memo } from 'react';
import { AppIcon } from './app-icon';
import { cn } from '@/lib/utils';

export type GradientIconColor =
  | 'primary'
  | 'blue'
  | 'emerald'
  | 'amber'
  | 'red'
  | 'purple'
  | 'cyan'
  | 'pink'
  | 'orange'
  | 'muted';

const GRADIENT_MAP: Record<GradientIconColor, { gradient: string; shadow: string }> = {
  primary: {
    gradient: 'linear-gradient(135deg, hsl(142 71% 45%), hsl(152 76% 36%))',
    shadow: '0 4px 12px -2px hsla(142, 71%, 45%, 0.35)',
  },
  blue: {
    gradient: 'linear-gradient(135deg, hsl(217 91% 60%), hsl(224 76% 48%))',
    shadow: '0 4px 12px -2px hsla(217, 91%, 60%, 0.35)',
  },
  emerald: {
    gradient: 'linear-gradient(135deg, hsl(160 84% 39%), hsl(158 64% 32%))',
    shadow: '0 4px 12px -2px hsla(160, 84%, 39%, 0.35)',
  },
  amber: {
    gradient: 'linear-gradient(135deg, hsl(38 92% 50%), hsl(32 95% 44%))',
    shadow: '0 4px 12px -2px hsla(38, 92%, 50%, 0.35)',
  },
  red: {
    gradient: 'linear-gradient(135deg, hsl(0 72% 51%), hsl(346 77% 50%))',
    shadow: '0 4px 12px -2px hsla(0, 72%, 51%, 0.35)',
  },
  purple: {
    gradient: 'linear-gradient(135deg, hsl(271 76% 53%), hsl(263 70% 50%))',
    shadow: '0 4px 12px -2px hsla(271, 76%, 53%, 0.35)',
  },
  cyan: {
    gradient: 'linear-gradient(135deg, hsl(189 94% 43%), hsl(199 89% 48%))',
    shadow: '0 4px 12px -2px hsla(189, 94%, 43%, 0.35)',
  },
  pink: {
    gradient: 'linear-gradient(135deg, hsl(330 81% 60%), hsl(340 75% 55%))',
    shadow: '0 4px 12px -2px hsla(330, 81%, 60%, 0.35)',
  },
  orange: {
    gradient: 'linear-gradient(135deg, hsl(25 95% 53%), hsl(16 90% 50%))',
    shadow: '0 4px 12px -2px hsla(25, 95%, 53%, 0.35)',
  },
  muted: {
    gradient: 'linear-gradient(135deg, hsl(var(--muted)), hsl(var(--secondary)))',
    shadow: 'none',
    iconClass: 'text-muted-foreground',
  },
};

interface GradientIconProps {
  name: string;
  color?: GradientIconColor;
  /** Container size: 'sm' = 36px, 'md' = 40px, 'lg' = 48px */
  size?: 'sm' | 'md' | 'lg';
  /** Icon size override */
  iconSize?: number;
  className?: string;
}

const SIZE_MAP = {
  sm: { container: 36, icon: 16 },
  md: { container: 40, icon: 18 },
  lg: { container: 48, icon: 22 },
};

export const GradientIcon = memo(function GradientIcon({
  name,
  color = 'primary',
  size = 'md',
  iconSize,
  className,
}: GradientIconProps) {
  const { gradient, shadow } = GRADIENT_MAP[color];
  const { container, icon } = SIZE_MAP[size];

  return (
    <div
      className={cn(
        'rounded-full flex items-center justify-center shrink-0',
        className
      )}
      style={{
        width: container,
        height: container,
        background: gradient,
        boxShadow: shadow,
      }}
    >
      <AppIcon name={name} size={iconSize ?? icon} className="text-white" />
    </div>
  );
});
