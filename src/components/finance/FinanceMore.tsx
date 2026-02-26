import { useState } from 'react';
import { AppIcon } from '@/components/ui/app-icon';
import { AccountManagement } from './AccountManagement';
import { CategoryManagement } from './CategoryManagement';
import { FinanceBackupSheet } from './FinanceBackupSheet';
import { FinanceAccount, FinanceCategory, FinanceTransaction } from '@/types/finance';
import { useFinanceBackup } from '@/hooks/useFinanceBackup';

interface FinanceMoreProps {
  accounts: FinanceAccount[];
  categories: FinanceCategory[];
  transactions: FinanceTransaction[];
  selectedMonth: Date;
  onAddAccount: (data: Omit<FinanceAccount, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => Promise<void>;
  onUpdateAccount: (id: string, data: Partial<FinanceAccount>) => Promise<void>;
  onDeleteAccount: (id: string) => Promise<void>;
  onRefreshCategories: () => Promise<void>;
  onRefreshAll: () => Promise<void>;
}

export function FinanceMore({ 
  accounts, 
  categories, 
  transactions,
  selectedMonth,
  onAddAccount, 
  onUpdateAccount, 
  onDeleteAccount,
  onRefreshCategories,
  onRefreshAll,
}: FinanceMoreProps) {
  const [accountsOpen, setAccountsOpen] = useState(false);
  const [categoriesOpen, setCategoriesOpen] = useState(false);
  const [backupOpen, setBackupOpen] = useState(false);

  const backup = useFinanceBackup(accounts, transactions, selectedMonth, onRefreshAll);

  const menuItems = [
    { icon: 'Wallet', label: 'Gerenciar Contas', onClick: () => setAccountsOpen(true), color: 'hsl(var(--neon-cyan))' },
    { icon: 'Hash', label: 'Gerenciar Categorias', onClick: () => setCategoriesOpen(true), color: 'hsl(var(--neon-amber))' },
    { icon: 'Archive', label: 'Backups', onClick: () => setBackupOpen(true), color: 'hsl(var(--neon-purple, 270 70% 60%))' },
  ];

  return (
    <>
      <div className="p-4 space-y-2 pb-32">
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
              <AppIcon name={item.icon} size={20} style={{ color: item.color }} />
            </div>
            <span className="flex-1 font-medium">{item.label}</span>
            <AppIcon name="ChevronRight" size={16} className="text-muted-foreground" />
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

      <FinanceBackupSheet
        open={backupOpen}
        onOpenChange={setBackupOpen}
        snapshots={backup.snapshots}
        isLoading={backup.isLoading}
        isCreating={backup.isCreating}
        isRestoring={backup.isRestoring}
        onFetch={backup.fetchSnapshots}
        onCreate={backup.createSnapshot}
        onCompare={backup.compareSnapshot}
        onRestore={backup.restoreSnapshot}
        onDelete={backup.deleteSnapshot}
      />
    </>
  );
}
