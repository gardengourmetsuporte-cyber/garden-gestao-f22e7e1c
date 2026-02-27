import { useState, useEffect, useMemo } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { useMenuAdmin, MenuProduct, MenuOptionGroup } from '@/hooks/useMenuAdmin';
import { useTabletAdmin } from '@/hooks/useTabletAdmin';
import { useGamificationAdmin } from '@/hooks/useGamificationAdmin';
import { useUnit } from '@/contexts/UnitContext';

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

type Section = 'cardapio' | 'opcionais' | 'pedidos' | 'mesas' | 'pdv' | 'roleta' | 'config';

const NAV_ITEMS: { id: Section; label: string; icon: string; description: string }[] = [
  { id: 'cardapio', label: 'Cardápio', icon: 'BookOpen', description: 'Categorias, grupos e produtos' },
  { id: 'opcionais', label: 'Opcionais', icon: 'Settings2', description: 'Grupos de complementos' },
  { id: 'pedidos', label: 'Pedidos', icon: 'ShoppingBag', description: 'Pedidos em tempo real' },
  { id: 'mesas', label: 'Mesas & QR', icon: 'QrCode', description: 'QR Codes e mesas' },
  { id: 'pdv', label: 'Integração PDV', icon: 'Zap', description: 'Conexão Colibri' },
  { id: 'roleta', label: 'Roleta', icon: 'Dices', description: 'Gamificação e prêmios' },
  { id: 'config', label: 'Configurações', icon: 'Cog', description: 'Horários, entrega, pagamento' },
];

