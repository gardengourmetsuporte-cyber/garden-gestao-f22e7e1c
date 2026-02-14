import { cn } from '@/lib/utils';
import { ICON_MAP } from '@/lib/iconMap';

interface AppIconProps {
  name: string;
  size?: number;
  className?: string;
  style?: React.CSSProperties;
}

export function AppIcon({ name, size = 24, className, style }: AppIconProps) {
  const materialName = ICON_MAP[name] || name;

  return (
    <span
      className={cn("material-icons-round select-none leading-none", className)}
      style={{ fontSize: size, color: 'inherit', ...style }}
    >
      {materialName}
    </span>
  );
}
