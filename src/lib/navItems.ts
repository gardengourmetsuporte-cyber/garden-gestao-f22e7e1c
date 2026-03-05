// Single source of truth for navigation items across all surfaces
// (MoreDrawer, AppLayout sidebar, BottomTabBar)

export interface NavItem {
  icon: string;
  /** Optional custom image icon (public path) */
  customIcon?: string;
  label: string;
  href: string;
  /** If true, only shown to admin/super_admin (when no access-level is assigned) */
  adminOnly?: boolean;
  group: string;
  groupLabel: string;
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
  // ── Principal ──
  { icon: 'CalendarDays', label: 'Agenda', href: '/agenda', group: 'principal', groupLabel: 'Principal' },

  // ── Gestão ──
  { icon: 'DollarSign', label: 'Financeiro', href: '/finance', adminOnly: true, group: 'gestao', groupLabel: 'Gestão' },
  { icon: 'Package', label: 'Estoque', href: '/inventory', group: 'gestao', groupLabel: 'Gestão' },
  { icon: 'UserSearch', label: 'Clientes', href: '/customers', group: 'gestao', groupLabel: 'Gestão' },
  { icon: 'ShoppingCart', label: 'Pedidos', href: '/orders', group: 'gestao', groupLabel: 'Gestão' },

  // ── Operação ──
  { icon: 'ClipboardCheck', label: 'Checklists', href: '/checklists', group: 'operacao', groupLabel: 'Operação' },
  { icon: 'Receipt', label: 'Fechamento', href: '/cash-closing', group: 'operacao', groupLabel: 'Operação' },
  { icon: 'Truck', label: 'Entregas', href: '/deliveries', group: 'operacao', groupLabel: 'Operação' },
  { icon: 'ChefHat', label: 'Fichas Técnicas', href: '/recipes', adminOnly: true, group: 'operacao', groupLabel: 'Operação' },

  // ── Pessoas ──
  { icon: 'Users', label: 'Funcionários', href: '/employees', adminOnly: true, group: 'pessoas', groupLabel: 'Pessoas' },
  { icon: 'Gift', customIcon: '/icons/gift.png', label: 'Recompensas', href: '/rewards', group: 'pessoas', groupLabel: 'Pessoas' },
  { icon: 'Trophy', customIcon: '/icons/trophy.png', label: 'Ranking', href: '/ranking', group: 'pessoas', groupLabel: 'Pessoas' },

  // ── Premium ──
  { icon: 'Megaphone', customIcon: '/icons/megaphone.png', label: 'Marketing', href: '/marketing', adminOnly: true, group: 'premium', groupLabel: 'Premium' },
  { icon: 'Sparkles', label: 'Copilot IA', href: '/copilot', adminOnly: true, group: 'premium', groupLabel: 'Premium' },
  { icon: 'BookOpen', label: 'Cardápio Digital', href: '/cardapio', adminOnly: true, group: 'premium', groupLabel: 'Premium' },
  { icon: 'MessageCircle', label: 'WhatsApp', href: '/whatsapp', adminOnly: true, group: 'premium', groupLabel: 'Premium' },
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
    // Premium modules are admin-only by default
    if (item.group === 'premium') return isAdmin;
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
