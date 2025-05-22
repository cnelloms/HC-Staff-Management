import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { PageHeader } from "../components/PageHeader";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { 
  Table, 
  TableHeader, 
  TableBody, 
  TableRow, 
  TableHead, 
  TableCell 
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { AlertCircle, CheckCircle, XCircle, UserCheck, Clock, User } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// Define change request type
interface ChangeRequest {
  id: number;
  employeeId: number;
  requestedBy: number;
  requestType: string;
  currentValue: string;
  requestedValue: string;
  field: string;
  status: "pending" | "approved" | "rejected";
  createdAt: string;
  updatedAt: string;
  employee?: {
    id: number;
    firstName: string;
    lastName: string;
    email: string;
    department?: {
      id: number;
      name: string;
    }
  };
  requestedByUser?: {
    id: number;
    firstName: string;
    lastName: string;
  }
}

export default function ApprovalInbox() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<string>("pending");
  
  // Fetch all pending change requests
  const { data: changeRequests, isLoading } = useQuery<ChangeRequest[]>({
    queryKey: ["/api/change-requests/pending"],
    refetchInterval: 30000, // Refetch every 30 seconds
  });
  
  // Approve a change request
  const approveMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await fetch(`/api/change-requests/${id}/approve`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to approve request");
      }
      
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/change-requests/pending"] });
      toast({
        title: "Request approved",
        description: "The change request has been approved successfully",
        variant: "default",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  // Reject a change request
  const rejectMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await fetch(`/api/change-requests/${id}/reject`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to reject request");
      }
      
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/change-requests/pending"] });
      toast({
        title: "Request rejected",
        description: "The change request has been rejected",
        variant: "default",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  // Filter requests by status
  const pendingRequests = changeRequests?.filter(req => req.status === "pending") || [];
  const approvedRequests = changeRequests?.filter(req => req.status === "approved") || [];
  const rejectedRequests = changeRequests?.filter(req => req.status === "rejected") || [];
  
  // Get formatted field name
  const getFormattedFieldName = (field: string) => {
    const fieldMap: Record<string, string> = {
      "workMobile": "Work Mobile",
      "personalEmail": "Personal Email",
      "emergencyContact": "Emergency Contact",
      "emergencyPhone": "Emergency Phone",
      "address": "Address",
      "phone": "Phone Number",
      "firstName": "First Name",
      "lastName": "Last Name",
      "email": "Email",
      "departmentId": "Department",
      "positionId": "Position",
      "reportingManagerId": "Reporting Manager"
    };
    
    return fieldMap[field] || field;
  };
  
  // Get status badge
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <Badge variant="outline" className="bg-yellow-50 text-yellow-800 border-yellow-300"><Clock className="w-3 h-3 mr-1" /> Pending</Badge>;
      case "approved":
        return <Badge variant="outline" className="bg-green-50 text-green-800 border-green-300"><CheckCircle className="w-3 h-3 mr-1" /> Approved</Badge>;
      case "rejected":
        return <Badge variant="outline" className="bg-red-50 text-red-800 border-red-300"><XCircle className="w-3 h-3 mr-1" /> Rejected</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };
  
  return (
    <div className="container mx-auto py-6">
      <PageHeader
        heading="Change Request Approvals"
        subheading="Review and manage employee change requests"
        icon={<UserCheck className="h-6 w-6" />}
      />
      
      <div className="mt-8">
        <Tabs defaultValue="pending" value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3 mb-8">
            <TabsTrigger value="pending" className="relative">
              Pending
              {pendingRequests.length > 0 && (
                <span className="absolute top-1 right-1 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] text-primary-foreground">
                  {pendingRequests.length}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="approved">Approved</TabsTrigger>
            <TabsTrigger value="rejected">Rejected</TabsTrigger>
          </TabsList>
          
          <TabsContent value="pending">
            {isLoading ? (
              <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : pendingRequests.length === 0 ? (
              <Card>
                <CardContent className="py-10">
                  <div className="text-center">
                    <Clock className="mx-auto h-12 w-12 text-muted-foreground" />
                    <h3 className="mt-4 text-lg font-semibold">No Pending Requests</h3>
                    <p className="text-muted-foreground">There are currently no pending change requests to review.</p>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-6">
                {pendingRequests.map((request) => (
                  <Card key={request.id}>
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle className="text-lg">
                            {request.employee?.firstName} {request.employee?.lastName} - {getFormattedFieldName(request.field)} Change
                          </CardTitle>
                          <CardDescription>
                            Requested by {request.requestedByUser?.firstName || request.employee?.firstName} {request.requestedByUser?.lastName || request.employee?.lastName} on {format(new Date(request.createdAt), "MMM d, yyyy")}
                          </CardDescription>
                        </div>
                        {getStatusBadge(request.status)}
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <h4 className="font-medium text-sm text-muted-foreground">Current Value</h4>
                          <div className="p-3 bg-muted rounded-md">
                            {request.currentValue || "-"}
                          </div>
                        </div>
                        <div className="space-y-2">
                          <h4 className="font-medium text-sm text-muted-foreground">Requested Value</h4>
                          <div className="p-3 bg-muted rounded-md">
                            {request.requestedValue || "-"}
                          </div>
                        </div>
                      </div>
                      
                      <div className="mt-4">
                        <h4 className="font-medium text-sm text-muted-foreground mb-2">Employee Information</h4>
                        <div className="p-3 bg-muted rounded-md">
                          <div className="flex items-center">
                            <User className="h-5 w-5 mr-2 text-muted-foreground" />
                            <div>
                              <span className="font-medium">{request.employee?.firstName} {request.employee?.lastName}</span>
                              <span className="text-sm text-muted-foreground block">{request.employee?.email}</span>
                              <span className="text-sm text-muted-foreground block">{request.employee?.department?.name || "No Department"}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                    <CardFooter className="flex justify-end space-x-2">
                      <Button 
                        variant="outline" 
                        onClick={() => rejectMutation.mutate(request.id)}
                        disabled={rejectMutation.isPending}
                      >
                        <XCircle className="h-4 w-4 mr-2" />
                        Reject
                      </Button>
                      <Button 
                        onClick={() => approveMutation.mutate(request.id)}
                        disabled={approveMutation.isPending}
                      >
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Approve
                      </Button>
                    </CardFooter>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="approved">
            {isLoading ? (
              <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : approvedRequests.length === 0 ? (
              <Card>
                <CardContent className="py-10">
                  <div className="text-center">
                    <CheckCircle className="mx-auto h-12 w-12 text-muted-foreground" />
                    <h3 className="mt-4 text-lg font-semibold">No Approved Requests</h3>
                    <p className="text-muted-foreground">There are no approved change requests to display.</p>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Employee</TableHead>
                    <TableHead>Field</TableHead>
                    <TableHead>Requested Value</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {approvedRequests.map((request) => (
                    <TableRow key={request.id}>
                      <TableCell className="font-medium">
                        {request.employee?.firstName} {request.employee?.lastName}
                      </TableCell>
                      <TableCell>{getFormattedFieldName(request.field)}</TableCell>
                      <TableCell>{request.requestedValue}</TableCell>
                      <TableCell>{getStatusBadge(request.status)}</TableCell>
                      <TableCell>{format(new Date(request.updatedAt), "MMM d, yyyy")}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </TabsContent>
          
          <TabsContent value="rejected">
            {isLoading ? (
              <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : rejectedRequests.length === 0 ? (
              <Card>
                <CardContent className="py-10">
                  <div className="text-center">
                    <XCircle className="mx-auto h-12 w-12 text-muted-foreground" />
                    <h3 className="mt-4 text-lg font-semibold">No Rejected Requests</h3>
                    <p className="text-muted-foreground">There are no rejected change requests to display.</p>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Employee</TableHead>
                    <TableHead>Field</TableHead>
                    <TableHead>Requested Value</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rejectedRequests.map((request) => (
                    <TableRow key={request.id}>
                      <TableCell className="font-medium">
                        {request.employee?.firstName} {request.employee?.lastName}
                      </TableCell>
                      <TableCell>{getFormattedFieldName(request.field)}</TableCell>
                      <TableCell>{request.requestedValue}</TableCell>
                      <TableCell>{getStatusBadge(request.status)}</TableCell>
                      <TableCell>{format(new Date(request.updatedAt), "MMM d, yyyy")}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}