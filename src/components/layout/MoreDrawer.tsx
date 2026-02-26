import { useMemo } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Drawer, DrawerContent } from '@/components/ui/drawer';
import { AppIcon } from '@/components/ui/app-icon';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { useUnit } from '@/contexts/UnitContext';
import { useUserModules } from '@/hooks/useAccessLevels';

import { usePoints } from '@/hooks/usePoints';
import { getRank } from '@/lib/ranks';
import { RankedAvatar } from '@/components/profile/RankedAvatar';
import { getThemeColor } from '@/lib/unitThemes';
import { getModuleKeyFromRoute } from '@/lib/modules';
import { MODULE_REQUIRED_PLAN, planSatisfies } from '@/lib/plans';
import type { PlanTier } from '@/lib/plans';
import { ThemeToggle } from '@/components/ui/theme-toggle';

interface NavItem {
  icon: string;
  label: string;
  href: string;
  adminOnly?: boolean;
  group: string;
  groupLabel: string;
}

const navItems: NavItem[] = [
  { icon: 'DollarSign', label: 'Financeiro', href: '/finance', adminOnly: true, group: 'gestao', groupLabel: 'Gestão' },
  { icon: 'Package', label: 'Estoque', href: '/inventory', group: 'gestao', groupLabel: 'Gestão' },
  { icon: 'ShoppingCart', label: 'Pedidos', href: '/orders', group: 'gestao', groupLabel: 'Gestão' },
  { icon: 'ClipboardCheck', label: 'Checklists', href: '/checklists', group: 'operacao', groupLabel: 'Operação' },
  { icon: 'Receipt', label: 'Fechamento', href: '/cash-closing', group: 'operacao', groupLabel: 'Operação' },
  { icon: 'ChefHat', label: 'Fichas Técnicas', href: '/recipes', adminOnly: true, group: 'operacao', groupLabel: 'Operação' },
  { icon: 'Users', label: 'Funcionários', href: '/employees', adminOnly: true, group: 'pessoas', groupLabel: 'Pessoas' },
  { icon: 'Gift', label: 'Recompensas', href: '/rewards', group: 'pessoas', groupLabel: 'Pessoas' },
  { icon: 'Trophy', label: 'Ranking', href: '/ranking', adminOnly: true, group: 'pessoas', groupLabel: 'Pessoas' },
  { icon: 'Megaphone', label: 'Marketing', href: '/marketing', adminOnly: true, group: 'premium', groupLabel: 'Premium' },
  { icon: 'Sparkles', label: 'Copilot IA', href: '/copilot', adminOnly: true, group: 'premium', groupLabel: 'Premium' },
  { icon: 'MessageSquare', label: 'WhatsApp', href: '/whatsapp', adminOnly: true, group: 'premium', groupLabel: 'Premium' },
  { icon: 'BookOpen', label: 'Cardápio', href: '/cardapio', adminOnly: true, group: 'premium', groupLabel: 'Premium' },
  { icon: 'Monitor', label: 'Tablets', href: '/tablet-admin', adminOnly: true, group: 'premium', groupLabel: 'Premium' },
  { icon: 'Dices', label: 'Gamificação', href: '/gamification', adminOnly: true, group: 'premium', groupLabel: 'Premium' },
];

