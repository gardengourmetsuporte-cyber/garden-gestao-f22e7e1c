import { lazy, Suspense, useEffect, useState } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { AppIcon } from '@/components/ui/app-icon';
import { cn } from '@/lib/utils';
import { PlanTier } from '@/lib/plans';
import { Skeleton } from '@/components/ui/skeleton';

// Lazy-loaded setting components
const ProfileSettings = lazy(() => import('@/components/settings/ProfileSettings').then(m => ({ default: m.ProfileSettings })));
const CategorySettings = lazy(() => import('@/components/settings/CategorySettings').then(m => ({ default: m.CategorySettings })));
const SupplierSettings = lazy(() => import('@/components/settings/SupplierSettings').then(m => ({ default: m.SupplierSettings })));
const ChecklistSettingsManager = lazy(() => import('@/components/settings/ChecklistSettingsManager').then(m => ({ default: m.ChecklistSettingsManager })));
const RewardSettings = lazy(() => import('@/components/settings/RewardSettings').then(m => ({ default: m.RewardSettings })));
const PaymentMethodSettings = lazy(() => import('@/components/settings/PaymentMethodSettings').then(m => ({ default: m.PaymentMethodSettings })));
const RecipeCostSettings = lazy(() => import('@/components/settings/RecipeCostSettings').then(m => ({ default: m.RecipeCostSettings })));
const UnitManagement = lazy(() => import('@/components/settings/UnitManagement').then(m => ({ default: m.UnitManagement })));
const TeamHub = lazy(() => import('@/components/settings/TeamHub').then(m => ({ default: m.TeamHub })));
const MedalSettings = lazy(() => import('@/components/settings/MedalSettings').then(m => ({ default: m.MedalSettings })));
const NotificationSettings = lazy(() => import('@/components/settings/NotificationSettings').then(m => ({ default: m.NotificationSettings })));
const AuditLogSettings = lazy(() => import('@/components/settings/AuditLogSettings').then(m => ({ default: m.AuditLogSettings })));
const CardapioSettings = lazy(() => import('@/components/settings/CardapioSettings').then(m => ({ default: m.CardapioSettings })));
const LoyaltySettings = lazy(() => import('@/components/settings/LoyaltySettings').then(m => ({ default: m.LoyaltySettings })));
interface MenuItem {
  value: string;
  icon: string;
  label: string;
  description: string;
  variant: string;
  section: string;
  requiredPlan: PlanTier;
}

const allMenuItems: MenuItem[] = [
  { value: 'plan', icon: 'Crown', label: 'Meu Plano', description: 'Gerencie sua assinatura', variant: 'cyan', section: 'Conta', requiredPlan: 'free' },
  { value: 'profile', icon: 'User', label: 'Perfil', description: 'Nome, avatar e dados pessoais', variant: 'cyan', section: 'Conta', requiredPlan: 'free' },
  { value: 'notifications', icon: 'BellRing', label: 'Notificações', description: 'Push, som e categorias de alerta', variant: 'cyan', section: 'Conta', requiredPlan: 'free' },
  { value: 'team', icon: 'Users', label: 'Equipe', description: 'Membros, convites e níveis de acesso', variant: 'cyan', section: 'Conta', requiredPlan: 'free' },
  { value: 'categories', icon: 'Tag', label: 'Categorias', description: 'Categorias de estoque', variant: 'amber', section: 'Operação', requiredPlan: 'free' },
  { value: 'suppliers', icon: 'Truck', label: 'Fornecedores', description: 'Cadastro de fornecedores', variant: 'amber', section: 'Operação', requiredPlan: 'free' },
  { value: 'checklists', icon: 'ClipboardCheck', label: 'Checklists', description: 'Setores, itens e pontuação', variant: 'amber', section: 'Operação', requiredPlan: 'free' },
  { value: 'payments', icon: 'Wallet', label: 'Métodos de Pagamento', description: 'Taxas e prazos de recebimento', variant: 'amber', section: 'Operação', requiredPlan: 'pro' },
  { value: 'costs', icon: 'Calculator', label: 'Custos de Receitas', description: 'Percentuais e markups', variant: 'amber', section: 'Operação', requiredPlan: 'pro' },
  { value: 'rewards', icon: 'Gift', label: 'Loja de Recompensas', description: 'Prêmios para colaboradores', variant: 'purple', section: 'Sistema', requiredPlan: 'pro' },
  { value: 'medals', icon: 'Award', label: 'Medalhas', description: 'Conceder medalhas de prestígio', variant: 'purple', section: 'Sistema', requiredPlan: 'pro' },
  { value: 'units', icon: 'Store', label: 'Lojas', description: 'Gerenciar suas lojas', variant: 'purple', section: 'Sistema', requiredPlan: 'free' },
  { value: 'audit-log', icon: 'FileText', label: 'Log de Atividades', description: 'Registro de ações no sistema', variant: 'purple', section: 'Sistema', requiredPlan: 'free' },
  { value: 'cardapio-digital', icon: 'BookOpen', label: 'Cardápio Digital', description: 'PDV, mesas, QR e roleta', variant: 'amber', section: 'Operação', requiredPlan: 'free' },
  { value: 'loyalty', icon: 'Heart', label: 'Fidelidade', description: 'Regras de pontos e recompensas', variant: 'purple', section: 'Sistema', requiredPlan: 'pro' },
];

