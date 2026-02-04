import { useState, useEffect } from 'react';
import { CreditCardInvoice, FinanceAccount, FinanceTransaction, FinanceCategory } from '@/types/finance';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  CreditCard, 
  ChevronRight, 
  Calendar, 
  Check, 
  AlertCircle,
  Plus,
  Loader2,
  ArrowLeft
} from 'lucide-react';
import { format, isBefore, isAfter, addDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { getLucideIcon } from '@/lib/icons';
import { TransactionSheet } from './TransactionSheet';

interface CreditCardTabProps {
  accounts: FinanceAccount[];
  categories: FinanceCategory[];
  invoices: CreditCardInvoice[];
  onPayInvoice: (invoiceId: string, fromAccountId: string) => Promise<void>;
  onGetInvoiceTransactions: (invoiceId: string) => Promise<FinanceTransaction[]>;
  onAddTransaction: (data: any) => Promise<void>;
  onDeleteTransaction: (id: string) => Promise<void>;
  onRefresh: () => Promise<void>;
}

export function CreditCardTab({
  accounts,
  categories,
  invoices,
  onPayInvoice,
  onGetInvoiceTransactions,
  onAddTransaction,
  onDeleteTransaction,
  onRefresh
}: CreditCardTabProps) {
  const [selectedInvoice, setSelectedInvoice] = useState<CreditCardInvoice | null>(null);
  const [invoiceTransactions, setInvoiceTransactions] = useState<FinanceTransaction[]>([]);
  const [isLoadingTransactions, setIsLoadingTransactions] = useState(false);
  const [showPaySheet, setShowPaySheet] = useState(false);
  const [selectedPayAccount, setSelectedPayAccount] = useState<string>('');
  const [isPayingInvoice, setIsPayingInvoice] = useState(false);
  const [showAddTransaction, setShowAddTransaction] = useState(false);

  const creditCardAccounts = accounts.filter(a => a.type === 'credit_card');
  const nonCreditCardAccounts = accounts.filter(a => a.type !== 'credit_card');

  const handleViewInvoice = async (invoice: CreditCardInvoice) => {
    setSelectedInvoice(invoice);
    setIsLoadingTransactions(true);
    const transactions = await onGetInvoiceTransactions(invoice.id);
    setInvoiceTransactions(transactions);
    setIsLoadingTransactions(false);
  };

  const handlePayInvoice = async () => {
    if (!selectedInvoice || !selectedPayAccount) return;
    setIsPayingInvoice(true);
    await onPayInvoice(selectedInvoice.id, selectedPayAccount);
    setIsPayingInvoice(false);
    setShowPaySheet(false);
    setSelectedInvoice(null);
    await onRefresh();
  };

  const getInvoiceStatus = (invoice: CreditCardInvoice) => {
    const today = new Date();
    const dueDate = new Date(invoice.due_date);
    
    if (invoice.is_paid) {
      return { label: 'Paga', variant: 'default' as const, icon: Check };
    }
    if (isBefore(dueDate, today)) {
      return { label: 'Vencida', variant: 'destructive' as const, icon: AlertCircle };
    }
    if (isBefore(dueDate, addDays(today, 7))) {
      return { label: 'Vence em breve', variant: 'secondary' as const, icon: Calendar };
    }
    return { label: 'Aberta', variant: 'outline' as const, icon: Calendar };
  };

  // Group invoices by credit card account
  const invoicesByAccount = creditCardAccounts.map(account => ({
    account,
    invoices: invoices.filter(i => i.account_id === account.id)
  }));

  return (
    <div className="p-4 space-y-6 pb-24">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">Cartões de Crédito</h1>
      </div>

      {creditCardAccounts.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="pt-6 text-center">
            <CreditCard className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground mb-4">
              Você ainda não tem cartões cadastrados
            </p>
            <p className="text-sm text-muted-foreground">
              Vá em "Mais" → "Gerenciar Contas" e adicione um cartão de crédito
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {invoicesByAccount.map(({ account, invoices: accountInvoices }) => (
            <div key={account.id} className="space-y-3">
              {/* Card header */}
              <div className="flex items-center gap-3">
                <div 
                  className="w-10 h-10 rounded-full flex items-center justify-center"
                  style={{ backgroundColor: account.color + '20' }}
                >
                  <CreditCard className="w-5 h-5" style={{ color: account.color }} />
                </div>
                <div className="flex-1">
                  <h2 className="font-semibold">{account.name}</h2>
                  <p className="text-sm text-muted-foreground">
                    {accountInvoices.length} fatura{accountInvoices.length !== 1 ? 's' : ''}
                  </p>
                </div>
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => {
                    setSelectedInvoice({ 
                      account_id: account.id,
                      account 
                    } as any);
                    setShowAddTransaction(true);
                  }}
                >
                  <Plus className="w-4 h-4 mr-1" />
                  Lançar
                </Button>
              </div>

              {/* Invoices list */}
              {accountInvoices.length === 0 ? (
                <Card className="border-dashed">
                  <CardContent className="py-4 text-center text-sm text-muted-foreground">
                    Nenhuma fatura ainda. Adicione um lançamento no cartão.
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-2">
                  {accountInvoices.map(invoice => {
                    const status = getInvoiceStatus(invoice);
                    const StatusIcon = status.icon;
                    
                    return (
                      <Card 
                        key={invoice.id}
                        className="cursor-pointer hover:bg-secondary/50 transition-colors"
                        onClick={() => handleViewInvoice(invoice)}
                      >
                        <CardContent className="p-4 flex items-center gap-3">
                          <div className="flex-1">
                            <p className="font-medium">
                              Fatura {format(new Date(invoice.due_date), 'MMMM/yyyy', { locale: ptBR })}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              Vence em {format(new Date(invoice.due_date), 'dd/MM')}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className={cn(
                              "font-semibold",
                              invoice.is_paid ? "text-muted-foreground" : "text-destructive"
                            )}>
                              R$ {Number(invoice.total_amount).toFixed(2)}
                            </p>
                            <Badge variant={status.variant} className="text-xs">
                              <StatusIcon className="w-3 h-3 mr-1" />
                              {status.label}
                            </Badge>
                          </div>
                          <ChevronRight className="w-5 h-5 text-muted-foreground" />
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Invoice detail sheet */}
      <Sheet open={!!selectedInvoice && !showAddTransaction} onOpenChange={(open) => !open && setSelectedInvoice(null)}>
        <SheetContent side="bottom" className="h-[85vh] rounded-t-2xl overflow-y-auto">
          <SheetHeader className="pb-4">
            <SheetTitle className="flex items-center gap-2">
              <Button variant="ghost" size="icon" onClick={() => setSelectedInvoice(null)}>
                <ArrowLeft className="w-5 h-5" />
              </Button>
              Fatura {selectedInvoice && format(new Date(selectedInvoice.due_date), 'MMMM/yyyy', { locale: ptBR })}
            </SheetTitle>
          </SheetHeader>

          {selectedInvoice && (
            <div className="space-y-6">
              {/* Invoice summary */}
              <Card className={cn(
                "border-2",
                selectedInvoice.is_paid ? "border-success/50" : "border-destructive/50"
              )}>
                <CardContent className="pt-6">
                  <div className="text-center">
                    <p className="text-sm text-muted-foreground">Total da fatura</p>
                    <p className={cn(
                      "text-3xl font-bold",
                      selectedInvoice.is_paid ? "text-success" : "text-destructive"
                    )}>
                      R$ {Number(selectedInvoice.total_amount).toFixed(2)}
                    </p>
                    <p className="text-sm text-muted-foreground mt-2">
                      Vencimento: {format(new Date(selectedInvoice.due_date), 'dd/MM/yyyy')}
                    </p>
                    {selectedInvoice.is_paid && selectedInvoice.paid_at && (
                      <Badge className="mt-2 bg-success text-success-foreground">
                        <Check className="w-3 h-3 mr-1" />
                        Paga em {format(new Date(selectedInvoice.paid_at), 'dd/MM')}
                      </Badge>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Actions */}
              {!selectedInvoice.is_paid && (
                <div className="flex gap-3">
                  <Button 
                    className="flex-1" 
                    onClick={() => setShowPaySheet(true)}
                  >
                    <Check className="w-4 h-4 mr-2" />
                    Pagar Fatura
                  </Button>
                  <Button 
                    variant="outline"
                    onClick={() => setShowAddTransaction(true)}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Adicionar
                  </Button>
                </div>
              )}

              {/* Transactions list */}
              <div className="space-y-3">
                <h3 className="font-semibold">Lançamentos</h3>
                
                {isLoadingTransactions ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                  </div>
                ) : invoiceTransactions.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">
                    Nenhum lançamento nesta fatura
                  </p>
                ) : (
                  <div className="space-y-2">
                    {invoiceTransactions.map(tx => {
                      const CatIcon = tx.category?.icon ? getLucideIcon(tx.category.icon) : null;
                      const isInstallment = tx.total_installments && tx.total_installments > 1;
                      
                      return (
                        <div 
                          key={tx.id}
                          className="flex items-center gap-3 p-3 bg-secondary/30 rounded-lg"
                        >
                          {CatIcon && (
                            <div 
                              className="w-10 h-10 rounded-full flex items-center justify-center"
                              style={{ backgroundColor: (tx.category?.color || '#6366f1') + '20' }}
                            >
                              <CatIcon className="w-5 h-5" style={{ color: tx.category?.color }} />
                            </div>
                          )}
                          <div className="flex-1">
                            <p className="font-medium text-sm">{tx.description}</p>
                            <p className="text-xs text-muted-foreground">
                              {format(new Date(tx.date), 'dd/MM')}
                              {isInstallment && (
                                <span className="ml-2 text-primary">
                                  {tx.installment_number}/{tx.total_installments}
                                </span>
                              )}
                            </p>
                          </div>
                          <p className="font-semibold text-destructive">
                            R$ {Number(tx.amount).toFixed(2)}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>

      {/* Pay invoice sheet */}
      <Sheet open={showPaySheet} onOpenChange={setShowPaySheet}>
        <SheetContent side="bottom" className="h-auto rounded-t-2xl">
          <SheetHeader className="pb-4">
            <SheetTitle>Pagar Fatura</SheetTitle>
          </SheetHeader>

          <div className="space-y-4 pb-8">
            <p className="text-sm text-muted-foreground">
              Selecione a conta de onde será debitado o pagamento:
            </p>

            <Select value={selectedPayAccount} onValueChange={setSelectedPayAccount}>
              <SelectTrigger className="h-12">
                <SelectValue placeholder="Selecionar conta" />
              </SelectTrigger>
              <SelectContent>
                {nonCreditCardAccounts.map(acc => (
                  <SelectItem key={acc.id} value={acc.id}>
                    {acc.name} - R$ {Number(acc.balance).toFixed(2)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Button 
              className="w-full h-12"
              onClick={handlePayInvoice}
              disabled={!selectedPayAccount || isPayingInvoice}
            >
              {isPayingInvoice ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  <Check className="w-4 h-4 mr-2" />
                  Confirmar Pagamento de R$ {selectedInvoice?.total_amount?.toFixed(2)}
                </>
              )}
            </Button>
          </div>
        </SheetContent>
      </Sheet>

      {/* Add transaction sheet */}
      {selectedInvoice && showAddTransaction && (
        <TransactionSheet
          open={showAddTransaction}
          onOpenChange={(open) => {
            setShowAddTransaction(open);
            if (!open) onRefresh();
          }}
          defaultType="credit_card"
          categories={categories}
          accounts={accounts}
          onSave={onAddTransaction}
          onDelete={onDeleteTransaction}
          creditCardAccountId={selectedInvoice.account_id}
        />
      )}
    </div>
  );
}
