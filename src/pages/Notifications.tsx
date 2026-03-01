import { AppLayout } from '@/components/layout/AppLayout';
import { NotificationCard } from '@/components/notifications/NotificationCard';
import { NotificationSettings } from '@/components/settings/NotificationSettings';
import { useState } from 'react';
import { AppIcon } from '@/components/ui/app-icon';
import { cn } from '@/lib/utils';

const Notifications = () => {
  const [tab, setTab] = useState<'inbox' | 'settings'>('inbox');

  return (
    <AppLayout>
      <div className="p-4 space-y-4 pb-24">
        <h1 className="text-xl font-bold text-foreground">Notificações</h1>

        {/* Tab switcher */}
        <div className="flex gap-2">
          {([
            { key: 'inbox' as const, label: 'Caixa de entrada', icon: 'Bell' },
            { key: 'settings' as const, label: 'Preferências', icon: 'Settings' },
          ]).map(t => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={cn(
                "flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all",
                tab === t.key
                  ? "bg-primary/15 text-primary ring-1 ring-primary/25"
                  : "bg-secondary/40 text-muted-foreground hover:bg-secondary/60"
              )}
            >
              <AppIcon name={t.icon} size={16} />
              {t.label}
            </button>
          ))}
        </div>

        {tab === 'inbox' ? <NotificationCard /> : <NotificationSettings />}
      </div>
    </AppLayout>
  );
};

export default Notifications;