function SettingsFallback() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-10 w-48" />
      <Skeleton className="h-32 w-full" />
      <Skeleton className="h-32 w-full" />
    </div>
  );
}

const PLAN_LABELS: Record<PlanTier, string> = {
  free: '',
  pro: 'PRO',
  business: 'BUSINESS',
};

export default function SettingsPage() {
  const { isAdmin, isSuperAdmin, hasPlan } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeSection, setActiveSection] = useState<string | null>(
    searchParams.get('tab')
  );

  // Sync active section to URL so it persists across navigation
  useEffect(() => {
    if (activeSection) {
      setSearchParams({ tab: activeSection }, { replace: true });
    } else {
      if (searchParams.has('tab')) {
        setSearchParams({}, { replace: true });
      }
    }
  }, [activeSection]); // eslint-disable-line react-hooks/exhaustive-deps

  const menuItems = allMenuItems.filter(item => {
    if (item.value === 'plan') return true;
    if (item.value === 'units') return isSuperAdmin;
    if (item.value === 'team') return isAdmin;
    if (item.value === 'audit-log') return isAdmin;
    if (item.value === 'medals') return isAdmin;
    if (item.value === 'profile' || item.value === 'notifications') return true;
    return isAdmin;
  });

  const handleSectionClick = (value: string, requiredPlan: PlanTier) => {
    if (value === 'plan') {
      navigate('/plans');
      return;
    }
    if (!hasPlan(requiredPlan)) {
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

  const settingsContent = activeSection ? (
    <Suspense fallback={<SettingsFallback />}>
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
      {activeSection === 'cardapio-digital' && <CardapioSettings />}
      {activeSection === 'loyalty' && <LoyaltySettings />}
    </Suspense>
  ) : null;

  const menuList = (
    <div className="space-y-6">
      {sections.map((section) => (
        <div key={section.label}>
          <h3 className="section-label mb-1 px-1">{section.label}</h3>
          <div className="card-surface rounded-2xl overflow-hidden divide-y divide-border/40">
            {section.items.map((item) => {
              const locked = !hasPlan(item.requiredPlan);
              const planLabel = PLAN_LABELS[item.requiredPlan];
              return (
                <button
                  key={item.value}
                  onClick={() => handleSectionClick(item.value, item.requiredPlan)}
                  className={cn(
                    "w-full flex items-center justify-between px-4 py-3.5 text-left hover:bg-secondary/30 active:bg-secondary/50 transition-colors",
                    locked && "opacity-50",
                    activeSection === item.value && "bg-primary/5 border-l-2 border-primary"
                  )}
                >
                  <span className="flex items-center gap-2">
                    <span className={cn("font-medium text-sm", locked ? "text-muted-foreground" : "text-foreground")}>{item.label}</span>
                    {locked && planLabel && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold tracking-wider text-amber-400 bg-amber-400/10 px-1.5 py-0.5 rounded-full">
                        💎 {planLabel}
                      </span>
                    )}
                  </span>
                  <AppIcon name={locked ? "Lock" : "ChevronRight"} size={16} className="text-muted-foreground shrink-0" />
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );

  // Mobile: show either menu or content
  // Desktop: show menu sidebar + content side by side
  if (activeSection && !settingsContent) {
    // fallback
  }

  // Mobile with active section — full screen content
  const mobileActiveView = activeSection ? (
    <div className="lg:hidden min-h-screen bg-background pb-24">
      <header className="page-header-bar">
        <div className="page-header-content flex items-center gap-3">
          <button onClick={() => setActiveSection(null)} className="text-muted-foreground hover:text-foreground transition-colors">
            <AppIcon name="ChevronRight" size={20} className="rotate-180 text-muted-foreground hover:text-foreground transition-colors" />
          </button>
          <h1 className="text-lg font-bold">{menuItems.find(i => i.value === activeSection)?.label}</h1>
        </div>
      </header>
      <div className="px-4 py-3 pb-24">
        {settingsContent}
      </div>
    </div>
  ) : null;

  return (
    <AppLayout>
      {/* Desktop: sidebar + content */}
      <div className="hidden lg:flex min-h-screen bg-background">
        <aside className="w-[300px] shrink-0 border-r border-border/40 overflow-y-auto py-3 px-4">
          {menuList}
        </aside>
        <main className="flex-1 overflow-y-auto py-3 px-6 pb-24">
          {settingsContent || (
            <div className="flex items-center justify-center h-64 text-muted-foreground text-sm">
              Selecione uma opção ao lado
            </div>
          )}
        </main>
      </div>

      {/* Mobile: original behavior */}
      <div className="lg:hidden">
        {activeSection ? mobileActiveView : (
          <div className="min-h-screen bg-background pb-24">
            <div className="px-4 py-3 space-y-6">
              {menuList}
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
