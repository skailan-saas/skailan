
"use client";

import { Bell, LogOut, Search, Settings, UserCircle, MessageSquareMore } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuGroup,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { supabase } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import React, { useState } from "react";

interface MockNotification {
  id: string;
  title: string;
  message: string;
  timestamp: string;
  isRead: boolean;
  link?: string;
  icon?: React.ElementType;
}

const mockNotificationsData: MockNotification[] = [
  { id: "1", title: "New Lead Assigned", message: "Lead 'John Doe' has been assigned to you.", timestamp: "10m ago", isRead: false, link: "/crm/leads/lead-123", icon: UserCircle },
  { id: "2", title: "Task Reminder", message: "Follow up with 'Alice W.' is due today.", timestamp: "1h ago", isRead: false, link: "/crm/tasks/task-456", icon: MessageSquareMore },
  { id: "3", title: "Flow Published", message: "Your 'Welcome Flow' has been successfully published.", timestamp: "3h ago", isRead: true, link: "/flows", icon: Settings },
  { id: "4", title: "Mention", message: "@admin mentioned you in conversation #CONV-789.", timestamp: "1d ago", isRead: true, link: "/dashboard?conversationId=789" },
];


export function AppHeader() {
  const router = useRouter();
  const { toast } = useToast();
  const [notifications, setNotifications] = useState<MockNotification[]>(mockNotificationsData);

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
      router.refresh(); 
    }
  };

  const unreadNotificationsCount = notifications.filter(n => !n.isRead).length;

  const handleNotificationClick = (notificationId: string) => {
    setNotifications(prev => 
      prev.map(n => n.id === notificationId ? {...n, isRead: true} : n)
    );
    // Potentially navigate to notification.link if provided
    const notification = notifications.find(n => n.id === notificationId);
    if (notification?.link) {
      router.push(notification.link);
    }
  };

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b bg-background/80 backdrop-blur-sm px-4 md:px-6">
      <div>
        <SidebarTrigger />
      </div>
      
      <div className="hidden md:block">
      </div>

      <div className="flex w-full items-center gap-4 md:ml-auto md:gap-2 lg:gap-4">
        <form className="ml-auto flex-1 sm:flex-initial">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search conversations, leads..."
              className="pl-8 sm:w-[300px] md:w-[200px] lg:w-[300px] rounded-full"
            />
          </div>
        </form>
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="rounded-full relative">
              <Bell className="h-5 w-5" />
              {unreadNotificationsCount > 0 && (
                <Badge variant="destructive" className="absolute -top-1 -right-1 h-4 w-4 p-0 flex items-center justify-center text-xs">
                  {unreadNotificationsCount}
                </Badge>
              )}
              <span className="sr-only">Toggle notifications</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-80 sm:w-96">
            <DropdownMenuLabel className="flex justify-between items-center">
              <span>Notifications</span>
              {unreadNotificationsCount > 0 && <Badge variant="secondary">{unreadNotificationsCount} New</Badge>}
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <ScrollArea className="h-[300px]">
              {notifications.length === 0 ? (
                <DropdownMenuItem disabled className="text-center text-muted-foreground py-4">No notifications</DropdownMenuItem>
              ) : (
                notifications.map((notif) => (
                  <DropdownMenuItem 
                    key={notif.id} 
                    className={`flex items-start gap-2.5 p-3 ${!notif.isRead ? 'bg-primary/5' : ''}`}
                    onClick={() => handleNotificationClick(notif.id)}
                    asChild={!!notif.link}
                  >
                    {notif.link ? (
                        <Link href={notif.link} className="w-full">
                            {notif.icon && <notif.icon className="h-4 w-4 mt-0.5 text-muted-foreground flex-shrink-0" />}
                            <div className="flex-1">
                                <p className={`font-medium text-sm ${!notif.isRead ? 'text-foreground' : 'text-muted-foreground'}`}>{notif.title}</p>
                                <p className="text-xs text-muted-foreground">{notif.message}</p>
                                <p className="text-xs text-muted-foreground/70 mt-0.5">{notif.timestamp}</p>
                            </div>
                            {!notif.isRead && <div className="h-2 w-2 rounded-full bg-primary self-center flex-shrink-0"></div>}
                        </Link>
                    ) : (
                        <>
                            {notif.icon && <notif.icon className="h-4 w-4 mt-0.5 text-muted-foreground flex-shrink-0" />}
                            <div className="flex-1">
                                <p className={`font-medium text-sm ${!notif.isRead ? 'text-foreground' : 'text-muted-foreground'}`}>{notif.title}</p>
                                <p className="text-xs text-muted-foreground">{notif.message}</p>
                                <p className="text-xs text-muted-foreground/70 mt-0.5">{notif.timestamp}</p>
                            </div>
                            {!notif.isRead && <div className="h-2 w-2 rounded-full bg-primary self-center flex-shrink-0"></div>}
                        </>
                    )}
                  </DropdownMenuItem>
                ))
              )}
            </ScrollArea>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="justify-center text-sm text-primary hover:!text-primary">
              <Link href="/notifications">View all notifications</Link>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="rounded-full">
              <Avatar className="h-8 w-8">
                <AvatarImage src="https://placehold.co/40x40.png" alt="User avatar" data-ai-hint="person avatar" />
                <AvatarFallback>CN</AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>My Account</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href="/settings/profile">
                <UserCircle className="mr-2 h-4 w-4" />
                <span>Profile</span>
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
                <Link href="/settings/tenant"> 
                    <Settings className="mr-2 h-4 w-4" />
                    <span>Tenant Settings</span>
                </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout}>
              <LogOut className="mr-2 h-4 w-4" />
              <span>Logout</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
