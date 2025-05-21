import { useLocation } from "wouter";
import Layout from "@/components/layout";
import { TicketForm } from "@/components/tickets/ticket-form-fixed";

export default function NewTicket() {
  const [location] = useLocation();
  const params = new URLSearchParams(location.split('?')[1]);
  const employeeId = params.get('employeeId') ? parseInt(params.get('employeeId')!) : undefined;

  return (
    <Layout title="Create New Ticket">
      <div className="max-w-3xl mx-auto">
        <h2 className="text-2xl font-bold tracking-tight mb-6">Create New Ticket</h2>
        <TicketForm employeeId={employeeId} />
      </div>
    </Layout>
  );
}
