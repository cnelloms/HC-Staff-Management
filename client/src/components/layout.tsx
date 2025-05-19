import { ReactNode } from "react";
import { Link, useLocation } from "wouter";
import { Sidebar } from "./ui/sidebar";
import { Button } from "@/components/ui/button";
import { Bell, PlusCircle, Search, User } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";

interface LayoutProps {
  children: ReactNode;
  title?: string;
}

const pageMap = {
  "/": "Dashboard",
  "/directory": "Staff Directory",
  "/tickets": "Tickets",
  "/access-management": "Access Management",
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
        <header className="bg-white shadow-sm z-10">
          <div className="flex justify-between h-16 px-6">
            <div className="flex items-center">
              <h1 className="text-xl font-semibold text-primary">{title || currentPage}</h1>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="relative w-64">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input 
                  type="search"
                  placeholder="Search staff or tickets..."
                  className="pl-8"
                />
              </div>
              
              <Button variant="default">
                <PlusCircle className="mr-2 h-4 w-4" />
                New Employee
              </Button>
              
              <Button variant="ghost" size="icon" className="text-muted-foreground">
                <Bell className="h-5 w-5" />
              </Button>
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="text-muted-foreground">
                    <User className="h-5 w-5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel>My Account</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem>Profile</DropdownMenuItem>
                  <DropdownMenuItem>Settings</DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem>Sign out</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </header>
        
        <main className="p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
