import { AppLayout } from '@/components/layout/AppLayout';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { AppIcon } from '@/components/ui/app-icon';
import { ProfileSettings } from '@/components/settings/ProfileSettings';
import { CategorySettings } from '@/components/settings/CategorySettings';
import { SupplierSettings } from '@/components/settings/SupplierSettings';
import { ChecklistSettingsManager } from '@/components/settings/ChecklistSettingsManager';
import { RewardSettings } from '@/components/settings/RewardSettings';
import { PaymentMethodSettings } from '@/components/settings/PaymentMethodSettings';
import { RecipeCostSettings } from '@/components/settings/RecipeCostSettings';
import { UnitManagement } from '@/components/settings/UnitManagement';
import { TeamHub } from '@/components/settings/TeamHub';
import { MedalSettings } from '@/components/settings/MedalSettings';
import { NotificationSettings } from '@/components/settings/NotificationSettings';
import { AuditLogSettings } from '@/components/settings/AuditLogSettings';
import { useState } from 'react';
import { cn } from '@/lib/utils';

interface MenuItem {
  value: string;
  icon: string;
  label: string;
  description: string;
  variant: string;
  section: string;
}

const allMenuItems: MenuItem[] = [
  { value: 'plan', icon: 'Crown', label: 'Meu Plano', description: 'Gerencie sua assinatura', variant: 'cyan', section: 'Conta' },
  { value: 'profile', icon: 'User', label: 'Perfil', description: 'Nome, avatar e dados pessoais', variant: 'cyan', section: 'Conta' },
  { value: 'notifications', icon: 'BellRing', label: 'Notificações', description: 'Push, som e categorias de alerta', variant: 'cyan', section: 'Conta' },
  { value: 'team', icon: 'Users', label: 'Equipe', description: 'Membros, convites e níveis de acesso', variant: 'cyan', section: 'Conta' },
  { value: 'categories', icon: 'Tag', label: 'Categorias', description: 'Categorias de estoque', variant: 'amber', section: 'Operação' },
  { value: 'suppliers', icon: 'Truck', label: 'Fornecedores', description: 'Cadastro de fornecedores', variant: 'amber', section: 'Operação' },
  { value: 'checklists', icon: 'ClipboardCheck', label: 'Checklists', description: 'Setores, itens e pontuação', variant: 'amber', section: 'Operação' },
  { value: 'payments', icon: 'Wallet', label: 'Métodos de Pagamento', description: 'Taxas e prazos de recebimento', variant: 'amber', section: 'Operação' },
  { value: 'costs', icon: 'Calculator', label: 'Custos de Receitas', description: 'Percentuais e markups', variant: 'amber', section: 'Operação' },
  { value: 'rewards', icon: 'Gift', label: 'Loja de Recompensas', description: 'Prêmios para colaboradores', variant: 'purple', section: 'Sistema' },
  { value: 'medals', icon: 'Award', label: 'Medalhas', description: 'Conceder medalhas de prestígio', variant: 'purple', section: 'Sistema' },
  { value: 'units', icon: 'Store', label: 'Lojas', description: 'Gerenciar suas lojas', variant: 'purple', section: 'Sistema' },
  { value: 'audit-log', icon: 'FileText', label: 'Log de Atividades', description: 'Registro de ações no sistema', variant: 'purple', section: 'Sistema' },
];

const variantColors: Record<string, string> = {
  cyan: 'hsl(var(--neon-cyan))',
  green: 'hsl(var(--neon-green))',
  red: 'hsl(var(--neon-red))',
  amber: 'hsl(var(--neon-amber))',
  purple: 'hsl(var(--neon-purple))',
};

export default function SettingsPage() {
  const { isAdmin, isSuperAdmin } = useAuth();
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState<string | null>(null);

  const menuItems = allMenuItems.filter(item => {
    if (item.value === 'plan') return true;
    if (item.value === 'units') return isSuperAdmin;
    if (item.value === 'team') return isAdmin;
    if (item.value === 'audit-log') return isAdmin;
    if (item.value === 'medals') return isAdmin;
    if (item.value === 'profile' || item.value === 'notifications') return true;
    return isAdmin;
  });

  const handleSectionClick = (value: string) => {
    if (value === 'plan') {
      navigate('/plans');
      return;
    }
    setActiveSection(value);
  };

  // Group by section
  const sections: { label: string; items: MenuItem[] }[] = [];
  const seenSections = new Set<string>();
  menuItems.forEach(item => {
    if (!seenSections.has(item.section)) {
      seenSections.add(item.section);
      sections.push({
        label: item.section,
        items: menuItems.filter(i => i.section === item.section),
      });
    }
  });

  if (activeSection) {
    const activeItem = menuItems.find(i => i.value === activeSection);
    return (
      <AppLayout>
        <div className="min-h-screen bg-background pb-24">
          <header className="page-header-bar">
            <div className="page-header-content flex items-center gap-3">
              <button onClick={() => setActiveSection(null)} className="text-muted-foreground hover:text-foreground transition-colors">
                <AppIcon name="ChevronRight" size={20} className="rotate-180 text-muted-foreground hover:text-foreground transition-colors" />
              </button>
              <h1 className="text-lg font-bold">{activeItem?.label}</h1>
            </div>
          </header>

          <div className="px-4 py-3 lg:px-6 pb-24">
              {activeSection === 'profile' && <ProfileSettings />}
              {activeSection === 'categories' && <CategorySettings />}
              {activeSection === 'suppliers' && <SupplierSettings />}
              {activeSection === 'checklists' && <ChecklistSettingsManager />}
              {activeSection === 'team' && <TeamHub />}
              {activeSection === 'rewards' && <RewardSettings />}
              {activeSection === 'payments' && <PaymentMethodSettings />}
              {activeSection === 'costs' && <RecipeCostSettings />}
              {activeSection === 'units' && <UnitManagement />}
              {activeSection === 'medals' && <MedalSettings />}
              {activeSection === 'notifications' && <NotificationSettings />}
              {activeSection === 'audit-log' && <AuditLogSettings />}
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="min-h-screen bg-background pb-24">

        <div className="px-4 py-3 lg:px-6 space-y-6">
          {sections.map((section) => (
            <div key={section.label}>
              <h3 className="section-label mb-1 px-1">{section.label}</h3>
              <div className="card-surface rounded-2xl overflow-hidden divide-y divide-border/40">
                {section.items.map((item) => (
                  <button
                    key={item.value}
                    onClick={() => handleSectionClick(item.value)}
                    className="w-full flex items-center justify-between px-4 py-3.5 text-left hover:bg-secondary/30 active:bg-secondary/50 transition-colors"
                  >
                    <span className="font-medium text-sm text-foreground">{item.label}</span>
                    <AppIcon name="ChevronRight" size={16} className="text-muted-foreground shrink-0" />
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </AppLayout>
  );
}
