
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
  Zap, 
  UserCircle,
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
  { href: "/settings/profile", label: "My Profile", icon: UserCircle },
  { href: "/settings/roles", label: "Users & Roles", icon: Users },
  { href: "/settings/channels", label: "Channel Connections", icon: Zap },
  { href: "/settings/sdk", label: "Website SDK", icon: Code2 },
];

const helpNavItems = [
   { href: "/documentation", label: "Documentation", icon: FileText },
   { href: "/support", label: "Support", icon: LifeBuoy },
];


export function AppSidebarNav() {
  const pathname = usePathname();
  const { state: sidebarState } = useSidebar();
  const isCollapsed = sidebarState === "collapsed";

  const renderNavItems = (items: typeof mainNavItems) =>
    items.map((item) => (
      <SidebarMenuItem key={item.href}>
        <SidebarMenuButton
          asChild
          isActive={pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href) && item.href !== "/settings/profile" && item.href !== "/dashboard" && item.href !== "/flows" && item.href !== "/analytics") || (pathname === "/settings" && item.href === "/settings/profile")}
          tooltip={item.label}
          className={cn(
            (pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href) && item.href !== "/settings/profile" && item.href !== "/dashboard" && item.href !== "/flows" && item.href !== "/analytics") || (pathname === "/settings" && item.href === "/settings/profile") )&& "bg-sidebar-primary text-sidebar-primary-foreground hover:bg-sidebar-primary/90"
          )}
        >
          <Link href={item.href}>
            <item.icon />
            {!isCollapsed && <span>{item.label}</span>}
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
