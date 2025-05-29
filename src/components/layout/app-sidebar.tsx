"use client";

import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarFooter,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/icons/logo";
import { AppSidebarNav } from "./app-sidebar-nav";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { LogOut } from "lucide-react";
import Link from "next/link";

export function AppSidebar() {
  const { state } = useSidebar();
  const isCollapsed = state === "collapsed";

  return (
    <Sidebar collapsible="icon" variant="sidebar" className="border-r">
      <SidebarHeader className="p-3">
        <Link href="/dashboard" className="flex items-center">
          <Logo collapsed={isCollapsed} />
        </Link>
      </SidebarHeader>
      <Separator className="mb-2 bg-sidebar-border" />
      <SidebarContent className="p-2 pr-0"> {/* Adjusted padding */}
        <AppSidebarNav />
      </SidebarContent>
      <Separator className="mt-auto mb-2 bg-sidebar-border" />
      <SidebarFooter className="p-3">
        {/* Can add user info or logout here when sidebar is expanded */}
        {/* Example logout for collapsed state */}
        {isCollapsed && (
           <Button variant="ghost" size="icon" className="w-full justify-center text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground">
            <LogOut className="h-5 w-5" />
           </Button>
        )}
         {!isCollapsed && (
           <Button variant="ghost" className="w-full justify-start text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground">
            <LogOut className="mr-2 h-5 w-5" />
            Logout
           </Button>
        )}
      </SidebarFooter>
    </Sidebar>
  );
}
