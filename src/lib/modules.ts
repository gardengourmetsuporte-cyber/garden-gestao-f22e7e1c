// Canonical module definitions for access control
export interface SubModuleDef {
  key: string;
  label: string;
  icon: string;
}

export interface ModuleDef {
  key: string;
  label: string;
  icon: string;
  route: string;
  /** Routes that belong to this module (for route protection) */
  routes: string[];
  group: string;
  children?: SubModuleDef[];
}

export const ALL_MODULES: ModuleDef[] = [
  {
    key: 'dashboard', label: 'Dashboard', icon: 'LayoutDashboard', route: '/', routes: ['/'], group: 'Principal',
  },
  {
    key: 'agenda', label: 'Agenda', icon: 'CalendarDays', route: '/agenda', routes: ['/agenda'], group: 'Principal',
    children: [
      { key: 'agenda.view', label: 'Visualizar tarefas', icon: 'Eye' },
      { key: 'agenda.create', label: 'Criar/editar tarefas', icon: 'PenSquare' },
      { key: 'agenda.appointments', label: 'Compromissos', icon: 'Clock' },
    ],
  },
  {
    key: 'copilot', label: 'Copilot IA', icon: 'Sparkles', route: '/copilot', routes: ['/copilot'], group: 'Principal',
  },
  {
    key: 'finance', label: 'Financeiro', icon: 'DollarSign', route: '/finance', routes: ['/finance'], group: 'Gestão',
    children: [
      { key: 'finance.view', label: 'Ver transações', icon: 'Eye' },
      { key: 'finance.create', label: 'Criar/editar transações', icon: 'PenSquare' },
      { key: 'finance.delete', label: 'Excluir transações', icon: 'Trash2' },
      { key: 'finance.accounts', label: 'Contas bancárias', icon: 'Building2' },
      { key: 'finance.categories', label: 'Categorias financeiras', icon: 'FolderTree' },
      { key: 'finance.reports', label: 'Relatórios (DRE/Fluxo)', icon: 'BarChart3' },
      { key: 'finance.planning', label: 'Planejamento/Orçamentos', icon: 'Target' },
      { key: 'finance.credit_cards', label: 'Cartões de crédito', icon: 'CreditCard' },
      { key: 'finance.backup', label: 'Backup financeiro', icon: 'Download' },
    ],
  },
  {
    key: 'inventory', label: 'Estoque', icon: 'Package', route: '/inventory', routes: ['/inventory'], group: 'Gestão',
    children: [
      { key: 'inventory.view', label: 'Ver itens', icon: 'Eye' },
      { key: 'inventory.create', label: 'Criar/editar itens', icon: 'PenSquare' },
      { key: 'inventory.delete', label: 'Excluir itens', icon: 'Trash2' },
      { key: 'inventory.movements', label: 'Entradas e saídas', icon: 'ArrowLeftRight' },
      { key: 'inventory.invoices', label: 'Notas fiscais', icon: 'FileText' },
      { key: 'inventory.smart_receiving', label: 'Recebimento inteligente', icon: 'Camera' },
    ],
  },
  {
    key: 'customers', label: 'Clientes', icon: 'UserRound', route: '/customers', routes: ['/customers'], group: 'Gestão',
    children: [
      { key: 'customers.view', label: 'Ver clientes', icon: 'Eye' },
      { key: 'customers.create', label: 'Criar/editar clientes', icon: 'PenSquare' },
      { key: 'customers.import', label: 'Importar CSV', icon: 'Upload' },
      { key: 'customers.delete', label: 'Excluir clientes', icon: 'Trash2' },
    ],
  },
  {
    key: 'orders', label: 'Pedidos', icon: 'ShoppingCart', route: '/orders', routes: ['/orders'], group: 'Gestão',
    children: [
      { key: 'orders.view', label: 'Ver pedidos', icon: 'Eye' },
      { key: 'orders.create', label: 'Criar/enviar pedidos', icon: 'PenSquare' },
      { key: 'orders.receive', label: 'Receber pedidos', icon: 'PackageCheck' },
      { key: 'orders.quotations', label: 'Cotações', icon: 'FileSearch' },
    ],
  },
  {
    key: 'checklists', label: 'Checklists', icon: 'ClipboardCheck', route: '/checklists', routes: ['/checklists'], group: 'Operação',
    children: [
      { key: 'checklists.complete', label: 'Completar itens', icon: 'CheckSquare' },
      { key: 'checklists.manage', label: 'Gerenciar itens (admin)', icon: 'Settings' },
      { key: 'checklists.contest', label: 'Contestar conclusões', icon: 'AlertTriangle' },
      { key: 'checklists.history', label: 'Ver histórico', icon: 'History' },
    ],
  },
  {
    key: 'cash-closing', label: 'Fechamento', icon: 'Receipt', route: '/cash-closing', routes: ['/cash-closing'], group: 'Operação',
    children: [
      { key: 'cash-closing.create', label: 'Criar fechamento', icon: 'PenSquare' },
      { key: 'cash-closing.validate', label: 'Validar fechamentos', icon: 'ShieldCheck' },
      { key: 'cash-closing.view_history', label: 'Ver histórico', icon: 'History' },
      { key: 'cash-closing.integrate', label: 'Integrar ao financeiro', icon: 'Link' },
    ],
  },
  {
    key: 'recipes', label: 'Fichas Técnicas', icon: 'ChefHat', route: '/recipes', routes: ['/recipes'], group: 'Operação',
    children: [
      { key: 'recipes.view', label: 'Ver fichas', icon: 'Eye' },
      { key: 'recipes.create', label: 'Criar/editar fichas', icon: 'PenSquare' },
      { key: 'recipes.costs', label: 'Custos e precificação', icon: 'Calculator' },
    ],
  },
  {
    key: 'employees', label: 'Funcionários', icon: 'Users', route: '/employees', routes: ['/employees'], group: 'Pessoas',
    children: [
      { key: 'employees.view', label: 'Ver funcionários', icon: 'Eye' },
      { key: 'employees.manage', label: 'Cadastrar/editar', icon: 'PenSquare' },
      { key: 'employees.payments', label: 'Pagamentos/Holerites', icon: 'Banknote' },
      { key: 'employees.schedule', label: 'Escala e folgas', icon: 'CalendarDays' },
      { key: 'employees.time_tracking', label: 'Registro de ponto', icon: 'Clock' },
      { key: 'employees.performance', label: 'Desempenho', icon: 'TrendingUp' },
      { key: 'employees.bonus', label: 'Pontos bônus', icon: 'Star' },
    ],
  },
  {
    key: 'rewards', label: 'Recompensas', icon: 'Gift', route: '/rewards', routes: ['/rewards'], group: 'Pessoas',
    children: [
      { key: 'rewards.shop', label: 'Loja de recompensas', icon: 'ShoppingBag' },
      { key: 'rewards.manage', label: 'Gerenciar produtos', icon: 'Settings' },
      { key: 'rewards.approve', label: 'Aprovar resgates', icon: 'CheckCircle' },
    ],
  },
  {
    key: 'ranking', label: 'Ranking', icon: 'Trophy', route: '/ranking', routes: ['/ranking'], group: 'Pessoas',
  },
  {
    key: 'marketing', label: 'Marketing', icon: 'Megaphone', route: '/marketing', routes: ['/marketing'], group: 'Premium',
    children: [
      { key: 'marketing.calendar', label: 'Calendário de posts', icon: 'Calendar' },
      { key: 'marketing.create', label: 'Criar/editar posts', icon: 'PenSquare' },
      { key: 'marketing.ai', label: 'Sugestões de IA', icon: 'Sparkles' },
    ],
  },
  {
    key: 'menu-admin', label: 'Cardápio', icon: 'BookOpen', route: '/cardapio', routes: ['/cardapio', '/menu-admin'], group: 'Premium',
    children: [
      { key: 'menu-admin.view', label: 'Ver cardápio', icon: 'Eye' },
      { key: 'menu-admin.products', label: 'Gerenciar produtos', icon: 'PenSquare' },
      { key: 'menu-admin.categories', label: 'Categorias do cardápio', icon: 'FolderTree' },
      { key: 'menu-admin.options', label: 'Grupos de opcionais', icon: 'ListPlus' },
    ],
  },
  {
    key: 'whatsapp', label: 'WhatsApp', icon: 'MessageSquare', route: '/whatsapp', routes: ['/whatsapp'], group: 'Premium',
    children: [
      { key: 'whatsapp.conversations', label: 'Conversas', icon: 'MessageCircle' },
      { key: 'whatsapp.settings', label: 'Configurações bot', icon: 'Settings' },
      { key: 'whatsapp.knowledge', label: 'Base de conhecimento', icon: 'BookOpen' },
      { key: 'whatsapp.orders', label: 'Pedidos WhatsApp', icon: 'ShoppingCart' },
    ],
  },
  {
    key: 'tablet-admin', label: 'Tablets', icon: 'Monitor', route: '/tablet-admin', routes: ['/tablet-admin'], group: 'Premium',
  },
  {
    key: 'gamification', label: 'Gamificação', icon: 'Dices', route: '/gamification', routes: ['/gamification'], group: 'Premium',
    children: [
      { key: 'gamification.play', label: 'Jogar', icon: 'Gamepad2' },
      { key: 'gamification.prizes', label: 'Gerenciar prêmios', icon: 'Gift' },
      { key: 'gamification.metrics', label: 'Métricas e relatórios', icon: 'BarChart3' },
    ],
  },
  {
    key: 'settings', label: 'Configurações', icon: 'Settings', route: '/settings', routes: ['/settings'], group: 'Sistema',
    children: [
      { key: 'settings.team', label: 'Equipe e convites', icon: 'Users' },
      { key: 'settings.access_levels', label: 'Níveis de acesso', icon: 'Shield' },
      { key: 'settings.stock_categories', label: 'Categorias de estoque', icon: 'Tags' },
      { key: 'settings.suppliers', label: 'Fornecedores', icon: 'Truck' },
      { key: 'settings.units', label: 'Unidades de medida', icon: 'Ruler' },
      { key: 'settings.payment_methods', label: 'Métodos de pagamento', icon: 'CreditCard' },
      { key: 'settings.recipe_costs', label: 'Custos de produção', icon: 'Calculator' },
      { key: 'settings.rewards', label: 'Recompensas (config)', icon: 'Gift' },
      { key: 'settings.medals', label: 'Medalhas', icon: 'Medal' },
      { key: 'settings.notifications', label: 'Notificações', icon: 'Bell' },
      { key: 'settings.profile', label: 'Perfil da loja', icon: 'Store' },
      { key: 'settings.audit', label: 'Log de auditoria', icon: 'FileText' },
      { key: 'settings.checklist_management', label: 'Gestão de checklists', icon: 'ClipboardList' },
    ],
  },
];

export const MODULE_KEYS = ALL_MODULES.map(m => m.key);

/** Get all sub-module keys for a given parent module key */
export function getSubModuleKeys(parentKey: string): string[] {
  const mod = ALL_MODULES.find(m => m.key === parentKey);
  return mod?.children?.map(c => c.key) || [];
}

/** Check if a key is a sub-module key (contains a dot) */
export function isSubModuleKey(key: string): boolean {
  return key.includes('.');
}

/** Get parent module key from a sub-module key */
export function getParentModuleKey(subKey: string): string {
  return subKey.split('.')[0];
}

/** Get module key from a route path */
export function getModuleKeyFromRoute(path: string): string | null {
  const mod = ALL_MODULES.find(m => m.routes.includes(path));
  return mod?.key ?? null;
}
