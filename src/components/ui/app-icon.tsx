import { forwardRef } from 'react';
import { cn } from '@/lib/utils';
import { ICON_MAP, CUSTOM_SVG_PATHS } from '@/lib/iconMap';

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
  ({ name, size = 24, className, style, fill = 1, weight = 400 }, ref) => {
    const customPaths = CUSTOM_SVG_PATHS[name];

    if (customPaths) {
      return (
        <span
          ref={ref}
          className={cn("select-none leading-none", className)}
          style={{
            width: size,
            height: size,
            display: 'inline-block',
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

    const materialName = ICON_MAP[name] || name;

    return (
      <span
        ref={ref}
        className={cn("material-symbols-rounded select-none leading-none", className)}
        style={{
          fontSize: size,
          width: size,
          height: size,
          overflow: 'hidden',
          display: 'inline-block',
          fontVariationSettings: `'FILL' ${fill}, 'wght' ${weight}, 'GRAD' 200, 'opsz' 20`,
          ...style,
        }}
      >
        {materialName}
      </span>
    );
  }
);
AppIcon.displayName = 'AppIcon';
