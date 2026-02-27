import { useState, useEffect, useMemo } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { useMenuAdmin, MenuProduct, MenuOptionGroup } from '@/hooks/useMenuAdmin';
import { useTabletAdmin } from '@/hooks/useTabletAdmin';
import { useGamificationAdmin } from '@/hooks/useGamificationAdmin';
import { useUnit } from '@/contexts/UnitContext';
import { useDigitalMenuSettings } from '@/hooks/useDigitalMenuSettings';

// Menu components
import { MenuCategoryTree } from '@/components/menu/MenuCategoryTree';
import { MenuGroupContent } from '@/components/menu/MenuGroupContent';
import { ProductSheet } from '@/components/menu/ProductSheet';
import { OptionGroupList } from '@/components/menu/OptionGroupList';
import { OptionGroupSheet } from '@/components/menu/OptionGroupSheet';
import { LinkOptionsDialog } from '@/components/menu/LinkOptionsDialog';

// Gamification components
import { GamificationSettingsPanel } from '@/components/gamification/GamificationSettings';
import { GamificationMetrics } from '@/components/gamification/GamificationMetrics';
import { PrizeSheet } from '@/components/gamification/PrizeSheet';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Card } from '@/components/ui/card';
import { AppIcon } from '@/components/ui/app-icon';
import { EmptyState } from '@/components/ui/empty-state';
import { toast } from 'sonner';
import { QRCodeSVG } from 'qrcode.react';
import type { GamificationPrize } from '@/hooks/useGamification';

