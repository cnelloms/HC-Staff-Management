import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/theme-provider";
import { UserProvider } from "@/context/user-context";
import NotFound from "@/pages/not-found";
import { ProtectedRoute } from "./components/auth/protected-route";
import { AdminRoute } from "./components/auth/admin-route";
import { useState, useEffect } from "react";
import { Loader2 } from "lucide-react";

// Pages
import Dashboard from "@/pages/dashboard";
import Directory from "@/pages/directory";
import Tickets from "@/pages/tickets";
import MyTickets from "@/pages/my-tickets";
import Reports from "@/pages/reports";
import Settings from "@/pages/settings";
import EmployeeProfile from "@/pages/employee-profile";
import UserProfile from "@/pages/profile-new";
import TicketDetail from "@/pages/ticket-detail";
import EditTicket from "@/pages/edit-ticket";
import NewEmployee from "@/pages/new-employee";
import NewTicket from "@/pages/new-ticket";
import Permissions from "@/pages/permissions";
import StaffImportPage from "@/pages/staff-import";
import SimpleLoginPage from "@/pages/simple-login";
import EmergencyLoginPage from "@/pages/emergency-login";
import DirectLoginPage from "@/pages/direct-login";
import UserManagementPage from "@/pages/user-management";
import TestLoginPage from "@/pages/test-login";

function Router() {
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  
  useEffect(() => {
    // Check if user is authenticated
    async function checkAuth() {
      try {
        const response = await fetch('/api/auth/user', {
          credentials: 'include'
        });
        
        if (response.ok) {
          const userData = await response.json();
          if (userData) {
            setIsAuthenticated(true);
            localStorage.setItem('auth_user', JSON.stringify(userData));
          }
        }
      } catch (error) {
        console.error('Error checking authentication:', error);
      } finally {
        setIsLoading(false);
      }
    }
    
    checkAuth();
  }, []);
  
  // Show loading screen while checking authentication
  if (isLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
          <h2 className="text-xl font-medium">Loading application...</h2>
        </div>
      </div>
    );
  }
  
  // Show login page if not authenticated
  if (!isAuthenticated) {
    // Check if we're on emergency login page
    if (window.location.pathname === '/emergency-login') {
      return <EmergencyLoginPage />;
    }
    // Default to regular login
    return <SimpleLoginPage />;
  }

  return (
    <Switch>
      <Route path="/login" component={SimpleLoginPage} />
      <Route path="/emergency-login" component={EmergencyLoginPage} />
      <Route path="/direct-login" component={DirectLoginPage} />
      <Route path="/test-login" component={TestLoginPage} />
      
      {/* Protected Routes - require authentication */}
      <Route path="/">
        {() => <Dashboard />}
      </Route>
      
      <Route path="/directory">
        {() => <Directory />}
      </Route>
      
      <Route path="/staff-import">
        {() => <StaffImportPage />}
      </Route>
      
      <Route path="/tickets">
        {() => <Tickets />}
      </Route>
      
      <Route path="/my-tickets">
        {() => <MyTickets />}
      </Route>
      
      <Route path="/tickets/new">
        {() => <NewTicket />}
      </Route>
      
      <Route path="/tickets/:id/edit">
        {() => <EditTicket />}
      </Route>
      
      <Route path="/tickets/:id">
        {() => <TicketDetail />}
      </Route>
      
      <Route path="/permissions">
        {() => <Permissions />}
      </Route>
      
      <Route path="/reports">
        {() => <Reports />}
      </Route>
      
      <Route path="/settings">
        {() => <Settings />}
      </Route>
      
      <Route path="/ticket-templates">
        {() => <TicketTemplatesPage />}
      </Route>
      
      <Route path="/user-management">
        {() => <UserManagementPage />}
      </Route>
      
      <Route path="/profile">
        {() => <UserProfile />}
      </Route>
      
      <Route path="/employee/new">
        {() => <NewEmployee />}
      </Route>
      
      <Route path="/employee/:id/edit">
        {() => <NewEmployee />}
      </Route>
      
      <Route path="/employee/:id">
        {() => <EmployeeProfile />}
      </Route>
      
      {/* Fallback to 404 */}
      <Route>
        {() => <NotFound />}
      </Route>
    </Switch>
  );
}

function App() {
  return (
    <ThemeProvider defaultTheme="system" storageKey="staff-management-theme">
      <QueryClientProvider client={queryClient}>
        <UserProvider>
          <TooltipProvider>
            <Toaster />
            <Router />
          </TooltipProvider>
        </UserProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );
}

export default App;
