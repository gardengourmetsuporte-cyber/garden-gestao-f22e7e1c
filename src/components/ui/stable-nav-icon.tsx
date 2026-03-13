import { useEffect, useState } from 'react';
import { AppIcon } from '@/components/ui/app-icon';
import { cn } from '@/lib/utils';

interface StableNavIconProps {
  name: string;
  customIcon?: string;
  active: boolean;
  size?: number;
  className?: string;
  keepIconColor?: boolean;
  fill?: 0 | 1;
  weight?: number;
}

const loadedIconCache = new Set<string>();

export function StableNavIcon({
  name,
  customIcon,
  active,
  size = 22,
  className,
  keepIconColor = false,
  fill = 1,
  weight,
}: StableNavIconProps) {
  const [isLoaded, setIsLoaded] = useState(() => (customIcon ? loadedIconCache.has(customIcon) : false));

  useEffect(() => {
    if (!customIcon) {
      setIsLoaded(false);
      return;
    }

    if (loadedIconCache.has(customIcon)) {
      setIsLoaded(true);
      return;
    }

    let isActive = true;
    const image = new Image();
    image.src = customIcon;

    if (image.complete) {
      loadedIconCache.add(customIcon);
      setIsLoaded(true);
      return;
    }

    image.onload = () => {
      if (!isActive) return;
      loadedIconCache.add(customIcon);
      setIsLoaded(true);
    };

    image.onerror = () => {
      if (!isActive) return;
      setIsLoaded(false);
    };

    return () => {
      isActive = false;
    };
  }, [customIcon]);

  if (!customIcon) {
    return (
      <AppIcon
        name={name}
        size={size}
        fill={fill}
        weight={weight}
        className={cn(className, active ? 'text-primary' : 'text-muted-foreground')}
      />
    );
  }

  return (
    <span
      className={cn('relative inline-flex items-center justify-center', className)}
      style={{ width: size, height: size }}
      aria-hidden="true"
    >
      <AppIcon
        name={name}
        size={size}
        fill={fill}
        weight={weight}
        className={cn(
          'absolute inset-0 transition-opacity duration-150',
          active ? 'text-primary' : 'text-muted-foreground',
          isLoaded ? 'opacity-0' : 'opacity-100'
        )}
      />

      <img
        src={customIcon}
        alt=""
        loading="eager"
        fetchPriority="high"
        decoding="sync"
        draggable={false}
        onLoad={() => {
          loadedIconCache.add(customIcon);
          setIsLoaded(true);
        }}
        onError={() => setIsLoaded(false)}
        className={cn(
          'absolute inset-0 w-full h-full object-contain transition-opacity duration-150',
          keepIconColor ? '' : active ? 'icon-tint-primary' : 'icon-tint-muted',
          isLoaded ? 'opacity-100' : 'opacity-0'
        )}
      />
    </span>
  );
}