export default function CardapioHub() {
  const { activeUnit } = useUnit();

  // Menu admin hook (products, categories, groups, options)
  const menuAdmin = useMenuAdmin();
  const {
    categories, groups, products, optionGroups, loading: menuLoading,
    saveCategory, deleteCategory,
    saveGroup, deleteGroup,
    saveProduct, deleteProduct,
    saveOptionGroup, deleteOptionGroup,
    getProductsByGroup, getLinkedProductIds, getLinkedOptionGroupIds,
    setProductOptionLinks,
  } = menuAdmin;

  // Tablet admin hook (orders, tables, PDV)
  const tabletAdmin = useTabletAdmin();
  const {
    tables, orders, pdvConfig, loading: tabletLoading,
    addTable, removeTable,
    savePDVConfig, retryPDV,
  } = tabletAdmin;

  // Gamification admin hook
  const gamAdmin = useGamificationAdmin();

  // State
  const [activeTab, setActiveTab] = useState('produtos');
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
  const [menuSubTab, setMenuSubTab] = useState<'menu' | 'options'>('menu');

  // Product sheet
  const [productSheetOpen, setProductSheetOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Partial<MenuProduct> | null>(null);

  // Option group sheet
  const [ogSheetOpen, setOgSheetOpen] = useState(false);
  const [editingOG, setEditingOG] = useState<Partial<MenuOptionGroup> | null>(null);

  // Link dialog
  const [linkDialogOpen, setLinkDialogOpen] = useState(false);
  const [linkingOG, setLinkingOG] = useState<MenuOptionGroup | null>(null);

  // Prize sheet
  const [prizeSheetOpen, setPrizeSheetOpen] = useState(false);
  const [editingPrize, setEditingPrize] = useState<GamificationPrize | null>(null);

  // Table
  const [newTableNum, setNewTableNum] = useState('');

  // PDV form
  const [hubUrl, setHubUrl] = useState('');
  const [authKey, setAuthKey] = useState('');
  const [paymentCode, setPaymentCode] = useState('1');
  const [pdvActive, setPdvActive] = useState(true);
  const [testingConnection, setTestingConnection] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'idle' | 'success' | 'error'>('idle');

  useEffect(() => {
    if (pdvConfig) {
      setHubUrl(pdvConfig.hub_url);
      setAuthKey(pdvConfig.auth_key);
      setPdvActive(pdvConfig.is_active);
      setPaymentCode((pdvConfig as any).payment_code || '1');
    }
  }, [pdvConfig]);

  const selectedGroup = groups.find(g => g.id === selectedGroupId) || null;
  const groupProducts = selectedGroupId ? getProductsByGroup(selectedGroupId) : [];

  // Stats
  const totalProducts = products.length;
  const totalCategories = categories.length;
  const totalOptions = optionGroups.length;
  const activeProducts = products.filter(p => p.is_active).length;

  // Order stats
  const todayStats = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10);
    const todayOrders = orders.filter(o => o.created_at.slice(0, 10) === today);
    return {
      total: todayOrders.length,
      sent: todayOrders.filter(o => o.status === 'sent_to_pdv').length,
      errors: todayOrders.filter(o => o.status === 'error').length,
      pending: todayOrders.filter(o => o.status === 'confirmed' || o.status === 'awaiting_confirmation').length,
    };
  }, [orders]);

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

  const formatPrice = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  // Product sheet handlers
  const openNewProduct = () => {
    setEditingProduct({
      name: '', price: 0, category: 'Geral', group_id: selectedGroupId,
      is_active: true, availability: { tablet: true, delivery: true },
      price_type: 'fixed', is_highlighted: false, is_18_plus: false,
    });
    setProductSheetOpen(true);
  };
  const openEditProduct = (p: MenuProduct) => { setEditingProduct(p); setProductSheetOpen(true); };

  // Option group handlers
  const openNewOG = () => {
    setEditingOG({
      title: '', min_selections: 0, max_selections: 1,
      allow_repeat: false, is_active: true,
      availability: { tablet: true, delivery: true }, options: [],
    });
    setOgSheetOpen(true);
  };
  const openEditOG = (og: MenuOptionGroup) => { setEditingOG(og); setOgSheetOpen(true); };
  const openLinkProducts = (og: MenuOptionGroup) => { setLinkingOG(og); setLinkDialogOpen(true); };

  // Gamification handlers
  const handleToggleEnabled = (enabled: boolean) => {
    gamAdmin.upsertSettings.mutate({ is_enabled: enabled }, {
      onSuccess: () => toast.success(enabled ? 'Jogo ativado!' : 'Jogo desativado'),
    });
  };
  const handleSettingsUpdate = (data: any) => { gamAdmin.upsertSettings.mutate(data); };
  const handleSavePrize = (data: Partial<GamificationPrize>) => {
    gamAdmin.savePrize.mutate(data, {
      onSuccess: () => { toast.success(data.id ? 'Prêmio atualizado!' : 'Prêmio criado!'); setPrizeSheetOpen(false); setEditingPrize(null); },
    });
  };
  const handleDeletePrize = (id: string) => {
    if (!confirm('Remover este prêmio?')) return;
    gamAdmin.deletePrize.mutate(id, { onSuccess: () => toast.success('Prêmio removido') });
  };

  // PDV test connection
  const testConnection = async () => {
    if (!hubUrl) return;
    setTestingConnection(true);
    setConnectionStatus('idle');
    try {
      const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/colibri-health`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'apikey': import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY },
        body: JSON.stringify({ hub_url: hubUrl, auth_key: authKey }),
      });
      const data = await res.json();
      if (data.success) { setConnectionStatus('success'); toast.success('Conexão OK'); }
      else { setConnectionStatus('error'); toast.error(data.error || 'Falha na conexão'); }
    } catch { setConnectionStatus('error'); toast.error('Não foi possível testar'); }
    finally { setTestingConnection(false); }
  };

  return (
    <AppLayout>
      <div className="px-4 py-3 lg:px-6 space-y-4">
        {/* Quick Stats */}
        <div className="grid grid-cols-4 gap-2">
          {[
            { label: 'Categorias', value: totalCategories, color: 'hsl(var(--neon-purple))' },
            { label: 'Produtos', value: totalProducts, color: 'hsl(var(--primary))' },
            { label: 'Ativos', value: activeProducts, color: 'hsl(var(--neon-green))' },
            { label: 'Opcionais', value: totalOptions, color: 'hsl(var(--neon-amber))' },
          ].map(s => (
            <div key={s.label} className="card-base p-3 text-center">
              <p className="text-lg font-bold" style={{ color: s.color }}>{s.value}</p>
              <p className="text-[10px] text-muted-foreground font-medium">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Link to digital menu */}
        {activeUnit && (
          <div className="flex items-center justify-between card-base px-4 py-2.5">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <AppIcon name="ExternalLink" size={14} className="text-primary" />
              <span>Cardápio público</span>
            </div>
            <a
              href={`/m/${activeUnit.id}`}
              target="_blank"
              rel="noopener"
              className="text-xs text-primary font-semibold"
            >
              Abrir →
            </a>
          </div>
        )}

        {/* Main Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="w-full overflow-x-auto">
            <TabsTrigger value="produtos" className="flex-1 text-xs">Produtos</TabsTrigger>
            <TabsTrigger value="pedidos" className="flex-1 text-xs">Pedidos</TabsTrigger>
            <TabsTrigger value="mesas" className="flex-1 text-xs">Mesas</TabsTrigger>
            <TabsTrigger value="pdv" className="flex-1 text-xs">PDV</TabsTrigger>
            <TabsTrigger value="roleta" className="flex-1 text-xs">Roleta</TabsTrigger>
          </TabsList>

          {/* ==================== PRODUTOS ==================== */}
          <TabsContent value="produtos" className="space-y-4 mt-4">
            {/* Menu / Options sub-tabs */}
            <div className="tab-command">
              <button
                className={`tab-command-item ${menuSubTab === 'menu' ? 'tab-command-item-active' : 'tab-command-inactive'}`}
                onClick={() => setMenuSubTab('menu')}
              >
                <AppIcon name="BookOpen" size={16} />
                <span>Cardápio</span>
              </button>
              <button
                className={`tab-command-item ${menuSubTab === 'options' ? 'tab-command-item-active' : 'tab-command-inactive'}`}
                onClick={() => setMenuSubTab('options')}
              >
                <AppIcon name="Settings" size={16} />
                <span>Opcionais</span>
              </button>
            </div>

            {menuSubTab === 'menu' ? (
              <div className="space-y-4">
                <MenuCategoryTree
                  categories={categories}
                  groups={groups}
                  selectedGroupId={selectedGroupId}
                  onSelectGroup={setSelectedGroupId}
                  onSaveCategory={saveCategory}
                  onDeleteCategory={deleteCategory}
                  onSaveGroup={saveGroup}
                  onDeleteGroup={deleteGroup}
                  getProductCount={(gid) => getProductsByGroup(gid).length}
                />
                <MenuGroupContent
                  group={selectedGroup}
                  products={groupProducts}
                  getOptionCount={(pid) => getLinkedOptionGroupIds(pid).length}
                  onNewProduct={openNewProduct}
                  onEditProduct={openEditProduct}
                  onDeleteProduct={deleteProduct}
                  onLinkOptions={() => setMenuSubTab('options')}
                />
              </div>
            ) : (
              <OptionGroupList
                optionGroups={optionGroups}
                onNew={openNewOG}
                onEdit={openEditOG}
                onDelete={deleteOptionGroup}
                onLinkProducts={openLinkProducts}
              />
            )}
          </TabsContent>

          {/* ==================== PEDIDOS ==================== */}
          <TabsContent value="pedidos" className="space-y-3 mt-4">
            {/* Stats banner */}
            {pdvConfig?.is_active && (
              <div className="grid grid-cols-3 gap-2">
                <div className="card-base p-3 text-center">
                  <AppIcon name="Send" size={16} className="mx-auto text-success mb-1" />
                  <p className="text-lg font-bold text-foreground">{todayStats.sent}</p>
                  <p className="text-[10px] text-muted-foreground">Enviados</p>
                </div>
                <div className="card-base p-3 text-center">
                  <AppIcon name="AlertCircle" size={16} className="mx-auto text-destructive mb-1" />
                  <p className="text-lg font-bold text-foreground">{todayStats.errors}</p>
                  <p className="text-[10px] text-muted-foreground">Erros</p>
                </div>
                <div className="card-base p-3 text-center">
                  <AppIcon name="Clock" size={16} className="mx-auto text-warning mb-1" />
                  <p className="text-lg font-bold text-foreground">{todayStats.pending}</p>
                  <p className="text-[10px] text-muted-foreground">Pendentes</p>
                </div>
              </div>
            )}

            {orders.length === 0 ? (
              <EmptyState icon="QrCode" title="Nenhum pedido ainda" subtitle="Os pedidos feitos no cardápio digital aparecerão aqui" />
            ) : (
              orders.map(order => (
                <div key={order.id} className="card-base p-3 space-y-2">
                  <div className="flex items-center justify-between">
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
                        <p key={item.id}>{item.quantity}x {item.tablet_products?.name || '?'}</p>
                      ))}
                    </div>
                  )}
                  {order.error_message && (
                    <p className="text-xs text-destructive flex items-center gap-1">
                      <AppIcon name="AlertCircle" size={12} /> {order.error_message}
                    </p>
                  )}
                  {order.status === 'error' && (
                    <Button size="sm" variant="outline" onClick={() => retryPDV(order.id)}>
                      <AppIcon name="RefreshCw" size={14} className="mr-1" /> Reenviar
                    </Button>
                  )}
                  <p className="text-[10px] text-muted-foreground">
                    {new Date(order.created_at).toLocaleString('pt-BR')}
                  </p>
                </div>
              ))
            )}
          </TabsContent>

          {/* ==================== MESAS & QR ==================== */}
          <TabsContent value="mesas" className="space-y-4 mt-4">
            {/* QR Code Section */}
            {activeUnit && (
              <div className="card-base p-4 space-y-4">
                <h3 className="font-bold text-foreground flex items-center gap-2">
                  <AppIcon name="QrCode" size={16} /> Cardápio Digital (QR Code)
                </h3>
                <p className="text-xs text-muted-foreground">
                  Gere QR Codes para que seus clientes acessem o cardápio digital pelo celular.
                </p>

                {/* Generic QR */}
                <div className="flex items-center gap-4 p-3 rounded-xl bg-secondary/30 border border-border/30">
                  <QRCodeSVG value={`${window.location.origin}/m/${activeUnit.id}`} size={80} bgColor="transparent" fgColor="currentColor" className="text-foreground shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-foreground">QR Genérico</p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">Balcão / Delivery</p>
                    <div className="flex gap-2 mt-2">
                      <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => { navigator.clipboard.writeText(`${window.location.origin}/m/${activeUnit.id}`); toast.success('Link copiado!'); }}>
                        <AppIcon name="Copy" size={12} className="mr-1" /> Copiar
                      </Button>
                      <a href={`/m/${activeUnit.id}`} target="_blank" rel="noopener" className="inline-flex items-center gap-1 text-xs text-primary font-medium">
                        <AppIcon name="ExternalLink" size={12} /> Abrir
                      </a>
                    </div>
                  </div>
                </div>

                {/* Per-table QR */}
                {tables.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-xs font-semibold text-foreground">QR por mesa:</p>
                    <div className="grid grid-cols-2 gap-2">
                      {tables.map(t => (
                        <div key={t.id} className="flex items-center gap-2 p-2 rounded-xl bg-secondary/20 border border-border/20">
                          <QRCodeSVG value={`${window.location.origin}/m/${activeUnit.id}?mesa=${t.number}`} size={48} bgColor="transparent" fgColor="currentColor" className="text-foreground shrink-0" />
                          <div className="min-w-0">
                            <p className="text-xs font-bold text-foreground">Mesa {t.number}</p>
                            <button onClick={() => { navigator.clipboard.writeText(`${window.location.origin}/m/${activeUnit.id}?mesa=${t.number}`); toast.success(`Link mesa ${t.number} copiado!`); }} className="text-[10px] text-primary font-medium mt-0.5">Copiar link</button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Add table */}
            <div className="flex gap-2">
              <Input type="number" placeholder="Nº da mesa" value={newTableNum} onChange={e => setNewTableNum(e.target.value)} className="flex-1" />
              <Button onClick={() => { addTable(parseInt(newTableNum)); setNewTableNum(''); }} disabled={!newTableNum}>
                <AppIcon name="Plus" size={16} className="mr-1" /> Adicionar
              </Button>
            </div>
            <div className="grid grid-cols-4 gap-2">
              {tables.map(t => (
                <div key={t.id} className="relative bg-secondary/50 rounded-xl p-4 text-center">
                  <span className="text-2xl font-bold text-foreground">{t.number}</span>
                  <button onClick={() => removeTable(t.id)} className="absolute top-1 right-1 p-1 rounded hover:bg-destructive/10">
                    <AppIcon name="Trash2" size={12} className="text-destructive" />
                  </button>
                </div>
              ))}
            </div>
          </TabsContent>

          {/* ==================== PDV (Colibri) ==================== */}
          <TabsContent value="pdv" className="space-y-4 mt-4">
            <div className="card-base p-4 space-y-4">
              <h3 className="font-bold text-foreground flex items-center gap-2">
                <AppIcon name="Settings2" size={16} /> Configuração Colibri PDV
                {pdvConfig?.is_active && (
                  <Badge variant="outline" className="text-success border-success/30 text-[10px]">
                    <AppIcon name="Wifi" size={12} className="mr-1" /> Ativo
                  </Badge>
                )}
              </h3>
              <div className="space-y-3">
                <div>
                  <Label>URL do Hub Colibri</Label>
                  <Input placeholder="http://192.168.1.100:8080/api/orders" value={hubUrl} onChange={e => setHubUrl(e.target.value)} />
                </div>
                <div>
                  <Label>Chave de Autenticação</Label>
                  <Input type="password" placeholder="Bearer token..." value={authKey} onChange={e => setAuthKey(e.target.value)} />
                </div>
                <div>
                  <Label>Código de Pagamento (Colibri)</Label>
                  <Input placeholder="1" value={paymentCode} onChange={e => setPaymentCode(e.target.value)} />
                  <p className="text-[10px] text-muted-foreground mt-1">Código da forma de pagamento no Colibri</p>
                </div>
                <div className="flex items-center justify-between">
                  <Label>Integração ativa</Label>
                  <Switch checked={pdvActive} onCheckedChange={setPdvActive} />
                </div>
                <Button variant="outline" onClick={testConnection} disabled={!hubUrl || testingConnection} className="w-full">
                  {testingConnection ? <AppIcon name="Loader2" size={16} className="animate-spin mr-2" /> : <AppIcon name="Zap" size={16} className="mr-2" />}
                  {testingConnection ? 'Testando...' : 'Testar Conexão'}
                </Button>
                <Button onClick={() => savePDVConfig({ hub_url: hubUrl, auth_key: authKey, is_active: pdvActive, ...(paymentCode ? { payment_code: paymentCode } : {}) } as any)} className="w-full" disabled={!hubUrl || !authKey}>
                  Salvar Configuração
                </Button>
              </div>
            </div>
          </TabsContent>

          {/* ==================== ROLETA ==================== */}
          <TabsContent value="roleta" className="space-y-4 mt-4">
            <GamificationSettingsPanel
              settings={gamAdmin.settings}
              onToggle={handleToggleEnabled}
              onUpdate={handleSettingsUpdate}
            />

            {/* Tablet link */}
            {activeUnit && (
              <Card className="p-3">
                <p className="text-xs text-muted-foreground mb-1">Link da roleta</p>
                <div className="flex items-center gap-2">
                  <code className="flex-1 text-xs bg-muted px-2 py-1.5 rounded truncate">
                    {`${window.location.origin}/m/${activeUnit.id}?tab=game`}
                  </code>
                  <Button size="sm" variant="outline" onClick={() => { navigator.clipboard.writeText(`${window.location.origin}/m/${activeUnit.id}?tab=game`); toast.success('Link copiado!'); }}>
                    <AppIcon name="Copy" size={14} />
                  </Button>
                </div>
              </Card>
            )}

            <GamificationMetrics
              playsToday={gamAdmin.metrics.playsToday}
              prizesToday={gamAdmin.metrics.prizesToday}
              costToday={gamAdmin.metrics.costToday}
              maxDailyCost={gamAdmin.settings?.max_daily_cost ?? 100}
            />

            {/* Prizes */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h2 className="font-semibold text-foreground">Prêmios</h2>
                <Button size="sm" onClick={() => { setEditingPrize(null); setPrizeSheetOpen(true); }}>
                  <AppIcon name="Plus" size={16} className="mr-1" /> Novo
                </Button>
              </div>

              {gamAdmin.prizesLoading ? (
                <div className="flex justify-center py-8">
                  <AppIcon name="Loader2" size={24} className="animate-spin text-muted-foreground" />
                </div>
              ) : gamAdmin.prizes.length === 0 ? (
                <Card className="p-6 text-center">
                  <AppIcon name="Gift" size={32} className="mx-auto text-muted-foreground mb-2" />
                  <p className="text-muted-foreground">Nenhum prêmio configurado</p>
                  <Button variant="outline" className="mt-3" onClick={() => { setEditingPrize(null); setPrizeSheetOpen(true); }}>
                    Criar primeiro prêmio
                  </Button>
                </Card>
              ) : (
                <div className="space-y-2">
                  {gamAdmin.prizes.map(prize => (
                    <Card key={prize.id} className="p-3 flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg flex items-center justify-center text-lg shrink-0" style={{ background: `${prize.color}20`, border: `2px solid ${prize.color}` }}>
                        {prize.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-foreground text-sm truncate">{prize.name}</p>
                        <p className="text-xs text-muted-foreground">Peso: {prize.probability} · R$ {prize.estimated_cost.toFixed(2)}</p>
                      </div>
                      <Switch checked={prize.is_active} onCheckedChange={val => gamAdmin.togglePrize.mutate({ id: prize.id, is_active: val })} />
                      <button onClick={() => { setEditingPrize(prize); setPrizeSheetOpen(true); }} className="p-1.5 hover:bg-muted rounded">
                        <AppIcon name="Pencil" size={14} className="text-muted-foreground" />
                      </button>
                      <button onClick={() => handleDeletePrize(prize.id)} className="p-1.5 hover:bg-destructive/10 rounded">
                        <AppIcon name="Trash2" size={14} className="text-destructive" />
                      </button>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Product Sheet */}
      <ProductSheet open={productSheetOpen} onOpenChange={setProductSheetOpen} product={editingProduct} groups={groups} onSave={saveProduct} onDelete={deleteProduct} />

      {/* Option Group Sheet */}
      <OptionGroupSheet open={ogSheetOpen} onOpenChange={setOgSheetOpen} optionGroup={editingOG} onSave={saveOptionGroup} onDelete={deleteOptionGroup} />

      {/* Link Options Dialog */}
      <LinkOptionsDialog open={linkDialogOpen} onOpenChange={setLinkDialogOpen} optionGroup={linkingOG} categories={categories} groups={groups} products={products} linkedProductIds={linkingOG ? getLinkedProductIds(linkingOG.id) : []} onSave={(ogId, pids) => setProductOptionLinks(ogId, pids)} />

      {/* Prize Sheet */}
      <PrizeSheet open={prizeSheetOpen} onOpenChange={setPrizeSheetOpen} prize={editingPrize} onSave={handleSavePrize} saving={gamAdmin.savePrize.isPending} />
    </AppLayout>
  );
}
