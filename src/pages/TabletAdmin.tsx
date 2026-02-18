import { useState } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { useTabletAdmin, TabletProductAdmin } from '@/hooks/useTabletAdmin';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import {
  Sheet, SheetContent, SheetHeader, SheetTitle,
} from '@/components/ui/sheet';
import {
  Package, Plus, Trash2, RefreshCw, Monitor, Settings2, LayoutGrid,
  AlertCircle, CheckCircle2, Clock, Send, QrCode, ExternalLink,
} from 'lucide-react';
import { useUnit } from '@/contexts/UnitContext';

export default function TabletAdmin() {
  const {
    products, tables, orders, pdvConfig, loading,
    saveProduct, deleteProduct,
    addTable, removeTable,
    savePDVConfig, retryPDV,
  } = useTabletAdmin();
  const { activeUnit } = useUnit();

  const [productSheet, setProductSheet] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Partial<TabletProductAdmin> | null>(null);
  const [newTableNum, setNewTableNum] = useState('');

  // PDV Config form
  const [hubUrl, setHubUrl] = useState(pdvConfig?.hub_url || '');
  const [authKey, setAuthKey] = useState(pdvConfig?.auth_key || '');
  const [pdvActive, setPdvActive] = useState(pdvConfig?.is_active ?? true);

  // Sync pdvConfig state
  useState(() => {
    if (pdvConfig) {
      setHubUrl(pdvConfig.hub_url);
      setAuthKey(pdvConfig.auth_key);
      setPdvActive(pdvConfig.is_active);
    }
  });

  const openNewProduct = () => {
    setEditingProduct({ name: '', price: 0, category: 'Geral', codigo_pdv: '', is_active: true });
    setProductSheet(true);
  };

  const openEditProduct = (p: TabletProductAdmin) => {
    setEditingProduct(p);
    setProductSheet(true);
  };

  const handleSaveProduct = () => {
    if (!editingProduct?.name) return;
    saveProduct(editingProduct as any);
    setProductSheet(false);
  };

  const statusColor: Record<string, string> = {
    draft: 'bg-secondary text-muted-foreground',
    awaiting_confirmation: 'bg-warning/15 text-warning',
    confirmed: 'bg-primary/15 text-primary',
    sent_to_pdv: 'bg-success/15 text-success',
    error: 'bg-destructive/15 text-destructive',
  };

  const statusLabel: Record<string, string> = {
    draft: 'Rascunho',
    awaiting_confirmation: 'Aguardando',
    confirmed: 'Confirmado',
    sent_to_pdv: 'Enviado PDV',
    error: 'Erro',
  };

  const formatPrice = (v: number) =>
    v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  return (
    <AppLayout>
      {/* Header */}
      <div className="page-header-bar">
        <div className="page-header-content flex items-center justify-between">
          <h1 className="page-title">Pedidos Tablet</h1>
          {activeUnit && (
            <a
              href={`/tablet/${activeUnit.id}`}
              target="_blank"
              rel="noopener"
              className="flex items-center gap-1.5 text-xs text-primary font-medium bg-primary/10 px-3 py-1.5 rounded-lg"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              Ver Cardápio
            </a>
          )}
        </div>
      </div>

      <div className="p-4 space-y-4">
        <Tabs defaultValue="orders">
          <TabsList className="w-full">
            <TabsTrigger value="orders" className="flex-1">Pedidos</TabsTrigger>
            <TabsTrigger value="products" className="flex-1">Produtos</TabsTrigger>
            <TabsTrigger value="tables" className="flex-1">Mesas</TabsTrigger>
            <TabsTrigger value="config" className="flex-1">PDV</TabsTrigger>
          </TabsList>

          {/* ORDERS TAB */}
          <TabsContent value="orders" className="space-y-3 mt-4">
            {orders.length === 0 ? (
              <div className="empty-state">
                <QrCode className="empty-state-icon" />
                <p className="empty-state-title">Nenhum pedido ainda</p>
                <p className="empty-state-text">Os pedidos feitos no tablet aparecerão aqui em tempo real</p>
              </div>
            ) : (
              orders.map(order => (
                <div key={order.id} className="list-command">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-foreground">Mesa {order.table_number}</span>
                      <Badge className={statusColor[order.status] || 'bg-secondary'}>
                        {statusLabel[order.status] || order.status}
                      </Badge>
                    </div>
                    <span className="font-bold text-primary">{formatPrice(order.total)}</span>
                  </div>
                  {order.tablet_order_items && (
                    <div className="text-xs text-muted-foreground space-y-0.5">
                      {order.tablet_order_items.map((item: any) => (
                        <p key={item.id}>
                          {item.quantity}x {item.tablet_products?.name || '?'}
                          {item.notes ? ` (${item.notes})` : ''}
                        </p>
                      ))}
                    </div>
                  )}
                  {order.error_message && (
                    <div className="mt-2 flex items-start gap-2 text-xs text-destructive">
                      <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                      <span>{order.error_message}</span>
                    </div>
                  )}
                  {order.status === 'error' && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => retryPDV(order.id)}
                      className="mt-2"
                    >
                      <RefreshCw className="w-3.5 h-3.5 mr-1" />
                      Reenviar ao PDV
                    </Button>
                  )}
                  <p className="text-[10px] text-muted-foreground mt-2">
                    {new Date(order.created_at).toLocaleString('pt-BR')}
                  </p>
                </div>
              ))
            )}
          </TabsContent>

          {/* PRODUCTS TAB */}
          <TabsContent value="products" className="space-y-3 mt-4">
            <Button onClick={openNewProduct} className="w-full h-12 rounded-xl">
              <Plus className="w-4 h-4 mr-2" />
              Novo Produto
            </Button>
            {products.map(p => (
              <div key={p.id} className="list-command" onClick={() => openEditProduct(p)}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-sm text-foreground">{p.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {p.category} • {p.codigo_pdv || 'Sem código PDV'}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-primary text-sm">{formatPrice(p.price)}</p>
                    {!p.is_active && <Badge variant="secondary" className="text-[10px]">Inativo</Badge>}
                  </div>
                </div>
              </div>
            ))}
          </TabsContent>

          {/* TABLES TAB */}
          <TabsContent value="tables" className="space-y-3 mt-4">
            <div className="flex gap-2">
              <Input
                type="number"
                placeholder="Nº da mesa"
                value={newTableNum}
                onChange={e => setNewTableNum(e.target.value)}
                className="flex-1"
              />
              <Button onClick={() => { addTable(parseInt(newTableNum)); setNewTableNum(''); }} disabled={!newTableNum}>
                <Plus className="w-4 h-4 mr-1" />
                Adicionar
              </Button>
            </div>
            <div className="grid grid-cols-4 gap-2">
              {tables.map(t => (
                <div key={t.id} className="relative bg-secondary/50 rounded-xl p-4 text-center">
                  <span className="text-2xl font-bold text-foreground">{t.number}</span>
                  <button
                    onClick={() => removeTable(t.id)}
                    className="absolute top-1 right-1 p-1 rounded hover:bg-destructive/10"
                  >
                    <Trash2 className="w-3 h-3 text-destructive" />
                  </button>
                </div>
              ))}
            </div>
          </TabsContent>

          {/* CONFIG TAB */}
          <TabsContent value="config" className="space-y-4 mt-4">
            <div className="card-base p-4 space-y-4">
              <h3 className="font-bold text-foreground flex items-center gap-2">
                <Settings2 className="w-4 h-4" />
                Configuração Colibri PDV
              </h3>
              <div className="space-y-3">
                <div>
                  <Label>URL do Hub Colibri</Label>
                  <Input
                    placeholder="https://hub.colibri.com.br/api/orders"
                    value={hubUrl}
                    onChange={e => setHubUrl(e.target.value)}
                  />
                </div>
                <div>
                  <Label>Chave de Autenticação</Label>
                  <Input
                    type="password"
                    placeholder="Bearer token..."
                    value={authKey}
                    onChange={e => setAuthKey(e.target.value)}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label>Integração ativa</Label>
                  <Switch checked={pdvActive} onCheckedChange={setPdvActive} />
                </div>
                <Button
                  onClick={() => savePDVConfig({ hub_url: hubUrl, auth_key: authKey, is_active: pdvActive })}
                  className="w-full"
                  disabled={!hubUrl || !authKey}
                >
                  Salvar Configuração
                </Button>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Product Sheet */}
      <Sheet open={productSheet} onOpenChange={setProductSheet}>
        <SheetContent side="bottom" className="h-[80vh] rounded-t-2xl">
          <SheetHeader>
            <SheetTitle>{editingProduct?.id ? 'Editar Produto' : 'Novo Produto'}</SheetTitle>
          </SheetHeader>
          {editingProduct && (
            <div className="mt-4 space-y-4">
              <div>
                <Label>Nome *</Label>
                <Input
                  value={editingProduct.name || ''}
                  onChange={e => setEditingProduct({ ...editingProduct, name: e.target.value })}
                />
              </div>
              <div>
                <Label>Código PDV (Colibri)</Label>
                <Input
                  value={editingProduct.codigo_pdv || ''}
                  onChange={e => setEditingProduct({ ...editingProduct, codigo_pdv: e.target.value })}
                  placeholder="Ex: 001"
                />
              </div>
              <div>
                <Label>Preço *</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={editingProduct.price || ''}
                  onChange={e => setEditingProduct({ ...editingProduct, price: parseFloat(e.target.value) || 0 })}
                />
              </div>
              <div>
                <Label>Categoria</Label>
                <Input
                  value={editingProduct.category || ''}
                  onChange={e => setEditingProduct({ ...editingProduct, category: e.target.value })}
                />
              </div>
              <div>
                <Label>Descrição</Label>
                <Input
                  value={editingProduct.description || ''}
                  onChange={e => setEditingProduct({ ...editingProduct, description: e.target.value })}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label>Ativo</Label>
                <Switch
                  checked={editingProduct.is_active ?? true}
                  onCheckedChange={v => setEditingProduct({ ...editingProduct, is_active: v })}
                />
              </div>
              <div className="flex gap-2">
                <Button onClick={handleSaveProduct} className="flex-1" disabled={!editingProduct.name}>
                  Salvar
                </Button>
                {editingProduct.id && (
                  <Button
                    variant="destructive"
                    onClick={() => { deleteProduct(editingProduct.id!); setProductSheet(false); }}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                )}
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </AppLayout>
  );
}
