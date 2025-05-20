import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import Layout from "@/components/layout";
import { useCurrentUser } from "@/context/user-context";
import { Ticket } from "@/types";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { StatusBadge } from "@/components/ui/status-badge";
import { format } from "date-fns";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Inbox, 
  Clock, 
  CheckCircle,
  UserCircle,
  Filter,
  UserPlus,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";

export default function MyTickets() {
  const { currentUser } = useCurrentUser();
  const [filter, setFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  
  const { data: assignedTickets, isLoading } = useQuery({
    queryKey: ['/api/tickets/assigned', currentUser?.id],
    enabled: !!currentUser?.id,
  });

  // Filter tickets based on status and search term
  const filteredTickets = Array.isArray(assignedTickets) 
    ? assignedTickets.filter((ticket: Ticket) => {
        // Apply status filter
        if (filter !== "all" && ticket.status !== filter) {
          return false;
        }
        
        // Apply search filter
        if (searchTerm) {
          const searchLower = searchTerm.toLowerCase();
          return (
            ticket.title.toLowerCase().includes(searchLower) ||
            ticket.description.toLowerCase().includes(searchLower) ||
            (ticket.requestor && 
              `${ticket.requestor.firstName} ${ticket.requestor.lastName}`
                .toLowerCase()
                .includes(searchLower)
            )
          );
        }
        
        return true;
      }) 
    : [];
  
  // Group tickets by status
  const openTickets = filteredTickets.filter((t: Ticket) => t.status === "open");
  const inProgressTickets = filteredTickets.filter((t: Ticket) => t.status === "in_progress");
  const closedTickets = filteredTickets.filter((t: Ticket) => t.status === "closed");
  
  // Calculate statistics
  const totalAssigned = Array.isArray(assignedTickets) ? assignedTickets.length : 0;
  const totalOpen = Array.isArray(assignedTickets) 
    ? assignedTickets.filter((t: Ticket) => t.status === "open").length 
    : 0;
  const totalInProgress = Array.isArray(assignedTickets)
    ? assignedTickets.filter((t: Ticket) => t.status === "in_progress").length
    : 0;
  const totalClosed = Array.isArray(assignedTickets)
    ? assignedTickets.filter((t: Ticket) => t.status === "closed").length
    : 0;
  
  // Staff onboarding tickets
  const onboardingTickets = filteredTickets.filter(
    (t: Ticket) => t.type === "new_staff_request"
  );

  return (
    <Layout title="My Tickets">
      <div className="container mx-auto py-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">My Tickets</h1>
            <p className="text-muted-foreground mt-1">
              Manage tickets assigned to you
            </p>
          </div>
          <Link href="/tickets/new">
            <Button>
              <UserPlus className="mr-2 h-4 w-4" />
              New Staff Request
            </Button>
          </Link>
        </div>
        
        {/* Stats cards */}
        <div className="grid gap-4 grid-cols-1 md:grid-cols-4 mb-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Assigned
              </CardTitle>
              <Inbox className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalAssigned}</div>
              <p className="text-xs text-muted-foreground">
                All tickets assigned to you
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Open</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalOpen}</div>
              <p className="text-xs text-muted-foreground">
                Tickets waiting to be actioned
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">In Progress</CardTitle>
              <UserCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalInProgress}</div>
              <p className="text-xs text-muted-foreground">
                Tickets you're currently working on
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Closed</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalClosed}</div>
              <p className="text-xs text-muted-foreground">
                Completed tickets
              </p>
            </CardContent>
          </Card>
        </div>
        
        {/* Filter controls */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6 items-end">
          <div className="w-full sm:w-1/4">
            <label className="text-sm font-medium mb-1 block">Status</label>
            <Select 
              value={filter} 
              onValueChange={(value) => setFilter(value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="open">Open</SelectItem>
                <SelectItem value="in_progress">In Progress</SelectItem>
                <SelectItem value="closed">Closed</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="w-full sm:w-3/4">
            <label className="text-sm font-medium mb-1 block">Search</label>
            <Input
              placeholder="Search tickets by title, description, or requestor"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full"
            />
          </div>
        </div>

        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
              <p className="mt-4">Loading your tickets...</p>
            </div>
          </div>
        ) : (
          <>
            {totalAssigned === 0 ? (
              <Alert className="my-8">
                <AlertTitle>No tickets assigned to you yet</AlertTitle>
                <AlertDescription>
                  When tickets are assigned to you, they will appear here.
                </AlertDescription>
              </Alert>
            ) : filteredTickets.length === 0 ? (
              <Alert className="my-8">
                <AlertTitle>No tickets match your filters</AlertTitle>
                <AlertDescription>
                  Try adjusting your search criteria or filter settings.
                </AlertDescription>
              </Alert>
            ) : (
              <Tabs defaultValue="all" className="w-full">
                <TabsList className="grid grid-cols-4 w-full">
                  <TabsTrigger value="all">
                    All ({filteredTickets.length})
                  </TabsTrigger>
                  <TabsTrigger value="open">
                    Open ({openTickets.length})
                  </TabsTrigger>
                  <TabsTrigger value="in-progress">
                    In Progress ({inProgressTickets.length})
                  </TabsTrigger>
                  <TabsTrigger value="closed">
                    Closed ({closedTickets.length})
                  </TabsTrigger>
                </TabsList>
                
                <ScrollArea className="h-[60vh]">
                  <TabsContent value="all" className="mt-4">
                    <TicketTable tickets={filteredTickets} />
                  </TabsContent>
                  
                  <TabsContent value="open" className="mt-4">
                    {openTickets.length === 0 ? (
                      <Alert>
                        <AlertTitle>No open tickets</AlertTitle>
                        <AlertDescription>
                          You don't have any open tickets assigned to you.
                        </AlertDescription>
                      </Alert>
                    ) : (
                      <TicketTable tickets={openTickets} />
                    )}
                  </TabsContent>
                  
                  <TabsContent value="in-progress" className="mt-4">
                    {inProgressTickets.length === 0 ? (
                      <Alert>
                        <AlertTitle>No in-progress tickets</AlertTitle>
                        <AlertDescription>
                          You don't have any tickets currently in progress.
                        </AlertDescription>
                      </Alert>
                    ) : (
                      <TicketTable tickets={inProgressTickets} />
                    )}
                  </TabsContent>
                  
                  <TabsContent value="closed" className="mt-4">
                    {closedTickets.length === 0 ? (
                      <Alert>
                        <AlertTitle>No closed tickets</AlertTitle>
                        <AlertDescription>
                          You don't have any closed tickets.
                        </AlertDescription>
                      </Alert>
                    ) : (
                      <TicketTable tickets={closedTickets} />
                    )}
                  </TabsContent>
                </ScrollArea>
              </Tabs>
            )}
            
            {/* Staff Onboarding Section when there are onboarding tickets */}
            {onboardingTickets.length > 0 && (
              <Card className="mt-6">
                <CardHeader>
                  <CardTitle className="text-xl">Staff Onboarding Tasks</CardTitle>
                  <CardDescription>
                    Review and complete onboarding tasks for new staff members
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>New Staff Member</TableHead>
                        <TableHead>Position</TableHead>
                        <TableHead>Start Date</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Priority</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {onboardingTickets.map((ticket: Ticket) => (
                        <TableRow key={ticket.id}>
                          <TableCell>
                            {ticket.metadata?.firstName} {ticket.metadata?.lastName}
                          </TableCell>
                          <TableCell>
                            {ticket.metadata?.position?.title || 
                             "Position not specified"}
                          </TableCell>
                          <TableCell>
                            {ticket.metadata?.startDate 
                              ? format(new Date(ticket.metadata.startDate), "MMM d, yyyy")
                              : "Not specified"}
                          </TableCell>
                          <TableCell>
                            <StatusBadge status={ticket.status} />
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant={
                                ticket.priority === "high"
                                  ? "destructive"
                                  : ticket.priority === "medium"
                                  ? "default"
                                  : "outline"
                              }
                            >
                              {ticket.priority}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <Button variant="outline" size="sm" asChild>
                              <Link href={`/ticket/${ticket.id}`}>View Details</Link>
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            )}
          </>
        )}
      </div>
    </Layout>
  );
}

function TicketTable({ tickets }: { tickets: Ticket[] }) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Title</TableHead>
          <TableHead>Requestor</TableHead>
          <TableHead>Created</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Priority</TableHead>
          <TableHead>Type</TableHead>
          <TableHead className="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {tickets.map((ticket: Ticket) => (
          <TableRow key={ticket.id}>
            <TableCell>
              <div className="font-medium">{ticket.title}</div>
            </TableCell>
            <TableCell>
              {ticket.requestor
                ? `${ticket.requestor.firstName} ${ticket.requestor.lastName}`
                : "Unknown"}
            </TableCell>
            <TableCell>
              {format(new Date(ticket.createdAt), "MMM d, yyyy")}
            </TableCell>
            <TableCell>
              <StatusBadge status={ticket.status} />
            </TableCell>
            <TableCell>
              <Badge
                variant={
                  ticket.priority === "high"
                    ? "destructive"
                    : ticket.priority === "medium"
                    ? "default"
                    : "outline"
                }
              >
                {ticket.priority}
              </Badge>
            </TableCell>
            <TableCell>
              <Badge variant="secondary">
                {ticket.type === "new_staff_request"
                  ? "New Staff"
                  : ticket.type === "system_access"
                  ? "System Access"
                  : ticket.type === "onboarding"
                  ? "Onboarding"
                  : ticket.type === "issue"
                  ? "Issue"
                  : "Request"}
              </Badge>
            </TableCell>
            <TableCell className="text-right">
              <Button variant="outline" size="sm" asChild>
                <Link href={`/ticket/${ticket.id}`}>View</Link>
              </Button>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}