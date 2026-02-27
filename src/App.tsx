import { lazy, Suspense, useEffect, useRef } from "react";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { FabActionProvider } from "@/contexts/FabActionContext";
import { UnitProvider, useUnit } from "@/contexts/UnitContext";
import { PageLoader } from "@/components/PageLoader";
import { useUserModules } from "@/hooks/useAccessLevels";
import { getModuleKeyFromRoute } from "@/lib/modules";
import { ThemeProvider } from "next-themes";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { toast } from "sonner";
import { useRoutePersist, useRouteRestore } from "@/hooks/useRouteRestore";
import { ScrollToTop } from "@/components/ScrollToTop";

const LAZY_RELOAD_KEY = 'lazy_reload_count';

function lazyRetry(importFn: () => Promise<any>, retries = 3): Promise<any> {
  return new Promise((resolve, reject) => {
    importFn()
      .then((module) => {
        // Reset reload counter on success
        sessionStorage.removeItem(LAZY_RELOAD_KEY);
        resolve(module);
      })
      .catch((err: Error) => {
        if (retries > 0) {
          setTimeout(() => {
            lazyRetry(importFn, retries - 1).then(resolve, reject);
          }, 500);
        } else {
          // Prevent infinite reload loop: max 2 reloads per session
          const reloadCount = parseInt(sessionStorage.getItem(LAZY_RELOAD_KEY) || '0', 10);
          if (reloadCount < 2) {
            sessionStorage.setItem(LAZY_RELOAD_KEY, String(reloadCount + 1));
            window.location.reload();
          } else {
            sessionStorage.removeItem(LAZY_RELOAD_KEY);
            reject(err);
          }
        }
      });
  });
}

// Lazy load all pages for code splitting with retry
const Auth = lazy(() => lazyRetry(() => import("./pages/Auth")));
const DashboardNew = lazy(() => lazyRetry(() => import("./pages/DashboardNew")));
const Agenda = lazy(() => lazyRetry(() => import("./pages/Agenda")));
const Finance = lazy(() => lazyRetry(() => import("./pages/Finance")));
const Inventory = lazy(() => lazyRetry(() => import("./pages/Inventory")));
const Checklists = lazy(() => lazyRetry(() => import("./pages/Checklists")));
const Rewards = lazy(() => lazyRetry(() => import("./pages/Rewards")));
const Settings = lazy(() => lazyRetry(() => import("./pages/Settings")));
const NotFound = lazy(() => lazyRetry(() => import("./pages/NotFound")));
const CashClosing = lazy(() => lazyRetry(() => import("./pages/CashClosing")));
const Recipes = lazy(() => lazyRetry(() => import("./pages/Recipes")));
const Employees = lazy(() => lazyRetry(() => import("./pages/Employees")));
const TabletSelect = lazy(() => lazyRetry(() => import("./pages/TabletSelect")));
const TabletMenu = lazy(() => lazyRetry(() => import("./pages/TabletMenu")));
const TabletConfirm = lazy(() => lazyRetry(() => import("./pages/TabletConfirm")));
const TabletAdmin = lazy(() => lazyRetry(() => import("./pages/TabletAdmin")));
const WhatsApp = lazy(() => lazyRetry(() => import("./pages/WhatsApp")));
const MenuAdmin = lazy(() => lazyRetry(() => import("./pages/MenuAdmin")));
const Profile = lazy(() => lazyRetry(() => import("./pages/Profile")));
const Orders = lazy(() => lazyRetry(() => import("./pages/Orders")));
const Marketing = lazy(() => lazyRetry(() => import("./pages/Marketing")));
const Ranking = lazy(() => lazyRetry(() => import("./pages/Ranking")));

const Landing = lazy(() => lazyRetry(() => import("./pages/Landing")));
const Copilot = lazy(() => lazyRetry(() => import("./pages/Copilot")));

const Gamification = lazy(() => lazyRetry(() => import("./pages/Gamification")));
const GamificationPlay = lazy(() => lazyRetry(() => import("./pages/GamificationPlay")));
const Invite = lazy(() => lazyRetry(() => import("./pages/Invite")));

const Plans = lazy(() => lazyRetry(() => import("./pages/Plans")));
const QuotationPublic = lazy(() => lazyRetry(() => import("./pages/QuotationPublic")));
const CalendarFull = lazy(() => lazyRetry(() => import("./pages/CalendarFull")));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      gcTime: 10 * 60 * 1000,
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
      retry: 1,
    },
    mutations: {
      onError: (error: Error) => {
        console.error('[Mutation error]', error);
        toast.error(error.message || 'Ocorreu um erro ao salvar.');
      },
    },
  },
});

