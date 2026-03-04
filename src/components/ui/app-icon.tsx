import { forwardRef } from 'react';
import { cn } from '@/lib/utils';
import { ICON_MAP, CUSTOM_SVG_ICONS } from '@/lib/iconMap';

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
    const customSvg = CUSTOM_SVG_ICONS[name];

    if (customSvg) {
      return (
        <span
          ref={ref}
          className={cn("select-none leading-none inline-block", className)}
          style={{
            width: size,
            height: size,
            overflow: 'hidden',
            display: 'inline-block',
            maskImage: `url(${customSvg})`,
            WebkitMaskImage: `url(${customSvg})`,
            maskSize: 'contain',
            WebkitMaskSize: 'contain',
            maskRepeat: 'no-repeat',
            WebkitMaskRepeat: 'no-repeat',
            maskPosition: 'center',
            WebkitMaskPosition: 'center',
            backgroundColor: 'currentColor',
            ...style,
          }}
        />
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
