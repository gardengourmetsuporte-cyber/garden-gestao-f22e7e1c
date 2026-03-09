import { useState, useMemo } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AppIcon } from '@/components/ui/app-icon';
import { Supplier, Order } from '@/types/database';
import { SupplierInvoice } from '@/types/supplier';
import { cn } from '@/lib/utils';
import { formatPhoneDisplay, normalizePhone } from '@/lib/normalizePhone';
import { toast } from 'sonner';

interface SupplierProfileSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  supplier: Supplier | null;
  orders: Order[];
  invoices: SupplierInvoice[];
  onSave: (data: { name: string; phone?: string; email?: string; delivery_frequency?: string }) => Promise<void>;
  onDelete?: (id: string) => Promise<void>;
  isNew?: boolean;
}

export function SupplierProfileSheet({
  open, onOpenChange, supplier, orders, invoices, onSave, onDelete, isNew = false,
}: SupplierProfileSheetProps) {
  const [editing, setEditing] = useState(isNew);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [deliveryFrequency, setDeliveryFrequency] = useState('weekly');
  const [saving, setSaving] = useState(false);

  // Sync form when supplier changes
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

  // Reset on open
  const handleOpenChange = (v: boolean) => {
    if (v) { syncForm(); setEditing(isNew); }
    onOpenChange(v);
  };

  // Stats
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
    const lastOrder = supplierOrders[0];
    return { totalOrders, totalReceived, totalInvoiced, pendingInvoices, lastOrder };
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
    if (normalized) {
      window.open(`https://wa.me/${normalized}`, '_blank');
    }
  };

  const hasWhatsApp = supplier?.phone ? !!normalizePhone(supplier.phone) : false;

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetContent side="bottom" className="rounded-t-3xl px-4 pb-8 max-h-[85vh] overflow-y-auto">
        <SheetHeader className="pb-4">
          <SheetTitle>{isNew ? 'Novo Fornecedor' : (editing ? 'Editar Fornecedor' : supplier?.name)}</SheetTitle>
        </SheetHeader>

        {editing ? (
          /* ===== EDIT MODE ===== */
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
          /* ===== VIEW MODE ===== */
          <div className="space-y-5">
            {/* Header info */}
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center shrink-0">
                <AppIcon name="Truck" size={28} className="text-primary" />
              </div>
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
                { label: 'Pedidos', value: stats.totalOrders, icon: 'ShoppingCart', color: 'text-blue-400', bg: 'bg-blue-500/10' },
                { label: 'Recebidos', value: stats.totalReceived, icon: 'PackageCheck', color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
                { label: 'Total Faturado', value: `R$ ${stats.totalInvoiced.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, icon: 'DollarSign', color: 'text-amber-400', bg: 'bg-amber-500/10' },
                { label: 'Contas Pendentes', value: stats.pendingInvoices, icon: 'AlertCircle', color: stats.pendingInvoices > 0 ? 'text-red-400' : 'text-muted-foreground', bg: stats.pendingInvoices > 0 ? 'bg-red-500/10' : 'bg-muted' },
              ].map(stat => (
                <div key={stat.label} className="p-3 rounded-2xl bg-card border border-border">
                  <div className="flex items-center gap-2 mb-1">
                    <div className={cn("w-7 h-7 rounded-lg flex items-center justify-center", stat.bg)}>
                      <AppIcon name={stat.icon} size={14} className={stat.color} />
                    </div>
                    <span className="text-[11px] text-muted-foreground">{stat.label}</span>
                  </div>
                  <p className="text-lg font-bold text-foreground">{stat.value}</p>
                </div>
              ))}
            </div>

            {/* Recent orders */}
            {supplierOrders.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Últimos Pedidos</p>
                <div className="space-y-2">
                  {supplierOrders.slice(0, 5).map(order => {
                    const statusMap: Record<string, { label: string; cls: string }> = {
                      draft: { label: 'Rascunho', cls: 'bg-muted text-muted-foreground' },
                      sent: { label: 'Enviado', cls: 'bg-emerald-500/10 text-emerald-400' },
                      received: { label: 'Recebido', cls: 'bg-success/10 text-success' },
                      cancelled: { label: 'Cancelado', cls: 'bg-destructive/10 text-destructive' },
                    };
                    const st = statusMap[order.status] || statusMap.draft;
                    return (
                      <div key={order.id} className="flex items-center justify-between p-3 rounded-xl bg-secondary/50 border border-border/50">
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-foreground">
                            {new Date(order.created_at).toLocaleDateString('pt-BR')}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {Array.isArray(order.order_items) ? order.order_items.length : 0} itens
                          </p>
                        </div>
                        <span className={cn("px-2 py-0.5 text-[10px] font-semibold rounded-full", st.cls)}>
                          {st.label}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Recent invoices */}
            {supplierInvoices.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Contas a Pagar</p>
                <div className="space-y-2">
                  {supplierInvoices.slice(0, 5).map(inv => (
                    <div key={inv.id} className="flex items-center justify-between p-3 rounded-xl bg-secondary/50 border border-border/50">
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-foreground">{inv.description}</p>
                        <p className="text-xs text-muted-foreground">
                          Venc: {new Date(inv.due_date).toLocaleDateString('pt-BR')}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-sm font-bold text-foreground">
                          R$ {inv.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </span>
                        {inv.is_paid ? (
                          <AppIcon name="CheckCircle" size={14} className="text-success" />
                        ) : (
                          <AppIcon name="Clock" size={14} className="text-warning" />
                        )}
                      </div>
                    </div>
                  ))}
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
  );
}
