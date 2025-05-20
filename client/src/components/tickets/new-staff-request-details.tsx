import React from 'react';
import { format } from 'date-fns';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Separator } from '@/components/ui/separator';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { 
  User, 
  Building, 
  BriefcaseBusiness, 
  Calendar, 
  Mail, 
  Phone,
  UserPlus
} from 'lucide-react';

interface NewStaffRequestDetailsProps {
  ticketId: number;
  metadata: any;
}

export function NewStaffRequestDetails({ ticketId, metadata }: NewStaffRequestDetailsProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const updateTaskMutation = useMutation({
    mutationFn: async (data: {taskIndex: number, completed: boolean}) => {
      // Clone the metadata
      const metadataCopy = {...metadata};
      
      // Update the checklist item
      if (metadataCopy.checklist && metadataCopy.checklist[data.taskIndex]) {
        metadataCopy.checklist[data.taskIndex].completed = data.completed;
      }
      
      // Send the updated metadata
      return apiRequest("PATCH", `/api/tickets/${ticketId}`, {
        metadata: metadataCopy
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/tickets/${ticketId}`] });
      toast({
        title: "Task updated",
        description: "The task status has been updated successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update task. Please try again.",
        variant: "destructive",
      });
    },
  });
  
  // Toggle task completion status
  const toggleTask = (taskIndex: number, currentStatus: boolean) => {
    updateTaskMutation.mutate({
      taskIndex,
      completed: !currentStatus
    });
  };
  
  if (!metadata) {
    return null;
  }
  
  // Extract staff information from metadata
  const {
    firstName,
    lastName,
    positionId,
    departmentId,
    reportingManagerId,
    startDate,
    email,
    phone,
    checklist = []
  } = metadata;
  
  // Fetch position data
  const { data: positions } = useQuery({
    queryKey: ['/api/positions'],
  });
  
  // Find position title
  const position = positions?.find(p => p.id === positionId)?.title || 'Unknown Position';
  
  // Format the start date if it exists
  const formattedStartDate = startDate ? format(new Date(startDate), 'MMMM d, yyyy') : 'Not specified';
  
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="bg-muted/50">
          <CardTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5" />
            <span>New Staff Information</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="flex items-start space-x-3">
                <User className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-sm font-medium">Full Name</p>
                  <p className="text-sm text-muted-foreground">{firstName} {lastName}</p>
                </div>
              </div>
              
              <div className="flex items-start space-x-3">
                <BriefcaseBusiness className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-sm font-medium">Position</p>
                  <p className="text-sm text-muted-foreground">{position}</p>
                </div>
              </div>
              
              <div className="flex items-start space-x-3">
                <Calendar className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-sm font-medium">Start Date</p>
                  <p className="text-sm text-muted-foreground">{formattedStartDate}</p>
                </div>
              </div>
            </div>
            
            <div className="space-y-4">
              {email && (
                <div className="flex items-start space-x-3">
                  <Mail className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-sm font-medium">Email</p>
                    <p className="text-sm text-muted-foreground">{email}</p>
                  </div>
                </div>
              )}
              
              {phone && (
                <div className="flex items-start space-x-3">
                  <Phone className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-sm font-medium">Phone</p>
                    <p className="text-sm text-muted-foreground">{phone}</p>
                  </div>
                </div>
              )}
              
              <div className="flex items-start space-x-3">
                <Building className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-sm font-medium">Department ID</p>
                  <p className="text-sm text-muted-foreground">{departmentId}</p>
                </div>
              </div>
              
              <div className="flex items-start space-x-3">
                <User className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-sm font-medium">Reporting Manager ID</p>
                  <p className="text-sm text-muted-foreground">{reportingManagerId}</p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="bg-muted/50">
          <CardTitle className="text-base">Onboarding Checklist</CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          {checklist && checklist.length > 0 ? (
            <div className="space-y-4">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">Status</TableHead>
                    <TableHead>Task</TableHead>
                    <TableHead className="text-right w-[100px]">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {checklist.map((task: any, index: number) => (
                    <TableRow key={index}>
                      <TableCell>
                        <Checkbox 
                          checked={task.completed} 
                          onCheckedChange={() => toggleTask(index, task.completed)}
                        />
                      </TableCell>
                      <TableCell className={task.completed ? "line-through text-muted-foreground" : ""}>
                        {task.task}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => toggleTask(index, task.completed)}
                        >
                          {task.completed ? "Undo" : "Complete"}
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground py-2">No checklist items available.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}