// Canonical module definitions for access control
export interface ModuleDef {
  key: string;
  label: string;
  icon: string;
  route: string;
  /** Routes that belong to this module (for route protection) */
  routes: string[];
  group: string;
}

export const ALL_MODULES: ModuleDef[] = [
  { key: 'dashboard', label: 'Dashboard', icon: 'LayoutDashboard', route: '/', routes: ['/'], group: 'Principal' },
  { key: 'agenda', label: 'Agenda', icon: 'CalendarDays', route: '/agenda', routes: ['/agenda'], group: 'Principal' },
  { key: 'finance', label: 'Financeiro', icon: 'DollarSign', route: '/finance', routes: ['/finance'], group: 'Gestão' },
  { key: 'inventory', label: 'Estoque', icon: 'Package', route: '/inventory', routes: ['/inventory'], group: 'Gestão' },
  { key: 'orders', label: 'Pedidos', icon: 'ShoppingCart', route: '/orders', routes: ['/orders'], group: 'Gestão' },
  { key: 'checklists', label: 'Checklists', icon: 'ClipboardCheck', route: '/checklists', routes: ['/checklists'], group: 'Operação' },
  { key: 'cash-closing', label: 'Fechamento', icon: 'Receipt', route: '/cash-closing', routes: ['/cash-closing'], group: 'Operação' },
  { key: 'recipes', label: 'Fichas Técnicas', icon: 'ChefHat', route: '/recipes', routes: ['/recipes'], group: 'Operação' },
  { key: 'employees', label: 'Funcionários', icon: 'Users', route: '/employees', routes: ['/employees'], group: 'Pessoas' },
  { key: 'rewards', label: 'Recompensas', icon: 'Gift', route: '/rewards', routes: ['/rewards'], group: 'Pessoas' },
  { key: 'chat', label: 'Chat', icon: 'MessageCircle', route: '/chat', routes: ['/chat'], group: 'Pessoas' },
  { key: 'tablet-admin', label: 'Tablets', icon: 'Monitor', route: '/tablet-admin', routes: ['/tablet-admin'], group: 'Em Produção' },
  { key: 'marketing', label: 'Marketing', icon: 'Megaphone', route: '/marketing', routes: ['/marketing'], group: 'Em Produção' },
  { key: 'menu-admin', label: 'Cardápio', icon: 'BookOpen', route: '/cardapio', routes: ['/cardapio'], group: 'Em Produção' },
  { key: 'whatsapp', label: 'WhatsApp', icon: 'MessageSquare', route: '/whatsapp', routes: ['/whatsapp'], group: 'Em Produção' },
  { key: 'ranking', label: 'Ranking', icon: 'Trophy', route: '/ranking', routes: ['/ranking'], group: 'Pessoas' },
  { key: 'copilot', label: 'Copilot IA', icon: 'Sparkles', route: '/copilot', routes: ['/copilot'], group: 'Principal' },
  { key: 'personal-finance', label: 'Finanças Pessoais', icon: 'Wallet', route: '/personal-finance', routes: ['/personal-finance'], group: 'Pessoal' },
  { key: 'settings', label: 'Configurações', icon: 'Settings', route: '/settings', routes: ['/settings'], group: 'Sistema' },
];

export const MODULE_KEYS = ALL_MODULES.map(m => m.key);

/** Get module key from a route path */
export function getModuleKeyFromRoute(path: string): string | null {
  const mod = ALL_MODULES.find(m => m.routes.includes(path));
  return mod?.key ?? null;
}
