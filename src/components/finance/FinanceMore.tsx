import { useState } from 'react';
import { AppIcon } from '@/components/ui/app-icon';
import { AccountManagement } from './AccountManagement';
import { CategoryManagement } from './CategoryManagement';
import { FinanceBackupSheet } from './FinanceBackupSheet';
import { FinanceImportSheet } from './FinanceImportSheet';
import { FinanceAccount, FinanceCategory, FinanceTransaction } from '@/types/finance';
import { useFinanceBackup } from '@/hooks/useFinanceBackup';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useUnit } from '@/contexts/UnitContext';

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
  const [importOpen, setImportOpen] = useState(false);
  const [isFixing, setIsFixing] = useState(false);

  const { activeUnit } = useUnit();
  const backup = useFinanceBackup(accounts, transactions, selectedMonth, onRefreshAll);

  const handleFixImported = async () => {
    if (!activeUnit?.id) return;
    setIsFixing(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { toast.error('Sessão expirada'); return; }

      const { data, error } = await supabase.functions.invoke('import-finance-csv', {
        body: { action: 'fix_imported', unitId: activeUnit.id },
      });

      if (error) throw error;

      if (data.updated === 0) {
        toast.info('Nenhuma transação importada pendente encontrada.');
      } else {
        const adjText = data.adjustments?.length
          ? `\n${data.adjustments.map((a: any) => `• ${a.accountName}: ajuste de R$ ${a.adjustmentAmount.toFixed(2)}`).join('\n')}`
          : '';
        toast.success(`✅ ${data.updated} transações corrigidas!${adjText}`);
        onRefreshAll();
      }
    } catch (err: any) {
      toast.error(err.message || 'Erro ao corrigir transações');
    } finally {
      setIsFixing(false);
    }
  };

  const menuItems = [
    { icon: 'Wallet', label: 'Gerenciar Contas', onClick: () => setAccountsOpen(true), color: 'hsl(var(--neon-cyan))' },
    { icon: 'Hash', label: 'Gerenciar Categorias', onClick: () => setCategoriesOpen(true), color: 'hsl(var(--neon-amber))' },
    { icon: 'Archive', label: 'Backups', onClick: () => setBackupOpen(true), color: 'hsl(var(--neon-purple, 270 70% 60%))' },
    { icon: 'Upload', label: 'Importar CSV', onClick: () => setImportOpen(true), color: 'hsl(var(--neon-green, 142 70% 45%))' },
    { icon: 'Wrench', label: isFixing ? 'Corrigindo...' : 'Corrigir importação anterior', onClick: handleFixImported, color: 'hsl(var(--neon-amber))' },
  ];

  return (
    <>
      <div className="px-4 py-3 lg:px-6 space-y-4 pb-32">
        <div className="card-surface rounded-2xl overflow-hidden divide-y divide-border/40">
          {menuItems.map((item) => (
            <button
              key={item.label}
              onClick={item.onClick}
              className="w-full flex items-center justify-between px-4 py-3.5 text-left hover:bg-secondary/30 active:bg-secondary/50 transition-colors"
            >
              <span className="font-medium text-sm text-foreground">{item.label}</span>
              <AppIcon name="ChevronRight" size={16} className="text-muted-foreground shrink-0" />
            </button>
          ))}
        </div>
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

      <FinanceImportSheet
        open={importOpen}
        onOpenChange={setImportOpen}
        onRefreshAll={onRefreshAll}
      />
    </>
  );
}