export default function CardapioHub() {
  const { activeUnit } = useUnit();

  // Menu admin hook
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

  // Tablet admin hook
  const tabletAdmin = useTabletAdmin();
  const {
    tables, orders, pdvConfig, loading: tabletLoading,
    addTable, removeTable,
    savePDVConfig, retryPDV,
  } = tabletAdmin;

  // Gamification admin hook
  const gamAdmin = useGamificationAdmin();

  // State
  const [activeSection, setActiveSection] = useState<Section>('cardapio');
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);

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
    try {
      const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/colibri-health`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'apikey': import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY },
        body: JSON.stringify({ hub_url: hubUrl, auth_key: authKey }),
      });
      const data = await res.json();
      if (data.success) { toast.success('Conexão OK'); }
      else { toast.error(data.error || 'Falha na conexão'); }
    } catch { toast.error('Não foi possível testar'); }
    finally { setTestingConnection(false); }
  };

  const activeNav = NAV_ITEMS.find(n => n.id === activeSection)!;

  // Counts for nav badges
  const pendingOrders = todayStats.errors + todayStats.pending;

  return (
    <AppLayout>
      <div className="flex flex-col lg:flex-row min-h-screen bg-background">
        {/* ==================== SIDEBAR NAV (Desktop) / Horizontal Scroll (Mobile) ==================== */}
        
        {/* Mobile: horizontal scroll nav */}
        <div className="lg:hidden border-b border-border/40 bg-card/50 backdrop-blur-sm sticky top-0 z-20">
          <div className="flex overflow-x-auto gap-1 px-3 py-2 scrollbar-hide">
            {NAV_ITEMS.map(item => (
              <button
                key={item.id}
                onClick={() => setActiveSection(item.id)}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium whitespace-nowrap transition-all shrink-0 ${
                  activeSection === item.id
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : 'text-muted-foreground hover:bg-muted'
                }`}
              >
                <AppIcon name={item.icon as any} size={14} />
                {item.label}
                {item.id === 'pedidos' && pendingOrders > 0 && (
                  <span className="w-4 h-4 rounded-full bg-destructive text-[9px] text-white flex items-center justify-center font-bold">{pendingOrders}</span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Desktop: vertical sidebar */}
        <aside className="hidden lg:flex flex-col w-56 shrink-0 border-r border-border/40 bg-card/30 p-3 gap-1">
          {/* Store link */}
          {activeUnit && (
            <a
              href={`/m/${activeUnit.id}`}
              target="_blank"
              rel="noopener"
              className="flex items-center gap-2 px-3 py-2 mb-2 rounded-lg bg-primary/5 border border-primary/10 hover:bg-primary/10 transition-colors"
            >
              <AppIcon name="ExternalLink" size={14} className="text-primary" />
              <span className="text-xs font-medium text-primary">Ver cardápio público</span>
            </a>
          )}
          
          {NAV_ITEMS.map(item => (
            <button
              key={item.id}
              onClick={() => setActiveSection(item.id)}
              className={`flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm transition-all text-left w-full ${
                activeSection === item.id
                  ? 'bg-primary text-primary-foreground font-semibold shadow-sm'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              }`}
            >
              <AppIcon name={item.icon as any} size={16} />
              <span className="flex-1">{item.label}</span>
              {item.id === 'pedidos' && pendingOrders > 0 && (
                <span className="w-5 h-5 rounded-full bg-destructive text-[10px] text-white flex items-center justify-center font-bold">{pendingOrders}</span>
              )}
              {item.id === 'pdv' && pdvConfig?.is_active && (
                <span className="w-2 h-2 rounded-full bg-success" />
              )}
            </button>
          ))}
        </aside>

        {/* ==================== MAIN CONTENT ==================== */}
        <main className="flex-1 min-w-0">
          {/* Section header */}
          <div className="px-4 pt-4 pb-2 lg:px-6 lg:pt-6 border-b border-border/30">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-lg font-bold text-foreground flex items-center gap-2">
                  <AppIcon name={activeNav.icon as any} size={20} className="text-primary" />
                  {activeNav.label}
                </h1>
                <p className="text-xs text-muted-foreground mt-0.5">{activeNav.description}</p>
              </div>

              {/* Mobile: store link */}
              {activeUnit && (
                <a
                  href={`/m/${activeUnit.id}`}
                  target="_blank"
                  rel="noopener"
                  className="lg:hidden flex items-center gap-1 text-xs text-primary font-medium"
                >
                  <AppIcon name="ExternalLink" size={14} /> Ver cardápio
                </a>
              )}
            </div>
          </div>

          <div className="px-4 py-4 lg:px-6 lg:py-5 space-y-4 pb-28">
            {/* ==================== CARDÁPIO ==================== */}
            {activeSection === 'cardapio' && (
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
                  onLinkOptions={() => setActiveSection('opcionais')}
                />
              </div>
            )}

            {/* ==================== OPCIONAIS ==================== */}
            {activeSection === 'opcionais' && (
              <OptionGroupList
                optionGroups={optionGroups}
                onNew={openNewOG}
                onEdit={openEditOG}
                onDelete={deleteOptionGroup}
                onLinkProducts={openLinkProducts}
              />
            )}

            {/* ==================== PEDIDOS ==================== */}
            {activeSection === 'pedidos' && (
              <div className="space-y-3">
                {/* Stats row */}
                {pdvConfig?.is_active && (
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { icon: 'Send', value: todayStats.sent, label: 'Enviados', color: 'text-success' },
                      { icon: 'AlertCircle', value: todayStats.errors, label: 'Erros', color: 'text-destructive' },
                      { icon: 'Clock', value: todayStats.pending, label: 'Pendentes', color: 'text-warning' },
                    ].map(s => (
                      <div key={s.label} className="card-base p-3 text-center">
                        <AppIcon name={s.icon as any} size={16} className={`mx-auto ${s.color} mb-1`} />
                        <p className="text-lg font-bold text-foreground">{s.value}</p>
                        <p className="text-[10px] text-muted-foreground">{s.label}</p>
                      </div>
                    ))}
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
              </div>
            )}

            {/* ==================== MESAS & QR ==================== */}
            {activeSection === 'mesas' && (
              <div className="space-y-4">
                {/* QR Code Section */}
                {activeUnit && (
                  <div className="card-base p-4 space-y-4">
                    <h3 className="font-bold text-foreground flex items-center gap-2 text-sm">
                      <AppIcon name="QrCode" size={16} className="text-primary" /> QR Codes
                    </h3>

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

                {/* Manage tables */}
                <div className="card-base p-4 space-y-3">
                  <h3 className="font-bold text-foreground text-sm flex items-center gap-2">
                    <AppIcon name="LayoutGrid" size={16} className="text-primary" /> Gerenciar mesas
                  </h3>
                  <div className="flex gap-2">
                    <Input type="number" placeholder="Nº da mesa" value={newTableNum} onChange={e => setNewTableNum(e.target.value)} className="flex-1" />
                    <Button onClick={() => { addTable(parseInt(newTableNum)); setNewTableNum(''); }} disabled={!newTableNum}>
                      <AppIcon name="Plus" size={16} className="mr-1" /> Adicionar
                    </Button>
                  </div>
                  {tables.length > 0 ? (
                    <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
                      {tables.map(t => (
                        <div key={t.id} className="relative bg-secondary/50 rounded-xl p-3 text-center group">
                          <span className="text-xl font-bold text-foreground">{t.number}</span>
                          <button onClick={() => removeTable(t.id)} className="absolute top-1 right-1 p-1 rounded opacity-0 group-hover:opacity-100 hover:bg-destructive/10 transition-opacity">
                            <AppIcon name="X" size={12} className="text-destructive" />
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-muted-foreground text-center py-4">Nenhuma mesa cadastrada</p>
                  )}
                </div>
              </div>
            )}

            {/* ==================== PDV ==================== */}
            {activeSection === 'pdv' && (
              <div className="card-base p-4 space-y-4">
                <h3 className="font-bold text-foreground flex items-center gap-2 text-sm">
                  <AppIcon name="Zap" size={16} className="text-primary" /> Integração Colibri PDV
                  {pdvConfig?.is_active && (
                    <Badge variant="outline" className="text-success border-success/30 text-[10px]">
                      <span className="w-1.5 h-1.5 rounded-full bg-success mr-1 inline-block" /> Conectado
                    </Badge>
                  )}
                </h3>
                <div className="space-y-3">
                  <div>
                    <Label className="text-xs">URL do Hub Colibri</Label>
                    <Input placeholder="http://192.168.1.100:8080/api/orders" value={hubUrl} onChange={e => setHubUrl(e.target.value)} />
                  </div>
                  <div>
                    <Label className="text-xs">Chave de Autenticação</Label>
                    <Input type="password" placeholder="Bearer token..." value={authKey} onChange={e => setAuthKey(e.target.value)} />
                  </div>
                  <div>
                    <Label className="text-xs">Código de Pagamento</Label>
                    <Input placeholder="1" value={paymentCode} onChange={e => setPaymentCode(e.target.value)} />
                    <p className="text-[10px] text-muted-foreground mt-1">Código da forma de pagamento no Colibri</p>
                  </div>
                  <div className="flex items-center justify-between py-1">
                    <Label className="text-xs">Integração ativa</Label>
                    <Switch checked={pdvActive} onCheckedChange={setPdvActive} />
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" onClick={testConnection} disabled={!hubUrl || testingConnection} className="flex-1">
                      {testingConnection ? <AppIcon name="Loader2" size={16} className="animate-spin mr-2" /> : <AppIcon name="Zap" size={16} className="mr-2" />}
                      {testingConnection ? 'Testando...' : 'Testar Conexão'}
                    </Button>
                    <Button onClick={() => savePDVConfig({ hub_url: hubUrl, auth_key: authKey, is_active: pdvActive, ...(paymentCode ? { payment_code: paymentCode } : {}) } as any)} className="flex-1" disabled={!hubUrl || !authKey}>
                      Salvar
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {/* ==================== ROLETA ==================== */}
            {activeSection === 'roleta' && (
              <div className="space-y-4">
                <GamificationSettingsPanel
                  settings={gamAdmin.settings}
                  onToggle={handleToggleEnabled}
                  onUpdate={handleSettingsUpdate}
                />

                {/* Link do cardápio digital */}
                {activeUnit && (
                  <Card className="p-3">
                    <p className="text-xs text-muted-foreground mb-1">Link do cardápio digital (com roleta)</p>
                    <div className="flex items-center gap-2">
                      <code className="flex-1 text-xs bg-muted px-2 py-1.5 rounded truncate">
                        {`${window.location.origin}/m/${activeUnit.id}`}
                      </code>
                      <Button size="sm" variant="outline" onClick={() => { navigator.clipboard.writeText(`${window.location.origin}/m/${activeUnit.id}`); toast.success('Link copiado!'); }}>
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
                    <h2 className="font-semibold text-foreground text-sm">Prêmios</h2>
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
                      <p className="text-muted-foreground text-sm">Nenhum prêmio configurado</p>
                      <Button variant="outline" className="mt-3" onClick={() => { setEditingPrize(null); setPrizeSheetOpen(true); }}>
                        Criar primeiro prêmio
                      </Button>
                    </Card>
                  ) : (
                    <div className="space-y-2">
                      {(() => {
                        const totalWeight = gamAdmin.prizes.reduce((sum, p) => sum + p.probability, 0);
                        return gamAdmin.prizes.map(prize => {
                          const pct = totalWeight > 0 ? ((prize.probability / totalWeight) * 100) : 0;
                          return (
                            <Card key={prize.id} className="p-3 space-y-2">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-lg flex items-center justify-center text-lg shrink-0" style={{ background: `${prize.color}20`, border: `2px solid ${prize.color}` }}>
                                  {prize.icon}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="font-medium text-foreground text-sm truncate">{prize.name}</p>
                                  <p className="text-xs text-muted-foreground">
                                    <span className="font-semibold text-primary">{pct.toFixed(1)}%</span> · R$ {prize.estimated_cost.toFixed(2)}
                                  </p>
                                </div>
                                <Switch checked={prize.is_active} onCheckedChange={val => gamAdmin.togglePrize.mutate({ id: prize.id, is_active: val })} />
                                <button onClick={() => { setEditingPrize(prize); setPrizeSheetOpen(true); }} className="p-1.5 hover:bg-muted rounded">
                                  <AppIcon name="Pencil" size={14} className="text-muted-foreground" />
                                </button>
                                <button onClick={() => handleDeletePrize(prize.id)} className="p-1.5 hover:bg-destructive/10 rounded">
                                  <AppIcon name="Trash2" size={14} className="text-destructive" />
                                </button>
                              </div>
                              <div className="h-1.5 rounded-full bg-secondary overflow-hidden">
                                <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: prize.color }} />
                              </div>
                            </Card>
                          );
                        });
                      })()}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ==================== CONFIGURAÇÕES ==================== */}
            {activeSection === 'config' && (
              <div className="space-y-4">
                {/* Delivery & Retirada */}
                <div className="card-base p-4 space-y-3">
                  <h3 className="font-bold text-foreground text-sm flex items-center gap-2">
                    <AppIcon name="Truck" size={16} className="text-primary" /> Delivery & Retirada
                  </h3>
                  <p className="text-xs text-muted-foreground">Configure entrega, taxas e raio de atendimento.</p>
                  <div className="flex items-center justify-between py-1">
                    <div>
                      <p className="text-sm font-medium text-foreground">Aceitar delivery</p>
                      <p className="text-[10px] text-muted-foreground">Clientes podem pedir para entrega</p>
                    </div>
                    <Switch />
                  </div>
                  <div className="flex items-center justify-between py-1">
                    <div>
                      <p className="text-sm font-medium text-foreground">Aceitar retirada</p>
                      <p className="text-[10px] text-muted-foreground">Clientes retiram no balcão</p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                </div>

                {/* Horários de funcionamento */}
                <div className="card-base p-4 space-y-3">
                  <h3 className="font-bold text-foreground text-sm flex items-center gap-2">
                    <AppIcon name="Clock" size={16} className="text-primary" /> Horários de Funcionamento
                  </h3>
                  <p className="text-xs text-muted-foreground">Define quando o cardápio digital aceita pedidos.</p>
                  <div className="space-y-2">
                    {['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado', 'Domingo'].map(day => (
                      <div key={day} className="flex items-center justify-between py-1.5 border-b border-border/20 last:border-0">
                        <span className="text-sm text-foreground font-medium w-20">{day}</span>
                        <div className="flex items-center gap-1">
                          <Input className="w-16 h-7 text-xs text-center" placeholder="08:00" defaultValue="08:00" />
                          <span className="text-muted-foreground text-xs">—</span>
                          <Input className="w-16 h-7 text-xs text-center" placeholder="22:00" defaultValue="22:00" />
                        </div>
                        <Switch defaultChecked />
                      </div>
                    ))}
                  </div>
                  <Button className="w-full" size="sm">
                    <AppIcon name="Save" size={14} className="mr-1" /> Salvar horários
                  </Button>
                </div>

                {/* Formas de pagamento online */}
                <div className="card-base p-4 space-y-3">
                  <h3 className="font-bold text-foreground text-sm flex items-center gap-2">
                    <AppIcon name="CreditCard" size={16} className="text-primary" /> Pagamento no Cardápio
                  </h3>
                  <p className="text-xs text-muted-foreground">Formas aceitas para pedidos via cardápio digital.</p>
                  {['Dinheiro', 'Pix', 'Crédito', 'Débito', 'Vale Refeição'].map(m => (
                    <div key={m} className="flex items-center justify-between py-1">
                      <span className="text-sm text-foreground">{m}</span>
                      <Switch defaultChecked />
                    </div>
                  ))}
                </div>

                {/* Branding */}
                <div className="card-base p-4 space-y-3">
                  <h3 className="font-bold text-foreground text-sm flex items-center gap-2">
                    <AppIcon name="Palette" size={16} className="text-primary" /> Personalização
                  </h3>
                  <p className="text-xs text-muted-foreground">Aparência do cardápio digital público.</p>
                  <div>
                    <Label className="text-xs">Nome exibido</Label>
                    <Input placeholder="Nome do restaurante" defaultValue={activeUnit?.name || ''} />
                  </div>
                  <div>
                    <Label className="text-xs">Descrição curta</Label>
                    <Input placeholder="Ex: Hambúrguers artesanais desde 2015" />
                  </div>
                  <div>
                    <Label className="text-xs">Tempo estimado de preparo (min)</Label>
                    <Input type="number" placeholder="30" defaultValue="30" />
                  </div>
                  <Button className="w-full" size="sm">
                    <AppIcon name="Save" size={14} className="mr-1" /> Salvar personalização
                  </Button>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>

      {/* Sheets */}
      <ProductSheet open={productSheetOpen} onOpenChange={setProductSheetOpen} product={editingProduct} groups={groups} onSave={saveProduct} onDelete={deleteProduct} />
      <OptionGroupSheet open={ogSheetOpen} onOpenChange={setOgSheetOpen} optionGroup={editingOG} onSave={saveOptionGroup} onDelete={deleteOptionGroup} />
      <LinkOptionsDialog open={linkDialogOpen} onOpenChange={setLinkDialogOpen} optionGroup={linkingOG} categories={categories} groups={groups} products={products} linkedProductIds={linkingOG ? getLinkedProductIds(linkingOG.id) : []} onSave={(ogId, pids) => setProductOptionLinks(ogId, pids)} />
      <PrizeSheet
        open={prizeSheetOpen}
        onOpenChange={setPrizeSheetOpen}
        prize={editingPrize}
        onSave={handleSavePrize}
        saving={gamAdmin.savePrize.isPending}
        otherPrizesTotalWeight={gamAdmin.prizes.filter(p => p.id !== editingPrize?.id).reduce((sum, p) => sum + p.probability, 0)}
      />
    </AppLayout>
  );
}
