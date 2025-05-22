import { useState } from "react";
import { useParams, Link, useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Layout from "@/components/layout";
import { Employee, Ticket, Activity } from "@/types";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { EmployeeOrgChart } from "@/components/staff/employee-org-chart";
import { SystemAccessTab } from "@/components/access/system-access-tab";
import { useAuth } from "@/hooks/useAuth";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { StatusBadge } from "@/components/ui/status-badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { format } from "date-fns";
import {
  Edit,
  Mail,
  Phone,
  Building,
  User,
  Calendar,
  Briefcase,
  Clock,
  Trash2,
  AlertTriangle,
  Settings,
  Ticket as TicketIcon,
  LogOut
} from "lucide-react";

export default function EmployeeProfile() {
  const { id } = useParams<{ id: string }>();
  const employeeId = parseInt(id);
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("overview");
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showOffboardDialog, setShowOffboardDialog] = useState(false);
  const [offboardingStage, setOffboardingStage] = useState(1);
  const [offboardingOptions, setOffboardingOptions] = useState({
    forwardEmail: false,
    forwardEmailTo: "",
    organizationNotification: false,
    lastDayOfWork: "",
    returnedEquipment: false,
    terminationReason: "",
    exitInterviewCompleted: false,
    pendingHRApproval: true,
    pendingITApproval: true
  });
  const { user, isAdmin } = useAuth();

  const { data: employee, isLoading } = useQuery<Employee>({
    queryKey: [`/api/employees/${employeeId}`],
  });
  
  // Fetch employee activities with forced refresh
  const { data: activities = [], isLoading: isLoadingActivities, refetch: refetchActivities } = useQuery<Activity[]>({
    queryKey: [`/api/employees/${employeeId}/activities`],
    enabled: !!employeeId,
    refetchInterval: 5000, // Auto-refresh activities every 5 seconds to catch new updates
    refetchOnMount: true,  // Refetch when component mounts
    refetchOnWindowFocus: true, // Refetch when window gets focus
    staleTime: 0, // Consider data always stale to force refreshes
  });

  const updateStatusMutation = useMutation({
    mutationFn: async (status: 'active' | 'inactive' | 'onboarding' | 'offboarded') => {
      return apiRequest("PATCH", `/api/employees/${employeeId}`, { status });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/employees/${employeeId}`] });
      queryClient.invalidateQueries({ queryKey: ['/api/employees'] });
      toast({
        title: "Status updated",
        description: "Employee status has been updated successfully.",
      });
      setShowOffboardDialog(false);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update employee status.",
        variant: "destructive",
      });
    },
  });
  
  const startOffboardingProcess = () => {
    // Create an offboarding ticket request instead of immediately changing status
    apiRequest("POST", `/api/tickets`, {
      title: `Offboarding Request - ${employee?.firstName} ${employee?.lastName}`,
      description: `Offboarding request for ${employee?.firstName} ${employee?.lastName} (Employee ID: ${employeeId})`,
      requestorId: user?.employeeId,
      priority: "high",
      type: "offboarding",
      status: "open",
      metadata: {
        ...offboardingOptions,
        employeeId: employeeId,
        employeeName: `${employee?.firstName} ${employee?.lastName}`,
        employeeEmail: employee?.email,
        employeePosition: employee?.position,
        department: employee?.department?.name,
        initiatedBy: user?.id,
        initiatedAt: new Date().toISOString(),
      }
    })
    .then((response) => {
      // Log the activity
      apiRequest("POST", `/api/employees/${employeeId}/activities`, {
        activityType: "offboarding",
        description: `Offboarding process initiated by ${user?.firstName} ${user?.lastName}`,
        metadata: {
          ticketId: response.id,
          status: "pending_approval",
          changedBy: user?.id
        }
      }).catch(error => {
        console.error("Failed to log offboarding activity:", error);
      });
      
      toast({
        title: "Offboarding process initiated",
        description: "HR and IT teams have been notified for approval.",
      });
      
      setShowOffboardDialog(false);
    })
    .catch(error => {
      toast({
        title: "Error",
        description: error.message || "Failed to start offboarding process.",
        variant: "destructive",
      });
    });
  };
  
  const handleOffboardingOptionsChange = (field: string, value: any) => {
    setOffboardingOptions(prev => ({
      ...prev,
      [field]: value
    }));
  };
  
  // Helper function to format activity timestamps
  const formatTimestamp = (timestamp: string | Date) => {
    try {
      const date = new Date(timestamp);
      // If it's today, show relative time (e.g., "2 hours ago")
      const today = new Date();
      if (date.toDateString() === today.toDateString()) {
        return `Today, ${format(date, 'h:mm a')}`;
      }
      // If it's yesterday, show "Yesterday"
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      if (date.toDateString() === yesterday.toDateString()) {
        return `Yesterday, ${format(date, 'h:mm a')}`;
      }
      // If it's this year, show month and day
      if (date.getFullYear() === today.getFullYear()) {
        return format(date, 'MMM d, h:mm a');
      }
      // Otherwise show full date
      return format(date, 'MMM d, yyyy h:mm a');
    } catch (error) {
      return 'Unknown date';
    }
  };
  
  const deleteEmployeeMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("DELETE", `/api/employees/${employeeId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/employees'] });
      toast({
        title: "Employee deleted",
        description: "The employee has been successfully removed from the system.",
      });
      navigate("/directory");
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete employee. Please try again.",
        variant: "destructive",
      });
      setShowDeleteDialog(false);
    },
  });

  if (isLoading) {
    return (
      <Layout>
        <div className="p-8 flex justify-center">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        </div>
      </Layout>
    );
  }

  if (!employee) {
    return (
      <Layout>
        <div className="text-center p-8">
          <h2 className="text-2xl font-bold">Employee Not Found</h2>
          <p className="text-muted-foreground mt-2">The employee you're looking for doesn't exist or you don't have permission to view it.</p>
          <Button className="mt-4" onClick={() => navigate("/directory")}>
            Back to Directory
          </Button>
        </div>
      </Layout>
    );
  }

  // The improved formatTimestamp function is already defined above

  return (
    <>
      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              Delete Employee
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete {employee.firstName} {employee.lastName}? This action cannot be undone and will permanently remove the employee from the system.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={() => deleteEmployeeMutation.mutate()}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteEmployeeMutation.isPending ? (
                <>
                  <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-background border-t-transparent"></div>
                  Deleting...
                </>
              ) : (
                "Delete Employee"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      
      {/* Multi-step Offboarding Dialog */}
      <AlertDialog open={showOffboardDialog} onOpenChange={setShowOffboardDialog}>
        <AlertDialogContent className="max-w-3xl overflow-auto max-h-[90vh]">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <LogOut className="h-5 w-5 text-amber-500" />
              Offboard Employee: {employee?.firstName} {employee?.lastName}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {offboardingStage === 1 && (
                <div className="space-y-4">
                  <p>
                    You are about to initiate the offboarding process for this employee. This will:
                  </p>
                  <ul className="list-disc ml-6 mt-2 space-y-1">
                    <li>Create an offboarding request ticket</li>
                    <li>Notify HR and IT departments for approval</li>
                    <li>Begin the system access revocation process</li>
                    <li>Initiate equipment return procedures</li>
                  </ul>
                  
                  <div className="border rounded-md p-4 mt-4 space-y-4">
                    <h3 className="font-medium text-base">Required Information</h3>
                    
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Last Day of Work</label>
                      <input 
                        type="date" 
                        className="w-full p-2 border rounded-md"
                        value={offboardingOptions.lastDayOfWork}
                        onChange={(e) => handleOffboardingOptionsChange("lastDayOfWork", e.target.value)}
                        required
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Reason for Termination</label>
                      <select
                        className="w-full p-2 border rounded-md"
                        value={offboardingOptions.terminationReason}
                        onChange={(e) => handleOffboardingOptionsChange("terminationReason", e.target.value)}
                        required
                      >
                        <option value="">-- Select a reason --</option>
                        <option value="resignation">Resignation</option>
                        <option value="retirement">Retirement</option>
                        <option value="termination">Termination</option>
                        <option value="layoff">Layoff</option>
                        <option value="contract_end">Contract End</option>
                        <option value="other">Other</option>
                      </select>
                    </div>
                  </div>
                  
                  <div className="flex justify-between mt-4">
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <Button
                      onClick={() => setOffboardingStage(2)}
                      disabled={!offboardingOptions.lastDayOfWork || !offboardingOptions.terminationReason}
                    >
                      Continue
                    </Button>
                  </div>
                </div>
              )}
              
              {offboardingStage === 2 && (
                <div className="space-y-4">
                  <p>
                    Please configure the email and communication settings for this offboarding:
                  </p>
                  
                  <div className="border rounded-md p-4 mt-4 space-y-4">
                    <h3 className="font-medium text-base">Email Configuration</h3>
                    
                    <div className="flex items-center space-x-2">
                      <input 
                        type="checkbox" 
                        id="forwardEmail" 
                        checked={offboardingOptions.forwardEmail}
                        onChange={(e) => handleOffboardingOptionsChange("forwardEmail", e.target.checked)}
                      />
                      <label htmlFor="forwardEmail" className="text-sm">
                        Forward emails to another address
                      </label>
                    </div>
                    
                    {offboardingOptions.forwardEmail && (
                      <div className="space-y-2 ml-6">
                        <label className="text-sm font-medium">Forward emails to:</label>
                        <input 
                          type="email" 
                          className="w-full p-2 border rounded-md"
                          placeholder="email@example.com"
                          value={offboardingOptions.forwardEmailTo}
                          onChange={(e) => handleOffboardingOptionsChange("forwardEmailTo", e.target.value)}
                        />
                      </div>
                    )}
                    
                    <div className="flex items-center space-x-2 mt-4">
                      <input 
                        type="checkbox" 
                        id="orgNotification" 
                        checked={offboardingOptions.organizationNotification}
                        onChange={(e) => handleOffboardingOptionsChange("organizationNotification", e.target.checked)}
                      />
                      <label htmlFor="orgNotification" className="text-sm">
                        Send organization-wide notification about this departure
                      </label>
                    </div>
                  </div>
                  
                  <div className="border rounded-md p-4 mt-4 space-y-4">
                    <h3 className="font-medium text-base">Equipment Return</h3>
                    
                    <div className="flex items-center space-x-2">
                      <input 
                        type="checkbox" 
                        id="returnedEquipment" 
                        checked={offboardingOptions.returnedEquipment}
                        onChange={(e) => handleOffboardingOptionsChange("returnedEquipment", e.target.checked)}
                      />
                      <label htmlFor="returnedEquipment" className="text-sm">
                        Employee has returned all company equipment
                      </label>
                    </div>
                  </div>
                  
                  <div className="flex justify-between mt-4">
                    <Button variant="outline" onClick={() => setOffboardingStage(1)}>
                      Back
                    </Button>
                    <Button
                      onClick={() => setOffboardingStage(3)}
                    >
                      Continue
                    </Button>
                  </div>
                </div>
              )}
              
              {offboardingStage === 3 && (
                <div className="space-y-4">
                  <p>
                    Please review the offboarding request. Once submitted, it will require approvals from:
                  </p>
                  
                  <div className="space-y-2 mt-4">
                    <div className="p-3 bg-blue-50 border border-blue-200 rounded-md flex items-center space-x-2">
                      <div className="h-3 w-3 rounded-full bg-blue-500"></div>
                      <span className="text-sm">HR Department Approval Required</span>
                    </div>
                    
                    <div className="p-3 bg-purple-50 border border-purple-200 rounded-md flex items-center space-x-2">
                      <div className="h-3 w-3 rounded-full bg-purple-500"></div>
                      <span className="text-sm">IT Department Approval Required</span>
                    </div>
                  </div>
                  
                  <div className="border rounded-md p-4 mt-4">
                    <h3 className="font-medium text-base mb-3">Offboarding Summary</h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="font-medium">Employee</p>
                        <p>{employee?.firstName} {employee?.lastName}</p>
                      </div>
                      
                      <div>
                        <p className="font-medium">Position</p>
                        <p>{employee?.position}</p>
                      </div>
                      
                      <div>
                        <p className="font-medium">Department</p>
                        <p>{employee?.department?.name}</p>
                      </div>
                      
                      <div>
                        <p className="font-medium">Last Day of Work</p>
                        <p>{offboardingOptions.lastDayOfWork || "Not specified"}</p>
                      </div>
                      
                      <div>
                        <p className="font-medium">Reason</p>
                        <p className="capitalize">{offboardingOptions.terminationReason.replace('_', ' ') || "Not specified"}</p>
                      </div>
                      
                      <div>
                        <p className="font-medium">Email Forwarding</p>
                        <p>{offboardingOptions.forwardEmail ? `Yes, to ${offboardingOptions.forwardEmailTo}` : "No"}</p>
                      </div>
                      
                      <div>
                        <p className="font-medium">Organization Notification</p>
                        <p>{offboardingOptions.organizationNotification ? "Yes" : "No"}</p>
                      </div>
                      
                      <div>
                        <p className="font-medium">Equipment Returned</p>
                        <p>{offboardingOptions.returnedEquipment ? "Yes" : "No"}</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2 mt-4">
                    <input 
                      type="checkbox" 
                      id="exitInterviewCompleted" 
                      checked={offboardingOptions.exitInterviewCompleted}
                      onChange={(e) => handleOffboardingOptionsChange("exitInterviewCompleted", e.target.checked)}
                    />
                    <label htmlFor="exitInterviewCompleted" className="text-sm">
                      Exit interview has been completed
                    </label>
                  </div>
                  
                  <div className="flex justify-between mt-4">
                    <Button variant="outline" onClick={() => setOffboardingStage(2)}>
                      Back
                    </Button>
                    <AlertDialogAction 
                      onClick={startOffboardingProcess}
                      className="bg-amber-500 text-white hover:bg-amber-600"
                    >
                      {updateStatusMutation.isPending ? (
                        <>
                          <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-background border-t-transparent"></div>
                          Processing...
                        </>
                      ) : (
                        "Submit Offboarding Request"
                      )}
                    </AlertDialogAction>
                  </div>
                </div>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
        </AlertDialogContent>
      </AlertDialog>
      
      <Layout title={`${employee.firstName} ${employee.lastName}`}>
        <div className="space-y-6">
          {/* Profile Header */}
          <div className="bg-card rounded-lg border shadow-sm p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Profile Info */}
              <div className="md:col-span-2">
                <div className="flex items-center space-x-4">
                  <Avatar className="h-20 w-20">
                    <AvatarImage src={employee.avatar} alt={`${employee.firstName} ${employee.lastName}`} />
                    <AvatarFallback className="text-xl">{employee.firstName[0]}{employee.lastName[0]}</AvatarFallback>
                  </Avatar>
                  <div>
                    <h2 className="text-2xl font-bold">{employee.firstName} {employee.lastName}</h2>
                    <p className="text-muted-foreground">{employee.position}</p>
                    <div className="flex items-center mt-2">
                      <StatusBadge status={employee.status as any} className="capitalize" />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                  <div className="flex items-center text-sm">
                    <Mail className="h-4 w-4 mr-2 text-muted-foreground" />
                    <span>{employee.email}</span>
                  </div>
                  <div className="flex items-center text-sm">
                    <Phone className="h-4 w-4 mr-2 text-muted-foreground" />
                    <span>{employee.phone || 'Not provided'}</span>
                  </div>
                  <div className="flex items-center text-sm">
                    <Building className="h-4 w-4 mr-2 text-muted-foreground" />
                    <span>{employee.department?.name || 'Unassigned'}</span>
                  </div>
                  <div className="flex items-center text-sm">
                    <User className="h-4 w-4 mr-2 text-muted-foreground" />
                    <span>Reports to: {employee.manager?.name || 'No manager'}</span>
                  </div>
                  <div className="flex items-center text-sm">
                    <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
                    <span>Hired: {format(new Date(employee.hireDate), 'MMM d, yyyy')}</span>
                  </div>
                  <div className="flex items-center text-sm">
                    <Briefcase className="h-4 w-4 mr-2 text-muted-foreground" />
                    <span>Employee ID: {employee.id}</span>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex flex-col space-y-3 justify-start items-start md:items-end">
                <Button asChild>
                  <Link href={`/employee/${employeeId}/edit`} className="flex items-center">
                    <Edit className="mr-2 h-4 w-4" />
                    <span>Edit Profile</span>
                  </Link>
                </Button>
                
                {/* Delete Employee Button (Global Admin Only) */}
                {employee.id !== 118 && ( // Prevent deletion of Chris Nelloms (primary admin)
                  <Button 
                    variant="destructive"
                    onClick={() => setShowDeleteDialog(true)}
                    className="flex items-center"
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    <span>Delete Employee</span>
                  </Button>
                )}

                {employee.status === 'onboarding' && (
                  <Button 
                    variant="secondary"
                    onClick={() => updateStatusMutation.mutate('active')}
                    disabled={updateStatusMutation.isPending}
                  >
                    Complete Onboarding
                  </Button>
                )}

                {employee.status === 'active' && (
                  <Button 
                    variant="destructive"
                    onClick={() => updateStatusMutation.mutate('inactive')}
                    disabled={updateStatusMutation.isPending}
                  >
                    Deactivate
                  </Button>
                )}

                {employee.status === 'inactive' && (
                  <Button 
                    variant="secondary"
                    onClick={() => updateStatusMutation.mutate('active')}
                    disabled={updateStatusMutation.isPending}
                  >
                    Reactivate
                  </Button>
                )}
                
                {/* Offboard Button - visible to managers and admins for active employees */}
                {employee.status === 'active' && (isAdmin || (user?.employeeId === employee.managerId)) && (
                  <Button 
                    variant="outline"
                    onClick={() => setShowOffboardDialog(true)}
                    disabled={updateStatusMutation.isPending}
                    className="border-amber-500 text-amber-500 hover:bg-amber-50 hover:text-amber-600"
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    Offboard Employee
                  </Button>
                )}
              </div>
            </div>
          </div>

          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid grid-cols-4 w-full max-w-md">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="tickets">Tickets</TabsTrigger>
              <TabsTrigger value="org-chart">Org Chart</TabsTrigger>
              <TabsTrigger value="systems">Systems</TabsTrigger>
            </TabsList>

            {/* Overview Tab */}
            <TabsContent value="overview" className="space-y-6">
              {/* Recent Activity */}
              <Card>
                <CardHeader>
                  <CardTitle>Recent Activity</CardTitle>
                  <CardDescription>Latest actions, changes and update requests for this employee</CardDescription>
                </CardHeader>
                <CardContent>
                  {isLoadingActivities ? (
                    <div className="space-y-4">
                      {[1, 2, 3].map((i) => (
                        <div key={i} className="flex items-start space-x-4 animate-pulse">
                          <div className="rounded-full bg-muted p-2 h-8 w-8"></div>
                          <div className="space-y-2 flex-1">
                            <div className="h-4 bg-muted rounded w-3/4"></div>
                            <div className="h-3 bg-muted rounded w-1/4"></div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : activities && activities.length > 0 ? (
                    <div className="space-y-4">
                      {activities.map((activity: Activity) => {
                        // Select the appropriate icon based on activity type
                        let ActivityIcon = Clock;
                        const activityType = activity.activityType || 'general';
                        
                        if (activityType === 'profile_update') {
                          ActivityIcon = User;
                        } else if (activityType === 'system_access') {
                          ActivityIcon = Settings;
                        } else if (activityType === 'ticket') {
                          ActivityIcon = TicketIcon;
                        } else if (activityType === 'change_request') {
                          ActivityIcon = Edit;
                        }
                        
                        // Format the activity type for display
                        const formattedType = activityType
                          .replace(/_/g, ' ')
                          .split(' ')
                          .map(word => word.charAt(0).toUpperCase() + word.slice(1))
                          .join(' ');
                        
                        return (
                          <div key={activity.id} className="flex items-start space-x-4">
                            <div className="rounded-full bg-primary/10 p-2">
                              <ActivityIcon className="h-4 w-4 text-primary" />
                            </div>
                            <div className="space-y-1">
                              <p className="text-sm">
                                <span className="font-medium">{formattedType}</span>: {activity.description}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {formatTimestamp(activity.timestamp)}
                              </p>
                              {activity.metadata?.status && (
                                <p className="text-xs">
                                  <StatusBadge 
                                    status={activity.metadata.status} 
                                    label={activity.metadata.status.charAt(0).toUpperCase() + activity.metadata.status.slice(1)} 
                                  />
                                </p>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="text-muted-foreground text-center py-4">No recent activity found for this employee</p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Tickets Tab */}
            <TabsContent value="tickets">
              <Card>
                <CardHeader>
                  <CardTitle>Tickets</CardTitle>
                  <CardDescription>Support tickets created by or assigned to this employee</CardDescription>
                </CardHeader>
                <CardContent>
                  {employee.tickets && employee.tickets.length > 0 ? (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Title</TableHead>
                          <TableHead>Type</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Priority</TableHead>
                          <TableHead>Created</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {employee.tickets.map((ticket: Ticket) => (
                          <TableRow key={ticket.id}>
                            <TableCell className="font-medium">
                              <Link href={`/tickets/${ticket.id}`} className="hover:underline">
                                {ticket.title}
                              </Link>
                            </TableCell>
                            <TableCell className="capitalize">{ticket.type.replace('_', ' ')}</TableCell>
                            <TableCell>
                              <StatusBadge status={ticket.status as any} />
                            </TableCell>
                            <TableCell>
                              <StatusBadge status={ticket.priority as any} />
                            </TableCell>
                            <TableCell>{format(new Date(ticket.createdAt), 'MMM d, yyyy')}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  ) : (
                    <div className="text-center py-6">
                      <p className="text-muted-foreground">No tickets found</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Organization Chart Tab */}
            <TabsContent value="org-chart">
              <Card>
                <CardHeader>
                  <CardTitle>Organization Chart</CardTitle>
                  <CardDescription>View {employee.firstName}'s team and direct reports</CardDescription>
                </CardHeader>
                <CardContent>
                  <EmployeeOrgChart managerId={employee.id} />
                </CardContent>
              </Card>
            </TabsContent>

            {/* Systems Tab */}
            <TabsContent value="systems">
              <Card>
                <CardHeader>
                  <CardTitle>Assigned Systems</CardTitle>
                  <CardDescription>Systems that {employee.firstName} has access to</CardDescription>
                </CardHeader>
                <CardContent>
                  <SystemAccessTab employeeId={employee.id} isAdmin={true} />
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </Layout>
    </>
  );
}