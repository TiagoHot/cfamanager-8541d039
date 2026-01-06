import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Routes, Route, Navigate } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { DataProvider } from "@/contexts/DataContext";
import { SessionContextProvider, ProtectedRoute } from "@/integrations/supabase/auth";
import ProductsPage from "@/pages/ProductsPage";
import CampaignsPage from "@/pages/CampaignsPage";
import WeeklyResultsPage from "@/pages/WeeklyResultsPage";
import FinancialPage from "@/pages/FinancialPage";
import CashFlowPage from "@/pages/CashFlowPage";
import ProductDashboard from "@/pages/ProductDashboard";
import CampaignDashboard from "@/pages/CampaignDashboard";
import BusinessDashboard from "@/pages/BusinessDashboard";
import SettingsPage from "@/pages/SettingsPage";
import NotFound from "./pages/NotFound";
import Login from "./pages/Login";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <SessionContextProvider>
        <DataProvider>
          <Toaster />
          <Sonner />
          <Routes>
            <Route path="/login" element={<Login />} />
            
            <Route path="/" element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
              <Route index element={<Navigate to="/dashboard/negocio" replace />} />
              <Route path="produtos" element={<ProductsPage />} />
              <Route path="campanhas" element={<CampaignsPage />} />
              <Route path="semanal" element={<WeeklyResultsPage />} />
              <Route path="financeiro" element={<FinancialPage />} />
              <Route path="fluxo-caixa" element={<CashFlowPage />} />
              <Route path="dashboard/produtos" element={<ProductDashboard />} />
              <Route path="dashboard/campanhas" element={<CampaignDashboard />} />
              <Route path="dashboard/negocio" element={<BusinessDashboard />} />
              <Route path="configuracoes" element={<SettingsPage />} />
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
        </DataProvider>
      </SessionContextProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;