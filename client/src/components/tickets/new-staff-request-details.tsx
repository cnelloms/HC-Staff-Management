import React, { useMemo } from 'react';
import { format } from 'date-fns';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle,
  CardDescription,
  CardFooter
} from '@/components/ui/card';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Separator } from '@/components/ui/separator';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
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
  UserPlus,
  CheckCircle,
  AlertCircle,
  Clock,
  CheckSquare,
  Laptop,
  Network,
  GraduationCap,
  MessageSquare
} from 'lucide-react';

// Task category icons
const categoryIcons: Record<string, React.ReactNode> = {
  accounts: <User className="h-4 w-4 mr-2" />,
  equipment: <Laptop className="h-4 w-4 mr-2" />,
  systems: <Network className="h-4 w-4 mr-2" />,
  onboarding: <GraduationCap className="h-4 w-4 mr-2" />,
  communication: <MessageSquare className="h-4 w-4 mr-2" />
};

// Category names
const categoryNames: Record<string, string> = {
  accounts: "Account Setup",
  equipment: "Equipment Preparation",
  systems: "System Access",
  onboarding: "Onboarding Process",
  communication: "Communication & Notifications"
};

interface NewStaffRequestDetailsProps {
  ticketId: number;
  metadata: any;
  ticket?: any;
}

