import Layout from "@/components/layout";
import { SummaryCard } from "@/components/dashboard/summary-card";
import { RecentActivity } from "@/components/dashboard/recent-activity";
import { TicketOverview } from "@/components/dashboard/ticket-overview";
import { useQuery } from "@tanstack/react-query";
import { DashboardStats } from "@/types";
import { useAuth } from "@/hooks/useAuth";
import { useEffect } from "react";
import { useLocation } from "wouter";
import { 
  Users, 
  Ticket, 
  CheckCircle,
  Loader2
} from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function Dashboard() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const [, navigate] = useLocation();
  
  // Redirect to login if not authenticated
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      navigate("/login");
    }
  }, [isAuthenticated, authLoading, navigate]);

  const { data: stats, isLoading: statsLoading, error } = useQuery<DashboardStats>({
    queryKey: ['/api/dashboard/stats'],
    enabled: isAuthenticated,
  });

  const isLoading = authLoading || statsLoading;

  if (authLoading) {
    return (
      <Layout title="Loading...">
        <div className="flex flex-col items-center justify-center min-h-[60vh]">
          <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
          <h2 className="text-xl font-medium">Loading dashboard...</h2>
        </div>
      </Layout>
    );
  }

  if (!isAuthenticated) {
    return (
      <Layout title="Sign In Required">
        <Card className="p-6 max-w-md mx-auto mt-12">
          <Alert className="mb-4">
            <AlertTitle>Authentication Required</AlertTitle>
            <AlertDescription>
              You need to sign in to access the dashboard.
            </AlertDescription>
          </Alert>
          <Button onClick={() => navigate("/login")} className="w-full">
            Go to Login
          </Button>
        </Card>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout title="Dashboard Error">
        <Alert variant="destructive" className="mb-6">
          <AlertTitle>Error loading dashboard data</AlertTitle>
          <AlertDescription>
            There was a problem loading the dashboard information. Please try refreshing the page.
          </AlertDescription>
        </Alert>
        <Button onClick={() => window.location.reload()} variant="outline">
          Refresh Page
        </Button>
      </Layout>
    );
  }

  return (
    <Layout title="Dashboard">
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold tracking-tight mb-6">Staff Management Dashboard</h2>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          <SummaryCard
            title="Total Staff"
            value={isLoading ? "-" : stats?.totalEmployees?.toString() || "0"}
            change={stats?.employeeGrowth}
            icon={<Users />}
            link={{ href: "/directory", label: "View all staff" }}
          />
          <SummaryCard
            title="Pending Tickets"
            value={isLoading ? "-" : stats?.pendingTickets?.toString() || "0"}
            change={stats?.ticketGrowth}
            icon={<Ticket />}
            iconBgColor="bg-accent/10"
            iconColor="text-accent"
            link={{ href: "/tickets", label: "View all tickets" }}
          />

          <SummaryCard
            title="Onboarding"
            value={isLoading ? "-" : stats?.onboardingCount?.toString() || "0"}
            icon={<CheckCircle />}
            iconBgColor="bg-primary/10"
            iconColor="text-primary"
            link={{ href: "/directory?status=onboarding", label: "Manage onboarding" }}
          />
        </div>

        {/* Main Dashboard Content Sections */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <RecentActivity />
          <TicketOverview />
        </div>
      </div>
    </Layout>
  );
}
