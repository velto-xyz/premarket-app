import {
  Analytics02Icon,
  Layout01Icon,
  MarketsIcon,
  Globe02Icon,
  ChampionIcon,
  ArtificialIntelligence02Icon,
  Logout01Icon
} from "@/components/icons";
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
  { title: "Markets", url: "/", icon: MarketsIcon },
  { title: "My Portfolio", url: "/portfolio", icon: Analytics02Icon },
  { title: "World Map", url: "/map", icon: Globe02Icon },
  { title: "Alpha League", url: "/alpha-league", icon: ChampionIcon },
  { title: "AI Watcher", url: "/ai-watcher", icon: ArtificialIntelligence02Icon },
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
      <SidebarHeader className="p-4">
        <Link to="/portfolio" className="flex items-center gap-3 cursor-pointer hover:opacity-80 transition-opacity">
          {isCollapsed ? (
            <div className="w-8 h-8 rounded-md bg-primary flex items-center justify-center shadow-primary">
              <span className="text-primary-foreground font-bold text-lg font-mono">V</span>
            </div>
          ) : (
            <span className="text-4xl font-bold text-foreground tracking-tighter">velto</span>
          )}
        </Link>
      </SidebarHeader>

      {/* Sidebar Content: Main Navigation Menu */}
      <SidebarContent>
        <SidebarGroup className="pb-4">
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <div className={isCollapsed ? "flex justify-center" : "px-2 py-1"}>
                  <ConnectWallet isCollapsed={isCollapsed} />
                </div>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.title} className="mb-3">
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={item.url}
                      end
                      className="text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors rounded-md"
                      activeClassName="bg-muted text-foreground font-medium"
                    >
                      <item.icon className="h-6 w-6" />
                      {!isCollapsed && <span className="text-base">{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      {/* Sidebar Footer: Theme and Log Out */}
      <SidebarFooter className="border-t border-border py-6 px-2">
        <SidebarMenu>
          <SidebarMenuItem className="pb-2">
            <ThemeToggle isCollapsed={isCollapsed} />
          </SidebarMenuItem>
          <SidebarMenuItem className="pb-2">
            <SidebarMenuButton
              onClick={handleLogout}
              className="text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors rounded-md"
            >
              <Logout01Icon className="h-6 w-6" />
              {!isCollapsed && <span className="text-base">Sign Out</span>}
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>

    </Sidebar>
  );
}
