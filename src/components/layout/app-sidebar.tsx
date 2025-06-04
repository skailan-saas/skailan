"use client";

import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarFooter,
  useSidebar,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/icons/logo";
import { AppSidebarNav } from "./app-sidebar-nav";
import { Separator } from "@/components/ui/separator";
import { LogOut } from "lucide-react";
import Link from "next/link";
import { supabase } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";

export function AppSidebar() {
  const { state } = useSidebar();
  const isCollapsed = state === "collapsed";
  const router = useRouter();
  const { toast } = useToast();

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast({
        title: "Logout Failed",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Logged Out",
        description: "You have been successfully logged out.",
      });
      router.push("/");
      router.refresh(); // Ensures server components re-evaluate auth state
    }
  };

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
        <Button
          variant="ghost"
          className={`w-full justify-${isCollapsed ? "center" : "start"} text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground`}
          onClick={handleLogout}
          title="Cerrar sesión"
        >
          <LogOut className={`h-5 w-5${isCollapsed ? "" : " mr-2"}`} />
          {!isCollapsed && "Cerrar sesión"}
        </Button>
      </SidebarFooter>
    </Sidebar>
  );
}
