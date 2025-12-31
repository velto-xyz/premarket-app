import { ReactNode } from "react";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "./AppSidebar";

import { cn } from "@/lib/utils";

interface AppLayoutProps {
  children: ReactNode;
  className?: string; // Allow overriding styles (e.g., padding)
}

export function AppLayout({ children, className }: AppLayoutProps) {
  return (
    <SidebarProvider>
      {/* Root layout: no background here – let <body> gradient be visible */}
      <div className="h-screen overflow-hidden flex w-full text-foreground">
        <AppSidebar />

        {/* Main area: transparent, with padding like the Crextio layout */}
        <main className={cn("flex-1 overflow-auto px-10 py-8 bg-transparent", className)}>{children}</main>
      </div>
    </SidebarProvider>
  );
}
