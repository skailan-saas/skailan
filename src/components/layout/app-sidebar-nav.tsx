
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  GitFork,
  BarChart3,
  Settings,
  Users,
  Code2,
  LifeBuoy,
  FileText,
  Zap, // Added for Channel Connections
} from "lucide-react";
import {
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarGroup,
  SidebarGroupLabel,
  useSidebar,
} from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";

const mainNavItems = [
  { href: "/dashboard", label: "Agent Workspace", icon: LayoutDashboard },
  { href: "/flows", label: "Flow Builder", icon: GitFork },
  { href: "/analytics", label: "Analytics", icon: BarChart3 },
];

const settingsNavItems = [
  { href: "/settings/roles", label: "Roles & Permissions", icon: Users },
  { href: "/settings/channels", label: "Channel Connections", icon: Zap },
  { href: "/settings/sdk", label: "Website SDK", icon: Code2 },
  // Add more settings links here
];

const helpNavItems = [
   { href: "/documentation", label: "Documentation", icon: FileText },
   { href: "/support", label: "Support", icon: LifeBuoy },
];


export function AppSidebarNav() {
  const pathname = usePathname();
  const { state: sidebarState } = useSidebar();

  const renderNavItems = (items: typeof mainNavItems) =>
    items.map((item) => (
      <SidebarMenuItem key={item.href}>
        <SidebarMenuButton
          asChild
          isActive={pathname.startsWith(item.href)}
          tooltip={item.label}
          className={cn(
            pathname.startsWith(item.href) && "bg-sidebar-primary text-sidebar-primary-foreground hover:bg-sidebar-primary/90"
          )}
        >
          <Link href={item.href}>
            <item.icon />
            <span>{item.label}</span>
          </Link>
        </SidebarMenuButton>
      </SidebarMenuItem>
    ));

  return (
    <>
      <SidebarGroup>
        {sidebarState === "expanded" && <SidebarGroupLabel>Menu</SidebarGroupLabel>}
        <SidebarMenu>{renderNavItems(mainNavItems)}</SidebarMenu>
      </SidebarGroup>

      <SidebarGroup>
         {sidebarState === "expanded" && <SidebarGroupLabel>Settings</SidebarGroupLabel>}
        <SidebarMenu>{renderNavItems(settingsNavItems)}</SidebarMenu>
      </SidebarGroup>
      
      <SidebarGroup className="mt-auto">
        {sidebarState === "expanded" && <SidebarGroupLabel>Help</SidebarGroupLabel>}
        <SidebarMenu>{renderNavItems(helpNavItems)}</SidebarMenu>
      </SidebarGroup>
    </>
  );
}

    