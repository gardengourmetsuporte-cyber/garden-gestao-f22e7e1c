import { AppLayout } from '@/components/layout/AppLayout';
import { NotificationCard } from '@/components/notifications/NotificationCard';
import { NotificationSettings } from '@/components/settings/NotificationSettings';
import { useState } from 'react';
import { AppIcon } from '@/components/ui/app-icon';
import { cn } from '@/lib/utils';

const tabs = [
  { key: 'inbox' as const, label: 'Caixa de entrada', icon: 'Bell' },
  { key: 'settings' as const, label: 'Preferências', icon: 'Settings' },
] as const;

const Notifications = () => {
  const [tab, setTab] = useState<'inbox' | 'settings'>('inbox');

  return (
    <AppLayout>
      <div className="p-4 space-y-5 pb-24">
        {/* Tab switcher */}
        <div className="flex gap-2 bg-secondary/30 p-1 rounded-2xl">
          {tabs.map(t => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={cn(
                "flex-1 flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200",
                tab === t.key
                  ? "bg-card text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground/70"
              )}
            >
              <AppIcon name={t.icon} size={16} fill={tab === t.key ? 1 : 0} />
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
