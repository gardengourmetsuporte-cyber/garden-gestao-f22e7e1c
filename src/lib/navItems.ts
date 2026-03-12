// Single source of truth for navigation items across all surfaces
// (MoreDrawer, AppLayout sidebar, BottomTabBar)

export interface NavItem {
  icon: string;
  /** Optional custom image icon (public path) */
  customIcon?: string;
  /** If true, customIcon keeps its original colors (no invert/brightness filters) */
  keepIconColor?: boolean;
  label: string;
  href: string;
  /** If true, only shown to admin/super_admin (when no access-level is assigned) */
  adminOnly?: boolean;
  group: string;
  groupLabel: string;
  /** Show a badge next to the label */
  badge?: string;
}

/**
 * Canonical navigation items.
 *
 * Visibility rules (applied by consumers):
 * 1. super_admin → see everything
 * 2. User has access_level assigned → show only modules in that level (+ dashboard + settings)
 * 3. Fallback (no access_level) → use `adminOnly` flag
 *
 * Plan locks are applied visually (gem icon + redirect to /plans) by each surface.
 */
export const NAV_ITEMS: NavItem[] = [
  // ── Início ──
  { icon: 'CalendarDays', label: 'Agenda', href: '/agenda', group: 'principal', groupLabel: 'Início' },
  { icon: 'Sparkles', customIcon: '/icons/copilot-ai.png', label: 'Copilot IA', href: '/copilot', adminOnly: true, group: 'principal', groupLabel: 'Início', badge: 'Beta' },

  // ── Gestão ──
  { icon: 'DollarSign', label: 'Financeiro', href: '/finance', adminOnly: true, group: 'gestao', groupLabel: 'Gestão' },
  { icon: 'UserSearch', label: 'Clientes', href: '/customers', group: 'gestao', groupLabel: 'Gestão' },
  { icon: 'Handshake', customIcon: '/icons/fornecedores.png', label: 'Fornecedores', href: '/orders', group: 'gestao', groupLabel: 'Gestão' },

  // ── Operação ──
  { icon: 'ClipboardCheck', label: 'Checklists', href: '/checklists', group: 'operacao', groupLabel: 'Operação' },
  { icon: 'Receipt', label: 'Fechamento de Caixa', href: '/cash-closing', group: 'operacao', groupLabel: 'Operação' },
  { icon: 'Package', label: 'Estoque', href: '/inventory', group: 'operacao', groupLabel: 'Operação' },
  { icon: 'Truck', customIcon: '/icons/motocicleta.png', label: 'Entregas', href: '/deliveries', group: 'operacao', groupLabel: 'Operação' },
  { icon: 'Monitor', label: 'PDV', href: '/pdv', group: 'operacao', groupLabel: 'Operação' },
  { icon: 'MenuBook', label: 'Cardápio', href: '/cardapio', adminOnly: true, group: 'operacao', groupLabel: 'Operação', badge: 'Beta' },
  { icon: 'MessageCircle', customIcon: '/icons/whatsapp.png', label: 'WhatsApp IA', href: '/whatsapp', adminOnly: true, group: 'operacao', groupLabel: 'Operação', badge: 'Beta' },

  // ── Pessoas ──
  { icon: 'Users', customIcon: '/icons/funcionarios.png', label: 'Funcionários', href: '/employees', adminOnly: true, group: 'pessoas', groupLabel: 'Pessoas' },
  { icon: 'Gift', customIcon: '/icons/gift.png', label: 'Recompensas', href: '/rewards', group: 'pessoas', groupLabel: 'Pessoas' },
  { icon: 'Trophy', customIcon: '/icons/trophy.png', label: 'Ranking', href: '/ranking', group: 'pessoas', groupLabel: 'Pessoas' },

  // ── Gestão ──
  { icon: 'Megaphone', customIcon: '/icons/megaphone.png', label: 'Marketing', href: '/marketing', adminOnly: true, group: 'gestao', groupLabel: 'Gestão', badge: 'Beta' },
  { icon: 'ShieldCheck', label: 'Obrigações Legais', href: '/compliance', adminOnly: true, group: 'gestao', groupLabel: 'Gestão' },
  
];

/**
 * Filter nav items based on user role and access level.
 * Shared logic used by MoreDrawer and AppLayout sidebar.
 */
export function filterNavItems(
  items: NavItem[],
  opts: {
    isSuperAdmin: boolean;
    isAdmin: boolean;
    hasAccessLevel: boolean;
    allowedModules: string[] | null | undefined;
    getModuleKeyFromRoute: (href: string) => string | null;
  }
): NavItem[] {
  const { isSuperAdmin, isAdmin, hasAccessLevel, allowedModules, getModuleKeyFromRoute } = opts;

  return items.filter(item => {
    const moduleKey = getModuleKeyFromRoute(item.href);

    // Super admin sees everything
    if (isSuperAdmin) return true;

    // If user has an access-level assigned, use it
    if (hasAccessLevel && allowedModules) {
      if (moduleKey === 'dashboard') return true;
      if (moduleKey === 'settings') return true;
      if (moduleKey && !allowedModules.includes(moduleKey)) return false;
      if (!moduleKey && item.adminOnly && !isAdmin) return false;
      return true;
    }

    // Fallback: use adminOnly flag
    if (item.adminOnly && !isAdmin) return false;
    return true;
  });
}

/**
 * Group nav items by their group label for rendering.
 */
export function groupNavItems(items: NavItem[]): { label: string; items: NavItem[] }[] {
  const groups: { label: string; items: NavItem[] }[] = [];
  const seen = new Set<string>();

  items.forEach(item => {
    if (!seen.has(item.group)) {
      seen.add(item.group);
      groups.push({
        label: item.groupLabel,
        items: items.filter(i => i.group === item.group),
      });
    }
  });

  return groups;
}
