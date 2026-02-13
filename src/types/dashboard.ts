export type WidgetSize = 'small' | 'medium' | 'large';

export type WidgetType =
  | 'welcome'
  | 'metric_balance'
  | 'metric_orders'
  | 'metric_critical'
  | 'metric_recipes'
  | 'alerts'
  | 'quick_access'
  | 'leaderboard'
  | 'notifications'
  | 'points';

export interface WidgetConfig {
  id: string;
  type: WidgetType;
  size: WidgetSize;
  order: number;
}

export interface WidgetDefinition {
  type: WidgetType;
  label: string;
  description: string;
  icon: string;
  allowedSizes: WidgetSize[];
  defaultSize: WidgetSize;
  adminOnly: boolean;
}

export const WIDGET_DEFINITIONS: WidgetDefinition[] = [
  { type: 'welcome', label: 'Boas-vindas', description: 'Header com nome e data', icon: 'Hand', allowedSizes: ['medium', 'large'], defaultSize: 'medium', adminOnly: false },
  { type: 'metric_balance', label: 'Saldo do Mês', description: 'Métrica financeira', icon: 'Wallet', allowedSizes: ['small', 'medium'], defaultSize: 'small', adminOnly: true },
  { type: 'metric_orders', label: 'Pedidos Pendentes', description: 'Métrica de pedidos', icon: 'ShoppingCart', allowedSizes: ['small', 'medium'], defaultSize: 'small', adminOnly: true },
  { type: 'metric_critical', label: 'Estoque Crítico', description: 'Métrica de estoque', icon: 'AlertTriangle', allowedSizes: ['small', 'medium'], defaultSize: 'small', adminOnly: true },
  { type: 'metric_recipes', label: 'Fichas Técnicas', description: 'Métrica de receitas', icon: 'ChefHat', allowedSizes: ['small', 'medium'], defaultSize: 'small', adminOnly: true },
  { type: 'alerts', label: 'Alertas Pendentes', description: 'Ações pendentes', icon: 'AlertCircle', allowedSizes: ['medium', 'large'], defaultSize: 'medium', adminOnly: true },
  { type: 'quick_access', label: 'Acesso Rápido', description: 'Atalhos para módulos', icon: 'LayoutGrid', allowedSizes: ['medium', 'large'], defaultSize: 'medium', adminOnly: false },
  { type: 'leaderboard', label: 'Leaderboard', description: 'Ranking de pontos', icon: 'Trophy', allowedSizes: ['medium', 'large'], defaultSize: 'medium', adminOnly: false },
  { type: 'notifications', label: 'Notificações', description: 'Últimas notificações', icon: 'Bell', allowedSizes: ['medium', 'large'], defaultSize: 'medium', adminOnly: false },
  { type: 'points', label: 'Meus Pontos', description: 'Card de pontos', icon: 'Star', allowedSizes: ['medium', 'large'], defaultSize: 'medium', adminOnly: false },
];

export const DEFAULT_ADMIN_WIDGETS: WidgetConfig[] = [
  { id: 'w1', type: 'welcome', size: 'medium', order: 0 },
  { id: 'w2', type: 'notifications', size: 'medium', order: 1 },
  { id: 'w3', type: 'metric_balance', size: 'small', order: 2 },
  { id: 'w4', type: 'metric_orders', size: 'small', order: 3 },
  { id: 'w5', type: 'metric_recipes', size: 'small', order: 4 },
  { id: 'w6', type: 'metric_critical', size: 'small', order: 5 },
  { id: 'w7', type: 'alerts', size: 'medium', order: 6 },
  { id: 'w8', type: 'quick_access', size: 'medium', order: 7 },
  { id: 'w9', type: 'leaderboard', size: 'medium', order: 8 },
];

export const DEFAULT_EMPLOYEE_WIDGETS: WidgetConfig[] = [
  { id: 'w1', type: 'welcome', size: 'medium', order: 0 },
  { id: 'w2', type: 'points', size: 'medium', order: 1 },
  { id: 'w3', type: 'quick_access', size: 'medium', order: 2 },
  { id: 'w4', type: 'leaderboard', size: 'medium', order: 3 },
];