export function NewStaffRequestDetails({ ticketId, metadata, ticket }: NewStaffRequestDetailsProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Calculate progress and status
  const { progress, tasksByCategory, totalTasks, completedTasks } = useMemo(() => {
    // Initialize counters and organize tasks by category
    let completed = 0;
    const total = metadata?.checklist?.length || 0;
    
    // Group tasks by category
    const byCategory: Record<string, any[]> = {};
    
    metadata?.checklist?.forEach((task: any) => {
      if (task.completed) completed++;
      
      // Add to category group
      const category = task.category || 'other';
      if (!byCategory[category]) byCategory[category] = [];
      byCategory[category].push(task);
    });
    
    // Calculate progress percentage
    const progressValue = total > 0 ? Math.round((completed / total) * 100) : 0;
    
    return {
      progress: progressValue,
      tasksByCategory: byCategory,
      totalTasks: total,
      completedTasks: completed
    };
  }, [metadata]);
  
  const updateTaskMutation = useMutation({
    mutationFn: async (data: {taskIndex: number, completed: boolean}) => {
      // Clone the metadata
      const metadataCopy = {...metadata};
      
      // Update the checklist item
      if (metadataCopy.checklist && metadataCopy.checklist[data.taskIndex]) {
        metadataCopy.checklist[data.taskIndex].completed = data.completed;
      }
      
      // Calculate new progress
      let completedCount = 0;
      metadataCopy.checklist.forEach((task: any) => {
        if (task.completed) completedCount++;
      });
      metadataCopy.progress = Math.round((completedCount / metadataCopy.checklist.length) * 100);
      
      // Update status based on progress
      if (metadataCopy.progress === 100) {
        metadataCopy.status = "completed";
      } else if (metadataCopy.progress > 0) {
        metadataCopy.status = "in_progress";
      } else {
        metadataCopy.status = "pending";
      }
      
      // Send the updated metadata
      return apiRequest("PATCH", `/api/tickets/${ticketId}`, {
        metadata: metadataCopy,
        // Also update ticket status if onboarding is complete
        ...(metadataCopy.progress === 100 ? { status: "closed" } : {})
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/tickets/${ticketId}`] });
      queryClient.invalidateQueries({ queryKey: ['/api/tickets'] });
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
    notes,
    expectedCompletionDate,
    checklist = []
  } = metadata;
  
  // Fetch position and department data
  const { data: positions } = useQuery({
    queryKey: ['/api/positions'],
  });
  
  const { data: departments } = useQuery({
    queryKey: ['/api/departments'],
  });
  
  const { data: employees } = useQuery({
    queryKey: ['/api/employees'],
  });
  
  // Find position title
  const position = positions?.find((p: any) => p.id === positionId)?.title || 'Unknown Position';
  
  // Find department name
  const department = departments?.find((d: any) => d.id === departmentId)?.name || 'Unknown Department';
  
  // Find reporting manager
  const manager = employees?.find((e: any) => e.id === reportingManagerId);
  const managerName = manager ? `${manager.firstName} ${manager.lastName}` : 'Unknown Manager';
  
  // Format the start date if it exists
  const formattedStartDate = startDate ? format(new Date(startDate), 'MMMM d, yyyy') : 'Not specified';
  
  // Format the expected completion date if it exists
  const formattedCompletionDate = expectedCompletionDate 
    ? format(new Date(expectedCompletionDate), 'MMMM d, yyyy') 
    : 'Not specified';
  
  // Get status badge
  const getStatusBadge = () => {
    if (progress === 100) {
      return <Badge className="bg-green-600"><CheckCircle className="h-3 w-3 mr-1" /> Completed</Badge>;
    } else if (progress > 0) {
      return <Badge className="bg-amber-500"><Clock className="h-3 w-3 mr-1" /> In Progress</Badge>;
    } else {
      return <Badge className="bg-blue-500"><AlertCircle className="h-3 w-3 mr-1" /> Pending</Badge>;
    }
  };
  
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="bg-muted/50">
          <div className="flex justify-between items-center">
            <CardTitle className="flex items-center gap-2">
              <UserPlus className="h-5 w-5" />
              <span>New Staff Request</span>
            </CardTitle>
            {getStatusBadge()}
          </div>
          <CardDescription>
            Onboarding progress: {completedTasks} of {totalTasks} tasks completed
          </CardDescription>
          <Progress className="h-2 mt-2" value={progress} />
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
                <Building className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-sm font-medium">Department</p>
                  <p className="text-sm text-muted-foreground">{department}</p>
                </div>
              </div>
              
              <div className="flex items-start space-x-3">
                <User className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-sm font-medium">Reporting Manager</p>
                  <p className="text-sm text-muted-foreground">{managerName}</p>
                </div>
              </div>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-start space-x-3">
                <Calendar className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-sm font-medium">Start Date</p>
                  <p className="text-sm text-muted-foreground">{formattedStartDate}</p>
                </div>
              </div>
              
              {expectedCompletionDate && (
                <div className="flex items-start space-x-3">
                  <Calendar className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-sm font-medium">Expected Completion</p>
                    <p className="text-sm text-muted-foreground">{formattedCompletionDate}</p>
                  </div>
                </div>
              )}
              
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
            </div>
          </div>
          
          {notes && (
            <div className="mt-6 pt-6 border-t">
              <p className="text-sm font-medium mb-2">Additional Notes</p>
              <p className="text-sm text-muted-foreground">{notes}</p>
            </div>
          )}
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="bg-muted/50">
          <CardTitle className="text-base flex items-center">
            <CheckSquare className="h-5 w-5 mr-2" />
            Onboarding Tasks
          </CardTitle>
          <CardDescription>
            Track and update the onboarding process for {firstName} {lastName}
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          {Object.keys(tasksByCategory).length > 0 ? (
            <Accordion type="multiple" defaultValue={Object.keys(tasksByCategory)}>
              {Object.entries(tasksByCategory).map(([category, tasks]) => {
                // Calculate category progress
                const categoryCompleted = tasks.filter(task => task.completed).length;
                const categoryTotal = tasks.length;
                const categoryProgress = Math.round((categoryCompleted / categoryTotal) * 100);
                
                return (
                  <AccordionItem key={category} value={category}>
                    <AccordionTrigger className="hover:bg-muted/50 px-4 rounded-md">
                      <div className="flex items-center justify-between w-full pr-4">
                        <div className="flex items-center">
                          {categoryIcons[category] || <CheckSquare className="h-4 w-4 mr-2" />}
                          <span>{categoryNames[category] || category}</span>
                        </div>
                        <div className="flex items-center text-sm">
                          <span className="mr-3">{categoryCompleted}/{categoryTotal}</span>
                          <Progress className="w-24 h-2" value={categoryProgress} />
                        </div>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="px-4">
                      <div className="space-y-2 pt-2">
                        {tasks.map((task: any, taskIndex: number) => {
                          // Find the original index in the full checklist
                          const originalIndex = metadata.checklist.findIndex((t: any) => t === task);
                          
                          return (
                            <div key={taskIndex} className="flex items-center space-x-2 py-2 px-1 hover:bg-muted/30 rounded-md">
                              <Checkbox 
                                id={`task-${originalIndex}`}
                                checked={task.completed} 
                                onCheckedChange={() => toggleTask(originalIndex, task.completed)}
                              />
                              <label 
                                htmlFor={`task-${originalIndex}`}
                                className={`text-sm flex-grow cursor-pointer ${task.completed ? "line-through text-muted-foreground" : ""}`}
                              >
                                {task.task}
                              </label>
                              <Button 
                                variant="ghost" 
                                size="sm"
                                onClick={() => toggleTask(originalIndex, task.completed)}
                              >
                                {task.completed ? "Undo" : "Complete"}
                              </Button>
                            </div>
                          );
                        })}
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                );
              })}
            </Accordion>
          ) : (
            <p className="text-sm text-muted-foreground py-2">No checklist items available.</p>
          )}
        </CardContent>
        <CardFooter className="bg-muted/20 flex justify-between">
          <div className="text-sm">Overall Progress: {completedTasks} of {totalTasks} completed</div>
          <Progress className="w-1/3 h-2" value={progress} />
        </CardFooter>
      </Card>
    </div>
  );
}