// PageLoader imported from @/components/PageLoader

function RouteErrorBoundary({ children }: { children: React.ReactNode }) {
  return <ErrorBoundary>{children}</ErrorBoundary>;
}

function ProtectedRoute({ children, skipOnboarding }: { children: React.ReactNode; skipOnboarding?: boolean }) {
  const { user, isLoading } = useAuth();
  const location = useLocation();
  const { hasAccess, isLoading: modulesLoading } = useUserModules();
  const { units, isLoading: unitsLoading } = useUnit();

  if (isLoading || unitsLoading) {
    return <PageLoader />;
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  // If units are still empty after loading finished, show a brief loader
  // but cap it — don't block forever (auto-provision may have failed)
  if (!skipOnboarding && units.length === 0) {
    return <PageLoader />;
  }

  // Check module access (skip during loading to avoid flash)
  if (!modulesLoading) {
    const moduleKey = getModuleKeyFromRoute(location.pathname);
    if (moduleKey && !hasAccess(moduleKey)) {
      return <Navigate to="/" replace />;
    }
  }

  return <>{children}</>;
}

function UnhandledRejectionGuard({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const handler = (e: PromiseRejectionEvent) => {
      console.error("[Unhandled rejection]", e.reason);
      toast.error("Ocorreu um erro inesperado.");
      e.preventDefault();
    };
    window.addEventListener("unhandledrejection", handler);
    return () => window.removeEventListener("unhandledrejection", handler);
  }, []);
  return <>{children}</>;
}

function AppRoutes() {
  useRoutePersist();
  useRouteRestore();

  return (
    <>
      <ScrollToTop />
      <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route path="/auth" element={<Auth />} />
          <Route path="/landing" element={<Landing />} />
          <Route path="/invite" element={<Invite />} />
          <Route path="/" element={<ProtectedRoute><RouteErrorBoundary><DashboardNew /></RouteErrorBoundary></ProtectedRoute>} />
          <Route path="/agenda" element={<ProtectedRoute><Agenda /></ProtectedRoute>} />
          <Route path="/finance" element={<ProtectedRoute><Finance /></ProtectedRoute>} />
          <Route path="/inventory" element={<ProtectedRoute><Inventory /></ProtectedRoute>} />
          <Route path="/orders" element={<ProtectedRoute><Orders /></ProtectedRoute>} />
          <Route path="/checklists" element={<ProtectedRoute><Checklists /></ProtectedRoute>} />
          <Route path="/rewards" element={<ProtectedRoute><Rewards /></ProtectedRoute>} />
          <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
          <Route path="/cash-closing" element={<ProtectedRoute><CashClosing /></ProtectedRoute>} />
          <Route path="/recipes" element={<ProtectedRoute><Recipes /></ProtectedRoute>} />
          <Route path="/employees" element={<ProtectedRoute><Employees /></ProtectedRoute>} />
          <Route path="/cotacao/:token" element={<QuotationPublic />} />
          <Route path="/tablet/:unitId" element={<TabletSelect />} />
          <Route path="/tablet/:unitId/menu" element={<TabletMenu />} />
          <Route path="/tablet/:unitId/confirm/:orderId" element={<TabletConfirm />} />
          <Route path="/gamification/:unitId" element={<GamificationPlay />} />
          <Route path="/tablet-admin" element={<ProtectedRoute><TabletAdmin /></ProtectedRoute>} />
          <Route path="/cardapio" element={<ProtectedRoute><MenuAdmin /></ProtectedRoute>} />
          <Route path="/marketing" element={<ProtectedRoute><Marketing /></ProtectedRoute>} />
          <Route path="/whatsapp" element={<ProtectedRoute><WhatsApp /></ProtectedRoute>} />
          <Route path="/ranking" element={<ProtectedRoute><Ranking /></ProtectedRoute>} />
          
          <Route path="/profile/:userId" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
          <Route path="/copilot" element={<ProtectedRoute><Copilot /></ProtectedRoute>} />
          <Route path="/gamification" element={<ProtectedRoute><Gamification /></ProtectedRoute>} />
          <Route path="/plans" element={<ProtectedRoute><Plans /></ProtectedRoute>} />
          <Route path="/calendar" element={<ProtectedRoute><CalendarFull /></ProtectedRoute>} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Suspense>
    </>
  );
}

const App = () => (
  <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false}>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Sonner />
        <BrowserRouter>
          <AuthProvider>
            <UnitProvider>
              <FabActionProvider>
                <UnhandledRejectionGuard>
                  <AppRoutes />
                </UnhandledRejectionGuard>
              </FabActionProvider>
            </UnitProvider>
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  </ThemeProvider>
);

export default App;