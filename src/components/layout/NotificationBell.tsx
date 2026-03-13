import { useState } from 'react';
import { AppIcon } from '@/components/ui/app-icon';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useNotifications } from '@/hooks/useNotifications';
import { NotificationCard } from '@/components/notifications/NotificationCard';

export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const { unreadCount } = useNotifications();

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <button className="relative w-9 h-9 flex items-center justify-center rounded-lg hover:bg-muted/50 transition-colors">
          <AppIcon name="Bell" size={19} className="text-muted-foreground" />
          {unreadCount > 0 && (
            <span className="absolute top-0.5 right-0.5 min-w-[16px] h-[16px] px-0.5 rounded-full bg-destructive text-destructive-foreground text-[9px] font-bold flex items-center justify-center">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" sideOffset={8} className="w-[calc(100vw-16px)] sm:w-96 max-h-[70vh] overflow-y-auto p-3 rounded-2xl">
        <div className="text-sm font-semibold text-foreground mb-2">Notificações</div>
        {open && <NotificationCard />}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
