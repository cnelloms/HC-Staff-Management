import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Layout from "@/components/layout";
import { Employee, SystemAccess, Ticket, Activity } from "@/types";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useProfileData } from "@/hooks/useProfileData";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { StatusBadge } from "@/components/ui/status-badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  Mail,
  Phone,
  Building,
  User,
  Calendar,
  Briefcase,
  Key,
  PlusCircle,
  Clock,
  ChevronRight,
  Ticket as TicketIcon,
  Settings,
  UserCog,
  Shield,
  Edit
} from "lucide-react";
import { Link } from "wouter";

export default function UserProfile() {
  const { profileData, isLoading, employeeData } = useProfileData();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("overview");

  // Get the employee ID from the profile data
  const employeeId = profileData?.employeeId;

  // If we still need more employee details, fetch them
  const { data: userDetails, isLoading: isDetailsLoading } = useQuery<Employee>({
    queryKey: [`/api/employees/${employeeId}`],
    enabled: !!employeeId && !employeeData,
  });

  // Use the most complete data source available
  const user = employeeData || userDetails || profileData;
  const isPageLoading = isLoading || isDetailsLoading;

  if (isPageLoading) {
    return (
      <Layout title="My Profile">
        <div className="p-8 flex justify-center">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        </div>
      </Layout>
    );
  }

  if (!user) {
    return (
      <Layout title="My Profile">
        <div className="text-center p-8">
          <h2 className="text-2xl font-bold">User Not Found</h2>
          <p className="text-muted-foreground mt-2">
            We couldn't load your profile information. Please try again later.
          </p>
          <Button className="mt-4" asChild>
            <Link href="/">Back to Dashboard</Link>
          </Button>
        </div>
      </Layout>
    );
  }

  const formatTimestamp = (timestamp: string) => {
    return format(new Date(timestamp), 'MMM d, yyyy h:mm a');
  };

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), 'MMM d, yyyy');
  }

  return (
    <Layout title="My Profile">
      <div className="space-y-6">
        {/* Profile Header */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border shadow-sm p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Profile Info */}
            <div className="md:col-span-2">
              <div className="flex items-center space-x-4">
                <Avatar className="h-20 w-20">
                  <AvatarImage src={user.avatar} alt={`${user.firstName} ${user.lastName}`} />
                  <AvatarFallback className="text-xl">{user.firstName[0]}{user.lastName[0]}</AvatarFallback>
                </Avatar>
                <div>
                  <h2 className="text-2xl font-bold">{user.firstName} {user.lastName}</h2>
                  <p className="text-muted-foreground">{user.position}</p>
                  <div className="flex items-center mt-2">
                    <StatusBadge status={user.status as any} className="capitalize" />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                <div className="flex items-center text-sm">
                  <Mail className="h-4 w-4 mr-2 text-muted-foreground" />
                  <span>{user.email}</span>
                </div>
                <div className="flex items-center text-sm">
                  <Phone className="h-4 w-4 mr-2 text-muted-foreground" />
                  <span>{user.phone || 'Not provided'}</span>
                </div>
                <div className="flex items-center text-sm">
                  <Building className="h-4 w-4 mr-2 text-muted-foreground" />
                  <span>{user.department?.name || 'Unassigned'}</span>
                </div>
                <div className="flex items-center text-sm">
                  <User className="h-4 w-4 mr-2 text-muted-foreground" />
                  <span>Reports to: {user.manager?.name || 'No manager'}</span>
                </div>
                <div className="flex items-center text-sm">
                  <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
                  <span>Hired: {formatDate(user.hireDate)}</span>
                </div>
                <div className="flex items-center text-sm">
                  <Briefcase className="h-4 w-4 mr-2 text-muted-foreground" />
                  <span>Employee ID: {user.id}</span>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-col space-y-3 justify-start items-start md:items-end">
              <Button variant="outline" asChild>
                <Link href="/settings">
                  <Settings className="mr-2 h-4 w-4" />
                  Account Settings
                </Link>
              </Button>
              
              <Button variant="outline" asChild>
                <Link href="/tickets/new">
                  <TicketIcon className="mr-2 h-4 w-4" />
                  New Staff Request
                </Link>
              </Button>


            </div>
          </div>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid grid-cols-2 w-full max-w-md">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="tickets">My Tickets</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            {/* Recent Activity */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>My Recent Activity</CardTitle>
                  <CardDescription>Your latest actions and updates</CardDescription>
                </div>
              </CardHeader>
              <CardContent>
                {user.activities && user.activities.length > 0 ? (
                  <div className="space-y-4">
                    {user.activities.map((activity: Activity) => (
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
              <CardFooter className="flex justify-center border-t pt-4">
                <Button variant="ghost" size="sm" className="gap-1">
                  View All Activity <ChevronRight className="h-4 w-4" />
                </Button>
              </CardFooter>
            </Card>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
                <CardDescription>Common tasks and actions</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Button variant="outline" className="h-auto py-4 flex flex-col items-center justify-center" asChild>
                    <Link href="/tickets/new">
                      <UserCog className="h-6 w-6 mb-2" />
                      <span>New Staff Request</span>
                    </Link>
                  </Button>
                  
                  <Button variant="outline" className="h-auto py-4 flex flex-col items-center justify-center" asChild>
                    <Link href="/settings">
                      <Edit className="h-6 w-6 mb-2" />
                      <span>Update Profile</span>
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>



          {/* Tickets Tab */}
          <TabsContent value="tickets">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>My Tickets</CardTitle>
                  <CardDescription>Support tickets you've created or been assigned to</CardDescription>
                </div>
                <Button variant="outline" size="sm" asChild>
                  <Link href="/tickets/new">
                    <PlusCircle className="mr-2 h-4 w-4" />
                    New Ticket
                  </Link>
                </Button>
              </CardHeader>
              <CardContent>
                {user.tickets && user.tickets.length > 0 ? (
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
                      {user.tickets.map((ticket: Ticket) => (
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
                          <TableCell>{formatDate(ticket.createdAt)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="text-center py-6">
                    <p className="text-muted-foreground">You haven't created any tickets yet</p>
                    <Button variant="outline" className="mt-4" asChild>
                      <Link href="/tickets/new">
                        Create New Ticket
                      </Link>
                    </Button>
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