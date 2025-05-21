import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Layout from "@/components/layout";
import { useToast } from "@/hooks/use-toast";
import { Link } from "wouter";

// UI components
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";

export default function UserSettings() {
  const [activeTab, setActiveTab] = useState("profile");
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Get current user data
  const { data: userData, isLoading: userLoading } = useQuery({
    queryKey: ["/api/auth/user"],
    retry: false,
  });
  
  // If user has employee ID, fetch employee data
  const { data: employeeData, isLoading: employeeLoading } = useQuery({
    queryKey: [`/api/employees/${userData?.employeeId}`],
    enabled: !!userData?.employeeId,
  });
  
  const isLoading = userLoading || employeeLoading;
  
  // Show loading state
  if (isLoading) {
    return (
      <Layout title="Account Settings">
        <div className="p-8 flex justify-center">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        </div>
      </Layout>
    );
  }
  
  // Show login prompt if not authenticated
  if (!userData) {
    return (
      <Layout title="Account Settings">
        <div className="text-center p-8">
          <h2 className="text-2xl font-bold">Login Required</h2>
          <p className="text-gray-500 mt-2">
            Please log in to access your account settings.
          </p>
          <Button className="mt-4" asChild>
            <Link href="/api/login">Login</Link>
          </Button>
        </div>
      </Layout>
    );
  }
  
  // Get the profile data from either source
  const profile = employeeData || userData;
  
  // Get initials for avatar fallback
  const getInitials = () => {
    const firstName = profile?.firstName || '';
    const lastName = profile?.lastName || '';
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  };
  
  return (
    <Layout title="Account Settings">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
            <p className="text-muted-foreground">
              Manage your account settings and preferences.
            </p>
          </div>
          <Button asChild variant="outline">
            <Link href="/">Back to Dashboard</Link>
          </Button>
        </div>
        
        <Tabs defaultValue="profile" value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full md:w-auto grid-cols-2 md:grid-cols-4">
            <TabsTrigger value="profile">Profile</TabsTrigger>
            <TabsTrigger value="appearance">Appearance</TabsTrigger>
            <TabsTrigger value="notifications">Notifications</TabsTrigger>
            <TabsTrigger value="admin">Administration</TabsTrigger>
          </TabsList>
          
          <TabsContent value="profile" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Profile Information</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col md:flex-row gap-6">
                  <div className="flex-shrink-0">
                    <Avatar className="w-24 h-24">
                      <AvatarImage src={profile?.avatar || undefined} alt={`${profile?.firstName} ${profile?.lastName}`} />
                      <AvatarFallback className="text-xl">{getInitials()}</AvatarFallback>
                    </Avatar>
                  </div>
                  
                  <div className="flex-1 space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <h3 className="font-medium">Name</h3>
                        <p>{profile?.firstName} {profile?.lastName}</p>
                      </div>
                      <div>
                        <h3 className="font-medium">Email</h3>
                        <p>{profile?.email || "Not set"}</p>
                      </div>
                      <div>
                        <h3 className="font-medium">Phone</h3>
                        <p>{profile?.phone || "Not set"}</p>
                      </div>
                      <div>
                        <h3 className="font-medium">Username</h3>
                        <p>{userData?.username || "N/A"}</p>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t">
                      <div>
                        <h3 className="font-medium">Department</h3>
                        <p>{typeof profile?.department === 'object' ? 
                          profile?.department?.name : profile?.department || "Not assigned"}</p>
                      </div>
                      <div>
                        <h3 className="font-medium">Position</h3>
                        <p>{typeof profile?.position === 'object' ? 
                          profile?.position?.title : profile?.position || "Not assigned"}</p>
                      </div>
                      <div>
                        <h3 className="font-medium">Hire Date</h3>
                        <p>{profile?.hireDate ? new Date(profile.hireDate).toLocaleDateString() : "Not set"}</p>
                      </div>
                      <div>
                        <h3 className="font-medium">Status</h3>
                        <p>{profile?.status || "Active"}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="appearance">
            <Card>
              <CardHeader>
                <CardTitle>Appearance Settings</CardTitle>
              </CardHeader>
              <CardContent>
                <p>Appearance settings will be available in a future update.</p>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="notifications">
            <Card>
              <CardHeader>
                <CardTitle>Notification Preferences</CardTitle>
              </CardHeader>
              <CardContent>
                <p>Notification settings will be available in a future update.</p>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="admin">
            <Card>
              <CardHeader>
                <CardTitle>Administration</CardTitle>
              </CardHeader>
              <CardContent>
                {userData?.isAdmin ? (
                  <div>
                    <p>Administration settings will be available in a future update.</p>
                  </div>
                ) : (
                  <p>You don't have access to administration settings.</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}