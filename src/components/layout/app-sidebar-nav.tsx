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
  Package,
  FileText as QuoteIcon,
  ClipboardCheck,
  Briefcase,
  Building as CompanyIcon, // Changed to CompanyIcon
  Landmark, // New icon for Tenant Settings
  BellRing,
  MessageSquare, // For Conversations
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
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/conversations", label: "Conversaciones", icon: MessageSquare },
  { href: "/flows", label: "Flow Builder", icon: GitFork },
  { href: "/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/notifications", label: "Notifications", icon: BellRing },
];

const crmNavItems = [
  { href: "/crm/leads", label: "Leads", icon: Users },
  { href: "/crm/companies", label: "Companies", icon: CompanyIcon }, // Added Companies
  { href: "/crm/products", label: "Products & Services", icon: Package },
  { href: "/crm/quotes", label: "Quotes", icon: QuoteIcon },
  { href: "/crm/tasks", label: "Tasks", icon: ClipboardCheck },
  { href: "/crm/projects", label: "Projects", icon: Briefcase },
];

const settingsNavItems = [
  { href: "/settings/profile", label: "My Profile", icon: UserCircle },
  { href: "/settings/roles", label: "Users & Roles", icon: Users },
  { href: "/settings/channels", label: "Channel Connections", icon: Zap },
  { href: "/settings/sdk", label: "Website SDK", icon: Code2 },
  { href: "/settings/tenant", label: "Tenant Settings", icon: Landmark }, // Changed icon
];

const helpNavItems = [
  { href: "/documentation", label: "Documentation", icon: FileText },
  { href: "/support", label: "Support", icon: LifeBuoy },
];

export function AppSidebarNav() {
  const pathname = usePathname();
  const { state: sidebarState } = useSidebar();
  const isCollapsed = sidebarState === "collapsed";

  const renderNavItems = (
    items: { href: string; label: string; icon: React.ElementType }[]
  ) =>
    items.map((item) => (
      <SidebarMenuItem key={item.href}>
        <SidebarMenuButton
          asChild
          isActive={
            pathname === item.href ||
            (item.href !== "/" &&
              !item.href.includes("/settings/") &&
              pathname.startsWith(item.href) &&
              ![
                "/dashboard",
                "/conversations",
                "/flows",
                "/analytics",
                "/notifications",
              ].includes(item.href)) ||
            (item.href.includes("/settings/") && pathname === item.href)
          }
          tooltip={item.label}
          className={cn(
            (pathname === item.href ||
              (item.href !== "/" &&
                !item.href.includes("/settings/") &&
                pathname.startsWith(item.href) &&
                ![
                  "/dashboard",
                  "/conversations",
                  "/flows",
                  "/analytics",
                  "/notifications",
                ].includes(item.href)) ||
              (item.href.includes("/settings/") && pathname === item.href)) &&
              "bg-sidebar-primary text-sidebar-primary-foreground hover:bg-sidebar-primary/90"
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
        {sidebarState === "expanded" && (
          <SidebarGroupLabel>Menu</SidebarGroupLabel>
        )}
        <SidebarMenu>{renderNavItems(mainNavItems)}</SidebarMenu>
      </SidebarGroup>

      <SidebarGroup>
        {sidebarState === "expanded" && (
          <SidebarGroupLabel>CRM</SidebarGroupLabel>
        )}
        <SidebarMenu>{renderNavItems(crmNavItems)}</SidebarMenu>
      </SidebarGroup>

      <SidebarGroup>
        {sidebarState === "expanded" && (
          <SidebarGroupLabel>Settings</SidebarGroupLabel>
        )}
        <SidebarMenu>{renderNavItems(settingsNavItems)}</SidebarMenu>
      </SidebarGroup>

      <SidebarGroup className="mt-auto">
        {sidebarState === "expanded" && (
          <SidebarGroupLabel>Help</SidebarGroupLabel>
        )}
        <SidebarMenu>{renderNavItems(helpNavItems)}</SidebarMenu>
      </SidebarGroup>
    </>
  );
}
