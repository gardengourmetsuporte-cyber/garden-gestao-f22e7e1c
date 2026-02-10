import { AppLayout } from '@/components/layout/AppLayout';
import { useAuth } from '@/contexts/AuthContext';
import { Tabs, TabsContent } from '@/components/ui/tabs';
import { User, Tag, Truck, ClipboardCheck, Users, Gift, Settings as SettingsIcon, Wallet, Calculator, ChevronRight } from 'lucide-react';
import { ProfileSettings } from '@/components/settings/ProfileSettings';
import { CategorySettings } from '@/components/settings/CategorySettings';
import { SupplierSettings } from '@/components/settings/SupplierSettings';
import { UserManagement } from '@/components/settings/UserManagement';
import { ChecklistSettingsManager } from '@/components/settings/ChecklistSettingsManager';
import { RewardSettings } from '@/components/settings/RewardSettings';
import { PaymentMethodSettings } from '@/components/settings/PaymentMethodSettings';
import { RecipeCostSettings } from '@/components/settings/RecipeCostSettings';
import { useState } from 'react';
import { cn } from '@/lib/utils';

const adminMenuItems = [
  { value: 'profile', icon: User, label: 'Perfil', variant: 'cyan' as const },
  { value: 'categories', icon: Tag, label: 'Categorias', variant: 'amber' as const },
  { value: 'suppliers', icon: Truck, label: 'Fornecedores', variant: 'green' as const },
  { value: 'checklists', icon: ClipboardCheck, label: 'Checklists', variant: 'purple' as const },
  { value: 'users', icon: Users, label: 'Usuários', variant: 'cyan' as const },
  { value: 'rewards', icon: Gift, label: 'Loja de Recompensas', variant: 'amber' as const },
  { value: 'payments', icon: Wallet, label: 'Métodos de Pagamento', variant: 'green' as const },
  { value: 'costs', icon: Calculator, label: 'Custos de Receitas', variant: 'red' as const },
];

const variantBorderColors: Record<string, string> = {
  cyan: 'hsl(var(--neon-cyan))',
  green: 'hsl(var(--neon-green))',
  red: 'hsl(var(--neon-red))',
  amber: 'hsl(var(--neon-amber))',
  purple: 'hsl(var(--neon-purple))',
};

export default function SettingsPage() {
  const { isAdmin } = useAuth();
  const [activeSection, setActiveSection] = useState<string | null>(null);

  const menuItems = isAdmin ? adminMenuItems : [adminMenuItems[0]];

  if (activeSection) {
    return (
      <AppLayout>
        <div className="min-h-screen bg-background pb-24">
          <header className="page-header-bar">
            <div className="flex items-center gap-3">
              <button onClick={() => setActiveSection(null)} className="text-muted-foreground hover:text-foreground transition-colors">
                <ChevronRight className="w-5 h-5 rotate-180" />
              </button>
              <h1 className="text-lg font-bold">{menuItems.find(i => i.value === activeSection)?.label}</h1>
            </div>
          </header>

          <div className="px-4 py-6 lg:px-6">
            <div className="card-command p-4 lg:p-6">
              {activeSection === 'profile' && <ProfileSettings />}
              {activeSection === 'categories' && <CategorySettings />}
              {activeSection === 'suppliers' && <SupplierSettings />}
              {activeSection === 'checklists' && <ChecklistSettingsManager />}
              {activeSection === 'users' && <UserManagement />}
              {activeSection === 'rewards' && <RewardSettings />}
              {activeSection === 'payments' && <PaymentMethodSettings />}
              {activeSection === 'costs' && <RecipeCostSettings />}
            </div>
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="min-h-screen bg-background pb-24">
        <header className="page-header-bar">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-secondary/80 flex items-center justify-center">
              <SettingsIcon className="w-5 h-5 text-muted-foreground" />
            </div>
            <div>
              <h1 className="text-lg font-bold">Configurações</h1>
              <p className="text-xs text-muted-foreground">
                {isAdmin ? 'Gerencie o sistema completo' : 'Gerencie seu perfil'}
              </p>
            </div>
          </div>
        </header>

        <div className="px-4 py-6 lg:px-6 space-y-2">
          {menuItems.map((item, index) => {
            const borderColor = variantBorderColors[item.variant];
            return (
              <button
                key={item.value}
                onClick={() => setActiveSection(item.value)}
                className={cn(
                  "list-command w-full flex items-center gap-3 p-4 text-left",
                  `animate-slide-up stagger-${index + 1}`
                )}
                style={{ borderLeftColor: borderColor }}
              >
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                  style={{ backgroundColor: `${borderColor}15` }}
                >
                  <item.icon className="w-5 h-5" style={{ color: borderColor }} />
                </div>
                <span className="flex-1 font-medium text-sm">{item.label}</span>
                <ChevronRight className="w-4 h-4 text-muted-foreground" />
              </button>
            );
          })}
        </div>
      </div>
    </AppLayout>
  );
}
