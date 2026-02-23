import { useState } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useSupplierInvoices } from '@/hooks/useSupplierInvoices';
import { useSuppliers } from '@/hooks/useSuppliers';
import { useFinance } from '@/hooks/useFinance';
import { SupplierInvoiceSheet } from './SupplierInvoiceSheet';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { AppIcon } from '@/components/ui/app-icon';
import { cn } from '@/lib/utils';

export function SupplierInvoicesList() {
  const { invoices, pendingInvoices, overdueInvoices, isLoading, addInvoice, updateInvoice, deleteInvoice, payInvoiceWithTransaction } = useSupplierInvoices();
  const { suppliers } = useSuppliers();
  const { accounts, categories } = useFinance(new Date());
  
  const [showSheet, setShowSheet] = useState(false);
  const [editingInvoice, setEditingInvoice] = useState<typeof invoices[0] | null>(null);
  const [showPayDialog, setShowPayDialog] = useState(false);
  const [payingInvoice, setPayingInvoice] = useState<typeof invoices[0] | null>(null);
  const [selectedAccountId, setSelectedAccountId] = useState('');
  const [selectedCategoryId, setSelectedCategoryId] = useState('');
  const [isPaying, setIsPaying] = useState(false);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const handleEdit = (invoice: typeof invoices[0]) => {
    setEditingInvoice(invoice);
    setShowSheet(true);
  };

  const handlePayClick = (invoice: typeof invoices[0]) => {
    setPayingInvoice(invoice);
    setSelectedAccountId(accounts[0]?.id || '');
    setShowPayDialog(true);
  };

  const handleConfirmPay = async () => {
    if (!payingInvoice || !selectedAccountId) return;
    
    setIsPaying(true);
    try {
      await payInvoiceWithTransaction({
        invoiceId: payingInvoice.id,
        accountId: selectedAccountId,
        categoryId: selectedCategoryId || undefined,
      });
      setShowPayDialog(false);
      setPayingInvoice(null);
    } finally {
      setIsPaying(false);
    }
  };

  const isOverdue = (dueDate: string) => new Date(dueDate) < new Date();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-pulse text-muted-foreground">Carregando...</div>
      </div>
    );
  }

  // Group by status
  const overdueList = invoices.filter(inv => !inv.is_paid && isOverdue(inv.due_date));
  const pendingList = invoices.filter(inv => !inv.is_paid && !isOverdue(inv.due_date));
  const paidList = invoices.filter(inv => inv.is_paid);

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-3">
        <Card className="p-4">
          <div className="flex items-center gap-2 text-muted-foreground mb-1">
            <AppIcon name="Schedule" size={16} />
            <span className="text-sm">A pagar</span>
          </div>
          <p className="text-xl font-semibold">
            {formatCurrency(pendingInvoices.reduce((sum, inv) => sum + inv.amount, 0))}
          </p>
          <p className="text-xs text-muted-foreground">{pendingInvoices.length} boletos</p>
        </Card>
        
        {overdueInvoices.length > 0 && (
          <Card className="p-4 border-destructive/50 bg-destructive/5">
            <div className="flex items-center gap-2 text-destructive mb-1">
              <AppIcon name="Warning" size={16} />
              <span className="text-sm">Vencidos</span>
            </div>
            <p className="text-xl font-semibold text-destructive">
              {formatCurrency(overdueInvoices.reduce((sum, inv) => sum + inv.amount, 0))}
            </p>
            <p className="text-xs text-destructive/80">{overdueInvoices.length} boletos</p>
          </Card>
        )}
      </div>

      {/* Add Button */}
      <Button onClick={() => { setEditingInvoice(null); setShowSheet(true); }} className="w-full">
        <AppIcon name="Add" size={16} className="mr-2" />
        Cadastrar Boleto
      </Button>

      {/* Overdue List */}
      {overdueList.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-sm font-medium text-destructive flex items-center gap-1">
            <AppIcon name="Warning" size={16} />
            Vencidos
          </h3>
          {overdueList.map(invoice => (
            <Card 
              key={invoice.id} 
              className="p-4 border-destructive/30 cursor-pointer hover:bg-muted/50 transition-colors"
              onClick={() => handleEdit(invoice)}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <AppIcon name="Business" size={16} className="text-muted-foreground shrink-0" />
                    <span className="font-medium truncate">{invoice.supplier?.name}</span>
                  </div>
                  <p className="text-sm text-muted-foreground truncate mt-1">{invoice.description}</p>
                  <div className="flex items-center gap-2 mt-2 text-xs text-destructive">
                    <AppIcon name="CalendarMonth" size={12} />
                    Venceu em {format(new Date(invoice.due_date), "dd/MM", { locale: ptBR })}
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <p className="font-semibold text-destructive">{formatCurrency(invoice.amount)}</p>
                  <Button
                    size="sm"
                    variant="outline"
                    className="mt-2"
                    onClick={(e) => {
                      e.stopPropagation();
                      handlePayClick(invoice);
                    }}
                  >
                    <AppIcon name="Wallet" size={12} className="mr-1" />
                    Pagar
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Pending List */}
      {pendingList.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-sm font-medium text-muted-foreground">A Vencer</h3>
          {pendingList.map(invoice => (
            <Card 
              key={invoice.id} 
              className="p-4 cursor-pointer hover:bg-muted/50 transition-colors"
              onClick={() => handleEdit(invoice)}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <AppIcon name="Business" size={16} className="text-muted-foreground shrink-0" />
                    <span className="font-medium truncate">{invoice.supplier?.name}</span>
                  </div>
                  <p className="text-sm text-muted-foreground truncate mt-1">{invoice.description}</p>
                  <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                    <AppIcon name="CalendarMonth" size={12} />
                    Vence em {format(new Date(invoice.due_date), "dd/MM", { locale: ptBR })}
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <p className="font-semibold">{formatCurrency(invoice.amount)}</p>
                  <Button
                    size="sm"
                    variant="outline"
                    className="mt-2"
                    onClick={(e) => {
                      e.stopPropagation();
                      handlePayClick(invoice);
                    }}
                  >
                    <AppIcon name="Wallet" size={12} className="mr-1" />
                    Pagar
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Paid List */}
      {paidList.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-sm font-medium text-muted-foreground">Pagos</h3>
          {paidList.slice(0, 5).map(invoice => (
            <Card 
              key={invoice.id} 
              className="p-4 opacity-60 cursor-pointer hover:opacity-80 transition-opacity"
              onClick={() => handleEdit(invoice)}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <AppIcon name="Business" size={16} className="text-muted-foreground shrink-0" />
                    <span className="font-medium truncate">{invoice.supplier?.name}</span>
                    <Badge variant="secondary" className="shrink-0">
                      <AppIcon name="Check" size={12} className="mr-1" />
                      Pago
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground truncate mt-1">{invoice.description}</p>
                </div>
                <p className="font-semibold shrink-0">{formatCurrency(invoice.amount)}</p>
              </div>
            </Card>
          ))}
        </div>
      )}

      {invoices.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          <AppIcon name="Description" size={48} className="mx-auto mb-3 opacity-50" />
          <p>Nenhum boleto cadastrado</p>
        </div>
      )}

      {/* Invoice Sheet */}
      <SupplierInvoiceSheet
        open={showSheet}
        onOpenChange={setShowSheet}
        suppliers={suppliers}
        editingInvoice={editingInvoice}
        onSave={addInvoice}
        onUpdate={updateInvoice}
        onDelete={deleteInvoice}
      />

      {/* Pay Dialog */}
      <Dialog open={showPayDialog} onOpenChange={setShowPayDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar Pagamento</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="p-3 bg-muted rounded-lg">
              <p className="font-medium">{payingInvoice?.supplier?.name}</p>
              <p className="text-sm text-muted-foreground">{payingInvoice?.description}</p>
              <p className="text-lg font-semibold mt-2">{payingInvoice && formatCurrency(payingInvoice.amount)}</p>
            </div>

            <div className="space-y-2">
              <Label>Conta para débito *</Label>
              <Select value={selectedAccountId} onValueChange={setSelectedAccountId}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a conta" />
                </SelectTrigger>
                <SelectContent>
                  {accounts.filter(a => a.type !== 'credit_card').map(acc => (
                    <SelectItem key={acc.id} value={acc.id}>{acc.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Categoria (opcional)</Label>
              <Select value={selectedCategoryId} onValueChange={setSelectedCategoryId}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a categoria" />
                </SelectTrigger>
                <SelectContent>
                  {categories.filter(c => c.type === 'expense').map(cat => (
                    <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPayDialog(false)}>
              Cancelar
            </Button>
            <Button onClick={handleConfirmPay} disabled={!selectedAccountId || isPaying}>
              {isPaying ? 'Processando...' : 'Confirmar Pagamento'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
