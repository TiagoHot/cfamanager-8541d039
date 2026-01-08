import { cn } from "@/lib/utils";
import React from "react";

interface PageContentProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

/**
 * Componente que envolve o conteúdo principal da página para gerenciar a rolagem.
 * Ele garante que o conteúdo se estenda para preencher o espaço restante abaixo do cabeçalho da aplicação (AppLayout header).
 */
export function PageContent({ children, className, ...props }: PageContentProps) {
  return (
    <div 
      className={cn(
        "flex flex-col h-[calc(100vh-4rem-24px)] overflow-y-auto scrollbar-thin", // 4rem (header height) + 24px (main padding top)
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}