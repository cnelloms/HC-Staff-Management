import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Bell, CheckCheck, Trash2, X } from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Link } from "wouter";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

// Notification type definition
interface Notification {
  id: number;
  userId: string;
  type: string;
  title: string;
  message: string;
  link?: string;
  isRead: boolean;
  createdAt: string;
  metadata?: Record<string, any>;
}

export function NotificationCenter() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isOpen, setIsOpen] = useState(false);

  // Fetch notifications
  const { data: notifications, isLoading: isLoadingNotifications } = useQuery<Notification[]>({
    queryKey: ['/api/notifications'],
    enabled: isOpen, // Only fetch when dropdown is open
  });

  // Fetch unread count - always refreshed
  const { data: unreadCountData, isLoading: isLoadingCount } = useQuery<{ count: number }>({
    queryKey: ['/api/notifications/unread-count'],
    refetchInterval: 60000, // Refresh every minute
  });

  const unreadCount = unreadCountData?.count || 0;

  // Mark notification as read
  const markAsReadMutation = useMutation({
    mutationFn: async (id: number) => {
      return apiRequest("PATCH", `/api/notifications/${id}/read`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/notifications'] });
      queryClient.invalidateQueries({ queryKey: ['/api/notifications/unread-count'] });
    },
  });

  // Mark all as read
  const markAllReadMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("POST", "/api/notifications/mark-all-read");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/notifications'] });
      queryClient.invalidateQueries({ queryKey: ['/api/notifications/unread-count'] });
      toast({
        title: "All notifications marked as read",
      });
    },
  });

  // Delete notification
  const deleteNotificationMutation = useMutation({
    mutationFn: async (id: number) => {
      return apiRequest("DELETE", `/api/notifications/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/notifications'] });
      queryClient.invalidateQueries({ queryKey: ['/api/notifications/unread-count'] });
    },
  });

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'ticket':
        return <span className="bg-blue-100 text-blue-600 p-1 rounded-md">🎫</span>;
      case 'employee':
        return <span className="bg-green-100 text-green-600 p-1 rounded-md">👤</span>;
      case 'role':
        return <span className="bg-purple-100 text-purple-600 p-1 rounded-md">🔑</span>;
      case 'system':
      default:
        return <span className="bg-amber-100 text-amber-600 p-1 rounded-md">🔔</span>;
    }
  };

  const formatNotificationTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    
    // If it's today, show relative time (e.g., "2 hours ago")
    if (date.toDateString() === now.toDateString()) {
      return formatDistanceToNow(date, { addSuffix: true });
    }
    
    // Otherwise, show the date
    return format(date, "MMM d, yyyy");
  };

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
  };

  return (
    <DropdownMenu open={isOpen} onOpenChange={handleOpenChange}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge 
              className="absolute -top-1 -right-1 px-1.5 py-0.5 bg-red-500 text-white min-w-[1rem] h-4 flex items-center justify-center"
              variant="destructive"
            >
              {unreadCount > 99 ? '99+' : unreadCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-96 max-h-[90vh] overflow-hidden flex flex-col" align="end">
        <div className="flex justify-between items-center p-4 border-b">
          <DropdownMenuLabel className="p-0">Notifications</DropdownMenuLabel>
          {notifications && notifications.length > 0 && (
            <Button 
              variant="ghost" 
              size="sm"
              className="text-xs"
              onClick={() => markAllReadMutation.mutate()}
              disabled={markAllReadMutation.isPending}
            >
              <CheckCheck className="h-3.5 w-3.5 mr-1" />
              Mark all read
            </Button>
          )}
        </div>

        <div className="overflow-y-auto max-h-[600px]">
          {isLoadingNotifications ? (
            <div className="p-4 space-y-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="flex space-x-3">
                  <Skeleton className="h-10 w-10 rounded-md" />
                  <div className="space-y-2 flex-1">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-3 w-3/4" />
                  </div>
                </div>
              ))}
            </div>
          ) : notifications && notifications.length > 0 ? (
            <DropdownMenuGroup>
              {notifications.map((notification) => (
                <div 
                  key={notification.id} 
                  className={`flex p-4 hover:bg-gray-50 border-b last:border-b-0 relative ${notification.isRead ? 'opacity-75' : 'bg-blue-50'}`}
                >
                  <div className="mr-3">
                    {getNotificationIcon(notification.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    {notification.link ? (
                      <Link 
                        href={notification.link} 
                        className="hover:underline font-medium block"
                        onClick={() => {
                          if (!notification.isRead) {
                            markAsReadMutation.mutate(notification.id);
                          }
                          setIsOpen(false);
                        }}
                      >
                        {notification.title}
                      </Link>
                    ) : (
                      <div className="font-medium">{notification.title}</div>
                    )}
                    <p className="text-sm text-gray-600 line-clamp-2">{notification.message}</p>
                    <div className="text-xs text-gray-500 mt-1">
                      {formatNotificationTime(notification.createdAt)}
                    </div>
                  </div>
                  <div className="ml-2 flex flex-col space-y-1">
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-6 w-6 opacity-50 hover:opacity-100"
                      onClick={() => deleteNotificationMutation.mutate(notification.id)}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                    {!notification.isRead && (
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-6 w-6 opacity-50 hover:opacity-100"
                        onClick={() => markAsReadMutation.mutate(notification.id)}
                      >
                        <CheckCheck className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </DropdownMenuGroup>
          ) : (
            <div className="p-8 text-center">
              <Bell className="h-8 w-8 mx-auto text-gray-400 mb-2" />
              <p className="text-gray-500">No notifications yet</p>
              <p className="text-gray-400 text-sm mt-1">
                You'll be notified when important activities happen
              </p>
            </div>
          )}
        </div>
        
        {notifications && notifications.length > 5 && (
          <div className="p-3 border-t">
            <Button variant="outline" size="sm" className="w-full">
              View all notifications
            </Button>
          </div>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}