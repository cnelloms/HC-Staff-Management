import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle,
  CardDescription
} from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { 
  User, 
  Building, 
  Briefcase, 
  Calendar, 
  Mail, 
  Laptop,
  Copy,
  Eye,
  EyeOff,
  CheckCircle,
  AlertCircle,
  Clock,
  CheckSquare,
  AlertTriangle
} from 'lucide-react';

interface NewStaffRequestDetailsProps {
  ticketId: number;
  metadata: any;
}

export function NewStaffRequestDetails({ ticketId, metadata }: NewStaffRequestDetailsProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // State for email, password, and tasks
  const [workEmail, setWorkEmail] = useState(metadata?.workEmail || '');
  const [password, setPassword] = useState(metadata?.password || '');
  const [showPassword, setShowPassword] = useState(false);
  const [copySuccess, setCopySuccess] = useState('');
  
  // Track completion status of the three tasks
  const [tasks, setTasks] = useState([
    { 
      id: 1, 
      title: "Create work email for new staff", 
      completed: metadata?.emailCreated || false,
      icon: <Mail className="h-5 w-5" />
    },
    { 
      id: 2, 
      title: "Generate a secure 12-character password", 
      completed: metadata?.passwordGenerated || false,
      icon: <Laptop className="h-5 w-5" />
    },
    { 
      id: 3, 
      title: "Provide login information with copy button for manual sharing", 
      completed: metadata?.loginInfoProvided || false,
      icon: <Copy className="h-5 w-5" />
    }
  ]);
  
  // Track completion progress
  const [progress, setProgress] = useState(0);
  
  // Update progress when tasks change
  useEffect(() => {
    const completedTasks = tasks.filter(task => task.completed).length;
    const progressValue = Math.round((completedTasks / tasks.length) * 100);
    setProgress(progressValue);
    
    // Check if all tasks are completed, then auto-close ticket
    if (completedTasks === tasks.length && !metadata?.allTasksCompleted) {
      updateTicketMutation.mutate({ 
        allTasksCompleted: true
      });
    }
  }, [tasks]);
  
  // Function to generate a random password
  const generatePassword = () => {
    // Only include human-readable characters (no 0/O, 1/I/l confusion)
    const readableChars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
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
  
  // Handle copying to clipboard
  const copyToClipboard = (text: string, type: string) => {
    navigator.clipboard.writeText(text).then(
      () => {
        setCopySuccess(`${type} copied!`);
        setTimeout(() => setCopySuccess(''), 2000);
        toast({
          title: "Copied!",
          description: `${type} has been copied to clipboard.`,
        });
      },
      (err) => {
        console.error('Could not copy text: ', err);
        toast({
          title: "Error",
          description: "Failed to copy to clipboard",
          variant: "destructive"
        });
      }
    );
  };
  
  // Update metadata mutation
  const updateTicketMutation = useMutation({
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
      passwordGenerated: true
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
      emailCreated: true
    });
  };
  
  // Handle task completion
  const handleTaskCompletion = (taskId: number, completed: boolean) => {
    const updatedTasks = [...tasks];
    const taskIndex = updatedTasks.findIndex(t => t.id === taskId);
    
    if (taskIndex === -1) return;
    
    updatedTasks[taskIndex].completed = completed;
    setTasks(updatedTasks);
    
    // Update metadata based on which task was completed
    const updates: any = {};
    
    if (taskId === 1) {
      updates.emailCreated = completed;
    } else if (taskId === 2) {
      updates.passwordGenerated = completed;
    } else if (taskId === 3) {
      updates.loginInfoProvided = completed;
    }
    
    updateTicketMutation.mutate(updates);
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
    startDate,
    email: personalEmail,
    phone
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
  
  // Generate login credentials text for copying
  const getLoginCredentialsText = () => {
    return `
Login Information for ${firstName} ${lastName}
-------------------------
Email: ${workEmail}
Password: ${password}
Start Date: ${formattedStartDate}
Department: ${department}
Position: ${position}
Reporting To: ${managerName}
    `.trim();
  };
  
  return (
    <div className="space-y-6">
      {/* Employee Information Card */}
      <Card>
        <CardHeader className="bg-muted/30">
          <div className="flex justify-between items-center">
            <CardTitle className="text-xl">Staff Details</CardTitle>
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
              
              {personalEmail && (
                <div className="flex items-start space-x-3">
                  <Mail className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-sm font-medium">Personal Email</p>
                    <p className="text-sm text-muted-foreground">{personalEmail}</p>
                  </div>
                </div>
              )}
              
              {phone && (
                <div className="flex items-start space-x-3">
                  <Mail className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-sm font-medium">Phone</p>
                    <p className="text-sm text-muted-foreground">{phone}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Tasks Card */}
      <Card>
        <CardHeader className="bg-muted/30">
          <CardTitle className="text-xl flex items-center">
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
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-start gap-4">
                <Checkbox 
                  id="task-1"
                  checked={tasks[0].completed}
                  onCheckedChange={(checked) => handleTaskCompletion(1, checked as boolean)}
                />
                <div>
                  <Label htmlFor="task-1" className="text-base font-medium">
                    Create work email for new staff
                  </Label>
                  <p className="text-sm text-muted-foreground mt-1">
                    Create a corporate email account for the new staff member
                  </p>
                </div>
              </div>
              {tasks[0].completed ? (
                <Badge className="bg-green-600">Completed</Badge>
              ) : (
                <Badge variant="outline">Pending</Badge>
              )}
            </div>
            
            <div className="space-y-4 ml-8">
              <div className="grid gap-2">
                <Label htmlFor="email">Work Email</Label>
                <div className="flex gap-2">
                  <Input
                    id="email"
                    type="email"
                    placeholder="employee@company.com"
                    value={workEmail}
                    onChange={(e) => setWorkEmail(e.target.value)}
                  />
                  <Button 
                    onClick={handleSaveEmail} 
                    disabled={!workEmail}
                    variant="secondary"
                  >
                    Save
                  </Button>
                </div>
              </div>
            </div>
          </div>
          
          {/* Task 2: Generate Password */}
          <div className="border rounded-md p-4">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-start gap-4">
                <Checkbox 
                  id="task-2"
                  checked={tasks[1].completed}
                  onCheckedChange={(checked) => handleTaskCompletion(2, checked as boolean)}
                />
                <div>
                  <Label htmlFor="task-2" className="text-base font-medium">
                    Generate a secure 12-character password
                  </Label>
                  <p className="text-sm text-muted-foreground mt-1">
                    Create a strong, human-readable password using letters and numbers
                  </p>
                </div>
              </div>
              {tasks[1].completed ? (
                <Badge className="bg-green-600">Completed</Badge>
              ) : (
                <Badge variant="outline">Pending</Badge>
              )}
            </div>
            
            <div className="space-y-4 ml-8">
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
                  <Button onClick={handleGeneratePassword} variant="secondary">
                    Generate
                  </Button>
                </div>
              </div>
            </div>
          </div>
          
          {/* Task 3: Copy Login Information */}
          <div className="border rounded-md p-4">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-start gap-4">
                <Checkbox 
                  id="task-3"
                  checked={tasks[2].completed}
                  onCheckedChange={(checked) => handleTaskCompletion(3, checked as boolean)}
                />
                <div>
                  <Label htmlFor="task-3" className="text-base font-medium">
                    Copy login information for manual sharing
                  </Label>
                  <p className="text-sm text-muted-foreground mt-1">
                    Use the copy button to copy login credentials for sharing
                  </p>
                </div>
              </div>
              {tasks[2].completed ? (
                <Badge className="bg-green-600">Completed</Badge>
              ) : (
                <Badge variant="outline">Pending</Badge>
              )}
            </div>
            
            <div className="space-y-4 ml-8">
              <div className="grid gap-2">
                <div className="flex justify-between items-center">
                  <Label>Login Credentials</Label>
                  {copySuccess && (
                    <Badge variant="outline" className="text-green-600">
                      {copySuccess}
                    </Badge>
                  )}
                </div>
                
                <div className="bg-muted p-3 rounded-md">
                  <p className="font-medium">Login Information for {firstName} {lastName}</p>
                  <div className="text-sm space-y-1 mt-2">
                    {workEmail && <p><span className="font-medium">Email:</span> {workEmail}</p>}
                    {password && <p><span className="font-medium">Password:</span> {showPassword ? password : '••••••••••••'}</p>}
                    <p><span className="font-medium">Start Date:</span> {formattedStartDate}</p>
                    <p><span className="font-medium">Department:</span> {department}</p>
                    <p><span className="font-medium">Position:</span> {position}</p>
                  </div>
                </div>
                
                <div className="flex justify-end mt-2">
                  <Button 
                    onClick={() => copyToClipboard(getLoginCredentialsText(), 'Login information')}
                    disabled={!workEmail || !password}
                    className="gap-2"
                  >
                    <Copy className="h-4 w-4" />
                    Copy All Details
                  </Button>
                </div>
              </div>
            </div>
          </div>
          
          {/* Instructions and Notes */}
          <div className="mt-6 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-md p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />
              <div>
                <h4 className="font-medium text-amber-800 dark:text-amber-400">Important Note</h4>
                <p className="text-sm text-amber-700 dark:text-amber-300 mt-1">
                  Please mark each task as complete after you've finished it. When all tasks are completed, the system will automatically close this ticket.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Auto-generated User Account Info - Only shown when employee is created from completed ticket */}
      {metadata?.employeeCreated && metadata?.userAccountCreated && (
        <Card className="border-green-200 bg-green-50 dark:bg-green-900/10 mt-6">
          <CardHeader className="bg-green-100 dark:bg-green-900/20 border-b border-green-200">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <CardTitle className="text-xl text-green-800 dark:text-green-400">Employee Account Created</CardTitle>
            </div>
            <CardDescription className="text-green-700 dark:text-green-300">
              The system has automatically created an employee record and user account
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6 space-y-4">
            <div className="bg-white dark:bg-gray-800 border border-green-200 rounded-md p-4 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-medium flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Account Details
                </h3>
                <Badge className="bg-green-600">Ready to Use</Badge>
              </div>
              
              <Separator />
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">Username</Label>
                  <div className="flex items-center gap-2">
                    <div className="font-mono bg-muted p-2 rounded text-sm flex-1 overflow-x-auto">
                      {metadata.username}
                    </div>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="h-9 px-2"
                      onClick={() => copyToClipboard(metadata.username, "Username")}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">Password</Label>
                  <div className="flex items-center gap-2">
                    <div className="font-mono bg-muted p-2 rounded text-sm flex-1 overflow-x-auto relative">
                      {showPassword ? metadata.password : '••••••••••••'}
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0 absolute right-2 top-1/2 transform -translate-y-1/2"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="h-9 px-2"
                      onClick={() => copyToClipboard(metadata.password, "Password")}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
              
              <div className="mt-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 rounded-md p-3">
                <div className="flex gap-2 text-yellow-800 dark:text-yellow-300">
                  <AlertTriangle className="h-5 w-5 flex-shrink-0" />
                  <div className="text-sm">
                    <p className="font-medium">Important</p>
                    <p>These credentials will only be shown once. Please save them securely and share them with the employee.</p>
                  </div>
                </div>
              </div>
              
              <Button
                onClick={() => copyToClipboard(
                  `Username: ${metadata.username}\nPassword: ${metadata.password}\n\nPlease change your password after the first login.`, 
                  "Account credentials"
                )}
                className="w-full"
              >
                <Copy className="h-4 w-4 mr-2" />
                Copy All Account Credentials
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}