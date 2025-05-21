import { ReactNode } from "react";
import { Link, useLocation } from "wouter";
import { Sidebar } from "./ui/sidebar";
import { Button } from "@/components/ui/button";
import { 
  PlusCircle, 
  MoreVertical, 
  Plus 
} from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import { NotificationCenter } from "./notifications/notification-center";
import { ProfileHeader } from "@/components/profile/profile-header";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface LayoutProps {
  children: ReactNode;
  title?: string;
}

const pageMap = {
  "/": "Dashboard",
  "/directory": "Staff Directory",
  "/tickets": "Tickets",
  "/reports": "Reports",
  "/settings": "Settings",
};

export default function Layout({ children, title }: LayoutProps) {
  const [location] = useLocation();
  const currentPage = pageMap[location as keyof typeof pageMap] || "Dashboard";

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar />
      
      <div className="flex-1 overflow-auto">
        <header className="bg-background shadow-sm z-10">
          <div className="flex justify-between h-16 px-4 md:px-6">
            <div className="flex items-center">
              <h1 className="text-xl font-semibold text-primary truncate max-w-[180px] md:max-w-full">{title || currentPage}</h1>
            </div>
            
            {/* Desktop header actions */}
            <div className="hidden md:flex items-center space-x-4">
              <Button variant="default" asChild>
                <Link href="/tickets/new">
                  <PlusCircle className="mr-2 h-4 w-4" />
                  New Staff Ticket
                </Link>
              </Button>
              
              <NotificationCenter />
              
              <ThemeToggle />
              
              <ProfileHeader />
            </div>
            
            {/* Mobile header actions */}
            <div className="flex md:hidden items-center space-x-2">
              {/* Mobile Quick Create Button */}
              <Button variant="outline" size="icon" asChild className="h-8 w-8">
                <Link href="/tickets/new">
                  <Plus className="h-4 w-4" />
                </Link>
              </Button>
            
              {/* Mobile Notification Center */}
              <NotificationCenter />
              
              {/* Mobile dropdown menu for other options */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <MoreVertical className="h-4 w-4" />
                    <span className="sr-only">More options</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem>
                    <ThemeToggle />
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href="/profile">My Profile</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/settings">Settings</Link>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              
              {/* Mobile Profile Header - simplified */}
              <ProfileHeader compact={true} />
            </div>
          </div>
        </header>
        
        <main className="p-4 md:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
