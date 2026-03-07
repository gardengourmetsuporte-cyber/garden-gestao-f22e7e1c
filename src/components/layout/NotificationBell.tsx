import { useState } from 'react';
import { AppIcon } from '@/components/ui/app-icon';
import { Drawer, DrawerContent, DrawerTrigger } from '@/components/ui/drawer';
import { useNotifications } from '@/hooks/useNotifications';
import { NotificationCard } from '@/components/notifications/NotificationCard';

export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const { unreadCount } = useNotifications();

  return (
    <Drawer open={open} onOpenChange={setOpen}>
      <DrawerTrigger asChild>
        <button className="relative w-9 h-9 flex items-center justify-center rounded-lg hover:bg-muted/50 transition-colors">
          <AppIcon name="Bell" size={19} className="text-muted-foreground" />
          {unreadCount > 0 && (
            <span className="absolute top-0.5 right-0.5 min-w-[16px] h-[16px] px-0.5 rounded-full bg-destructive text-destructive-foreground text-[9px] font-bold flex items-center justify-center">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </button>
      </DrawerTrigger>
      <DrawerContent className="px-4 pb-8 pt-4 max-h-[70vh] overflow-y-auto mx-auto max-w-lg">
        <div className="mx-auto w-12 h-1.5 rounded-full bg-muted mb-4" />
        {open && <NotificationCard />}
      </DrawerContent>
    </Drawer>
  );
}
