import { lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { UnitProvider } from "@/contexts/UnitContext";
import { PageLoader } from "@/components/PageLoader";

// Lazy load all pages for code splitting
const Auth = lazy(() => import("./pages/Auth"));
const DashboardNew = lazy(() => import("./pages/DashboardNew"));
const Agenda = lazy(() => import("./pages/Agenda"));
const Finance = lazy(() => import("./pages/Finance"));
const Inventory = lazy(() => import("./pages/Inventory"));
const Checklists = lazy(() => import("./pages/Checklists"));
const Rewards = lazy(() => import("./pages/Rewards"));
const Settings = lazy(() => import("./pages/Settings"));
const NotFound = lazy(() => import("./pages/NotFound"));
const CashClosing = lazy(() => import("./pages/CashClosing"));
const Recipes = lazy(() => import("./pages/Recipes"));
const Employees = lazy(() => import("./pages/Employees"));
const Chat = lazy(() => import("./pages/Chat"));
const TabletSelect = lazy(() => import("./pages/TabletSelect"));
const TabletMenu = lazy(() => import("./pages/TabletMenu"));
const TabletConfirm = lazy(() => import("./pages/TabletConfirm"));
const TabletAdmin = lazy(() => import("./pages/TabletAdmin"));
const WhatsApp = lazy(() => import("./pages/WhatsApp"));
const MenuAdmin = lazy(() => import("./pages/MenuAdmin"));
const Profile = lazy(() => import("./pages/Profile"));
const Orders = lazy(() => import("./pages/Orders"));
const Marketing = lazy(() => import("./pages/Marketing"));

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

  if (isLoading) {
    return <PageLoader />;
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  return <>{children}</>;
}

function AppRoutes() {
  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        <Route path="/auth" element={<Auth />} />
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
          path="/profile/:userId"
          element={
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Suspense>
  );
}

const App = () => (
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
);

export default App;