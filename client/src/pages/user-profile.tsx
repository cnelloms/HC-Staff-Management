import React from "react";
import Layout from "@/components/layout";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { useProfileData } from "@/hooks/useProfileData";
import { ProfileCard } from "@/components/profile/profile-card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Clock, TicketIcon } from "lucide-react";
import { format } from "date-fns";

export default function UserProfile() {
  const { profileData, isLoading, employeeData } = useProfileData();
  const [activeTab, setActiveTab] = React.useState("profile");

  const formatDate = (dateString?: string) => {
    if (!dateString) return "N/A";
    return format(new Date(dateString), 'MMM d, yyyy');
  };

  if (isLoading || !profileData) {
    return (
      <Layout title="My Profile">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="My Profile">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">My Profile</h1>
          <Button asChild variant="outline">
            <Link href="/">Back to Dashboard</Link>
          </Button>
        </div>
        
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="profile">Profile</TabsTrigger>
            <TabsTrigger value="activity">Activity</TabsTrigger>
          </TabsList>
          
          <TabsContent value="profile" className="space-y-6">
            {/* Show the consistent profile card component */}
            <ProfileCard />
            
            {/* Additional profile actions */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
                <CardDescription>
                  Manage your account and settings
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Button variant="outline" className="justify-start" asChild>
                    <Link href="/settings">
                      Edit Profile Settings
                    </Link>
                  </Button>
                  
                  <Button variant="outline" className="justify-start" asChild>
                    <Link href="/tickets/new">
                      Create New Ticket
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="activity" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
                <CardDescription>
                  Your recent actions in the system
                </CardDescription>
              </CardHeader>
              <CardContent>
                {employeeData?.activities && employeeData.activities.length > 0 ? (
                  <div className="space-y-4">
                    {employeeData.activities.map((activity) => (
                      <div key={activity.id} className="flex items-start space-x-4">
                        <div className="rounded-full bg-primary/10 p-2">
                          <Clock className="h-4 w-4 text-primary" />
                        </div>
                        <div className="space-y-1">
                          <p className="text-sm font-medium">
                            {typeof activity.activityType === 'string' 
                              ? activity.activityType.replace('_', ' ').toUpperCase() 
                              : 'Activity'}
                          </p>
                          <p className="text-sm">{activity.description}</p>
                          <p className="text-xs text-muted-foreground">
                            {activity.timestamp ? formatDate(activity.timestamp) : 'Unknown date'}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground">No recent activity found</p>
                  </div>
                )}
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>My Tickets</CardTitle>
                <CardDescription>
                  Your tickets and requests
                </CardDescription>
              </CardHeader>
              <CardContent>
                {employeeData?.tickets && employeeData.tickets.length > 0 ? (
                  <div className="space-y-4">
                    {employeeData.tickets.map((ticket) => (
                      <div key={ticket.id} className="flex items-start space-x-4">
                        <div className="rounded-full bg-primary/10 p-2">
                          <TicketIcon className="h-4 w-4 text-primary" />
                        </div>
                        <div className="space-y-1">
                          <p className="text-sm font-medium">
                            <Link href={`/tickets/${ticket.id}`} className="hover:underline">
                              {ticket.title}
                            </Link>
                          </p>
                          <p className="text-xs">
                            Status: <span className="capitalize">{typeof ticket.status === 'string' ? ticket.status : 'Unknown'}</span>
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Created: {ticket.createdAt ? formatDate(ticket.createdAt) : 'Unknown date'}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground">No tickets found</p>
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