interface MoreDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function MoreDrawer({ open, onOpenChange }: MoreDrawerProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, profile, isAdmin, isSuperAdmin, signOut, plan } = useAuth();
  const { units, activeUnit, setActiveUnitId } = useUnit();
  const { hasAccess, allowedModules, isLoading: accessLoading } = useUserModules();
  
  const { earned: earnedPoints } = usePoints();
  const rank = useMemo(() => getRank(earnedPoints), [earnedPoints]);

  const hasAccessLevel = allowedModules !== null && allowedModules !== undefined;

  const filteredNavItems = useMemo(() => {
    return navItems.filter(item => {
      const moduleKey = getModuleKeyFromRoute(item.href);
      if (isSuperAdmin) return true;
      if (hasAccessLevel) {
        if (moduleKey === 'settings' || moduleKey === 'dashboard') return isAdmin || !item.adminOnly;
        if (moduleKey && !allowedModules!.includes(moduleKey)) return false;
        if (!moduleKey && item.adminOnly && !isAdmin) return false;
        return true;
      }
      if (item.group === 'premium') return isAdmin;
      if (item.adminOnly && !isAdmin) return false;
      return true;
    });
  }, [isSuperAdmin, isAdmin, hasAccessLevel, allowedModules]);

  const groupedNav: { label: string; items: typeof filteredNavItems }[] = [];
  const seenGroups = new Set<string>();
  filteredNavItems.forEach(item => {
    if (!seenGroups.has(item.group)) {
      seenGroups.add(item.group);
      groupedNav.push({
        label: item.groupLabel,
        items: filteredNavItems.filter(i => i.group === item.group),
      });
    }
  });

  const isModuleLocked = (href: string): boolean => {
    const moduleKey = getModuleKeyFromRoute(href);
    if (!moduleKey) return false;
    const required = MODULE_REQUIRED_PLAN[moduleKey];
    if (!required) return false;
    return !planSatisfies(plan, required);
  };

  const handleSignOut = async () => {
    onOpenChange(false);
    await signOut();
    navigate('/auth');
  };

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="max-h-[80vh] overflow-hidden">
        <div className="overflow-y-auto px-4 pb-8 pt-2 space-y-3" style={{ maxHeight: '75vh' }}>
          {/* Profile card */}
          <div className="flex items-center gap-3 w-full py-3">
            <button
              onClick={() => { navigate('/profile/me'); onOpenChange(false); }}
              className="flex items-center gap-3 flex-1 min-w-0 active:scale-[0.98] transition-transform"
            >
              <RankedAvatar avatarUrl={profile?.avatar_url} earnedPoints={earnedPoints} size={48} userName={profile?.full_name || 'Usuário'} userId={user?.id} />
              <div className="text-left min-w-0 flex-1">
                <p className="text-sm font-bold text-foreground truncate font-display">{profile?.full_name || 'Usuário'}</p>
                <p className="text-[11px] font-medium" style={{ color: rank.color }}>{rank.title} · {earnedPoints} pts</p>
              </div>
            </button>
            <ThemeToggle className="p-1.5 shrink-0" />
          </div>

          {/* Unit selector */}
          {units.length > 1 && (
            <div className="mb-4 p-1 rounded-xl bg-secondary/50">
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/50 px-2 py-1 block">Unidade</span>
              <div className="flex flex-col gap-0.5">
                {units.map(unit => (
                  <button
                    key={unit.id}
                    onClick={() => setActiveUnitId(unit.id)}
                    className={cn(
                      "flex items-center gap-2 px-2 py-2 rounded-lg text-sm transition-all",
                      unit.id === activeUnit?.id ? "text-primary bg-primary/10" : "text-muted-foreground hover:bg-secondary"
                    )}
                  >
                    <span className="w-2 h-2 rounded-full shrink-0" style={{ background: getThemeColor(unit.slug), boxShadow: `0 0 6px ${getThemeColor(unit.slug)}60` }} />
                    <span className="truncate font-medium">{unit.name}</span>
                    {unit.id === activeUnit?.id && <AppIcon name="Check" size={14} className="text-primary ml-auto shrink-0" />}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Plans button (admin only) */}
          {isAdmin && (
            <button
              onClick={() => { navigate('/plans'); onOpenChange(false); }}
              className="flex items-center gap-3 w-full px-3 py-2.5 mb-4 rounded-xl bg-secondary/50 hover:bg-secondary transition-all"
            >
              <AppIcon name="Crown" size={20} style={{ color: 'hsl(45 90% 55%)', filter: 'drop-shadow(0 0 6px hsl(45 90% 55% / 0.4))' }} />
              <span className="text-sm font-semibold text-foreground">Planos</span>
              <span className="text-[10px] font-bold uppercase tracking-wider text-primary ml-auto">{plan}</span>
            </button>
          )}

          {/* Agenda — full width card */}
          {(isSuperAdmin || isAdmin || (!hasAccessLevel || (allowedModules && allowedModules.includes('agenda')))) && (
            <button
              onClick={() => { navigate('/agenda'); onOpenChange(false); }}
              className="flex items-center gap-3 w-full px-4 py-3 rounded-xl bg-secondary/50 hover:bg-secondary active:bg-secondary/80 transition-all"
            >
              <div className="w-9 h-9 rounded-full bg-muted flex items-center justify-center shrink-0">
                <AppIcon name="CalendarDays" size={18} className="text-foreground/70" />
              </div>
              <span className="text-sm font-medium text-foreground">Agenda</span>
              <AppIcon name="ChevronRight" size={16} className="text-muted-foreground ml-auto shrink-0" />
            </button>
          )}

          {/* Module grid */}
          {groupedNav.map(group => (
            <div key={group.label} className="mb-5">
              <span className="text-[10px] font-bold uppercase tracking-[0.15em] px-1 mb-2.5 block text-muted-foreground/50 font-display">
                {group.label}
              </span>
              <div className="grid grid-cols-4 gap-4">
                {group.items.map(item => {
                  const active = location.pathname === item.href;
                  const locked = isModuleLocked(item.href);

                  return (
                    <Link
                      key={item.href}
                      to={locked ? '/plans' : item.href}
                      onClick={() => onOpenChange(false)}
                      className="flex flex-col items-center gap-1.5 active:scale-90 transition-all duration-150"
                    >
                      <div className="relative">
                        <div
                          className={cn(
                            "w-12 h-12 rounded-[18px] flex items-center justify-center transition-all",
                            active ? "bg-primary" : "bg-secondary"
                          )}
                          style={{
                            boxShadow: active ? '0 4px 16px hsl(var(--primary) / 0.35)' : undefined,
                            opacity: locked ? 0.5 : 1,
                            border: locked ? '1px dashed hsl(var(--primary) / 0.4)' : active ? 'none' : '1px solid hsl(var(--border) / 0.3)',
                          }}
                        >
                          <AppIcon
                            name={item.icon}
                            size={20}
                            fill={active ? 1 : 0}
                            className={active ? "text-primary-foreground" : "text-foreground/70"}
                          />
                        </div>
                        {locked && (
                          <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full flex items-center justify-center bg-primary/15 border border-primary/40">
                            <AppIcon name="Lock" size={8} className="text-primary" />
                          </span>
                        )}
                      </div>
                      <span
                        className="text-[10px] font-medium leading-tight text-center truncate max-w-full"
                        style={{ color: active ? 'hsl(var(--foreground))' : locked ? 'hsl(var(--muted-foreground))' : 'hsl(var(--foreground) / 0.8)' }}
                      >
                        {item.label}
                      </span>
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}

          {/* Settings + Logout — Meta style */}
          <div className="space-y-1.5 mt-2">
            {isAdmin && (
              <button
                onClick={() => { navigate('/settings'); onOpenChange(false); }}
                className="flex items-center gap-3 w-full px-4 py-3 rounded-xl bg-secondary/50 hover:bg-secondary active:bg-secondary/80 transition-all"
              >
                <div className="w-9 h-9 rounded-full bg-muted flex items-center justify-center shrink-0">
                  <AppIcon name="Settings" size={18} className="text-foreground/70" />
                </div>
                <span className="text-sm font-medium text-foreground">Configurações</span>
                <AppIcon name="ChevronRight" size={16} className="text-muted-foreground ml-auto shrink-0" />
              </button>
            )}
            <button
              onClick={handleSignOut}
              className="flex items-center gap-3 w-full px-4 py-3 rounded-xl bg-secondary/50 hover:bg-secondary active:bg-secondary/80 transition-all"
            >
              <div className="w-9 h-9 rounded-full bg-muted flex items-center justify-center shrink-0">
                <AppIcon name="LogOut" size={18} className="text-muted-foreground" />
              </div>
              <span className="text-sm font-medium text-muted-foreground">Sair da conta</span>
            </button>
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  );
}
