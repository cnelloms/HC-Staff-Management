import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle,
  CardDescription,
  CardFooter
} from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { 
  User, 
  Building, 
  Briefcase, 
  Calendar, 
  Mail, 
  Phone,
  UserPlus,
  CheckCircle,
  AlertCircle,
  Clock,
  CheckSquare,
  Laptop,
  Copy,
  Eye,
  EyeOff,
  MessageSquare
} from 'lucide-react';

interface NewStaffRequestDetailsProps {
  ticketId: number;
  metadata: any;
  ticket?: any;
}

export function NewStaffRequestDetails({ ticketId, metadata, ticket }: NewStaffRequestDetailsProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // State for email, password, and tasks
  const [workEmail, setWorkEmail] = useState(metadata?.workEmail || '');
  const [password, setPassword] = useState(metadata?.password || '');
  const [showPassword, setShowPassword] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  
  // Track completion status of the three tasks
  const [tasks, setTasks] = useState([
    { 
      id: 1, 
      title: "Create and provide email for new staff", 
      completed: !!metadata?.workEmail,
      icon: <Mail className="h-5 w-5" />
    },
    { 
      id: 2, 
      title: "Generate secure password", 
      completed: !!metadata?.password,
      icon: <Laptop className="h-5 w-5" />
    },
    { 
      id: 3, 
      title: "Send login information to reporting manager", 
      completed: metadata?.notificationSent || false,
      icon: <MessageSquare className="h-5 w-5" />
    }
  ]);
  
  // Track completion progress
  const [progress, setProgress] = useState(0);
  
  // Update progress when tasks change
  useEffect(() => {
    const completedTasks = tasks.filter(task => task.completed).length;
    const progressValue = Math.round((completedTasks / tasks.length) * 100);
    setProgress(progressValue);
  }, [tasks]);
  
  // Function to generate a random password
  const generatePassword = () => {
    const readableChars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789';
    let result = '';
    for (let i = 0; i < 12; i++) {
      result += readableChars.charAt(Math.floor(Math.random() * readableChars.length));
    }
    return result;
  };
  
  // Function to validate email
  const isValidEmail = (email: string) => {
    return /\S+@\S+\.\S+/.test(email);
  };
  
  // Update metadata mutation
  const updateTicketMutation = useMutation<Response, Error, any>({
    mutationFn: async (updatedData: any) => {
      // Create a deep copy of metadata and merge updates
      const updatedMetadata = {
        ...JSON.parse(JSON.stringify(metadata || {})),
        ...updatedData
      };
      
      // Create the payload
      const payload: any = {
        metadata: updatedMetadata
      };
      
      // If all tasks are completed, close the ticket
      if (updatedData.allTasksCompleted) {
        payload.status = "closed";
      }
      
      return apiRequest("PATCH", `/api/tickets/${ticketId}`, payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/tickets/${ticketId}`] });
      queryClient.invalidateQueries({ queryKey: ['/api/tickets'] });
      toast({
        title: "Update successful",
        description: "The task has been updated successfully."
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update task. Please try again.",
        variant: "destructive"
      });
    }
  });
  
  // Handle password generation
  const handleGeneratePassword = () => {
    const newPassword = generatePassword();
    setPassword(newPassword);
    
    // Update tasks state
    const updatedTasks = [...tasks];
    updatedTasks[1].completed = true;
    setTasks(updatedTasks);
    
    // Update metadata
    updateTicketMutation.mutate({ 
      password: newPassword,
      allTasksCompleted: updatedTasks.every(task => task.completed)
    });
  };
  
  // Handle email save
  const handleSaveEmail = () => {
    if (!isValidEmail(workEmail)) {
      toast({
        title: "Invalid email",
        description: "Please enter a valid email address.",
        variant: "destructive"
      });
      return;
    }
    
    // Update tasks state
    const updatedTasks = [...tasks];
    updatedTasks[0].completed = true;
    setTasks(updatedTasks);
    
    // Update metadata
    updateTicketMutation.mutate({ 
      workEmail,
      allTasksCompleted: updatedTasks.every(task => task.completed)
    });
  };
  
  // Handle notification to manager
  const handleSendNotification = () => {
    if (!workEmail || !password) {
      toast({
        title: "Missing information",
        description: "Both email and password must be created first.",
        variant: "destructive"
      });
      return;
    }
    
    setIsDialogOpen(true);
  };
  
  // Confirm sending notification
  const confirmSendNotification = () => {
    // Update tasks state
    const updatedTasks = [...tasks];
    updatedTasks[2].completed = true;
    setTasks(updatedTasks);
    
    // Update metadata
    updateTicketMutation.mutate({ 
      notificationSent: true,
      allTasksCompleted: true // This is the last task, so all tasks are complete
    });
    
    setIsDialogOpen(false);
  };
  
  // Fetch necessary data
  const { data: positions } = useQuery<any[]>({
    queryKey: ['/api/positions'],
  });
  
  const { data: departments } = useQuery<any[]>({
    queryKey: ['/api/departments'],
  });
  
  const { data: employees } = useQuery<any[]>({
    queryKey: ['/api/employees'],
  });
  
  // Get employee details
  const {
    firstName,
    lastName,
    positionId,
    departmentId,
    reportingManagerId,
    startDate
  } = metadata || {};
  
  // Find position
  const position = Array.isArray(positions) 
    ? positions.find((p: any) => p.id === positionId)?.title || 'Unknown Position'
    : 'Unknown Position';
  
  // Find department
  const department = Array.isArray(departments) 
    ? departments.find((d: any) => d.id === departmentId)?.name || 'Unknown Department'
    : 'Unknown Department';
  
  // Find reporting manager
  const manager = Array.isArray(employees) 
    ? employees.find((e: any) => e.id === reportingManagerId)
    : null;
  const managerName = manager ? `${manager.firstName} ${manager.lastName}` : 'Unknown Manager';
  
  // Format dates
  const formattedStartDate = startDate ? format(new Date(startDate), 'MMMM d, yyyy') : 'Not specified';
  
  // Get status badge
  const getStatusBadge = () => {
    if (progress === 100) {
      return <Badge className="bg-green-600"><CheckCircle className="h-3 w-3 mr-1" /> Completed</Badge>;
    } else if (progress > 0) {
      return <Badge className="bg-amber-500"><Clock className="h-3 w-3 mr-1" /> In Progress</Badge>;
    }
    return <Badge className="bg-blue-500"><AlertCircle className="h-3 w-3 mr-1" /> Pending</Badge>;
  };
  
  return (
    <div className="space-y-6">
      {/* Employee Information Card */}
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
            Onboarding progress: {tasks.filter(t => t.completed).length} of {tasks.length} tasks completed
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
                <Briefcase className="h-5 w-5 text-muted-foreground mt-0.5" />
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
              
              {workEmail && (
                <div className="flex items-start space-x-3">
                  <Mail className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-sm font-medium">Work Email</p>
                    <p className="text-sm text-muted-foreground">{workEmail}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Tasks Card */}
      <Card>
        <CardHeader className="bg-muted/50">
          <CardTitle className="text-base flex items-center">
            <CheckSquare className="h-5 w-5 mr-2" />
            Onboarding Tasks
          </CardTitle>
          <CardDescription>
            Complete these tasks to onboard {firstName} {lastName}
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-6 space-y-6">
          {/* Task 1: Create Email */}
          <div className="border rounded-md p-4">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Mail className="h-5 w-5 text-primary" />
                <h3 className="font-medium">Task 1: Create Email Account</h3>
              </div>
              {tasks[0].completed ? (
                <Badge className="bg-green-600">Completed</Badge>
              ) : (
                <Badge>Pending</Badge>
              )}
            </div>
            
            <div className="space-y-4">
              <div className="grid gap-2">
                <Label htmlFor="email">Work Email</Label>
                <div className="flex gap-2">
                  <Input
                    id="email"
                    type="email"
                    placeholder="employee@company.com"
                    value={workEmail}
                    onChange={(e) => setWorkEmail(e.target.value)}
                    disabled={tasks[0].completed}
                  />
                  <Button onClick={handleSaveEmail} disabled={tasks[0].completed || !workEmail}>
                    Save
                  </Button>
                </div>
              </div>
            </div>
          </div>
          
          {/* Task 2: Generate Password */}
          <div className="border rounded-md p-4">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Laptop className="h-5 w-5 text-primary" />
                <h3 className="font-medium">Task 2: Generate Password</h3>
              </div>
              {tasks[1].completed ? (
                <Badge className="bg-green-600">Completed</Badge>
              ) : (
                <Badge>Pending</Badge>
              )}
            </div>
            
            <div className="space-y-4">
              <div className="grid gap-2">
                <Label htmlFor="password">Secure Password</Label>
                <div className="flex gap-2">
                  <div className="flex-1 relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      value={password}
                      readOnly
                      className="pr-10"
                    />
                    <Button
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                  {password && (
                    <Button
                      variant="outline"
                      onClick={() => {
                        navigator.clipboard.writeText(password);
                        toast({
                          title: "Copied",
                          description: "Password copied to clipboard"
                        });
                      }}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  )}
                  <Button 
                    onClick={handleGeneratePassword} 
                    disabled={tasks[1].completed}
                  >
                    Generate
                  </Button>
                </div>
              </div>
            </div>
          </div>
          
          {/* Task 3: Send Login Information */}
          <div className="border rounded-md p-4">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5 text-primary" />
                <h3 className="font-medium">Task 3: Notify Manager</h3>
              </div>
              {tasks[2].completed ? (
                <Badge className="bg-green-600">Completed</Badge>
              ) : (
                <Badge>Pending</Badge>
              )}
            </div>
            
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Send the login credentials to {managerName} for the new employee.
              </p>
              
              <div className="bg-muted p-3 rounded-md">
                <p className="text-sm font-medium mb-2">Email Template:</p>
                <div className="text-sm">
                  <p>Hello {managerName},</p>
                  <p className="mt-2">
                    The login credentials for {firstName} {lastName} have been created. Please share these with them on their first day:
                  </p>
                  <p className="mt-2">
                    <strong>Email:</strong> {workEmail || '[Not created yet]'}<br />
                    <strong>Password:</strong> {password || '[Not generated yet]'}<br />
                    <strong>Start Date:</strong> {formattedStartDate}
                  </p>
                  <p className="mt-2">
                    Please remind them to change their password upon first login.
                  </p>
                  <p className="mt-2">
                    Regards,<br />
                    IT Department
                  </p>
                </div>
              </div>
              
              <Button 
                className="w-full" 
                onClick={handleSendNotification} 
                disabled={tasks[2].completed || !workEmail || !password}
              >
                Send Login Information
              </Button>
            </div>
          </div>
        </CardContent>
        <CardFooter className="bg-muted/20 flex justify-between">
          <div className="text-sm">Overall Progress: {tasks.filter(t => t.completed).length} of {tasks.length} completed</div>
          <Progress className="w-1/3 h-2" value={progress} />
        </CardFooter>
      </Card>
      
      {/* Confirmation Dialog */}
      <AlertDialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Notification</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to send the login credentials to {managerName}?
              This will mark the onboarding process as complete.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmSendNotification}>
              Send Notification
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}