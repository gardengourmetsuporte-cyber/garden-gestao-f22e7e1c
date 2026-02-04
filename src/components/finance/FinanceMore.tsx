import { Wallet, Tag, Settings, FileText, HelpCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface FinanceMoreProps {
  onManageAccounts: () => void;
  onManageCategories: () => void;
}

export function FinanceMore({ onManageAccounts, onManageCategories }: FinanceMoreProps) {
  const menuItems = [
    { icon: Wallet, label: 'Gerenciar Contas', onClick: onManageAccounts },
    { icon: Tag, label: 'Gerenciar Categorias', onClick: onManageCategories },
    { icon: FileText, label: 'Relatórios', disabled: true },
    { icon: Settings, label: 'Configurações', disabled: true },
    { icon: HelpCircle, label: 'Ajuda', disabled: true },
  ];

  return (
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
  );
}
