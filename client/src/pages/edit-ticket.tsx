import { useParams } from "wouter";
import { useQuery } from "@tanstack/react-query";
import Layout from "@/components/layout";
import { TicketForm } from "@/components/tickets/ticket-form";
import { Ticket } from "@/types";

export default function EditTicket() {
  const { id } = useParams<{ id: string }>();
  const ticketId = parseInt(id);

  const { data: ticket, isLoading } = useQuery<Ticket>({
    queryKey: [`/api/tickets/${ticketId}`],
  });

  return (
    <Layout title="Edit Ticket">
      <div className="max-w-3xl mx-auto">
        <h2 className="text-2xl font-bold tracking-tight mb-6">Edit Ticket #{ticketId}</h2>
        {isLoading ? (
          <div className="flex items-center justify-center p-8">
            <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
            <p className="ml-3 text-muted-foreground">Loading ticket data...</p>
          </div>
        ) : ticket ? (
          <TicketForm ticketId={ticketId} defaultValues={ticket} />
        ) : (
          <div className="text-center p-8">
            <h3 className="text-lg font-bold">Ticket Not Found</h3>
            <p className="text-muted-foreground mt-2">The ticket you're trying to edit could not be found.</p>
          </div>
        )}
      </div>
    </Layout>
  );
}