import { forwardRef } from 'react';
import { cn } from '@/lib/utils';
import { ICON_MAP } from '@/lib/iconMap';

interface AppIconProps {
  name: string;
  size?: number;
  className?: string;
  style?: React.CSSProperties;
  /** 0 = outlined, 1 = filled (default) */
  fill?: 0 | 1;
  /** Weight: 100-700, default 400 */
  weight?: number;
}

export const AppIcon = forwardRef<HTMLSpanElement, AppIconProps>(
  ({ name, size = 24, className, style, fill = 0, weight = 400 }, ref) => {
    const materialName = ICON_MAP[name] || name;

    return (
      <span
        ref={ref}
        className={cn("material-symbols-rounded select-none leading-none", className)}
        style={{
          fontSize: size,
          fontVariationSettings: `'FILL' ${fill}, 'wght' ${weight}, 'GRAD' 0, 'opsz' ${size > 32 ? 48 : 24}`,
          ...style,
        }}
      >
        {materialName}
      </span>
    );
  }
);
AppIcon.displayName = 'AppIcon';
