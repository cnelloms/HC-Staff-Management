import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import {
  Users,
  Ticket,
  Layout,
  Key,
  BarChart2,
  Settings,
  Home,
  ShieldCheck,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface SidebarProps {
  user?: {
    name: string;
    role: string;
    avatar?: string;
  };
}

export function Sidebar({ user = { name: 'Sarah Johnson', role: 'HR Administrator', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80' } }: SidebarProps) {
  const [location] = useLocation();

  const navItems = [
    { href: "/", label: "Dashboard", icon: <Home className="sidebar-icon" /> },
    { href: "/directory", label: "Staff Directory", icon: <Users className="sidebar-icon" /> },
    { href: "/tickets", label: "Tickets", icon: <Ticket className="sidebar-icon" /> },
    { href: "/access-management", label: "Access Management", icon: <Key className="sidebar-icon" /> },
    { href: "/permissions", label: "Permissions", icon: <ShieldCheck className="sidebar-icon" /> },
    { href: "/reports", label: "Reports", icon: <BarChart2 className="sidebar-icon" /> },
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
      
      <div className="border-t border-border p-4">
        <div className="flex items-center">
          <Avatar className="h-10 w-10">
            <AvatarImage src={user.avatar} alt={user.name} />
            <AvatarFallback>{user.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
          </Avatar>
          <div className="ml-3">
            <p className="text-sm font-medium">{user.name}</p>
            <p className="text-xs text-muted-foreground">{user.role}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
