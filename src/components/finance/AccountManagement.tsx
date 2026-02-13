import { useState } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { FinanceAccount, AccountType } from '@/types/finance';
import { Plus, Pencil, Trash2, Wallet, Building2, CreditCard, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { matchBankBrand, WALLET_BRAND } from '@/lib/bankBrands';

interface AccountManagementProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  accounts: FinanceAccount[];
  onAdd: (data: Omit<FinanceAccount, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => Promise<void>;
  onUpdate: (id: string, data: Partial<FinanceAccount>) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

const ACCOUNT_TYPES: { value: AccountType; label: string; icon: typeof Wallet }[] = [
  { value: 'wallet', label: 'Carteira', icon: Wallet },
  { value: 'bank', label: 'Banco', icon: Building2 },
  { value: 'credit_card', label: 'Cartão de Crédito', icon: CreditCard },
];

const COLORS = [
  '#3b82f6', '#22c55e', '#ef4444', '#f59e0b', '#8b5cf6', 
  '#ec4899', '#06b6d4', '#84cc16', '#f97316', '#6366f1'
];

export function AccountManagement({
  open,
  onOpenChange,
  accounts,
  onAdd,
  onUpdate,
  onDelete
}: AccountManagementProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editingAccount, setEditingAccount] = useState<FinanceAccount | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  
  // Form state
  const [name, setName] = useState('');
  const [type, setType] = useState<AccountType>('wallet');
  const [balance, setBalance] = useState('');
  const [color, setColor] = useState(COLORS[0]);

  const resetForm = () => {
    setName('');
    setType('wallet');
    setBalance('');
    setColor(COLORS[0]);
    setEditingAccount(null);
    setIsEditing(false);
  };

  const handleEdit = (account: FinanceAccount) => {
    setEditingAccount(account);
    setName(account.name);
    setType(account.type as AccountType);
    setBalance(String(account.balance));
    setColor(account.color);
    setIsEditing(true);
  };

  const handleSave = async () => {
    if (!name.trim()) return;
    setIsLoading(true);
    
    if (editingAccount) {
      await onUpdate(editingAccount.id, {
        name: name.trim(),
        type,
        balance: parseFloat(balance) || 0,
        color
      });
    } else {
      await onAdd({
        name: name.trim(),
        type,
        balance: parseFloat(balance) || 0,
        color,
        icon: type === 'wallet' ? 'Wallet' : type === 'bank' ? 'Building2' : 'CreditCard',
        is_active: true
      });
    }
    
    setIsLoading(false);
    resetForm();
  };

  const handleDelete = async (id: string) => {
    setIsLoading(true);
    await onDelete(id);
    setIsLoading(false);
  };

  const getBankAvatar = (account: FinanceAccount) => {
    const isWalletType = account.type === 'wallet';
    const brand = isWalletType ? WALLET_BRAND : matchBankBrand(account.name);
    if (brand) {
      return (
        <div
          className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-xs shrink-0 shadow-sm"
          style={{ backgroundColor: brand.bgColor, color: brand.textColor }}
        >
          {brand.abbr}
        </div>
      );
    }
    const Icon = getAccountIcon(account.type);
    return (
      <div
        className="w-10 h-10 rounded-full flex items-center justify-center"
        style={{ backgroundColor: account.color + '20' }}
      >
        <Icon className="w-5 h-5" style={{ color: account.color }} />
      </div>
    );
  };

  const getAccountIcon = (accountType: string) => {
    const typeInfo = ACCOUNT_TYPES.find(t => t.value === accountType);
    return typeInfo?.icon || Wallet;
  };

  return (
    <Sheet open={open} onOpenChange={(o) => { onOpenChange(o); if (!o) resetForm(); }}>
      <SheetContent side="bottom" className="h-[85vh] rounded-t-2xl overflow-y-auto">
        <SheetHeader className="pb-4">
          <SheetTitle>
            {isEditing ? (editingAccount ? 'Editar Conta' : 'Nova Conta') : 'Gerenciar Contas'}
          </SheetTitle>
        </SheetHeader>

        {!isEditing ? (
          <div className="space-y-4">
            {/* List of accounts */}
            <div className="space-y-2">
              {accounts.map(account => {
                return (
                  <div
                    key={account.id}
                    className="flex items-center gap-3 p-4 bg-card border rounded-xl"
                  >
                    {getBankAvatar(account)}
                    <div className="flex-1">
                      <p className="font-medium">{account.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(account.balance)}
                      </p>
                    </div>
                    <Button variant="ghost" size="icon" onClick={() => handleEdit(account)}>
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      onClick={() => handleDelete(account.id)}
                      disabled={isLoading}
                    >
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </Button>
                  </div>
                );
              })}
            </div>

            {/* Add button */}
            <Button 
              className="w-full h-12" 
              onClick={() => setIsEditing(true)}
            >
              <Plus className="w-5 h-5 mr-2" />
              Nova Conta
            </Button>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Name */}
            <div className="space-y-2">
              <Label>Nome da conta</Label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ex: Santander, Carteira..."
                className="h-12"
              />
            </div>

            {/* Type */}
            <div className="space-y-2">
              <Label>Tipo</Label>
              <div className="grid grid-cols-3 gap-2">
                {ACCOUNT_TYPES.map(t => (
                  <Button
                    key={t.value}
                    variant={type === t.value ? "default" : "outline"}
                    className="h-16 flex-col gap-1"
                    onClick={() => setType(t.value)}
                  >
                    <t.icon className="w-5 h-5" />
                    <span className="text-xs">{t.label}</span>
                  </Button>
                ))}
              </div>
            </div>

            {/* Balance */}
            <div className="space-y-2">
              <Label>Saldo inicial</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">R$</span>
                <Input
                  type="number"
                  inputMode="decimal"
                  value={balance}
                  onChange={(e) => setBalance(e.target.value)}
                  placeholder="0,00"
                  className="pl-10 h-12"
                />
              </div>
            </div>

            {/* Color */}
            <div className="space-y-2">
              <Label>Cor</Label>
              <div className="flex flex-wrap gap-2">
                {COLORS.map(c => (
                  <button
                    key={c}
                    className={cn(
                      "w-8 h-8 rounded-full transition-transform",
                      color === c && "ring-2 ring-offset-2 ring-primary scale-110"
                    )}
                    style={{ backgroundColor: c }}
                    onClick={() => setColor(c)}
                  />
                ))}
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-4">
              <Button variant="outline" className="flex-1 h-12" onClick={resetForm}>
                Cancelar
              </Button>
              <Button 
                className="flex-1 h-12" 
                onClick={handleSave}
                disabled={isLoading || !name.trim()}
              >
                {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Salvar'}
              </Button>
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
