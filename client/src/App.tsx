import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/theme-provider";
import { UserProvider } from "@/context/user-context";
import NotFound from "@/pages/not-found";

// Pages
import Dashboard from "@/pages/dashboard";
import Directory from "@/pages/directory";
import Tickets from "@/pages/tickets";
import MyTickets from "@/pages/my-tickets";
import AccessManagement from "@/pages/access-management";
import Reports from "@/pages/reports";
import Settings from "@/pages/settings";
import EmployeeProfile from "@/pages/employee-profile";
import UserProfile from "@/pages/profile";
import TicketDetail from "@/pages/ticket-detail";
import NewEmployee from "@/pages/new-employee";
import NewTicket from "@/pages/new-ticket";
import Permissions from "@/pages/permissions";
import StaffImportPage from "@/pages/staff-import";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Dashboard} />
      <Route path="/directory" component={Directory} />
      <Route path="/staff-import" component={StaffImportPage} />
      <Route path="/tickets" component={Tickets} />
      <Route path="/my-tickets" component={MyTickets} />
      <Route path="/tickets/new" component={NewTicket} />
      <Route path="/tickets/:id" component={TicketDetail} />
      <Route path="/access-management" component={AccessManagement} />
      <Route path="/permissions" component={Permissions} />
      <Route path="/reports" component={Reports} />
      <Route path="/settings" component={Settings} />
      <Route path="/profile" component={UserProfile} />
      <Route path="/employee/new" component={NewEmployee} />
      <Route path="/employee/:id" component={EmployeeProfile} />
      {/* Fallback to 404 */}
      <Route component={NotFound} />
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
