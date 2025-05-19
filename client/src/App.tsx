import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";

// Pages
import Dashboard from "@/pages/dashboard";
import Directory from "@/pages/directory";
import Tickets from "@/pages/tickets";
import AccessManagement from "@/pages/access-management";
import Reports from "@/pages/reports";
import Settings from "@/pages/settings";
import EmployeeProfile from "@/pages/employee-profile";
import TicketDetail from "@/pages/ticket-detail";
import NewEmployee from "@/pages/new-employee";
import NewTicket from "@/pages/new-ticket";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Dashboard} />
      <Route path="/directory" component={Directory} />
      <Route path="/tickets" component={Tickets} />
      <Route path="/tickets/new" component={NewTicket} />
      <Route path="/tickets/:id" component={TicketDetail} />
      <Route path="/access-management" component={AccessManagement} />
      <Route path="/reports" component={Reports} />
      <Route path="/settings" component={Settings} />
      <Route path="/employee/new" component={NewEmployee} />
      <Route path="/employee/:id" component={EmployeeProfile} />
      {/* Fallback to 404 */}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
