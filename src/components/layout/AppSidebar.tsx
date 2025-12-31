import { LayoutDashboard, TrendingUp, Globe, Briefcase, Brain, LogOut, Trophy } from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useNavigate, Link } from "react-router-dom";
import { ConnectWallet } from "@/components/ConnectWallet";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarTrigger,
  useSidebar,
  SidebarHeader,
  SidebarFooter,
} from "@/components/ui/sidebar";
import { ThemeToggle } from "@/components/ThemeToggle";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const menuItems = [
  { title: "Dashboard", url: "/portfolio", icon: Briefcase },
  { title: "Industries", url: "/", icon: LayoutDashboard },
  { title: "Markets", url: "/markets", icon: TrendingUp },
  { title: "World Map", url: "/map", icon: Globe },
  { title: "Alpha League", url: "/alpha-league", icon: Trophy },
  { title: "AI Watcher", url: "/ai-watcher", icon: Brain },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const navigate = useNavigate();

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast.error("Failed to sign out");
    } else {
      toast.success("Signed out successfully");
      navigate("/auth");
    }
  };

  const isCollapsed = state === "collapsed";

  return (
    <Sidebar
      collapsible="icon"
      className="border-r border-border"
    >
      {/* Sidebar Header: Logo and App Name */}
      <SidebarHeader className="border-b border-border p-4">
        <Link to="/portfolio" className="flex items-center gap-3 cursor-pointer hover:opacity-80 transition-opacity">
          {isCollapsed ? (
            <div className="w-8 h-8 rounded-md bg-primary flex items-center justify-center shadow-primary">
              <span className="text-primary-foreground font-bold text-lg font-mono">V</span>
            </div>
          ) : (
            <span className="text-3xl font-bold text-foreground tracking-tight">Velto</span>
          )}
        </Link>
      </SidebarHeader>

      {/* Sidebar Content: Main Navigation Menu */}
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={item.url}
                      end
                      className="text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors rounded-md"
                      activeClassName="bg-muted text-primary font-medium"
                    >
                      <item.icon className="h-4 w-4" />
                      {!isCollapsed && <span className="text-sm">{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      {/* Sidebar Footer: Wallet, Theme, and Log Out */}
      <SidebarFooter className="border-t border-border p-2">
        <SidebarMenu>
          <SidebarMenuItem>
            <div className={isCollapsed ? "flex justify-center" : "px-2 py-1"}>
              <ConnectWallet isCollapsed={isCollapsed} />
            </div>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <ThemeToggle isCollapsed={isCollapsed} />
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton
              onClick={handleLogout}
              className="text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors rounded-md"
            >
              <LogOut className="h-4 w-4" />
              {!isCollapsed && <span className="text-sm">Sign Out</span>}
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>

      {/* Sidebar Trigger: Collapse button */}
      <SidebarTrigger className="m-2 self-end text-muted-foreground hover:text-foreground" />
    </Sidebar>
  );
}
