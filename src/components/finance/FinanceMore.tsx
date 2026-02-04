import { useState } from 'react';
import { Wallet, Tag, Settings, FileText, HelpCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AccountManagement } from './AccountManagement';
import { CategoryManagement } from './CategoryManagement';
import { FinanceAccount, FinanceCategory } from '@/types/finance';

interface FinanceMoreProps {
  accounts: FinanceAccount[];
  categories: FinanceCategory[];
  onAddAccount: (data: Omit<FinanceAccount, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => Promise<void>;
  onUpdateAccount: (id: string, data: Partial<FinanceAccount>) => Promise<void>;
  onDeleteAccount: (id: string) => Promise<void>;
  onRefreshCategories: () => Promise<void>;
}

export function FinanceMore({ 
  accounts, 
  categories, 
  onAddAccount, 
  onUpdateAccount, 
  onDeleteAccount,
  onRefreshCategories 
}: FinanceMoreProps) {
  const [accountsOpen, setAccountsOpen] = useState(false);
  const [categoriesOpen, setCategoriesOpen] = useState(false);

  const menuItems = [
    { icon: Wallet, label: 'Gerenciar Contas', onClick: () => setAccountsOpen(true) },
    { icon: Tag, label: 'Gerenciar Categorias', onClick: () => setCategoriesOpen(true) },
    { icon: FileText, label: 'Relatórios', disabled: true },
    { icon: Settings, label: 'Configurações', disabled: true },
    { icon: HelpCircle, label: 'Ajuda', disabled: true },
  ];

  return (
    <>
      <div className="p-4 space-y-2 pb-24">
        <h1 className="text-xl font-bold mb-4">Mais Opções</h1>
        
        {menuItems.map((item, index) => (
          <Button
            key={index}
            variant="ghost"
            className="w-full justify-start h-14 text-left gap-3"
            onClick={item.onClick}
            disabled={item.disabled}
          >
            <item.icon className="w-5 h-5 text-muted-foreground" />
            <span className="font-medium">{item.label}</span>
            {item.disabled && (
              <span className="ml-auto text-xs text-muted-foreground">Em breve</span>
            )}
          </Button>
        ))}
      </div>

      <AccountManagement
        open={accountsOpen}
        onOpenChange={setAccountsOpen}
        accounts={accounts}
        onAdd={onAddAccount}
        onUpdate={onUpdateAccount}
        onDelete={onDeleteAccount}
      />

      <CategoryManagement
        open={categoriesOpen}
        onOpenChange={setCategoriesOpen}
        categories={categories}
        onRefresh={onRefreshCategories}
      />
    </>
  );
}
