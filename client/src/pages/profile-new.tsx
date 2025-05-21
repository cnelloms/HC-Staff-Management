import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import Layout from "@/components/layout";
import { Employee } from "@/types";
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
  Clock,
  ChevronRight,
  Ticket as TicketIcon,
  Settings,
} from "lucide-react";
import { Link } from "wouter";
import { ProfileCard } from "@/components/profile/profile-card";

/**
 * Profile page using the shared profile data hook for consistent display
 */
export default function UserProfile() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("overview");
  
  // Get profile data from our shared hook
  const { profileData, isLoading, employeeData } = useProfileData();
  
  // Get employee ID to fetch more detailed information if needed
  const employeeId = profileData?.employeeId;
  
  // Fetch detailed employee information if we have an employee ID
  const { data: employeeDetails } = useQuery<Employee>({
    queryKey: [`/api/employees/${employeeId}`],
    enabled: !!employeeId && !employeeData,
  });
  
  // If still loading, show spinner
  if (isLoading) {
    return (
      <Layout title="My Profile">
        <div className="p-8 flex justify-center">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        </div>
      </Layout>
    );
  }
  
  // If no profile data, show error
  if (!profileData) {
    return (
      <Layout title="My Profile">
        <div className="text-center p-8">
          <h2 className="text-2xl font-bold">Profile Not Found</h2>
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
  
  // Format dates consistently
  const formatDate = (dateString?: string) => {
    if (!dateString) return "Not available";
    try {
      return format(new Date(dateString), 'MMM d, yyyy');
    } catch (e) {
      return "Invalid date";
    }
  };
  
  // Use the most detailed employee data we have
  const employee = employeeData || employeeDetails;
  
  // Get manager name if available
  const managerName = employee?.manager?.name || "No manager";
  
  // Get department name
  let departmentName = "";
  if (profileData.department) {
    if (typeof profileData.department === 'object' && 'name' in profileData.department) {
      departmentName = profileData.department.name as string;
    } else if (typeof profileData.department === 'string') {
      departmentName = profileData.department;
    }
  }
  
  // Get position title
  let positionTitle = "";
  if (profileData.position) {
    if (typeof profileData.position === 'object' && 'title' in profileData.position) {
      positionTitle = profileData.position.title as string;
    } else if (typeof profileData.position === 'string') {
      positionTitle = profileData.position;
    }
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
                  <AvatarImage src={profileData.avatar} alt={`${profileData.firstName} ${profileData.lastName}`} />
                  <AvatarFallback className="text-xl">
                    {profileData.firstName?.[0] || ""}{profileData.lastName?.[0] || ""}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h2 className="text-2xl font-bold">{profileData.firstName} {profileData.lastName}</h2>
                  <p className="text-muted-foreground">{positionTitle}</p>
                  <div className="flex items-center mt-2">
                    <StatusBadge status={profileData.status as any} className="capitalize" />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                <div className="flex items-center text-sm">
                  <Mail className="h-4 w-4 mr-2 text-muted-foreground" />
                  <span>{profileData.email || "Not provided"}</span>
                </div>
                <div className="flex items-center text-sm">
                  <Phone className="h-4 w-4 mr-2 text-muted-foreground" />
                  <span>{profileData.phone || "Not provided"}</span>
                </div>
                <div className="flex items-center text-sm">
                  <Building className="h-4 w-4 mr-2 text-muted-foreground" />
                  <span>{departmentName || "Unassigned"}</span>
                </div>
                <div className="flex items-center text-sm">
                  <User className="h-4 w-4 mr-2 text-muted-foreground" />
                  <span>Reports to: {managerName}</span>
                </div>
                {profileData.hireDate && (
                  <div className="flex items-center text-sm">
                    <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
                    <span>Hired: {formatDate(profileData.hireDate)}</span>
                  </div>
                )}
                {employeeId && (
                  <div className="flex items-center text-sm">
                    <Briefcase className="h-4 w-4 mr-2 text-muted-foreground" />
                    <span>Employee ID: {employeeId}</span>
                  </div>
                )}
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
            {/* Profile card from shared component */}
            <ProfileCard />
            
            {/* Recent Activity */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>My Recent Activity</CardTitle>
                  <CardDescription>Your latest actions and updates</CardDescription>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-center p-6">
                  <p className="text-muted-foreground text-center">
                    Recent activity information will be available soon
                  </p>
                </div>
              </CardContent>
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
                      <TicketIcon className="h-6 w-6 mb-2" />
                      <span>New Staff Request</span>
                    </Link>
                  </Button>
                  
                  <Button variant="outline" className="h-auto py-4 flex flex-col items-center justify-center" asChild>
                    <Link href="/settings">
                      <Settings className="h-6 w-6 mb-2" />
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
                    <TicketIcon className="mr-2 h-4 w-4" />
                    New Ticket
                  </Link>
                </Button>
              </CardHeader>
              <CardContent>
                <div className="text-center py-6">
                  <p className="text-muted-foreground">Ticket data will be synchronized soon</p>
                  <Button variant="outline" className="mt-4" asChild>
                    <Link href="/tickets/new">
                      Create New Ticket
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}