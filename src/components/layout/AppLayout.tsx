import { SidebarProvider, SidebarTrigger, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "./AppSidebar";
import { Outlet } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useData } from "@/contexts/DataContext";
import { Button } from "@/components/ui/button";
import { LogOut, Loader2, DollarSign, Euro, RefreshCw } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useCurrencyRates } from "@/contexts/CurrencyRatesContext"; // Import hook from context
import { formatCurrency } from "@/lib/formatters"; // Import formatter
import { Card } from "@/components/ui/card"; // Import Card
import { cn } from "@/lib/utils"; // Import cn

// Componente para exibir as taxas de câmbio (movido para AppLayout)
const CurrencyRateDisplay = () => {
  const { rates, fetchRatesFromAPI, isLoading } = useCurrencyRates();
  
  // Format the rates to BRL currency display, removing the R$ symbol for cleaner display
  const formatRate = (rate: number) => formatCurrency(rate, 'BRL').replace('R$', '').trim();

  return (
    <div className="flex items-center gap-4 text-sm">
      <div className={cn("flex items-center gap-1 p-2 rounded-lg transition-colors", "bg-info/10 text-info hover:bg-info/20")}>
        <DollarSign className="w-4 h-4" />
        <span className="font-medium">USD:</span>
        <span className="font-bold">R$ {formatRate(rates.Dollar)}</span>
      </div>
      <div className={cn("flex items-center gap-1 p-2 rounded-lg transition-colors", "bg-chart-5/10 text-chart-5 hover:bg-chart-5/20")}>
        <Euro className="w-4 h-4" />
        <span className="font-medium">EUR:</span>
        <span className="font-bold">R$ {formatRate(rates.Euro)}</span>
      </div>
      
      <Button 
        onClick={fetchRatesFromAPI} 
        variant="outline"
        size="sm"
        className="h-9 px-3"
        disabled={isLoading}
      >
        {isLoading ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <RefreshCw className="w-4 h-4" />
        )}
      </Button>
    </div>
  );
};


export function AppLayout() {
  const { user, signOut } = useAuth();
  const { isLoading } = useData();

  const getInitials = (email: string) => {
    return email.substring(0, 2).toUpperCase();
  };

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar />
        <SidebarInset className="flex-1">
          <header className="sticky top-0 z-10 flex h-16 items-center gap-4 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-6">
            <SidebarTrigger className="-ml-2" />
            
            {/* Adicionando a exibição das taxas de câmbio aqui */}
            <CurrencyRateDisplay />

            <div className="flex-1" />
            
            {isLoading && (
              <div className="flex items-center gap-2 text-muted-foreground text-sm">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Carregando...</span>
              </div>
            )}

            <ThemeToggle />

            {user && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                    <Avatar className="h-10 w-10">
                      <AvatarFallback className="bg-primary text-primary-foreground">
                        {getInitials(user.email || 'U')}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end" forceMount>
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none">Minha Conta</p>
                      <p className="text-xs leading-none text-muted-foreground">
                        {user.email}
                      </p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={signOut} className="text-destructive focus:text-destructive">
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Sair</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </header>
          <main className="flex-1 p-6">
            <Outlet />
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}