import Layout from "@/components/layout";
import { SummaryCard } from "@/components/dashboard/summary-card";
import { RecentActivity } from "@/components/dashboard/recent-activity";
import { TicketOverview } from "@/components/dashboard/ticket-overview";
import { SystemAccessTable } from "@/components/dashboard/system-access-table";
import { useQuery } from "@tanstack/react-query";
import { DashboardStats } from "@/types";
import { 
  Users, 
  Ticket, 
  Key, 
  CheckCircle
} from "lucide-react";

export default function Dashboard() {
  const { data: stats, isLoading } = useQuery<DashboardStats>({
    queryKey: ['/api/dashboard/stats'],
  });

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
            value={isLoading ? "-" : stats?.totalEmployees.toString() || "0"}
            change={stats?.employeeGrowth}
            icon={<Users />}
            link={{ href: "/directory", label: "View all staff" }}
          />
          <SummaryCard
            title="Pending Tickets"
            value={isLoading ? "-" : stats?.pendingTickets.toString() || "0"}
            change={stats?.ticketGrowth}
            icon={<Ticket />}
            iconBgColor="bg-accent/10"
            iconColor="text-accent"
            link={{ href: "/tickets", label: "View all tickets" }}
          />
          <SummaryCard
            title="System Access"
            value={isLoading ? "-" : `${stats?.systemAccessRate}%` || "0%"}
            change={stats?.systemAccessGrowth}
            icon={<Key />}
            iconBgColor="bg-secondary/10"
            iconColor="text-secondary"
            link={{ href: "/access-management", label: "View access details" }}
          />
          <SummaryCard
            title="Onboarding"
            value={isLoading ? "-" : stats?.onboardingCount.toString() || "0"}
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

        {/* System Access Section */}
        <div className="mt-2">
          <SystemAccessTable />
        </div>
      </div>
    </Layout>
  );
}
