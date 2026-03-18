import { useState, useMemo } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AppIcon } from '@/components/ui/app-icon';
import { GradientIcon, type GradientIconColor } from '@/components/ui/gradient-icon';
import { Supplier, Order } from '@/types/database';
import { SupplierInvoice } from '@/types/supplier';
import { cn } from '@/lib/utils';
import { formatPhoneDisplay, normalizePhone } from '@/lib/normalizePhone';
import { toast } from 'sonner';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface SupplierProfileSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  supplier: Supplier | null;
  orders: Order[];
  invoices: SupplierInvoice[];
  onSave: (data: { name: string; phone?: string; email?: string; delivery_frequency?: string }) => Promise<void>;
  onDelete?: (id: string) => Promise<void>;
  isNew?: boolean;
  onDeleteOrder?: (orderId: string) => Promise<void>;
  onUpdateOrderStatus?: (orderId: string, status: string) => Promise<void>;
  onDeleteInvoice?: (invoiceId: string) => Promise<void>;
  onMarkInvoicePaid?: (invoiceId: string) => Promise<void>;
  onCreateFinanceFromInvoice?: (invoice: SupplierInvoice) => void;
  onViewOrder?: (order: Order) => void;
}

export function SupplierProfileSheet({
  open, onOpenChange, supplier, orders, invoices, onSave, onDelete, isNew = false,
  onDeleteOrder, onUpdateOrderStatus, onDeleteInvoice, onMarkInvoicePaid,
  onCreateFinanceFromInvoice, onViewOrder,
}: SupplierProfileSheetProps) {
  const [editing, setEditing] = useState(isNew);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [deliveryFrequency, setDeliveryFrequency] = useState('weekly');
  const [saving, setSaving] = useState(false);
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);
  const [expandedInvoice, setExpandedInvoice] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<{ type: 'order' | 'invoice'; id: string; label: string } | null>(null);

  const syncForm = () => {
    if (supplier) {
      setName(supplier.name);
      setPhone(supplier.phone || '');
      setEmail(supplier.email || '');
      setDeliveryFrequency((supplier as any).delivery_frequency || 'weekly');
    } else {
      setName(''); setPhone(''); setEmail(''); setDeliveryFrequency('weekly');
    }
  };

  const handleOpenChange = (v: boolean) => {
    if (v) { syncForm(); setEditing(isNew); setExpandedOrder(null); setExpandedInvoice(null); }
    onOpenChange(v);
  };

  const supplierOrders = useMemo(() => 
    supplier ? orders.filter(o => o.supplier_id === supplier.id) : [],
    [orders, supplier]
  );

  const supplierInvoices = useMemo(() =>
    supplier ? invoices.filter(i => i.supplier_id === supplier.id) : [],
    [invoices, supplier]
  );

  const stats = useMemo(() => {
    const totalOrders = supplierOrders.length;
    const totalReceived = supplierOrders.filter(o => o.status === 'received').length;
    const totalInvoiced = supplierInvoices.reduce((sum, i) => sum + i.amount, 0);
    const pendingInvoices = supplierInvoices.filter(i => !i.is_paid).length;
    return { totalOrders, totalReceived, totalInvoiced, pendingInvoices };
  }, [supplierOrders, supplierInvoices]);

  const handleSave = async () => {
    if (!name.trim()) return;
    setSaving(true);
    try {
      await onSave({
        name: name.trim(),
        phone: phone.trim() || undefined,
        email: email.trim() || undefined,
        delivery_frequency: deliveryFrequency,
      });
      setEditing(false);
      if (isNew) onOpenChange(false);
    } catch {
      toast.error('Erro ao salvar fornecedor');
    } finally {
      setSaving(false);
    }
  };

  const handleWhatsApp = () => {
    if (!supplier?.phone) return;
    const normalized = normalizePhone(supplier.phone);
    if (normalized) window.open(`https://wa.me/${normalized}`, '_blank');
  };

  const hasWhatsApp = supplier?.phone ? !!normalizePhone(supplier.phone) : false;

  const handleConfirmDelete = async () => {
    if (!confirmDelete) return;
    const { type, id } = confirmDelete;
    setConfirmDelete(null);
    try {
      if (type === 'order' && onDeleteOrder) {
        await onDeleteOrder(id);
      } else if (type === 'invoice' && onDeleteInvoice) {
        setExpandedInvoice(null);
        await onDeleteInvoice(id);
      }
    } catch {
      toast.error('Erro ao excluir');
    }
  };

  const statusMap: Record<string, { label: string; cls: string }> = {
    draft: { label: 'Rascunho', cls: 'bg-muted text-muted-foreground' },
    sent: { label: 'Enviado', cls: 'bg-emerald-500/10 text-emerald-400' },
    received: { label: 'Recebido', cls: 'bg-success/10 text-success' },
    cancelled: { label: 'Cancelado', cls: 'bg-destructive/10 text-destructive' },
  };

  return (
    <>
      <Sheet open={open} onOpenChange={handleOpenChange}>
        <SheetContent side="bottom" className="rounded-t-3xl px-4 pb-8 max-h-[85vh] overflow-y-auto">
          <SheetHeader className="pb-4">
            <SheetTitle>{isNew ? 'Novo Fornecedor' : (editing ? 'Editar Fornecedor' : supplier?.name)}</SheetTitle>
          </SheetHeader>

          {editing ? (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Nome *</Label>
                <Input value={name} onChange={e => setName(e.target.value)} placeholder="Ex: Distribuidora ABC" className="h-12" />
              </div>
              <div className="space-y-2">
                <Label className="flex items-center gap-2"><AppIcon name="Phone" size={16} /> Telefone/WhatsApp</Label>
                <Input value={phone} onChange={e => setPhone(e.target.value)} placeholder="Ex: 11999999999" className="h-12" />
                <p className="text-xs text-muted-foreground">DDD + número (para enviar pedidos via WhatsApp)</p>
              </div>
              <div className="space-y-2">
                <Label className="flex items-center gap-2"><AppIcon name="Mail" size={16} /> E-mail</Label>
                <Input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="contato@fornecedor.com" className="h-12" />
              </div>
              <div className="space-y-2">
                <Label className="flex items-center gap-2"><AppIcon name="Truck" size={16} /> Frequência de Pedido</Label>
                <Select value={deliveryFrequency} onValueChange={setDeliveryFrequency}>
                  <SelectTrigger className="h-12"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="daily">Diário</SelectItem>
                    <SelectItem value="weekly">Semanal</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex gap-2">
                {!isNew && (
                  <Button variant="ghost" onClick={() => { syncForm(); setEditing(false); }} className="h-12 rounded-xl">
                    Cancelar
                  </Button>
                )}
                <Button onClick={handleSave} disabled={!name.trim() || saving} className="flex-1 h-12 rounded-xl shadow-lg shadow-primary/20">
                  {saving ? 'Salvando...' : isNew ? 'Criar Fornecedor' : 'Salvar'}
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-5">
              {/* Header info */}
              <div className="flex items-center gap-4">
                <GradientIcon name="Truck" color="primary" size="lg" />
                <div className="flex-1 min-w-0">
                  <h3 className="text-lg font-bold text-foreground truncate">{supplier?.name}</h3>
                  <div className="flex items-center gap-3 mt-1 flex-wrap">
                    {(supplier as any)?.delivery_frequency === 'daily' && (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary/15 text-primary font-semibold">Diário</span>
                    )}
                    {supplier?.phone && (
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <AppIcon name="Phone" size={12} />
                        {formatPhoneDisplay(normalizePhone(supplier.phone))}
                      </span>
                    )}
                    {supplier?.email && (
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <AppIcon name="Mail" size={12} />
                        {supplier.email}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Quick actions */}
              <div className="flex gap-2">
                {hasWhatsApp && (
                  <Button size="sm" onClick={handleWhatsApp} className="gap-1.5 rounded-xl bg-[hsl(142,70%,35%)] hover:bg-[hsl(142,70%,30%)]">
                    <AppIcon name="MessageCircle" size={16} />
                    WhatsApp
                  </Button>
                )}
                <Button size="sm" variant="outline" onClick={() => setEditing(true)} className="gap-1.5 rounded-xl">
                  <AppIcon name="Edit2" size={16} />
                  Editar
                </Button>
                {onDelete && supplier && (
                  <Button size="sm" variant="ghost" onClick={() => onDelete(supplier.id).then(() => onOpenChange(false))} className="gap-1.5 rounded-xl text-destructive hover:text-destructive ml-auto">
                    <AppIcon name="Trash2" size={16} />
                  </Button>
                )}
              </div>

              {/* Stats grid */}
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: 'Pedidos', value: stats.totalOrders, icon: 'ShoppingCart', gradient: 'blue' as const },
                  { label: 'Recebidos', value: stats.totalReceived, icon: 'PackageCheck', gradient: 'emerald' as const },
                  { label: 'Total Faturado', value: `R$ ${stats.totalInvoiced.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, icon: 'DollarSign', gradient: 'amber' as const },
                  { label: 'Contas Pendentes', value: stats.pendingInvoices, icon: 'AlertCircle', gradient: (stats.pendingInvoices > 0 ? 'red' : 'muted') as GradientIconColor },
                ].map(stat => (
                  <div key={stat.label} className="p-3 rounded-2xl bg-card border border-border">
                    <div className="flex items-center gap-2 mb-1">
                      <GradientIcon name={stat.icon} color={stat.gradient} size="sm" iconSize={14} />
                      <span className="text-[11px] text-muted-foreground">{stat.label}</span>
                    </div>
                    <p className="text-lg font-bold text-foreground">{stat.value}</p>
                  </div>
                ))}
              </div>

              {/* Recent orders - interactive */}
              {supplierOrders.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Últimos Pedidos</p>
                  <div className="space-y-2">
                    {supplierOrders.slice(0, 5).map(order => {
                      const st = statusMap[order.status] || statusMap.draft;
                      const isExpanded = expandedOrder === order.id;
                      const orderItems = Array.isArray(order.order_items) ? order.order_items : [];
                      return (
                        <div key={order.id} className="rounded-xl bg-secondary/50 border border-border/50 overflow-hidden transition-all">
                          <button
                            type="button"
                            onClick={() => setExpandedOrder(isExpanded ? null : order.id)}
                            className="w-full flex items-center justify-between p-3 text-left active:bg-secondary/80 transition-colors touch-manipulation"
                          >
                            <div className="min-w-0 flex-1">
                              <p className="text-sm font-medium text-foreground">
                                {new Date(order.created_at).toLocaleDateString('pt-BR')}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {orderItems.length} itens
                              </p>
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                              <span className={cn("px-2 py-0.5 text-[10px] font-semibold rounded-full", st.cls)}>
                                {st.label}
                              </span>
                              <AppIcon
                                name="ChevronDown"
                                size={16}
                                className={cn("text-muted-foreground transition-transform", isExpanded && "rotate-180")}
                              />
                            </div>
                          </button>

                          {isExpanded && (
                            <div className="px-3 pb-3 space-y-2 animate-fade-in">
                              {/* Order items preview */}
                              {orderItems.length > 0 && (
                                <div className="bg-background/50 rounded-lg p-2 space-y-1">
                                  {orderItems.slice(0, 4).map((item: any, idx: number) => (
                                    <div key={idx} className="flex justify-between text-xs">
                                      <span className="text-muted-foreground truncate">{item.item_name || item.name || 'Item'}</span>
                                      <span className="text-foreground font-medium shrink-0 ml-2">{item.quantity}x</span>
                                    </div>
                                  ))}
                                  {orderItems.length > 4 && (
                                    <p className="text-[10px] text-muted-foreground">+{orderItems.length - 4} mais...</p>
                                  )}
                                </div>
                              )}

                              {/* Action buttons */}
                              <div className="flex items-center gap-2 pt-1">
                                {order.status === 'sent' && hasWhatsApp && (
                                  <Button
                                    size="sm"
                                    className="h-8 rounded-xl gap-1.5 text-xs bg-[hsl(142,70%,35%)] hover:bg-[hsl(142,70%,30%)] text-white flex-1"
                                    onClick={() => handleWhatsApp()}
                                  >
                                    <AppIcon name="MessageCircle" size={14} />
                                    Reenviar
                                  </Button>
                                )}
                                {order.status === 'draft' && onUpdateOrderStatus && (
                                  <Button
                                    size="sm"
                                    className="h-8 rounded-xl gap-1.5 text-xs bg-[hsl(142,70%,35%)] hover:bg-[hsl(142,70%,30%)] text-white flex-1"
                                    onClick={async () => {
                                      await onUpdateOrderStatus(order.id, 'sent');
                                      toast.success('Pedido marcado como enviado');
                                    }}
                                  >
                                    <AppIcon name="Send" size={14} />
                                    Enviar
                                  </Button>
                                )}
                                {order.status === 'sent' && onUpdateOrderStatus && (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="h-8 rounded-xl gap-1.5 text-xs border-success/30 text-success hover:bg-success/10 flex-1"
                                    onClick={async () => {
                                      await onUpdateOrderStatus(order.id, 'received');
                                      toast.success('Pedido marcado como recebido');
                                    }}
                                  >
                                    <AppIcon name="PackageCheck" size={14} />
                                    Receber
                                  </Button>
                                )}
                                {onViewOrder && (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="h-8 rounded-xl gap-1.5 text-xs flex-1"
                                    onClick={() => onViewOrder(order)}
                                  >
                                    <AppIcon name="Eye" size={14} />
                                    Ver
                                  </Button>
                                )}
                                {onDeleteOrder && (
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    className="h-8 w-8 rounded-xl p-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10 shrink-0"
                                    onClick={() => setConfirmDelete({
                                      type: 'order',
                                      id: order.id,
                                      label: `Pedido de ${new Date(order.created_at).toLocaleDateString('pt-BR')}`,
                                    })}
                                  >
                                    <AppIcon name="Trash2" size={14} />
                                  </Button>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Recent invoices - interactive */}
              {supplierInvoices.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Contas a Pagar</p>
                  <div className="space-y-2">
                    {supplierInvoices.slice(0, 5).map(inv => {
                      const isExpanded = expandedInvoice === inv.id;
                      const isOverdue = !inv.is_paid && new Date(inv.due_date) < new Date();
                      const isDueSoon = !inv.is_paid && !isOverdue && (() => {
                        const diff = (new Date(inv.due_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24);
                        return diff <= 3;
                      })();

                      return (
                        <div key={inv.id} className={cn(
                          "rounded-2xl overflow-hidden transition-all",
                          isOverdue
                            ? "bg-destructive/5 border border-destructive/15"
                            : isDueSoon
                              ? "bg-warning/5 border border-warning/15"
                              : "bg-card/80 border border-border/30"
                        )}>
                          <button
                            type="button"
                            onClick={() => setExpandedInvoice(isExpanded ? null : inv.id)}
                            className="w-full flex items-center justify-between p-3.5 text-left active:bg-secondary/50 transition-colors touch-manipulation"
                          >
                            <div className="min-w-0 flex-1">
                              <p className="text-sm font-medium text-foreground">{inv.description}</p>
                              <p className={cn(
                                "text-xs",
                                isOverdue ? "text-destructive font-semibold" : "text-muted-foreground"
                              )}>
                                Venc: {new Date(inv.due_date).toLocaleDateString('pt-BR')}
                                {isOverdue && ' · Atrasado'}
                                {isDueSoon && ' · Vence em breve'}
                              </p>
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                              <span className="text-sm font-bold text-foreground">
                                R$ {inv.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                              </span>
                              {inv.is_paid ? (
                                <AppIcon name="CheckCircle" size={14} className="text-success" />
                              ) : (
                                <AppIcon name="Clock" size={14} className={isOverdue ? "text-destructive" : "text-warning"} />
                              )}
                              <AppIcon
                                name="ChevronDown"
                                size={16}
                                className={cn("text-muted-foreground transition-transform", isExpanded && "rotate-180")}
                              />
                            </div>
                          </button>

                          {isExpanded && (
                            <div className="px-3 pb-3 space-y-2 animate-fade-in">
                              {/* Invoice details */}
                              <div className="bg-background/50 rounded-lg p-2 space-y-1 text-xs">
                                {inv.invoice_number && (
                                  <div className="flex justify-between">
                                    <span className="text-muted-foreground">Nº Nota</span>
                                    <span className="text-foreground font-medium">{inv.invoice_number}</span>
                                  </div>
                                )}
                                <div className="flex justify-between">
                                  <span className="text-muted-foreground">Emissão</span>
                                  <span className="text-foreground font-medium">{new Date(inv.issue_date).toLocaleDateString('pt-BR')}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-muted-foreground">Status</span>
                                  <span className={cn("font-semibold", inv.is_paid ? "text-success" : isOverdue ? "text-destructive" : "text-warning")}>
                                    {inv.is_paid ? 'Pago' : isOverdue ? 'Atrasado' : 'Pendente'}
                                  </span>
                                </div>
                                {inv.paid_at && (
                                  <div className="flex justify-between">
                                    <span className="text-muted-foreground">Pago em</span>
                                    <span className="text-foreground font-medium">{new Date(inv.paid_at).toLocaleDateString('pt-BR')}</span>
                                  </div>
                                )}
                                {inv.notes && (
                                  <div className="pt-1 border-t border-border/50">
                                    <p className="text-muted-foreground">{inv.notes}</p>
                                  </div>
                                )}
                              </div>

                              {/* Action buttons */}
                              <div className="flex items-center gap-2 pt-2">
                                {!inv.is_paid && onMarkInvoicePaid && (
                                  <Button
                                    size="sm"
                                    className="h-9 rounded-xl gap-1.5 text-xs bg-success hover:bg-success/90 text-white flex-1"
                                    onClick={async () => {
                                      await onMarkInvoicePaid(inv.id);
                                    }}
                                  >
                                    <AppIcon name="CheckCircle" size={14} />
                                    Pagar
                                  </Button>
                                )}
                                {!inv.is_paid && onCreateFinanceFromInvoice && (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="h-9 rounded-xl gap-1.5 text-xs flex-1"
                                    onClick={() => onCreateFinanceFromInvoice(inv)}
                                  >
                                    <AppIcon name="DollarSign" size={14} />
                                    Lançar
                                  </Button>
                                )}
                                {onDeleteInvoice && (
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    className="h-9 w-9 rounded-xl p-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10 shrink-0"
                                    onClick={() => setConfirmDelete({
                                      type: 'invoice',
                                      id: inv.id,
                                      label: inv.description,
                                    })}
                                  >
                                    <AppIcon name="Trash2" size={14} />
                                  </Button>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {supplierOrders.length === 0 && supplierInvoices.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-6">Nenhum histórico com este fornecedor</p>
              )}
            </div>
          )}
        </SheetContent>
      </Sheet>

      {/* Confirm delete dialog */}
      <AlertDialog open={!!confirmDelete} onOpenChange={v => !v && setConfirmDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir "{confirmDelete?.label}"? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
