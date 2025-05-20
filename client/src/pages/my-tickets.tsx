import { useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import Layout from "@/components/layout";
import { Ticket } from "@/types";
import { useCurrentUser } from "@/context/user-context";
import { format } from "date-fns";
import { Link } from "wouter";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from "@/components/ui/tabs";
import { 
  FilterX,
  Plus,
  Ticket as TicketIcon,
  Inbox,
  AlertCircle,
  Clock,
  CheckCircle2
} from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// Status badge variations 
const getStatusBadge = (status: string) => {
  switch (status) {
    case "open":
      return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950 dark:text-blue-300 dark:border-blue-800">Open</Badge>;
    case "in_progress":
      return <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950 dark:text-amber-300 dark:border-amber-800">In Progress</Badge>;
    case "closed":
      return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 dark:bg-green-950 dark:text-green-300 dark:border-green-800">Closed</Badge>;
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
};

// Priority badge variations
const getPriorityBadge = (priority: string) => {
  switch (priority) {
    case "high":
      return <Badge className="bg-red-100 text-red-800 hover:bg-red-100 dark:bg-red-900 dark:text-red-300">High</Badge>;
    case "medium":
      return <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-100 dark:bg-amber-900 dark:text-amber-300">Medium</Badge>;
    case "low":
      return <Badge className="bg-green-100 text-green-800 hover:bg-green-100 dark:bg-green-900 dark:text-green-300">Low</Badge>;
    default:
      return <Badge>{priority}</Badge>;
  }
};

// Type badge variations
const getTypeBadge = (type: string) => {
  switch (type) {
    case "new_staff_request":
      return <Badge variant="secondary">New Staff Request</Badge>;
    case "system_access":
      return <Badge variant="secondary">System Access</Badge>;
    case "onboarding":
      return <Badge variant="secondary">Onboarding</Badge>;
    case "issue":
      return <Badge variant="secondary">Issue</Badge>;
    case "request":
      return <Badge variant="secondary">General Request</Badge>;
    default:
      return <Badge variant="secondary">{type}</Badge>;
  }
};

export default function MyTickets() {
  const { currentUser, isLoading: isUserLoading } = useCurrentUser();
  const [activeTab, setActiveTab] = useState("assigned");
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  
  // Fetch all tickets
  const { 
    data: allTickets, 
    isLoading: isTicketsLoading 
  } = useQuery<Ticket[]>({
    queryKey: [`/api/tickets`],
    enabled: !!currentUser?.id,
  });
  
  // Get tickets assigned to current user
  const assignedTickets = Array.isArray(allTickets) 
    ? allTickets.filter(ticket => ticket.assigneeId === currentUser?.id)
    : [];
  
  // Filter assigned tickets based on status and type
  const filteredAssignedTickets = assignedTickets.filter(ticket => {
    const matchesStatus = statusFilter === "all" || ticket.status === statusFilter;
    const matchesType = typeFilter === "all" || ticket.type === typeFilter;
    return matchesStatus && matchesType;
  });

  // Ticket count by status for assigned tickets
  const assignedTicketCounts = {
    total: assignedTickets.length,
    open: assignedTickets.filter(t => t.status === "open").length,
    inProgress: assignedTickets.filter(t => t.status === "in_progress").length,
    closed: assignedTickets.filter(t => t.status === "closed").length,
  };
  
  // Get tickets created by current user
  const createdTickets = Array.isArray(allTickets) 
    ? allTickets.filter(ticket => ticket.requestorId === currentUser?.id)
    : [];
    
  const createdTicketCounts = {
    total: createdTickets.length,
    open: createdTickets.filter(t => t.status === "open").length,
    inProgress: createdTickets.filter(t => t.status === "in_progress").length,
    closed: createdTickets.filter(t => t.status === "closed").length,
  };

  // Reset filters
  const resetFilters = () => {
    setStatusFilter("all");
    setTypeFilter("all");
  };

  // Loading state
  if (isUserLoading) {
    return (
      <Layout title="My Tickets">
        <div className="flex justify-center items-center h-64">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="My Tickets">
      <div className="space-y-6">
        {/* Header with counts */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
              <Inbox className="h-8 w-8" />
              My Tickets
            </h1>
            <p className="text-muted-foreground mt-1">
              Manage tickets assigned to you and view your ticket requests
            </p>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-3">
            <Button asChild>
              <Link href="/tickets/new">
                <Plus className="mr-2 h-4 w-4" />
                New Ticket
              </Link>
            </Button>
          </div>
        </div>
        
        {/* Ticket Tabs */}
        <Tabs defaultValue="assigned" value={activeTab} onValueChange={setActiveTab}>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <TabsList>
              <TabsTrigger value="assigned" className="relative">
                Assigned to Me
                {assignedTicketCounts.total > 0 && (
                  <span className="ml-2 bg-primary text-primary-foreground text-xs rounded-full px-2 py-0.5">
                    {assignedTicketCounts.total}
                  </span>
                )}
              </TabsTrigger>
              <TabsTrigger value="created" className="relative">
                Created by Me
                {createdTicketCounts.total > 0 && (
                  <span className="ml-2 bg-primary text-primary-foreground text-xs rounded-full px-2 py-0.5">
                    {createdTicketCounts.total}
                  </span>
                )}
              </TabsTrigger>
            </TabsList>
            
            <div className="flex items-center gap-2">
              {/* Status Filter */}
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[130px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="open">Open</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="closed">Closed</SelectItem>
                </SelectContent>
              </Select>
              
              {/* Type Filter */}
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="new_staff_request">New Staff Request</SelectItem>
                  <SelectItem value="system_access">System Access</SelectItem>
                  <SelectItem value="onboarding">Onboarding</SelectItem>
                  <SelectItem value="issue">Issue</SelectItem>
                  <SelectItem value="request">General Request</SelectItem>
                </SelectContent>
              </Select>
              
              {/* Reset Filters */}
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={resetFilters}
                disabled={statusFilter === "all" && typeFilter === "all"}
                title="Reset filters"
              >
                <FilterX className="h-4 w-4" />
              </Button>
            </div>
          </div>
          
          {/* Assigned Tickets Tab */}
          <TabsContent value="assigned">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <TicketIcon className="h-5 w-5" />
                  Tickets Assigned To Me
                </CardTitle>
                <CardDescription>
                  Manage and update status of tickets where you're the assignee
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex gap-3 mb-6">
                  <div className="flex-1 p-4 border rounded-lg bg-card">
                    <div className="text-muted-foreground text-sm">Open</div>
                    <div className="text-2xl font-bold mt-1 flex items-center gap-2">
                      <AlertCircle className="text-blue-500 h-5 w-5" />
                      {assignedTicketCounts.open}
                    </div>
                  </div>
                  <div className="flex-1 p-4 border rounded-lg bg-card">
                    <div className="text-muted-foreground text-sm">In Progress</div>
                    <div className="text-2xl font-bold mt-1 flex items-center gap-2">
                      <Clock className="text-amber-500 h-5 w-5" />
                      {assignedTicketCounts.inProgress}
                    </div>
                  </div>
                  <div className="flex-1 p-4 border rounded-lg bg-card">
                    <div className="text-muted-foreground text-sm">Closed</div>
                    <div className="text-2xl font-bold mt-1 flex items-center gap-2">
                      <CheckCircle2 className="text-green-500 h-5 w-5" />
                      {assignedTicketCounts.closed}
                    </div>
                  </div>
                </div>
                
                {isAssignedLoading ? (
                  <div className="flex justify-center items-center h-64">
                    <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                  </div>
                ) : filteredAssignedTickets.length > 0 ? (
                  <ScrollArea className="h-[400px]">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>ID</TableHead>
                          <TableHead>Title</TableHead>
                          <TableHead>Type</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Priority</TableHead>
                          <TableHead>Created</TableHead>
                          <TableHead>Requestor</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredAssignedTickets.map((ticket) => (
                          <TableRow key={ticket.id}>
                            <TableCell className="font-medium">#{ticket.id}</TableCell>
                            <TableCell>
                              <Link href={`/tickets/${ticket.id}`} className="text-primary hover:underline">
                                {ticket.title}
                              </Link>
                            </TableCell>
                            <TableCell>{getTypeBadge(ticket.type)}</TableCell>
                            <TableCell>{getStatusBadge(ticket.status)}</TableCell>
                            <TableCell>{getPriorityBadge(ticket.priority)}</TableCell>
                            <TableCell>{format(new Date(ticket.createdAt), 'MMM d, yyyy')}</TableCell>
                            <TableCell>
                              {ticket.requestor?.firstName} {ticket.requestor?.lastName}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </ScrollArea>
                ) : (
                  <div className="text-center py-12 border rounded-lg">
                    <TicketIcon className="mx-auto h-12 w-12 text-muted-foreground opacity-20" />
                    <h3 className="mt-4 text-lg font-medium">No tickets found</h3>
                    <p className="mt-2 text-sm text-muted-foreground max-w-sm mx-auto">
                      {statusFilter !== "all" || typeFilter !== "all"
                        ? "Try changing your filters or check back later for new assignments."
                        : "You don't have any assigned tickets yet. Check back later for new assignments."}
                    </p>
                    {(statusFilter !== "all" || typeFilter !== "all") && (
                      <Button variant="outline" className="mt-4" onClick={resetFilters}>
                        <FilterX className="mr-2 h-4 w-4" />
                        Clear Filters
                      </Button>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          
          {/* Created Tickets Tab */}
          <TabsContent value="created">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <TicketIcon className="h-5 w-5" />
                  Tickets Created By Me
                </CardTitle>
                <CardDescription>
                  Track the status of tickets you've submitted
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex gap-3 mb-6">
                  <div className="flex-1 p-4 border rounded-lg bg-card">
                    <div className="text-muted-foreground text-sm">Open</div>
                    <div className="text-2xl font-bold mt-1 flex items-center gap-2">
                      <AlertCircle className="text-blue-500 h-5 w-5" />
                      {createdTicketCounts.open}
                    </div>
                  </div>
                  <div className="flex-1 p-4 border rounded-lg bg-card">
                    <div className="text-muted-foreground text-sm">In Progress</div>
                    <div className="text-2xl font-bold mt-1 flex items-center gap-2">
                      <Clock className="text-amber-500 h-5 w-5" />
                      {createdTicketCounts.inProgress}
                    </div>
                  </div>
                  <div className="flex-1 p-4 border rounded-lg bg-card">
                    <div className="text-muted-foreground text-sm">Closed</div>
                    <div className="text-2xl font-bold mt-1 flex items-center gap-2">
                      <CheckCircle2 className="text-green-500 h-5 w-5" />
                      {createdTicketCounts.closed}
                    </div>
                  </div>
                </div>
                
                {isAssignedLoading ? (
                  <div className="flex justify-center items-center h-64">
                    <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                  </div>
                ) : createdTickets.length > 0 ? (
                  <ScrollArea className="h-[400px]">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>ID</TableHead>
                          <TableHead>Title</TableHead>
                          <TableHead>Type</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Priority</TableHead>
                          <TableHead>Created</TableHead>
                          <TableHead>Assignee</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {createdTickets
                          .filter(ticket => {
                            const matchesStatus = statusFilter === "all" || ticket.status === statusFilter;
                            const matchesType = typeFilter === "all" || ticket.type === typeFilter;
                            return matchesStatus && matchesType;
                          })
                          .map((ticket) => (
                            <TableRow key={ticket.id}>
                              <TableCell className="font-medium">#{ticket.id}</TableCell>
                              <TableCell>
                                <Link href={`/tickets/${ticket.id}`} className="text-primary hover:underline">
                                  {ticket.title}
                                </Link>
                              </TableCell>
                              <TableCell>{getTypeBadge(ticket.type)}</TableCell>
                              <TableCell>{getStatusBadge(ticket.status)}</TableCell>
                              <TableCell>{getPriorityBadge(ticket.priority)}</TableCell>
                              <TableCell>{format(new Date(ticket.createdAt), 'MMM d, yyyy')}</TableCell>
                              <TableCell>
                                {ticket.assignee ? `${ticket.assignee.firstName} ${ticket.assignee.lastName}` : "—"}
                              </TableCell>
                            </TableRow>
                          ))}
                      </TableBody>
                    </Table>
                  </ScrollArea>
                ) : (
                  <div className="text-center py-12 border rounded-lg">
                    <TicketIcon className="mx-auto h-12 w-12 text-muted-foreground opacity-20" />
                    <h3 className="mt-4 text-lg font-medium">No tickets found</h3>
                    <p className="mt-2 text-sm text-muted-foreground max-w-sm mx-auto">
                      {statusFilter !== "all" || typeFilter !== "all"
                        ? "Try changing your filters or create a new ticket request."
                        : "You haven't created any tickets yet. Click the 'New Ticket' button to get started."}
                    </p>
                    {(statusFilter !== "all" || typeFilter !== "all") ? (
                      <Button variant="outline" className="mt-4" onClick={resetFilters}>
                        <FilterX className="mr-2 h-4 w-4" />
                        Clear Filters
                      </Button>
                    ) : (
                      <Button className="mt-4" asChild>
                        <Link href="/tickets/new">
                          <Plus className="mr-2 h-4 w-4" />
                          Create Ticket
                        </Link>
                      </Button>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}