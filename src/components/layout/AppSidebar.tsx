import { LayoutDashboard, TrendingUp, Globe, Briefcase, Brain, LogOut, Trophy } from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useNavigate, Link } from "react-router-dom";
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
      className="border-r border-white/[0.08]"
      style={{ 
        backgroundColor: 'rgba(10, 10, 10, 0.8)',
        backdropFilter: 'blur(10px)'
      }}
    >
      <SidebarHeader className="border-b border-white/[0.08] p-4">
        <Link to="/portfolio" className="flex items-center gap-3 cursor-pointer hover:opacity-80 transition-opacity">
          <div className="w-8 h-8 rounded-md bg-[#00F0FF] flex items-center justify-center shadow-[0_4px_20px_rgba(0,240,255,0.3)]">
            <span className="text-black font-bold text-lg font-mono">V</span>
          </div>
          {!isCollapsed && <span className="text-xl font-bold text-white tracking-tight">Velto</span>}
        </Link>
      </SidebarHeader>

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
                      className="text-[#888888] hover:text-white hover:bg-white/[0.05] transition-colors rounded-md"
                      activeClassName="bg-white/[0.08] text-[#00F0FF] font-medium"
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

      <SidebarFooter className="border-t border-white/[0.08] p-2">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton 
              onClick={handleLogout} 
              className="text-[#888888] hover:text-white hover:bg-white/[0.05] transition-colors rounded-md"
            >
              <LogOut className="h-4 w-4" />
              {!isCollapsed && <span className="text-sm">Sign Out</span>}
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>

      <SidebarTrigger className="m-2 self-end text-[#888888] hover:text-white" />
    </Sidebar>
  );
}
