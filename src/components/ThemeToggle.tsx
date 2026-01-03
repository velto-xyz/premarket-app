import { Sun01Icon, Moon01Icon, ComputerIcon } from "@/components/icons";
import { useTheme } from "next-themes";
import { SidebarMenuButton } from "@/components/ui/sidebar";
import { useEffect, useState } from "react";

interface ThemeToggleProps {
  isCollapsed?: boolean;
}

export function ThemeToggle({ isCollapsed = false }: ThemeToggleProps) {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Avoid hydration mismatch by only rendering after mount
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  const cycleTheme = () => {
    if (theme === "system") {
      setTheme("light");
    } else if (theme === "light") {
      setTheme("dark");
    } else {
      setTheme("system");
    }
  };

  const getIcon = () => {
    switch (theme) {
      case "light":
        return <Sun01Icon className="h-6 w-6" />;
      case "dark":
        return <Moon01Icon className="h-6 w-6" />;
      default:
        return <ComputerIcon className="h-6 w-6" />;
    }
  };

  const getLabel = () => {
    switch (theme) {
      case "light":
        return "Light";
      case "dark":
        return "Dark";
      default:
        return "System";
    }
  };

  return (
    <SidebarMenuButton
      onClick={cycleTheme}
      className="text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors rounded-md"
      title={`Theme: ${getLabel()} (click to cycle)`}
    >
      {getIcon()}
      {!isCollapsed && <span className="text-base">{getLabel()}</span>}
    </SidebarMenuButton>
  );
}
