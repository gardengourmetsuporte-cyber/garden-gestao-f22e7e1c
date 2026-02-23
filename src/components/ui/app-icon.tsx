import { forwardRef } from 'react';
import { cn } from '@/lib/utils';
import { ICON_MAP } from '@/lib/iconMap';

interface AppIconProps {
  name: string;
  size?: number;
  className?: string;
  style?: React.CSSProperties;
}

export const AppIcon = forwardRef<HTMLSpanElement, AppIconProps>(
  ({ name, size = 24, className, style }, ref) => {
    const materialName = ICON_MAP[name] || name;

    return (
      <span
        ref={ref}
        className={cn("material-icons-round select-none leading-none", className)}
        style={{ fontSize: size, color: 'inherit', ...style }}
      >
        {materialName}
      </span>
    );
  }
);
AppIcon.displayName = 'AppIcon';
