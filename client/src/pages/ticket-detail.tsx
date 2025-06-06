import { useParams, Link, useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Layout from "@/components/layout";
import { Ticket, Employee } from "@/types";
import { NewStaffRequestDetails } from "@/components/tickets/new-staff-request-details";
import { ITSupportDetails } from "@/components/tickets/it-support-details";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useCurrentUser } from "@/context/user-context";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { StatusBadge } from "@/components/ui/status-badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { format } from "date-fns";
import { useState } from "react";
import {
  Edit,
  Clock,
  AlertCircle,
  CheckCircle,
  Tag,
  User,
  BarChart2,
  Calendar,
  Building,
  Trash,
} from "lucide-react";

export default function TicketDetail() {
  const { id } = useParams<{ id: string }>();
  const ticketId = parseInt(id);
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { currentUser } = useCurrentUser();
  
  const [status, setStatus] = useState<'open' | 'in_progress' | 'closed' | ''>('');
  const [assigneeId, setAssigneeId] = useState<string>('');

  const { data: ticket, isLoading: ticketLoading } = useQuery<Ticket>({
    queryKey: [`/api/tickets/${ticketId}`],
  });

  const { data: employees, isLoading: employeesLoading } = useQuery<Employee[]>({
    queryKey: ['/api/employees'],
  });

  const updateTicketMutation = useMutation({
    mutationFn: async (data: { status?: string; assigneeId?: number | null }) => {
      return apiRequest("PATCH", `/api/tickets/${ticketId}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/tickets/${ticketId}`] });
      queryClient.invalidateQueries({ queryKey: ['/api/tickets'] });
      toast({
        title: "Ticket updated",
        description: "The ticket has been successfully updated.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update ticket.",
        variant: "destructive",
      });
    },
  });
  
  const deleteTicketMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("DELETE", `/api/tickets/${ticketId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/tickets'] });
      toast({
        title: "Ticket deleted",
        description: "The ticket has been successfully deleted.",
      });
      navigate("/tickets");
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete ticket.",
        variant: "destructive",
      });
    },
  });

  const handleStatusChange = (newStatus: string) => {
    setStatus(newStatus as 'open' | 'in_progress' | 'closed');
    
    // For all status changes, we only need to update the status
    // The backend will handle setting closedAt if status is being changed to closed
    updateTicketMutation.mutate({ 
      status: newStatus 
    });
    
    // Show toast confirmation 
    toast({
      title: "Status updated",
      description: `Ticket status has been updated to ${newStatus.replace("_", " ")}.`,
    });
  };

  const handleAssigneeChange = (newAssigneeId: string) => {
    setAssigneeId(newAssigneeId);
    updateTicketMutation.mutate({ 
      assigneeId: newAssigneeId === 'unassigned' ? null : parseInt(newAssigneeId)
    });
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'open':
        return <AlertCircle className="h-5 w-5 text-yellow-500" />;
      case 'in_progress':
        return <Clock className="h-5 w-5 text-blue-500" />;
      case 'closed':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      default:
        return <AlertCircle className="h-5 w-5" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'low':
        return 'text-blue-500';
      case 'medium':
        return 'text-yellow-500';
      case 'high':
        return 'text-red-500';
      default:
        return '';
    }
  };

  if (ticketLoading) {
    return (
      <Layout>
        <div className="p-8 flex flex-col items-center justify-center gap-4">
          <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          <p className="text-muted-foreground">Loading ticket details...</p>
        </div>
      </Layout>
    );
  }

  if (!ticket) {
    return (
      <Layout>
        <div className="text-center p-8">
          <h2 className="text-2xl font-bold">Ticket Not Found</h2>
          <p className="text-muted-foreground mt-2">The ticket you're looking for doesn't exist or you don't have permission to view it.</p>
          <Button className="mt-4" onClick={() => navigate("/tickets")}>
            Back to Tickets
          </Button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout title={`Ticket #${ticket.id}`}>
      <div className="space-y-6">
        {/* Ticket Header */}
        <div className="bg-background rounded-lg border shadow-sm p-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <div className="flex items-center space-x-2">
                <StatusBadge status={ticket.status as any} />
                <h2 className="text-2xl font-bold">{ticket.title}</h2>
              </div>
              <p className="text-muted-foreground mt-1">Ticket #{ticket.id} • Created {format(new Date(ticket.createdAt), 'MMM d, yyyy')}</p>
            </div>
            <div className="flex items-center space-x-2">
              {ticket.status === 'open' && !ticket.assigneeId && currentUser && (
                <Button 
                  onClick={() => {
                    if (currentUser && currentUser.id) {
                      updateTicketMutation.mutate({ 
                        status: 'in_progress',
                        assigneeId: currentUser.id
                      });
                      setStatus('in_progress');
                      setAssigneeId(currentUser.id.toString());
                    } else {
                      toast({
                        title: "Error",
                        description: "Could not determine your user ID. Please try again or contact support.",
                        variant: "destructive",
                      });
                    }
                    
                    toast({
                      title: "Ticket accepted",
                      description: "You have successfully accepted this ticket.",
                    });
                  }}
                >
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Accept Ticket
                </Button>
              )}
              <Button variant="outline" asChild>
                <Link href={`/tickets/${ticketId}/edit`}>
                  <Edit className="mr-2 h-4 w-4" />
                  Edit Ticket
                </Link>
              </Button>
              <Button 
                variant="outline" 
                className="text-destructive hover:bg-destructive/10" 
                onClick={() => {
                  if (window.confirm("Are you sure you want to delete this ticket? This action cannot be undone.")) {
                    deleteTicketMutation.mutate();
                  }
                }}
              >
                <Trash className="mr-2 h-4 w-4" />
                Delete
              </Button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Ticket Details */}
          <div className="col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Ticket Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <h3 className="text-sm font-medium text-muted-foreground">Description</h3>
                  <p className="text-sm whitespace-pre-line">{ticket.description}</p>
                </div>
                
                {ticket.system && (
                  <>
                    <Separator />
                    <div className="space-y-2">
                      <h3 className="text-sm font-medium text-muted-foreground">Related System</h3>
                      <div className="flex items-center">
                        <Building className="h-4 w-4 mr-2 text-muted-foreground" />
                        <span>{ticket.system.name}</span>
                      </div>
                      {ticket.system.description && (
                        <p className="text-sm text-muted-foreground">{ticket.system.description}</p>
                      )}
                    </div>
                  </>
                )}
                
                {ticket.metadata && ticket.type !== 'new_staff_request' && (
                  <>
                    <Separator />
                    <div className="space-y-2">
                      <h3 className="text-sm font-medium text-muted-foreground">Additional Information</h3>
                      <pre className="text-sm whitespace-pre-wrap bg-muted p-3 rounded-md overflow-auto">
                        {JSON.stringify(ticket.metadata, null, 2)}
                      </pre>
                    </div>
                  </>
                )}
                
                {/* Show the New Staff Request Component */}
                {ticket.type === 'new_staff_request' && ticket.metadata && (
                  <>
                    <Separator />
                    <NewStaffRequestDetails 
                      ticketId={ticket.id} 
                      metadata={ticket.metadata} 
                    />
                  </>
                )}
                
                {/* Show the IT Support Component */}
                {ticket.type === 'it_support' && ticket.metadata && (
                  <>
                    <Separator />
                    <ITSupportDetails 
                      ticketId={ticket.id} 
                      metadata={ticket.metadata} 
                    />
                  </>
                )}
                
                <Separator />
                <div className="pt-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex items-center space-x-2">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-sm font-medium">Created</p>
                        <p className="text-sm text-muted-foreground">
                          {format(new Date(ticket.createdAt), 'MMM d, yyyy h:mm a')}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-sm font-medium">Updated</p>
                        <p className="text-sm text-muted-foreground">
                          {format(new Date(ticket.updatedAt), 'MMM d, yyyy h:mm a')}
                        </p>
                      </div>
                    </div>
                    {ticket.closedAt && (
                      <div className="flex items-center space-x-2">
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        <div>
                          <p className="text-sm font-medium">Closed</p>
                          <p className="text-sm text-muted-foreground">
                            {format(new Date(ticket.closedAt), 'MMM d, yyyy h:mm a')}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Status Card */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Ticket Status</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Status</label>
                  <Select
                    value={status || ticket.status}
                    onValueChange={handleStatusChange}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="open">Open</SelectItem>
                      <SelectItem value="in_progress">In Progress</SelectItem>
                      <SelectItem value="closed">Closed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Assigned To</label>
                  <Select
                    value={assigneeId || (ticket.assigneeId?.toString() || '')}
                    onValueChange={handleAssigneeChange}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select assignee" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="unassigned">Unassigned</SelectItem>
                      {!employeesLoading && employees?.map(employee => (
                        <SelectItem key={employee.id} value={employee.id.toString()}>
                          {employee.firstName} {employee.lastName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Info Card */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Ticket Info</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Tag className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">Type:</span>
                  </div>
                  <span className="text-sm font-medium capitalize">
                    {ticket.type.replace('_', ' ')}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <BarChart2 className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">Priority:</span>
                  </div>
                  <span className={`text-sm font-medium capitalize ${getPriorityColor(ticket.priority)}`}>
                    {ticket.priority}
                  </span>
                </div>

                <Separator />

                <div className="space-y-3">
                  <label className="text-sm font-medium">Requestor</label>
                  {ticket.requestor ? (
                    <div className="flex items-center space-x-3">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={ticket.requestor.avatar} alt={`${ticket.requestor.firstName} ${ticket.requestor.lastName}`} />
                        <AvatarFallback>
                          {ticket.requestor.firstName?.[0]}{ticket.requestor.lastName?.[0]}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <Link href={`/employee/${ticket.requestorId}`} className="text-sm font-medium hover:underline">
                          {ticket.requestor.firstName} {ticket.requestor.lastName}
                        </Link>
                      </div>
                    </div>
                  ) : (
                    <div className="text-sm text-muted-foreground">Unknown</div>
                  )}
                </div>

                {ticket.assignee && (
                  <div className="space-y-3">
                    <label className="text-sm font-medium">Assignee</label>
                    <div className="flex items-center space-x-3">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={ticket.assignee.avatar} alt={`${ticket.assignee.firstName} ${ticket.assignee.lastName}`} />
                        <AvatarFallback>
                          {ticket.assignee.firstName?.[0]}{ticket.assignee.lastName?.[0]}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <Link href={`/employee/${ticket.assigneeId}`} className="text-sm font-medium hover:underline">
                          {ticket.assignee.firstName} {ticket.assignee.lastName}
                        </Link>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </Layout>
  );
}
