import { lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { UnitProvider } from "@/contexts/UnitContext";
import { PageLoader } from "@/components/PageLoader";
import { useUserModules } from "@/hooks/useAccessLevels";
import { getModuleKeyFromRoute } from "@/lib/modules";
import { ThemeProvider } from "next-themes";

// Retry wrapper for lazy imports to handle transient fetch failures
function lazyRetry(importFn: () => Promise<any>, retries = 3): Promise<any> {
  return new Promise((resolve, reject) => {
    importFn()
      .then(resolve)
      .catch((err: Error) => {
        if (retries > 0) {
          setTimeout(() => {
            lazyRetry(importFn, retries - 1).then(resolve, reject);
          }, 500);
        } else {
          // Force reload as last resort to clear stale cache
          window.location.reload();
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
const Chat = lazy(() => lazyRetry(() => import("./pages/Chat")));
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
const PersonalFinance = lazy(() => lazyRetry(() => import("./pages/PersonalFinance")));
const Landing = lazy(() => lazyRetry(() => import("./pages/Landing")));
const Copilot = lazy(() => lazyRetry(() => import("./pages/Copilot")));
const Alerts = lazy(() => lazyRetry(() => import("./pages/Alerts")));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 2 * 60 * 1000, // 2 minutes
      gcTime: 5 * 60 * 1000, // 5 minutes
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

// PageLoader imported from @/components/PageLoader

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();
  const location = useLocation();
  const { hasAccess, isLoading: modulesLoading } = useUserModules();

  if (isLoading) {
    return <PageLoader />;
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
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

function AppRoutes() {
  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        <Route path="/auth" element={<Auth />} />
        <Route path="/landing" element={<Landing />} />
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <DashboardNew />
            </ProtectedRoute>
          }
        />
        <Route
          path="/agenda"
          element={
            <ProtectedRoute>
              <Agenda />
            </ProtectedRoute>
          }
        />
        <Route
          path="/finance"
          element={
            <ProtectedRoute>
              <Finance />
            </ProtectedRoute>
          }
        />
        <Route
          path="/inventory"
          element={
            <ProtectedRoute>
              <Inventory />
            </ProtectedRoute>
          }
        />
        <Route
          path="/orders"
          element={
            <ProtectedRoute>
              <Orders />
            </ProtectedRoute>
          }
        />
        <Route
          path="/checklists"
          element={
            <ProtectedRoute>
              <Checklists />
            </ProtectedRoute>
          }
        />
        <Route
          path="/rewards"
          element={
            <ProtectedRoute>
              <Rewards />
            </ProtectedRoute>
          }
        />
        <Route
          path="/settings"
          element={
            <ProtectedRoute>
              <Settings />
            </ProtectedRoute>
          }
        />
        <Route
          path="/cash-closing"
          element={
            <ProtectedRoute>
              <CashClosing />
            </ProtectedRoute>
          }
        />
         <Route
           path="/recipes"
           element={
             <ProtectedRoute>
               <Recipes />
             </ProtectedRoute>
           }
         />
        <Route
          path="/employees"
          element={
            <ProtectedRoute>
              <Employees />
            </ProtectedRoute>
          }
        />
        <Route
          path="/chat"
          element={
            <ProtectedRoute>
              <Chat />
            </ProtectedRoute>
          }
        />
        {/* Tablet routes (public, no auth) */}
        <Route path="/tablet/:unitId" element={<TabletSelect />} />
        <Route path="/tablet/:unitId/menu" element={<TabletMenu />} />
        <Route path="/tablet/:unitId/confirm/:orderId" element={<TabletConfirm />} />
        {/* Tablet admin (protected) */}
        <Route
          path="/tablet-admin"
          element={
            <ProtectedRoute>
              <TabletAdmin />
            </ProtectedRoute>
          }
        />
        <Route
          path="/cardapio"
          element={
            <ProtectedRoute>
              <MenuAdmin />
            </ProtectedRoute>
          }
        />
        <Route
          path="/marketing"
          element={
            <ProtectedRoute>
              <Marketing />
            </ProtectedRoute>
          }
        />
        <Route
          path="/whatsapp"
          element={
            <ProtectedRoute>
              <WhatsApp />
            </ProtectedRoute>
          }
        />
        <Route
          path="/ranking"
          element={
            <ProtectedRoute>
              <Ranking />
            </ProtectedRoute>
          }
        />
        <Route
          path="/personal-finance"
          element={
            <ProtectedRoute>
              <PersonalFinance />
            </ProtectedRoute>
          }
        />
        <Route
          path="/profile/:userId"
          element={
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
          }
        />
        <Route
          path="/copilot"
          element={
            <ProtectedRoute>
              <Copilot />
            </ProtectedRoute>
          }
        />
        <Route
          path="/alerts"
          element={
            <ProtectedRoute>
              <Alerts />
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Suspense>
  );
}

const App = () => (
  <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false}>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AuthProvider>
            <UnitProvider>
              <AppRoutes />
            </UnitProvider>
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  </ThemeProvider>
);

export default App;