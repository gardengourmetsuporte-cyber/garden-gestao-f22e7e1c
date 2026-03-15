import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { AppIcon } from '@/components/ui/app-icon';
import { useCopilotConfig } from '@/hooks/useCopilotConfig';

const ALL_TOOLS = [
  { key: 'create_transaction', name: 'Criar Transação', description: 'Registrar receita ou despesa no financeiro', icon: 'DollarSign' },
  { key: 'create_task', name: 'Criar Tarefa', description: 'Adicionar tarefa/lembrete na agenda', icon: 'CheckSquare' },
  { key: 'register_stock_movement', name: 'Movimentar Estoque', description: 'Entrada ou saída de itens do inventário', icon: 'Package' },
  { key: 'mark_transaction_paid', name: 'Marcar como Pago', description: 'Quitar despesas pendentes', icon: 'CheckCircle' },
  { key: 'complete_task', name: 'Concluir Tarefa', description: 'Marcar tarefa da agenda como feita', icon: 'Check' },
  { key: 'delete_task', name: 'Excluir Tarefa', description: 'Remover tarefa da agenda', icon: 'Trash2' },
  { key: 'create_order', name: 'Criar Pedido', description: 'Pedido de compra para fornecedor', icon: 'ShoppingCart' },
  { key: 'register_employee_payment', name: 'Pagamento Funcionário', description: 'Registrar salário, adiantamento ou bônus', icon: 'Users' },
  { key: 'mark_closing_validated', name: 'Validar Fechamento', description: 'Aprovar fechamento de caixa pendente', icon: 'Shield' },
  { key: 'update_transaction', name: 'Editar Transação', description: 'Alterar valor, data ou categoria de transação', icon: 'Edit' },
  { key: 'create_supplier_invoice', name: 'Criar Boleto', description: 'Registrar boleto/fatura de fornecedor', icon: 'FileText' },
  { key: 'mark_invoice_paid', name: 'Pagar Boleto', description: 'Quitar boleto de fornecedor', icon: 'CreditCard' },
  { key: 'complete_checklist_item', name: 'Concluir Checklist', description: 'Marcar item do checklist como feito', icon: 'ClipboardCheck' },
  { key: 'send_order', name: 'Enviar Pedido', description: 'Despachar pedido para fornecedor', icon: 'Send' },
  { key: 'create_appointment', name: 'Criar Compromisso', description: 'Agendar compromisso com horário', icon: 'Calendar' },
  { key: 'save_preference', name: 'Salvar Preferência', description: 'Memorizar atalhos e apelidos', icon: 'Brain' },
];

export function AgentToolsManager() {
  const { config, isLoading, upsertConfig } = useCopilotConfig();
  const [enabledTools, setEnabledTools] = useState<string[]>([]);
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    if (config?.enabled_tools?.length) {
      setEnabledTools(config.enabled_tools);
    } else {
      // Default: all enabled
      setEnabledTools(ALL_TOOLS.map(t => t.key));
    }
  }, [config]);

  const toggle = (key: string) => {
    setEnabledTools(prev => prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]);
    setDirty(true);
  };

  const toggleAll = (enabled: boolean) => {
    setEnabledTools(enabled ? ALL_TOOLS.map(t => t.key) : []);
    setDirty(true);
  };

  const handleSave = () => {
    upsertConfig.mutate({ enabled_tools: enabledTools }, { onSuccess: () => setDirty(false) });
  };

  if (isLoading) {
    return <div className="space-y-2">{[1,2,3,4].map(i => <div key={i} className="h-14 bg-muted rounded-xl animate-pulse" />)}</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{enabledTools.length}/{ALL_TOOLS.length} ferramentas ativas</p>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" className="rounded-xl text-xs" onClick={() => toggleAll(true)}>Ativar Todas</Button>
          <Button size="sm" variant="outline" className="rounded-xl text-xs" onClick={() => toggleAll(false)}>Desativar Todas</Button>
        </div>
      </div>

      <div className="space-y-2">
        {ALL_TOOLS.map(tool => (
          <div key={tool.key} className="flex items-center gap-3 p-3 rounded-xl border border-border bg-card">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
              <AppIcon name={tool.icon as any} className="w-4 h-4 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground">{tool.name}</p>
              <p className="text-[11px] text-muted-foreground">{tool.description}</p>
            </div>
            <Switch checked={enabledTools.includes(tool.key)} onCheckedChange={() => toggle(tool.key)} />
          </div>
        ))}
      </div>

      {dirty && (
        <Button onClick={handleSave} disabled={upsertConfig.isPending} className="w-full gap-2">
          <AppIcon name="Save" className="w-4 h-4" />
          {upsertConfig.isPending ? 'Salvando...' : 'Salvar Ferramentas'}
        </Button>
      )}
    </div>
  );
}
