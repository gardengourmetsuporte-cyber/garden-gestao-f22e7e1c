import { useState } from 'react';
import { Wallet, Tag, ChevronRight } from 'lucide-react';
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
    { icon: Wallet, label: 'Gerenciar Contas', onClick: () => setAccountsOpen(true), color: 'hsl(var(--neon-cyan))' },
    { icon: Tag, label: 'Gerenciar Categorias', onClick: () => setCategoriesOpen(true), color: 'hsl(var(--neon-amber))' },
  ];

  return (
    <>
      <div className="p-4 space-y-2 pb-24">
        <h1 className="text-xl font-bold mb-4">Mais Opções</h1>
        
        {menuItems.map((item, index) => (
          <button
            key={index}
            onClick={item.onClick}
            className="list-command w-full flex items-center gap-3 p-4 text-left animate-slide-up"
            style={{ borderLeftColor: item.color, animationDelay: `${index * 50}ms` }}
          >
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
              style={{ backgroundColor: `${item.color}15` }}
            >
              <item.icon className="w-5 h-5" style={{ color: item.color }} />
            </div>
            <span className="flex-1 font-medium">{item.label}</span>
            <ChevronRight className="w-4 h-4 text-muted-foreground" />
          </button>
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
