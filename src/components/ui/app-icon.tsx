import { forwardRef, memo } from 'react';
import { cn } from '@/lib/utils';
import { CUSTOM_SVG_PATHS } from '@/lib/iconMap';
import { PHOSPHOR_MAP } from '@/lib/phosphorMap';

interface AppIconProps {
  name: string;
  size?: number;
  className?: string;
  style?: React.CSSProperties;
  /** 0 = outlined, 1 = filled (default) */
  fill?: 0 | 1;
  /** Weight: 100-700, default 400 (unused with Phosphor, kept for API compat) */
  weight?: number;
}

export const AppIcon = memo(forwardRef<HTMLSpanElement, AppIconProps>(
  ({ name, size = 24, className, style, fill = 1 }, ref) => {
    // 1. Custom SVG paths (highest priority)
    const customPaths = CUSTOM_SVG_PATHS[name];
    if (customPaths) {
      const hasGalaxyClass = (className ?? '').includes('tab-icon-galaxy');
      const safeClassName = hasGalaxyClass
        ? (className ?? '').replace('tab-icon-galaxy', '').trim()
        : className;

      return (
        <span
          ref={ref}
          className={cn("select-none leading-none", safeClassName)}
          style={{
            width: size,
            height: size,
            display: 'inline-block',
            color: hasGalaxyClass ? 'hsl(var(--primary))' : undefined,
            ...style,
          }}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="currentColor"
            width={size}
            height={size}
          >
            {customPaths.map((d, i) => (
              <path key={i} d={d} />
            ))}
          </svg>
        </span>
      );
    }

    // 2. Phosphor icon (solid fill)
    const PhosphorComponent = PHOSPHOR_MAP[name];
    if (PhosphorComponent) {
      return (
        <span
          ref={ref}
          className={cn("select-none leading-none", className)}
          style={{
            width: size,
            height: size,
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            ...style,
          }}
        >
          <PhosphorComponent
            size={size}
            weight={fill === 1 ? 'fill' : 'regular'}
          />
        </span>
      );
    }

    // 3. Fallback: render name as text (shouldn't happen)
    return (
      <span
        ref={ref}
        className={cn("select-none leading-none text-muted-foreground", className)}
        style={{
          fontSize: size * 0.5,
          width: size,
          height: size,
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          ...style,
        }}
      >
        ?
      </span>
    );
  }
));
AppIcon.displayName = 'AppIcon';
