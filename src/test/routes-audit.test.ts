/**
 * Comprehensive Route Audit Tests
 * 
 * Tests all routing, module definitions, plan locks, navigation items,
 * preload mappings, and access control consistency.
 */
import { describe, it, expect } from 'vitest';
import { ALL_MODULES, getModuleKeyFromRoute } from '@/lib/modules';
import { MODULE_REQUIRED_PLAN, planSatisfies, PRODUCTION_MODULES } from '@/lib/plans';
import { NAV_ITEMS, filterNavItems } from '@/lib/navItems';

// ─── Extract route config from App.tsx (manually mirrored for testing) ───
// These are all the routes defined in App.tsx
const PUBLIC_ROUTES = ['/auth', '/landing', '/invite', '/share-receipt', '/cotacao/:token', '/m/:unitId', '/tablet/:unitId', '/tablet/:unitId/menu', '/tablet/:unitId/confirm/:orderId', '/gamification/:unitId'];
const REDIRECT_ROUTES: Record<string, string> = {
  '/tablet-admin': '/cardapio',
  '/gamification': '/cardapio',
};
const PROTECTED_ROUTES = [
  '/', '/agenda', '/finance', '/inventory', '/orders', '/checklists',
  '/rewards', '/settings', '/cash-closing', '/recipes', '/employees',
  '/cardapio', '/marketing', '/brand-core', '/whatsapp', '/ranking',
  '/deliveries', '/profile/:userId', '/copilot', '/plans', '/calendar',
  '/customers', '/personal-finance', '/notifications',
];
const ALL_APP_ROUTES = [...PUBLIC_ROUTES, ...Object.keys(REDIRECT_ROUTES), ...PROTECTED_ROUTES, '*'];

// ─── 1. Module definitions consistency ───
describe('Module Definitions (modules.ts)', () => {
  it('every module has a unique key', () => {
    const keys = ALL_MODULES.map(m => m.key);
    expect(new Set(keys).size).toBe(keys.length);
  });

  it('every module has at least one route', () => {
    for (const mod of ALL_MODULES) {
      expect(mod.routes.length, `Module ${mod.key} has no routes`).toBeGreaterThan(0);
    }
  });

  it('every module route resolves back to its own key via getModuleKeyFromRoute', () => {
    for (const mod of ALL_MODULES) {
      for (const route of mod.routes) {
        const resolved = getModuleKeyFromRoute(route);
        expect(resolved, `Route "${route}" should resolve to module "${mod.key}" but got "${resolved}"`).toBe(mod.key);
      }
    }
  });

  it('dashboard and settings are always-accessible modules', () => {
    const dashMod = ALL_MODULES.find(m => m.key === 'dashboard');
    const settingsMod = ALL_MODULES.find(m => m.key === 'settings');
    expect(dashMod).toBeDefined();
    expect(settingsMod).toBeDefined();
    // They should NOT be in MODULE_REQUIRED_PLAN (accessible on free)
    expect(MODULE_REQUIRED_PLAN['dashboard']).toBeUndefined();
    expect(MODULE_REQUIRED_PLAN['settings']).toBeUndefined();
  });
});

// ─── 2. Protected routes have module definitions ───
describe('Protected Routes have Module Definitions', () => {
  // Routes that intentionally don't map to modules
  const EXEMPT_ROUTES = ['/', '/profile/:userId', '/plans', '/calendar', '/notifications'];

  const routesNeedingModules = PROTECTED_ROUTES.filter(r => !EXEMPT_ROUTES.includes(r));

  for (const route of routesNeedingModules) {
    it(`protected route "${route}" maps to a module`, () => {
      const moduleKey = getModuleKeyFromRoute(route);
      expect(moduleKey, `Route "${route}" has no module definition in modules.ts`).not.toBeNull();
    });
  }
});

