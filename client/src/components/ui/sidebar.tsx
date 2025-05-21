import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import {
  Users,
  Ticket,
  Layout,
  BarChart2,
  Settings,
  Home,
  FileUp,
  Shield,
  Inbox,
  UserX
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/hooks/useAuth";
import { LoginButton } from "@/components/auth/login-button";

interface SidebarProps {
  user?: {
    name: string;
    role: string;
    avatar?: string;
  };
}

export function Sidebar({ user: defaultUser }: SidebarProps) {
  const [location] = useLocation();
  const { isAuthenticated, user, employee, isAdmin, isImpersonating, impersonatingEmployee } = useAuth();

  // Basic navigation items for all users
  const baseNavItems = [
    { href: "/", label: "Dashboard", icon: <Home className="sidebar-icon" /> },
    { href: "/directory", label: "Staff Directory", icon: <Users className="sidebar-icon" /> },
    { href: "/tickets", label: "Tickets", icon: <Ticket className="sidebar-icon" /> },
    { href: "/my-tickets", label: "My Tickets", icon: <Inbox className="sidebar-icon" /> },
    { href: "/reports", label: "Reports", icon: <BarChart2 className="sidebar-icon" /> },
    { href: "/settings", label: "Settings", icon: <Settings className="sidebar-icon" /> },
  ];
  
  // Admin-only navigation items
  const adminNavItems = [
    { href: "/staff-import", label: "Import Staff", icon: <FileUp className="sidebar-icon" /> },
    { href: "/permissions", label: "Permissions", icon: <Shield className="sidebar-icon" /> },
    { href: "/user-management", label: "User Management", icon: <Users className="sidebar-icon" /> },
  ];
  
  // Combine based on user role
  const navItems = isAdmin 
    ? [...baseNavItems, ...adminNavItems] 
    : baseNavItems;

  return (
    <div className="flex flex-col w-64 bg-sidebar shadow-sm border-r border-border h-screen">
      <div className="p-4 border-b border-border">
        <div className="flex items-center space-x-3">
          <div className="bg-primary rounded-md p-2 w-8 h-8 flex items-center justify-center">
            <Layout className="h-4 w-4 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-lg font-semibold text-primary">HC Staff</h1>
            <p className="text-xs text-muted-foreground">Management System</p>
          </div>
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto pt-5 pb-4">
        <nav className="mt-2 px-3 space-y-1">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "sidebar-link",
                location === item.href
                  ? "sidebar-link-active"
                  : "sidebar-link-inactive"
              )}
            >
              {item.icon}
              {item.label}
            </Link>
          ))}
        </nav>
      </div>
      
      <div className="border-t border-border p-4 space-y-3">
        {isAuthenticated ? (
          <>
            <Link
              href={isImpersonating && impersonatingEmployee
                ? `/employee/${impersonatingEmployee.id}`
                : employee ? `/employee/${employee.id}` : "/settings"}
              className="flex items-center hover:bg-gray-50 p-2 rounded-md transition-colors"
            >
              <Avatar className="h-10 w-10">
                <AvatarImage 
                  src={isImpersonating && impersonatingEmployee 
                    ? impersonatingEmployee.avatar 
                    : employee?.avatar || user?.profileImageUrl} 
                  alt={isImpersonating && impersonatingEmployee && impersonatingEmployee.firstName
                    ? `${impersonatingEmployee.firstName} ${impersonatingEmployee.lastName || ''}`
                    : employee && employee.firstName
                      ? `${employee.firstName} ${employee.lastName || ''}`
                      : user?.firstName || "User"} 
                />
                <AvatarFallback>
                  {isImpersonating && impersonatingEmployee && impersonatingEmployee.firstName
                    ? `${impersonatingEmployee.firstName[0]}${impersonatingEmployee.lastName ? impersonatingEmployee.lastName[0] : ''}`
                    : employee && employee.firstName
                      ? `${employee.firstName[0]}${employee.lastName ? employee.lastName[0] : ''}`
                      : user?.firstName?.[0] || "U"}
                </AvatarFallback>
              </Avatar>
              <div className="ml-3">
                <p className="text-sm font-medium">
                  {isImpersonating && impersonatingEmployee && impersonatingEmployee.firstName
                    ? `${impersonatingEmployee.firstName} ${impersonatingEmployee.lastName || ''}`
                    : employee && employee.firstName
                      ? `${employee.firstName} ${employee.lastName || ''}`
                      : user?.firstName || "User"}
                </p>
                <p className="text-xs text-muted-foreground">
                  {isImpersonating && impersonatingEmployee 
                    ? (impersonatingEmployee.position || "Staff")
                    : employee?.position || "User"}
                  {isAdmin && <span className="ml-1 text-primary">(Admin)</span>}
                </p>
              </div>
            </Link>
            
            {/* Impersonation badge - only shows when actively impersonating */}
            {isImpersonating && impersonatingEmployee && (
              <div className="flex items-center p-2 my-2 bg-amber-50 border border-amber-200 rounded-md text-sm">
                <span className="text-amber-600 font-medium flex items-center">
                  <UserX className="h-4 w-4 mr-1" />
                  Viewing as: {impersonatingEmployee.firstName} {impersonatingEmployee.lastName}
                </span>
              </div>
            )}
            
            {/* Login/Logout button */}
            <LoginButton className="w-full" />
          </>
        ) : (
          <LoginButton className="w-full" />
        )}
      </div>
    </div>
  );
}
