import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PlusIcon, CalendarIcon, UserIcon } from "lucide-react";
import { Ticket } from "@/types";
import { StatusBadge } from "@/components/ui/status-badge";
import { Link } from "wouter";
import { format } from "date-fns";

export function TicketOverview() {
  const { data: tickets, isLoading } = useQuery<Ticket[]>({
    queryKey: ['/api/tickets'],
  });

  const countByStatus = {
    open: tickets?.filter(t => t.status === 'open').length || 0,
    in_progress: tickets?.filter(t => t.status === 'in_progress').length || 0,
    closed: tickets?.filter(t => t.status === 'closed').length || 0
  };

  // Get the 3 most recent tickets
  const recentTickets = tickets
    ?.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 3);

  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg font-medium">Ticket Overview</CardTitle>
      </CardHeader>
      <CardContent className="pb-0">
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-muted p-4 rounded-lg">
            <p className="text-sm font-medium text-muted-foreground">Open</p>
            <p className="mt-1 text-3xl font-semibold">
              {isLoading ? (
                <span className="animate-pulse">-</span>
              ) : (
                countByStatus.open
              )}
            </p>
            <div className="flex items-center mt-2 text-xs text-muted-foreground">
              <svg className="h-4 w-4 text-destructive mr-1" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
              <span>12% from last week</span>
            </div>
          </div>
          <div className="bg-muted p-4 rounded-lg">
            <p className="text-sm font-medium text-muted-foreground">In Progress</p>
            <p className="mt-1 text-3xl font-semibold">
              {isLoading ? (
                <span className="animate-pulse">-</span>
              ) : (
                countByStatus.in_progress
              )}
            </p>
            <div className="flex items-center mt-2 text-xs text-muted-foreground">
              <svg className="h-4 w-4 text-secondary mr-1" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 10l7-7m0 0l7 7m-7-7v18" />
              </svg>
              <span>5% from last week</span>
            </div>
          </div>
          <div className="bg-muted p-4 rounded-lg">
            <p className="text-sm font-medium text-muted-foreground">Closed</p>
            <p className="mt-1 text-3xl font-semibold">
              {isLoading ? (
                <span className="animate-pulse">-</span>
              ) : (
                countByStatus.closed
              )}
            </p>
            <div className="flex items-center mt-2 text-xs text-muted-foreground">
              <svg className="h-4 w-4 text-secondary mr-1" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 10l7-7m0 0l7 7m-7-7v18" />
              </svg>
              <span>15% from last week</span>
            </div>
          </div>
        </div>

        <div className="border-t border-border pt-4">
          <h4 className="text-sm font-medium text-foreground mb-2">Recent Tickets</h4>
          <div className="overflow-hidden bg-white shadow-sm rounded-md">
            <ul className="divide-y divide-border">
              {isLoading ? (
                Array.from({ length: 3 }).map((_, index) => (
                  <li key={index} className="animate-pulse p-4">
                    <div className="flex justify-between mb-2">
                      <div className="h-4 w-1/2 bg-muted rounded" />
                      <div className="h-4 w-16 bg-muted rounded" />
                    </div>
                    <div className="flex justify-between">
                      <div className="h-3 w-1/4 bg-muted rounded" />
                      <div className="h-3 w-1/4 bg-muted rounded" />
                    </div>
                  </li>
                ))
              ) : (
                recentTickets?.map((ticket) => (
                  <li key={ticket.id}>
                    <Link href={`/tickets/${ticket.id}`} className="block px-4 py-4 hover:bg-muted/50">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-medium text-primary truncate">
                            {ticket.title || "Untitled Ticket"}
                          </p>
                          <div className="ml-2 flex-shrink-0">
                            <StatusBadge status={ticket.status || "open"} label={ticket.status || "Open"} className="text-xs" />
                          </div>
                        </div>
                        <div className="mt-2 sm:flex sm:justify-between">
                          <div className="sm:flex">
                            <p className="flex items-center text-sm text-muted-foreground">
                              <UserIcon className="flex-shrink-0 mr-1.5 h-5 w-5 text-muted-foreground" />
                              {ticket.requestor ? 
                                `${ticket.requestor.firstName} ${ticket.requestor.lastName}` : 
                                "User"}
                            </p>
                          </div>
                          <div className="mt-2 flex items-center text-sm text-muted-foreground sm:mt-0">
                            <CalendarIcon className="flex-shrink-0 mr-1.5 h-5 w-5 text-muted-foreground" />
                            <p>
                              {ticket.status === 'closed' ? 'Closed on ' : 'Opened on '}
                              <time dateTime={
                                ticket.status === 'closed' && ticket.closedAt 
                                  ? ticket.closedAt 
                                  : ticket.createdAt || new Date().toISOString()
                              }>
                                {format(
                                  new Date(
                                    ticket.status === 'closed' && ticket.closedAt 
                                      ? ticket.closedAt 
                                      : ticket.createdAt || new Date()
                                  ), 
                                  'MMM d, yyyy'
                                )}
                              </time>
                            </p>
                          </div>
                        </div>
                    </Link>
                  </li>
                ))
              )}
            </ul>
          </div>
        </div>
      </CardContent>
      <CardFooter className="bg-muted pt-2 pb-2">
        <Link href="/tickets" className="text-sm font-medium text-primary hover:text-primary/80">
          View all tickets
        </Link>
      </CardFooter>
    </Card>
  );
}