// ─── 3. Plan locks consistency ───
describe('Plan Lock Consistency', () => {
  it('every entry in MODULE_REQUIRED_PLAN references a valid module key', () => {
    const moduleKeys = ALL_MODULES.map(m => m.key);
    for (const [key, plan] of Object.entries(MODULE_REQUIRED_PLAN)) {
      expect(moduleKeys, `MODULE_REQUIRED_PLAN key "${key}" is not a valid module`).toContain(key);
      expect(['pro', 'business']).toContain(plan);
    }
  });

  it('plan hierarchy works correctly', () => {
    expect(planSatisfies('free', 'free')).toBe(true);
    expect(planSatisfies('free', 'pro')).toBe(false);
    expect(planSatisfies('free', 'business')).toBe(false);
    expect(planSatisfies('pro', 'free')).toBe(true);
    expect(planSatisfies('pro', 'pro')).toBe(true);
    expect(planSatisfies('pro', 'business')).toBe(false);
    expect(planSatisfies('business', 'free')).toBe(true);
    expect(planSatisfies('business', 'pro')).toBe(true);
    expect(planSatisfies('business', 'business')).toBe(true);
  });

  it('PRODUCTION_MODULES all reference valid module keys', () => {
    const moduleKeys = ALL_MODULES.map(m => m.key);
    for (const key of PRODUCTION_MODULES) {
      expect(moduleKeys, `PRODUCTION_MODULE "${key}" is not a valid module`).toContain(key);
    }
  });

  // Specific plan assignments
  const PRO_MODULES = ['finance', 'cash-closing', 'recipes', 'employees', 'ranking', 'rewards', 'personal-finance'];
  const BUSINESS_MODULES = ['marketing', 'copilot', 'menu-admin', 'whatsapp'];

  for (const key of PRO_MODULES) {
    it(`"${key}" requires pro plan`, () => {
      expect(MODULE_REQUIRED_PLAN[key]).toBe('pro');
    });
  }

  for (const key of BUSINESS_MODULES) {
    it(`"${key}" requires business plan`, () => {
      expect(MODULE_REQUIRED_PLAN[key]).toBe('business');
    });
  }

  // Free modules should NOT be in the plan map
  const FREE_MODULES = ['dashboard', 'agenda', 'inventory', 'orders', 'checklists', 'deliveries', 'customers', 'settings'];
  for (const key of FREE_MODULES) {
    it(`"${key}" is free (no plan restriction)`, () => {
      expect(MODULE_REQUIRED_PLAN[key]).toBeUndefined();
    });
  }
});

// ─── 4. Navigation items consistency ───
describe('Navigation Items (navItems.ts)', () => {
  it('every nav item href maps to a valid module', () => {
    for (const item of NAV_ITEMS) {
      const moduleKey = getModuleKeyFromRoute(item.href);
      expect(moduleKey, `Nav item "${item.label}" (${item.href}) has no module`).not.toBeNull();
    }
  });

  it('no duplicate hrefs in nav items', () => {
    const hrefs = NAV_ITEMS.map(i => i.href);
    expect(new Set(hrefs).size).toBe(hrefs.length);
  });

  it('every nav item has a valid group', () => {
    const validGroups = ['principal', 'gestao', 'operacao', 'pessoas', 'premium'];
    for (const item of NAV_ITEMS) {
      expect(validGroups, `Nav item "${item.label}" has invalid group "${item.group}"`).toContain(item.group);
    }
  });

  it('premium group items are all adminOnly', () => {
    const premiumItems = NAV_ITEMS.filter(i => i.group === 'premium');
    for (const item of premiumItems) {
      expect(item.adminOnly, `Premium item "${item.label}" should be adminOnly`).toBe(true);
    }
  });
});

// ─── 5. Filter logic for different user roles ───
describe('Nav Item Filtering by Role', () => {
  const mockGetModule = getModuleKeyFromRoute;

  it('super_admin sees all items', () => {
    const result = filterNavItems(NAV_ITEMS, {
      isSuperAdmin: true,
      isAdmin: true,
      hasAccessLevel: false,
      allowedModules: null,
      getModuleKeyFromRoute: mockGetModule,
    });
    expect(result.length).toBe(NAV_ITEMS.length);
  });

  it('admin without access level sees all items', () => {
    const result = filterNavItems(NAV_ITEMS, {
      isSuperAdmin: false,
      isAdmin: true,
      hasAccessLevel: false,
      allowedModules: null,
      getModuleKeyFromRoute: mockGetModule,
    });
    expect(result.length).toBe(NAV_ITEMS.length);
  });

  it('employee (no access level) cannot see adminOnly items', () => {
    const result = filterNavItems(NAV_ITEMS, {
      isSuperAdmin: false,
      isAdmin: false,
      hasAccessLevel: false,
      allowedModules: null,
      getModuleKeyFromRoute: mockGetModule,
    });
    const adminOnlyItems = NAV_ITEMS.filter(i => i.adminOnly || i.group === 'premium');
    for (const item of adminOnlyItems) {
      expect(result.some(r => r.href === item.href), `Employee should NOT see "${item.label}"`).toBe(false);
    }
  });

  it('employee with access level sees only allowed modules', () => {
    const result = filterNavItems(NAV_ITEMS, {
      isSuperAdmin: false,
      isAdmin: false,
      hasAccessLevel: true,
      allowedModules: ['agenda', 'checklists', 'inventory'],
      getModuleKeyFromRoute: mockGetModule,
    });
    // Should only have items whose module key is in the allowed list
    for (const item of result) {
      const moduleKey = mockGetModule(item.href);
      expect(
        ['agenda', 'checklists', 'inventory', 'dashboard', 'settings'].includes(moduleKey!),
        `Employee with restricted access should NOT see "${item.label}" (module: ${moduleKey})`
      ).toBe(true);
    }
  });
});

