
"use client";

import React, { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BellRing, CheckCheck, Eye, MailWarning } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation"; // Import useRouter
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast"; // Import useToast

// Re-using the mock data and types from AppHeader for consistency in this example
interface MockNotification {
  id: string;
  title: string;
  message: string;
  timestamp: string;
  isRead: boolean;
  link?: string;
  icon?: React.ElementType; // Using a generic type for icon components
}

const initialNotificationsData: MockNotification[] = [
  { id: "1", title: "New Lead Assigned", message: "Lead 'John Doe' from 'Acme Corp' has been assigned to you. Please follow up.", timestamp: "10m ago", isRead: false, link: "/crm/leads", icon: MailWarning },
  { id: "2", title: "Task Reminder: Follow up", message: "Follow up with 'Alice W.' regarding quote QT-2024-001 is due today.", timestamp: "1h ago", isRead: false, link: "/crm/tasks", icon: BellRing },
  { id: "3", title: "Flow 'Welcome New Users' Published", message: "Your conversational flow 'Welcome New Users' has been successfully published and is now active.", timestamp: "3h ago", isRead: true, link: "/flows", icon: CheckCheck },
  { id: "4", title: "System Update Scheduled", message: "A system maintenance is scheduled for tomorrow at 2 AM. Expect brief downtime.", timestamp: "1d ago", isRead: true, icon: Eye },
  { id: "5", title: "Quote Accepted: QT-2024-002", message: "Quote QT-2024-002 for 'Bob T. (Builders Co.)' has been accepted.", timestamp: "2d ago", isRead: true, link: "/crm/quotes", icon: CheckCheck },
  { id: "6", title: "New Channel Connected: Main Website", message: "The 'Main Website Chat' channel has been successfully connected and is now live.", timestamp: "3d ago", isRead: true, link: "/settings/channels", icon: CheckCheck },
];


export default function NotificationsPage() {
  const router = useRouter(); // Initialize router
  const { toast } = useToast(); // Initialize toast
  const [notifications, setNotifications] = useState<MockNotification[]>(initialNotificationsData);
  const [filter, setFilter] = useState<"all" | "unread" | "read">("all");

  const filteredNotifications = useMemo(() => {
    if (filter === "unread") return notifications.filter(n => !n.isRead);
    if (filter === "read") return notifications.filter(n => n.isRead);
    return notifications;
  }, [notifications, filter]);

  const handleNotificationClick = (notification: MockNotification) => {
    setNotifications(prev =>
      prev.map(n => n.id === notification.id ? { ...n, isRead: true } : n)
    );
    if (notification.link) {
      router.push(notification.link);
    }
  };

  const handleMarkAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    toast({ title: "All notifications marked as read." });
  };

  return (
    <ScrollArea className="h-[calc(100vh-4rem)]">
      <div className="p-6 space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold flex items-center"><BellRing className="mr-3 h-8 w-8 text-primary"/>Notifications</h1>
            <p className="text-muted-foreground">
              View and manage all your system notifications.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Select value={filter} onValueChange={(value) => setFilter(value as "all" | "unread" | "read")}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter notifications" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Notifications</SelectItem>
                <SelectItem value="unread">Unread</SelectItem>
                <SelectItem value="read">Read</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" onClick={handleMarkAllAsRead} disabled={notifications.every(n => n.isRead)}>
              <CheckCheck className="mr-2 h-4 w-4"/> Mark all as read
            </Button>
          </div>
        </div>

        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle>Notification List</CardTitle>
            <CardDescription>
              Showing {filteredNotifications.length} of {notifications.length} total notifications.
              {filter !== "all" && ` (Filtered by: ${filter.charAt(0).toUpperCase() + filter.slice(1)})`}
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            {filteredNotifications.length === 0 ? (
              <div className="text-center py-10 text-muted-foreground">
                <BellRing className="h-12 w-12 mx-auto mb-4" />
                <p>No notifications to display for this filter.</p>
              </div>
            ) : (
              <div className="divide-y divide-border">
                {filteredNotifications.map((notification) => {
                  const IconComponent = notification.icon || BellRing;
                  return (
                    <div
                      key={notification.id}
                      className={cn(
                        "p-4 hover:bg-muted/50 transition-colors cursor-pointer flex items-start gap-3",
                        !notification.isRead && "bg-primary/5 font-medium"
                      )}
                      onClick={() => handleNotificationClick(notification)}
                    >
                      <div className={cn("mt-1 flex-shrink-0 h-6 w-6 rounded-full flex items-center justify-center", !notification.isRead ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground")}>
                        <IconComponent className={cn("h-4 w-4", !notification.isRead && "text-primary-foreground")} />
                      </div>
                      <div className="flex-1">
                        <div className="flex justify-between items-start">
                          <h3 className={cn("text-sm", !notification.isRead ? "text-foreground font-semibold" : "text-muted-foreground")}>{notification.title}</h3>
                           {!notification.isRead && (
                            <div className="h-2.5 w-2.5 rounded-full bg-primary ml-2 mt-1 flex-shrink-0" title="Unread"></div>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">{notification.message}</p>
                        <p className="text-xs text-muted-foreground/80 mt-1">{notification.timestamp}</p>
                      </div>
                      {notification.link && (
                        <Button variant="ghost" size="sm" asChild className="ml-auto self-center">
                          <Link href={notification.link} onClick={(e) => e.stopPropagation()}>View</Link>
                        </Button>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </ScrollArea>
  );
}
