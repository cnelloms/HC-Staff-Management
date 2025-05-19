import Layout from "@/components/layout";
import { TicketTable } from "@/components/tickets/ticket-table";

export default function Tickets() {
  return (
    <Layout title="Tickets">
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold tracking-tight mb-6">Ticket Management</h2>
          <p className="text-muted-foreground mb-6">
            Track and manage support tickets, system access requests, and onboarding tasks.
          </p>
        </div>

        <TicketTable />
      </div>
    </Layout>
  );
}
