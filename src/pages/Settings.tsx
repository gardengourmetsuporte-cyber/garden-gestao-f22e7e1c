import { AppLayout } from '@/components/layout/AppLayout';
import { useAuth } from '@/contexts/AuthContext';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { User, Tag, Truck, ClipboardCheck, Users, Gift, Settings as SettingsIcon, Wallet } from 'lucide-react';
import { ProfileSettings } from '@/components/settings/ProfileSettings';
import { CategorySettings } from '@/components/settings/CategorySettings';
import { SupplierSettings } from '@/components/settings/SupplierSettings';
import { UserManagement } from '@/components/settings/UserManagement';
import { ChecklistSettingsManager } from '@/components/settings/ChecklistSettingsManager';
import { RewardSettings } from '@/components/settings/RewardSettings';
import { PaymentMethodSettings } from '@/components/settings/PaymentMethodSettings';

export default function SettingsPage() {
  const { isAdmin } = useAuth();

  return (
    <AppLayout>
      <div className="min-h-screen bg-background pb-24">
        {/* Header */}
        <header className="page-header">
          <div className="page-header-content">
            <div className="flex items-center gap-3">
              <div className="page-header-icon bg-secondary">
                <SettingsIcon className="w-5 h-5 text-muted-foreground" />
              </div>
              <div>
                <h1 className="page-title">Configurações</h1>
                <p className="page-subtitle">
                  {isAdmin ? 'Gerencie o sistema completo' : 'Gerencie seu perfil'}
                </p>
              </div>
            </div>
          </div>
        </header>

        <div className="px-4 py-6 lg:px-6">
          <Tabs defaultValue="profile" className="space-y-4">
            <TabsList className={`grid w-full ${isAdmin ? 'grid-cols-4 lg:grid-cols-7' : 'grid-cols-1'} h-auto gap-2 bg-transparent p-0`}>
              <TabsTrigger
                value="profile"
                className="flex items-center gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-xl py-3 bg-secondary"
              >
                <User className="w-4 h-4" />
                <span className="hidden sm:inline">Perfil</span>
              </TabsTrigger>
              {isAdmin && (
                <>
                  <TabsTrigger
                    value="categories"
                    className="flex items-center gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-xl py-3 bg-secondary"
                  >
                    <Tag className="w-4 h-4" />
                    <span className="hidden sm:inline">Categorias</span>
                  </TabsTrigger>
                  <TabsTrigger
                    value="suppliers"
                    className="flex items-center gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-xl py-3 bg-secondary"
                  >
                    <Truck className="w-4 h-4" />
                    <span className="hidden sm:inline">Fornecedores</span>
                  </TabsTrigger>
                  <TabsTrigger
                    value="checklists"
                    className="flex items-center gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-xl py-3 bg-secondary"
                  >
                    <ClipboardCheck className="w-4 h-4" />
                    <span className="hidden sm:inline">Checklists</span>
                  </TabsTrigger>
                  <TabsTrigger
                    value="users"
                    className="flex items-center gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-xl py-3 bg-secondary"
                  >
                    <Users className="w-4 h-4" />
                    <span className="hidden sm:inline">Usuários</span>
                  </TabsTrigger>
                  <TabsTrigger
                    value="rewards"
                    className="flex items-center gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-xl py-3 bg-secondary"
                  >
                    <Gift className="w-4 h-4" />
                    <span className="hidden sm:inline">Loja</span>
                  </TabsTrigger>
                  <TabsTrigger
                    value="payments"
                    className="flex items-center gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-xl py-3 bg-secondary"
                  >
                    <Wallet className="w-4 h-4" />
                    <span className="hidden sm:inline">Pagamentos</span>
                  </TabsTrigger>
                </>
              )}
            </TabsList>

            <div className="card-base p-4 lg:p-6">
              <TabsContent value="profile" className="mt-0">
                <ProfileSettings />
              </TabsContent>

              {isAdmin && (
                <>
                  <TabsContent value="categories" className="mt-0">
                    <CategorySettings />
                  </TabsContent>

                  <TabsContent value="suppliers" className="mt-0">
                    <SupplierSettings />
                  </TabsContent>

                  <TabsContent value="checklists" className="mt-0">
                    <ChecklistSettingsManager />
                  </TabsContent>

                  <TabsContent value="users" className="mt-0">
                    <UserManagement />
                  </TabsContent>

                  <TabsContent value="rewards" className="mt-0">
                    <RewardSettings />
                  </TabsContent>

                  <TabsContent value="payments" className="mt-0">
                    <PaymentMethodSettings />
                  </TabsContent>
                </>
              )}
            </div>
          </Tabs>
        </div>
      </div>
    </AppLayout>
  );
}
