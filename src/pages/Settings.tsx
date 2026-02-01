import { AppLayout } from '@/components/layout/AppLayout';
import { useAuth } from '@/contexts/AuthContext';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { User, Tag, Truck, ClipboardCheck, Users } from 'lucide-react';
import { ProfileSettings } from '@/components/settings/ProfileSettings';
import { CategorySettings } from '@/components/settings/CategorySettings';
import { SupplierSettings } from '@/components/settings/SupplierSettings';
import { UserManagement } from '@/components/settings/UserManagement';
import { ChecklistSettingsManager } from '@/components/settings/ChecklistSettingsManager';

export default function SettingsPage() {
  const { isAdmin } = useAuth();

  return (
    <AppLayout>
      <div className="min-h-screen bg-background pb-24">
        {/* Header */}
        <header className="bg-card border-b sticky top-0 lg:top-0 z-40">
          <div className="px-4 py-4 lg:px-6">
            <h1 className="text-xl font-bold text-foreground">Configurações</h1>
            <p className="text-sm text-muted-foreground">
              {isAdmin ? 'Gerencie o sistema completo' : 'Gerencie seu perfil'}
            </p>
          </div>
        </header>

        <div className="px-4 py-6 lg:px-6">
          <Tabs defaultValue="profile" className="space-y-6">
            <TabsList className="grid w-full grid-cols-2 lg:grid-cols-5 h-auto gap-2 bg-transparent p-0">
              <TabsTrigger
                value="profile"
                className="flex items-center gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-xl py-3"
              >
                <User className="w-4 h-4" />
                <span className="hidden sm:inline">Perfil</span>
              </TabsTrigger>
              {isAdmin && (
                <>
                  <TabsTrigger
                    value="categories"
                    className="flex items-center gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-xl py-3"
                  >
                    <Tag className="w-4 h-4" />
                    <span className="hidden sm:inline">Categorias</span>
                  </TabsTrigger>
                  <TabsTrigger
                    value="suppliers"
                    className="flex items-center gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-xl py-3"
                  >
                    <Truck className="w-4 h-4" />
                    <span className="hidden sm:inline">Fornecedores</span>
                  </TabsTrigger>
                  <TabsTrigger
                    value="checklists"
                    className="flex items-center gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-xl py-3"
                  >
                    <ClipboardCheck className="w-4 h-4" />
                    <span className="hidden sm:inline">Checklists</span>
                  </TabsTrigger>
                  <TabsTrigger
                    value="users"
                    className="flex items-center gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-xl py-3"
                  >
                    <Users className="w-4 h-4" />
                    <span className="hidden sm:inline">Usuários</span>
                  </TabsTrigger>
                </>
              )}
            </TabsList>

            <div className="bg-card rounded-2xl border p-4 lg:p-6">
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
                </>
              )}
            </div>
          </Tabs>
        </div>
      </div>
    </AppLayout>
  );
}
