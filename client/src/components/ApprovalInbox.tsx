import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { apiRequest } from "@/lib/queryClient";
import { Loader2, CheckCircle, XCircle } from "lucide-react";

type ChangeRequest = {
  id: number;
  targetEmployeeId: number;
  requesterEmployeeId: number;
  payload: Record<string, any>;
  status: string;
  approvedById?: number;
  createdAt: string;
  updatedAt: string;
};

export default function ApprovalInbox() {
  const queryClient = useQueryClient();
  const [expandedRequest, setExpandedRequest] = useState<number | null>(null);

  // Fetch pending change requests - managers will only see requests for their teams
  const { data: requests = [], isLoading } = useQuery({
    queryKey: ['/api/change_requests'],
    queryFn: async () => {
      const response = await fetch('/api/change_requests');
      if (!response.ok) {
        throw new Error('Failed to fetch change requests');
      }
      return response.json();
    }
  });

  // Approve or reject a change request
  const mutation = useMutation({
    mutationFn: async ({ id, status }: { id: number; status: 'approved' | 'rejected' }) => {
      const response = await fetch(`/api/change_requests/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });
      
      if (!response.ok) {
        throw new Error('Failed to update change request');
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/change_requests'] });
    }
  });

  const toggleExpand = (id: number) => {
    setExpandedRequest(expandedRequest === id ? null : id);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2">Loading pending requests...</span>
      </div>
    );
  }

  if (requests.length === 0) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Pending Change Requests</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-center py-8">
            There are no pending change requests that require your attention.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Pending Change Requests</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ID</TableHead>
              <TableHead>Target Employee</TableHead>
              <TableHead>Requested By</TableHead>
              <TableHead>Created</TableHead>
              <TableHead>Changes</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {requests.map((request: ChangeRequest) => (
              <TableRow key={request.id} className="cursor-pointer">
                <TableCell className="font-medium">{request.id}</TableCell>
                <TableCell>ID: {request.targetEmployeeId}</TableCell>
                <TableCell>ID: {request.requesterEmployeeId}</TableCell>
                <TableCell>{new Date(request.createdAt).toLocaleDateString()}</TableCell>
                <TableCell>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => toggleExpand(request.id)}
                  >
                    {expandedRequest === request.id ? 'Hide Details' : 'View Details'}
                  </Button>
                  {expandedRequest === request.id && (
                    <div className="mt-2 bg-muted p-3 rounded-md text-xs">
                      <pre className="whitespace-pre-wrap overflow-x-auto">
                        {JSON.stringify(request.payload, null, 2)}
                      </pre>
                    </div>
                  )}
                </TableCell>
                <TableCell>
                  <div className="flex space-x-2">
                    <Button 
                      size="sm" 
                      variant="outline" 
                      className="text-green-600" 
                      onClick={() => mutation.mutate({ id: request.id, status: 'approved' })}
                      disabled={mutation.isPending}
                    >
                      <CheckCircle className="h-4 w-4 mr-1" />
                      Approve
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline" 
                      className="text-red-600" 
                      onClick={() => mutation.mutate({ id: request.id, status: 'rejected' })}
                      disabled={mutation.isPending}
                    >
                      <XCircle className="h-4 w-4 mr-1" />
                      Reject
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}