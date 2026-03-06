import { useTheme } from 'next-themes';
import { AppIcon } from '@/components/ui/app-icon';
import { cn } from '@/lib/utils';

const themes = [
  { value: 'light', icon: 'Sun', label: 'Claro', description: 'Fundo branco com texto escuro' },
  { value: 'dark', icon: 'Moon', label: 'Escuro', description: 'Fundo escuro premium' },
  { value: 'system', icon: 'Monitor', label: 'Sistema', description: 'Segue o tema do dispositivo' },
] as const;

export function AppearanceSettings() {
  const { theme, setTheme } = useTheme();

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold text-foreground">Aparência</h3>
        <p className="text-sm text-muted-foreground">Escolha o tema visual do app</p>
      </div>

      <div className="grid gap-3">
        {themes.map((t) => {
          const isActive = theme === t.value;
          return (
            <button
              key={t.value}
              onClick={() => setTheme(t.value)}
              className={cn(
                "flex items-center gap-4 p-4 rounded-2xl border transition-all text-left",
                isActive
                  ? "border-primary bg-primary/10 shadow-glow-primary"
                  : "border-border bg-card hover:border-border/80"
              )}
            >
              <div className={cn(
                "w-10 h-10 rounded-xl flex items-center justify-center",
                isActive ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground"
              )}>
                <AppIcon name={t.icon} size={20} />
              </div>
              <div className="flex-1">
                <p className={cn("font-medium text-sm", isActive ? "text-primary" : "text-foreground")}>
                  {t.label}
                </p>
                <p className="text-xs text-muted-foreground">{t.description}</p>
              </div>
              {isActive && (
                <AppIcon name="Check" size={18} className="text-primary" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
