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
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/hooks/useAuth";
import { LoginButton } from "@/components/auth/login-button";
import { ImpersonationControls } from "@/components/auth/impersonation-controls";

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

  const navItems = [
    { href: "/", label: "Dashboard", icon: <Home className="sidebar-icon" /> },
    { href: "/directory", label: "Staff Directory", icon: <Users className="sidebar-icon" /> },
    { href: "/staff-import", label: "Import Staff", icon: <FileUp className="sidebar-icon" /> },
    { href: "/tickets", label: "Tickets", icon: <Ticket className="sidebar-icon" /> },
    { href: "/my-tickets", label: "My Tickets", icon: <Inbox className="sidebar-icon" /> },
    { href: "/reports", label: "Reports", icon: <BarChart2 className="sidebar-icon" /> },
    { href: "/permissions", label: "Permissions", icon: <Shield className="sidebar-icon" /> },
    { href: "/settings", label: "Settings", icon: <Settings className="sidebar-icon" /> },
  ];

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
            <div className="flex items-center">
              <Avatar className="h-10 w-10">
                <AvatarImage 
                  src={isImpersonating && impersonatingEmployee 
                    ? impersonatingEmployee.avatar 
                    : employee?.avatar || user?.profileImageUrl} 
                  alt={isImpersonating && impersonatingEmployee 
                    ? `${impersonatingEmployee.firstName} ${impersonatingEmployee.lastName}`
                    : employee 
                      ? `${employee.firstName} ${employee.lastName}`
                      : user?.firstName || "User"} 
                />
                <AvatarFallback>
                  {isImpersonating && impersonatingEmployee 
                    ? `${impersonatingEmployee.firstName[0]}${impersonatingEmployee.lastName[0]}`
                    : employee 
                      ? `${employee.firstName[0]}${employee.lastName[0]}`
                      : user?.firstName?.[0] || "U"}
                </AvatarFallback>
              </Avatar>
              <div className="ml-3">
                <p className="text-sm font-medium">
                  {isImpersonating && impersonatingEmployee 
                    ? `${impersonatingEmployee.firstName} ${impersonatingEmployee.lastName}`
                    : employee 
                      ? `${employee.firstName} ${employee.lastName}`
                      : user?.firstName || "User"}
                </p>
                <p className="text-xs text-muted-foreground">
                  {isImpersonating && impersonatingEmployee 
                    ? impersonatingEmployee.position
                    : employee?.position || "User"}
                  {isAdmin && <span className="ml-1 text-primary">(Admin)</span>}
                </p>
              </div>
            </div>
            
            {/* Impersonation controls for admins */}
            {(isAdmin || isImpersonating) && (
              <ImpersonationControls />
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
