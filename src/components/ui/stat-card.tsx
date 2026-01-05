import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";

interface StatCardProps {
  title: string;
  value: string | number;
  icon?: LucideIcon;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  variant?: "default" | "success" | "danger" | "warning" | "info";
  className?: string;
}

const variantStyles = {
  default: "bg-card border border-border",
  success: "bg-success/10 border border-success/20",
  danger: "bg-destructive/10 border border-destructive/20",
  warning: "bg-warning/10 border border-warning/20",
  info: "bg-info/10 border border-info/20",
};

const iconVariantStyles = {
  default: "bg-primary/10 text-primary",
  success: "bg-success/20 text-success",
  danger: "bg-destructive/20 text-destructive",
  warning: "bg-warning/20 text-warning",
  info: "bg-info/20 text-info",
};

export function StatCard({ 
  title, 
  value, 
  icon: Icon, 
  trend, 
  variant = "default",
  className 
}: StatCardProps) {
  return (
    <div className={cn(
      "rounded-xl p-5 card-hover animate-fade-in",
      variantStyles[variant],
      className
    )}>
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <p className="text-2xl font-bold tracking-tight">{value}</p>
          {trend && (
            <p className={cn(
              "text-sm font-medium",
              trend.isPositive ? "text-success" : "text-destructive"
            )}>
              {trend.isPositive ? "+" : ""}{trend.value}%
            </p>
          )}
        </div>
        {Icon && (
          <div className={cn(
            "p-3 rounded-lg",
            iconVariantStyles[variant]
          )}>
            <Icon className="w-5 h-5" />
          </div>
        )}
      </div>
    </div>
  );
}
