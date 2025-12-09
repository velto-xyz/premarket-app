import { ReactNode } from "react";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "./AppSidebar";

interface AppLayoutProps {
  children: ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  return (
    <SidebarProvider>
      {/* Root layout: no background here – let <body> gradient be visible */}
      <div className="min-h-screen flex w-full text-foreground">
        <AppSidebar />

        {/* Main area: transparent, with padding like the Crextio layout */}
        <main className="flex-1 overflow-auto px-10 py-8 bg-transparent">{children}</main>
      </div>
    </SidebarProvider>
  );
}