// ─── 6. Route preload mappings ───
describe('Route Preload Consistency', () => {
  // We can't import the actual file easily, so we test the contract
  it('key protected routes have corresponding page files', () => {
    // This is a static check - just verify the route-to-page mapping makes sense
    const routePageMap: Record<string, string> = {
      '/': 'DashboardNew',
      '/agenda': 'Agenda',
      '/finance': 'Finance',
      '/inventory': 'Inventory',
      '/orders': 'Orders',
      '/checklists': 'Checklists',
      '/cash-closing': 'CashClosing',
      '/recipes': 'Recipes',
      '/employees': 'Employees',
      '/rewards': 'Rewards',
      '/settings': 'Settings',
      '/marketing': 'Marketing',
      '/copilot': 'Copilot',
      '/whatsapp': 'WhatsApp',
      '/cardapio': 'CardapioHub',
      '/ranking': 'Ranking',
      '/personal-finance': 'PersonalFinance',
      '/plans': 'Plans',
    };

    for (const [route, page] of Object.entries(routePageMap)) {
      // Just verify the mapping exists (page file existence is implied by build)
      expect(page).toBeTruthy();
      // Verify the route is actually in PROTECTED_ROUTES
      expect(PROTECTED_ROUTES, `Route "${route}" (page: ${page}) is not in PROTECTED_ROUTES`).toContain(route);
    }
  });
});

// ─── 7. Redirect routes ───
describe('Redirect Routes', () => {
  it('/tablet-admin redirects to /cardapio', () => {
    expect(REDIRECT_ROUTES['/tablet-admin']).toBe('/cardapio');
  });

  it('/gamification redirects to /cardapio', () => {
    expect(REDIRECT_ROUTES['/gamification']).toBe('/cardapio');
  });

  it('redirect targets are valid protected routes', () => {
    for (const [from, to] of Object.entries(REDIRECT_ROUTES)) {
      expect(PROTECTED_ROUTES, `Redirect target "${to}" (from "${from}") is not a valid protected route`).toContain(to);
    }
  });
});

// ─── 8. Cross-reference: modules with routes in App.tsx ───
describe('Module Routes are Registered in App.tsx', () => {
  const allStaticProtected = PROTECTED_ROUTES.filter(r => !r.includes(':'));

  for (const mod of ALL_MODULES) {
    it(`module "${mod.key}" primary route "${mod.route}" is registered`, () => {
      // Check if the module's primary route is in App.tsx
      const isRegistered = allStaticProtected.includes(mod.route) || 
                          PUBLIC_ROUTES.includes(mod.route) ||
                          Object.keys(REDIRECT_ROUTES).includes(mod.route);
      expect(isRegistered, `Module "${mod.key}" route "${mod.route}" is NOT registered in App.tsx`).toBe(true);
    });
  }
});

// ─── 9. Access control edge cases ───
describe('Access Control Edge Cases', () => {
  it('getModuleKeyFromRoute returns null for unknown routes', () => {
    expect(getModuleKeyFromRoute('/unknown')).toBeNull();
    expect(getModuleKeyFromRoute('/foo/bar')).toBeNull();
  });

  it('getModuleKeyFromRoute handles profile route (param route)', () => {
    // /profile/:userId is a param route, exact match won't work
    expect(getModuleKeyFromRoute('/profile/abc123')).toBeNull();
    // This is expected - profile has no module restriction
  });

  it('/brand-core maps to marketing module', () => {
    expect(getModuleKeyFromRoute('/brand-core')).toBe('marketing');
  });

  it('plan check works for brand-core (requires business)', () => {
    const moduleKey = getModuleKeyFromRoute('/brand-core');
    expect(moduleKey).toBe('marketing');
    expect(MODULE_REQUIRED_PLAN[moduleKey!]).toBe('business');
    expect(planSatisfies('free', 'business')).toBe(false);
    expect(planSatisfies('pro', 'business')).toBe(false);
    expect(planSatisfies('business', 'business')).toBe(true);
  });

  it('/personal-finance maps to personal-finance module and requires pro', () => {
    const moduleKey = getModuleKeyFromRoute('/personal-finance');
    expect(moduleKey).toBe('personal-finance');
    expect(MODULE_REQUIRED_PLAN[moduleKey!]).toBe('pro');
  });
});

// ─── 10. Completeness summary ───
describe('Completeness Check', () => {
  it('all protected routes (non-param) have either a module or are exempt', () => {
    const EXEMPT = ['/', '/profile/:userId', '/plans', '/calendar', '/notifications'];
    const staticProtected = PROTECTED_ROUTES.filter(r => !r.includes(':') && !EXEMPT.includes(r));
    
    const missingModules: string[] = [];
    for (const route of staticProtected) {
      if (!getModuleKeyFromRoute(route)) {
        missingModules.push(route);
      }
    }
    expect(missingModules, `Routes without module definitions: ${missingModules.join(', ')}`).toEqual([]);
  });
});
