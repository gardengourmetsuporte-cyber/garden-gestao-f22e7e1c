import { Button } from '@/components/ui/button';
import { AppIcon } from '@/components/ui/app-icon';

interface DesktopActionBarProps {
  label: string;
  icon?: string;
  onClick: () => void;
}

export function DesktopActionBar({ label, icon = 'Plus', onClick }: DesktopActionBarProps) {
  return (
    <div className="hidden lg:flex justify-end">
      <Button onClick={onClick} size="sm" className="gap-1.5">
        <AppIcon name={icon} size={16} />
        {label}
      </Button>
    </div>
  );
}
