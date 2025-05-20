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

// Pages
import Dashboard from "@/pages/dashboard";
import Directory from "@/pages/directory";
import Tickets from "@/pages/tickets";
import MyTickets from "@/pages/my-tickets";
import Reports from "@/pages/reports";
import Settings from "@/pages/settings";
import EmployeeProfile from "@/pages/employee-profile";
import UserProfile from "@/pages/profile";
import TicketDetail from "@/pages/ticket-detail";
import EditTicket from "@/pages/edit-ticket";
import NewEmployee from "@/pages/new-employee";
import NewTicket from "@/pages/new-ticket";
import Permissions from "@/pages/permissions";
import StaffImportPage from "@/pages/staff-import";
import LoginPage from "@/pages/login";
import UserManagementPage from "@/pages/user-management";

function Router() {
  return (
    <Switch>
      <Route path="/login" component={LoginPage} />
      
      {/* Protected Routes - require authentication */}
      <Route path="/">
        {() => (
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        )}
      </Route>
      <Route path="/directory">
        {() => (
          <ProtectedRoute>
            <Directory />
          </ProtectedRoute>
        )}
      </Route>
      <Route path="/staff-import">
        {() => (
          <ProtectedRoute>
            <StaffImportPage />
          </ProtectedRoute>
        )}
      </Route>
      <Route path="/tickets">
        {() => (
          <ProtectedRoute>
            <Tickets />
          </ProtectedRoute>
        )}
      </Route>
      <Route path="/my-tickets">
        {() => (
          <ProtectedRoute>
            <MyTickets />
          </ProtectedRoute>
        )}
      </Route>
      <Route path="/tickets/new">
        {() => (
          <ProtectedRoute>
            <NewTicket />
          </ProtectedRoute>
        )}
      </Route>
      <Route path="/tickets/:id/edit">
        {(params) => (
          <ProtectedRoute>
            <EditTicket />
          </ProtectedRoute>
        )}
      </Route>
      <Route path="/tickets/:id">
        {(params) => (
          <ProtectedRoute>
            <TicketDetail />
          </ProtectedRoute>
        )}
      </Route>
      <Route path="/permissions">
        {() => (
          <ProtectedRoute>
            <Permissions />
          </ProtectedRoute>
        )}
      </Route>
      <Route path="/reports">
        {() => (
          <ProtectedRoute>
            <Reports />
          </ProtectedRoute>
        )}
      </Route>
      <Route path="/settings">
        {() => (
          <ProtectedRoute>
            <Settings />
          </ProtectedRoute>
        )}
      </Route>
      <Route path="/user-management">
        {() => (
          <AdminRoute>
            <UserManagementPage />
          </AdminRoute>
        )}
      </Route>
      <Route path="/profile">
        {() => (
          <ProtectedRoute>
            <UserProfile />
          </ProtectedRoute>
        )}
      </Route>
      <Route path="/employee/new">
        {() => (
          <ProtectedRoute>
            <NewEmployee />
          </ProtectedRoute>
        )}
      </Route>
      <Route path="/employee/:id">
        {(params) => (
          <ProtectedRoute>
            <EmployeeProfile />
          </ProtectedRoute>
        )}
      </Route>
      
      {/* Fallback to 404 */}
      <Route>
        {() => (
          <ProtectedRoute>
            <NotFound />
          </ProtectedRoute>
        )}
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
