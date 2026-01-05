import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
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

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<AppLayout />}>
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
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
