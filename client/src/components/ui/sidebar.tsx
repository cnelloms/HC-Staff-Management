import { useState, useEffect } from "react";
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
  UserX,
  Menu,
  X,
  Server,
  ClipboardCheck
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { LoginButton } from "@/components/auth/login-button";
import { useProfileData, getInitials } from "@/hooks/useProfileData";

interface SidebarProps {
  user?: {
    name: string;
    role: string;
    avatar?: string;
  };
}

export function Sidebar({ user: defaultUser }: SidebarProps) {
  const [location] = useLocation();
  const { isAuthenticated, user, employee, isAdmin } = useAuth();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  
  // Close sidebar when navigating on mobile
  useEffect(() => {
    setIsSidebarOpen(false);
  }, [location]);

  // Close sidebar on window resize if screen becomes large
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) { // lg breakpoint
        setIsSidebarOpen(false);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Basic navigation items for all users
  const baseNavItems = [
    { href: "/", label: "Dashboard", icon: <Home className="sidebar-icon" /> },
    { href: "/directory", label: "Staff Directory", icon: <Users className="sidebar-icon" /> },
    { href: "/tickets", label: "Tickets", icon: <Ticket className="sidebar-icon" /> },
    { href: "/my-tickets", label: "My Tickets", icon: <Inbox className="sidebar-icon" /> },
    { href: "/reports", label: "Reports", icon: <BarChart2 className="sidebar-icon" /> },
    { href: "/settings", label: "Settings", icon: <Settings className="sidebar-icon" /> },
  ];
  
  // Manager-level navigation items
  const managerNavItems = [
    { href: "/change-requests", label: "Change Approvals", icon: <ClipboardCheck className="sidebar-icon" /> },
  ];
  
  // User-specific navigation items
  const userNavItems = [
    { href: "/me", label: "My Profile", icon: <Users className="sidebar-icon" /> },
  ];
  
  // Admin-only navigation items
  const adminNavItems = [
    { href: "/admin-dashboard", label: "Admin Dashboard", icon: <BarChart2 className="sidebar-icon" /> },
    { href: "/admin/requests", label: "Change Request Approvals", icon: <ClipboardCheck className="sidebar-icon" /> },
    { href: "/staff-import", label: "Import Staff", icon: <FileUp className="sidebar-icon" /> },
    { href: "/permissions", label: "Permissions", icon: <Shield className="sidebar-icon" /> },
    { href: "/user-management", label: "User Management", icon: <Users className="sidebar-icon" /> },
    { href: "/systems", label: "Systems Management", icon: <Server className="sidebar-icon" /> },
    { href: "/ticket-templates", label: "Ticket Templates", icon: <Ticket className="sidebar-icon" /> },
  ];
  
  // Check if user has a manager role
  const userRoles = (user as any)?.roles || [];
  const isManager = userRoles.includes("manager") || isAdmin;
  
  // Combine based on user role
  const navItems = isAdmin 
    ? [...userNavItems, ...baseNavItems, ...managerNavItems, ...adminNavItems] 
    : isManager
    ? [...userNavItems, ...baseNavItems, ...managerNavItems]
    : [...userNavItems, ...baseNavItems];

  // Mobile toggle button
  const MobileMenuToggle = () => (
    <Button 
      variant="ghost" 
      size="icon" 
      className="lg:hidden fixed top-4 left-4 z-50 bg-background/80 backdrop-blur-sm shadow-sm"
      onClick={() => setIsSidebarOpen(!isSidebarOpen)}
    >
      {isSidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
    </Button>
  );

  // Profile section for sidebar
  const ProfileSection = () => {
    const { profileData, isLoading } = useProfileData();
    
    if (isLoading || !profileData) {
      return (
        <>
          <Avatar className="h-10 w-10">
            <AvatarFallback>...</AvatarFallback>
          </Avatar>
          <div className="ml-3">
            <p className="text-sm font-medium">Loading...</p>
            <p className="text-xs text-muted-foreground">...</p>
          </div>
        </>
      );
    }
    
    const initials = getInitials(profileData.firstName, profileData.lastName);
    const fullName = `${profileData.firstName || ''} ${profileData.lastName || ''}`.trim() || 'User';
    
    // Handle position/department display
    let positionDisplay = '';
    if (profileData.position) {
      if (typeof profileData.position === 'object' && 'title' in profileData.position) {
        positionDisplay = profileData.position.title as string;
      } else if (typeof profileData.position === 'string') {
        positionDisplay = profileData.position;
      }
    }
    
    let departmentDisplay = '';
    if (profileData.department) {
      if (typeof profileData.department === 'object' && 'name' in profileData.department) {
        departmentDisplay = profileData.department.name as string;
      } else if (typeof profileData.department === 'string') {
        departmentDisplay = profileData.department;
      }
    }
    
    const positionOrDepartment = positionDisplay || departmentDisplay || "User";
    
    return (
      <>
        <Avatar className="h-10 w-10">
          <AvatarImage src={profileData.avatar} alt={fullName} />
          <AvatarFallback>{initials}</AvatarFallback>
        </Avatar>
        <div className="ml-3">
          <p className="text-sm font-medium">{fullName}</p>
          <p className="text-xs text-muted-foreground">
            {positionOrDepartment}
            {profileData.isAdmin && <span className="ml-1 text-primary">(Admin)</span>}
          </p>
        </div>
      </>
    );
  };

  return (
    <>
      <MobileMenuToggle />
      
      {/* Desktop sidebar - always visible on large screens */}
      <div className="hidden lg:flex flex-col w-64 bg-sidebar shadow-sm border-r border-border h-screen">
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
              <Link href="/profile" className="flex items-center hover:bg-gray-50 p-2 rounded-md transition-colors cursor-pointer">
                <ProfileSection />
              </Link>
              
              {/* Login/Logout button */}
              <LoginButton className="w-full" />
            </>
          ) : (
            <LoginButton className="w-full" />
          )}
        </div>
      </div>
      
      {/* Mobile sidebar - only visible when toggled */}
      <div className={cn(
        "lg:hidden fixed inset-0 z-40 flex transform transition-transform duration-300 ease-in-out",
        isSidebarOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        {/* Backdrop */}
        <div 
          className={cn(
            "fixed inset-0 bg-black/30 backdrop-blur-sm",
            isSidebarOpen ? "opacity-100" : "opacity-0 pointer-events-none"
          )}
          onClick={() => setIsSidebarOpen(false)}
        />
        
        {/* Sidebar content */}
        <div className="relative flex flex-col w-72 max-w-[80vw] bg-sidebar shadow-xl h-full overflow-y-auto">
          <div className="p-4 border-b border-border">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="bg-primary rounded-md p-2 w-8 h-8 flex items-center justify-center">
                  <Layout className="h-4 w-4 text-primary-foreground" />
                </div>
                <div>
                  <h1 className="text-lg font-semibold text-primary">HC Staff</h1>
                  <p className="text-xs text-muted-foreground">Management System</p>
                </div>
              </div>
              <Button 
                variant="ghost" 
                size="icon" 
                className="lg:hidden"
                onClick={() => setIsSidebarOpen(false)}
              >
                <X className="h-5 w-5" />
              </Button>
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
                  onClick={() => setIsSidebarOpen(false)}
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
                  href="/profile" 
                  className="flex items-center hover:bg-gray-50 p-2 rounded-md transition-colors cursor-pointer"
                  onClick={() => setIsSidebarOpen(false)}
                >
                  <ProfileSection />
                </Link>
                
                {/* Login/Logout button */}
                <LoginButton className="w-full" />
              </>
            ) : (
              <LoginButton className="w-full" />
            )}
          </div>
        </div>
      </div>
    </>
  );
}
