import { 
  Package, 
  Target, 
  Calendar, 
  DollarSign, 
  TrendingUp, 
  BarChart3, 
  PieChart, 
  LayoutDashboard,
  Settings,
  ChevronDown
} from "lucide-react";
import { NavLink, useLocation } from "react-router-dom";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
  useSidebar,
} from "@/components/ui/sidebar";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";

const dataItems = [
  { title: "Produtos", url: "/produtos", icon: Package },
  { title: "Resultados de Campanhas", url: "/campanhas", icon: Target },
  { title: "Resultados Semanais", url: "/semanal", icon: Calendar },
  { title: "Receitas & Despesas", url: "/financeiro", icon: DollarSign },
  { title: "Fluxo de Caixa", url: "/fluxo-caixa", icon: TrendingUp },
];

const dashboardItems = [
  { title: "Dashboard de Produtos", url: "/dashboard/produtos", icon: BarChart3 },
  { title: "Dashboard de Campanhas", url: "/dashboard/campanhas", icon: PieChart },
  { title: "Dashboard do Negócio", url: "/dashboard/negocio", icon: LayoutDashboard },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const location = useLocation();
  const collapsed = state === "collapsed";
  
  const isActive = (path: string) => location.pathname === path;
  const isInDataSection = dataItems.some(item => isActive(item.url));
  const isInDashboardSection = dashboardItems.some(item => isActive(item.url));

  return (
    <Sidebar className="border-r-0">
      <SidebarHeader className="p-4 border-b border-sidebar-border">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg gradient-accent flex items-center justify-center">
            <TrendingUp className="w-5 h-5 text-sidebar-primary-foreground" />
          </div>
          {!collapsed && (
            <div className="flex flex-col">
              <span className="font-bold text-sidebar-foreground text-lg tracking-tight">CFA</span>
              <span className="text-xs text-sidebar-foreground/60">Affiliate Manager</span>
            </div>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent className="px-2 py-4">
        <SidebarGroup>
          <Collapsible defaultOpen={isInDataSection || !isInDashboardSection}>
            <CollapsibleTrigger className="w-full">
              <SidebarGroupLabel className="flex items-center justify-between px-2 text-sidebar-foreground/50 hover:text-sidebar-foreground transition-colors cursor-pointer">
                <span>Dados</span>
                <ChevronDown className="w-4 h-4" />
              </SidebarGroupLabel>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <SidebarGroupContent className="mt-2">
                <SidebarMenu>
                  {dataItems.map((item) => (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton asChild>
                        <NavLink 
                          to={item.url} 
                          className={cn(
                            "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200",
                            isActive(item.url) 
                              ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-lg" 
                              : "text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent"
                          )}
                        >
                          <item.icon className="w-5 h-5" />
                          {!collapsed && <span className="font-medium">{item.title}</span>}
                        </NavLink>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </CollapsibleContent>
          </Collapsible>
        </SidebarGroup>

        <SidebarGroup className="mt-4">
          <Collapsible defaultOpen={isInDashboardSection}>
            <CollapsibleTrigger className="w-full">
              <SidebarGroupLabel className="flex items-center justify-between px-2 text-sidebar-foreground/50 hover:text-sidebar-foreground transition-colors cursor-pointer">
                <span>Dashboards</span>
                <ChevronDown className="w-4 h-4" />
              </SidebarGroupLabel>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <SidebarGroupContent className="mt-2">
                <SidebarMenu>
                  {dashboardItems.map((item) => (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton asChild>
                        <NavLink 
                          to={item.url} 
                          className={cn(
                            "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200",
                            isActive(item.url) 
                              ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-lg" 
                              : "text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent"
                          )}
                        >
                          <item.icon className="w-5 h-5" />
                          {!collapsed && <span className="font-medium">{item.title}</span>}
                        </NavLink>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </CollapsibleContent>
          </Collapsible>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-4 border-t border-sidebar-border">
        <NavLink 
          to="/configuracoes" 
          className={cn(
            "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200",
            isActive("/configuracoes") 
              ? "bg-sidebar-primary text-sidebar-primary-foreground" 
              : "text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent"
          )}
        >
          <Settings className="w-5 h-5" />
          {!collapsed && <span className="font-medium">Parâmetros</span>}
        </NavLink>
      </SidebarFooter>
    </Sidebar>
  );
}
