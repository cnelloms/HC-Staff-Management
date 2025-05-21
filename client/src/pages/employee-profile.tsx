import { useState } from "react";
import { useParams, Link, useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Layout from "@/components/layout";
import { Employee, Ticket, Activity } from "@/types";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { EmployeeOrgChart } from "@/components/staff/employee-org-chart";

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
  AlertTriangle
} from "lucide-react";

export default function EmployeeProfile() {
  const { id } = useParams<{ id: string }>();
  const employeeId = parseInt(id);
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("overview");
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const { data: employee, isLoading } = useQuery<Employee>({
    queryKey: [`/api/employees/${employeeId}`],
  });

  const updateStatusMutation = useMutation({
    mutationFn: async (status: 'active' | 'inactive' | 'onboarding') => {
      return apiRequest("PATCH", `/api/employees/${employeeId}`, { status });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/employees/${employeeId}`] });
      queryClient.invalidateQueries({ queryKey: ['/api/employees'] });
      toast({
        title: "Status updated",
        description: "Employee status has been updated successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update employee status.",
        variant: "destructive",
      });
    },
  });
  
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

  const formatTimestamp = (timestamp: string) => {
    return format(new Date(timestamp), 'MMM d, yyyy h:mm a');
  };

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
              </div>
            </div>
          </div>

          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid grid-cols-3 w-full max-w-md">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="tickets">Tickets</TabsTrigger>
              <TabsTrigger value="org-chart">Org Chart</TabsTrigger>
            </TabsList>

            {/* Overview Tab */}
            <TabsContent value="overview" className="space-y-6">
              {/* Recent Activity */}
              <Card>
                <CardHeader>
                  <CardTitle>Recent Activity</CardTitle>
                  <CardDescription>Latest actions and updates for this employee</CardDescription>
                </CardHeader>
                <CardContent>
                  {employee.activities && employee.activities.length > 0 ? (
                    <div className="space-y-4">
                      {employee.activities.map((activity: Activity) => (
                        <div key={activity.id} className="flex items-start space-x-4">
                          <div className="rounded-full bg-primary/10 p-2">
                            <Clock className="h-4 w-4 text-primary" />
                          </div>
                          <div className="space-y-1">
                            <p className="text-sm">
                              <span className="font-medium">{activity.activityType.replace('_', ' ').toUpperCase()}</span>: {activity.description}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {formatTimestamp(activity.timestamp)}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-muted-foreground text-center py-4">No recent activity</p>
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
          </Tabs>
        </div>
      </Layout>
    </>
  );
}
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
              </div>
            </div>
          </div>

          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid grid-cols-3 w-full max-w-md">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="tickets">Tickets</TabsTrigger>
              <TabsTrigger value="org-chart">Org Chart</TabsTrigger>
            </TabsList>

            {/* Overview Tab */}
            <TabsContent value="overview" className="space-y-6">
              {/* Recent Activity */}
              <Card>
                <CardHeader>
                  <CardTitle>Recent Activity</CardTitle>
                  <CardDescription>Latest actions and updates for this employee</CardDescription>
                </CardHeader>
                <CardContent>
                  {employee.activities && employee.activities.length > 0 ? (
                    <div className="space-y-4">
                      {employee.activities.map((activity: Activity) => (
                        <div key={activity.id} className="flex items-start space-x-4">
                          <div className="rounded-full bg-primary/10 p-2">
                            <Clock className="h-4 w-4 text-primary" />
                          </div>
                          <div className="space-y-1">
                            <p className="text-sm">
                              <span className="font-medium">{activity.activityType.replace('_', ' ').toUpperCase()}</span>: {activity.description}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {formatTimestamp(activity.timestamp)}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-muted-foreground text-center py-4">No recent activity</p>
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
          </Tabs>
        </div>
      </Layout>
    </>
  );
}
