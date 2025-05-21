import React from "react";
import { useQuery } from "@tanstack/react-query";
import Layout from "@/components/layout";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";

export default function UserSettings() {
  // First fetch user data from auth endpoint
  const { data: userData, isLoading: isUserLoading } = useQuery({
    queryKey: ["/api/auth/user"],
    retry: false,
  });

  // If user has an employee ID, fetch the complete employee data as well
  const { data: employeeData, isLoading: isEmployeeLoading } = useQuery({
    queryKey: [`/api/employees/${userData?.employeeId}`],
    enabled: !!userData?.employeeId,
    retry: false,
  });

  const isLoading = isUserLoading || isEmployeeLoading;

  // Show loading state while fetching data
  if (isLoading) {
    return (
      <Layout title="Settings">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </Layout>
    );
  }

  // Not authenticated
  if (!userData) {
    return (
      <Layout title="Settings">
        <Card className="mx-auto max-w-md mt-8">
          <CardHeader>
            <CardTitle>Login Required</CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <p className="mb-4">Please sign in to access your settings</p>
            <Button asChild>
              <Link href="/api/login">Sign In</Link>
            </Button>
          </CardContent>
        </Card>
      </Layout>
    );
  }

  // Prepare display data, preferring employee data when available
  const displayData = {
    id: userData.id,
    firstName: employeeData?.firstName || userData?.firstName || '',
    lastName: employeeData?.lastName || userData?.lastName || '',
    email: employeeData?.email || userData?.email || '',
    username: userData.username,
    isAdmin: userData.isAdmin,
    position: employeeData?.position || userData?.position || '',
    department: employeeData?.department || userData?.department || '',
    // Additional employee fields
    phone: employeeData?.phone || '',
    status: employeeData?.status || 'Active',
    hireDate: employeeData?.hireDate || '',
    avatar: employeeData?.avatar || '',
  };

  // Display profile with enhanced layout
  return (
    <Layout title="Settings">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Account Settings</h1>
          <Button asChild variant="outline">
            <Link href="/">Back to Dashboard</Link>
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>User Profile</CardTitle>
            <CardDescription>
              Your profile information synchronized from Staff Management
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col md:flex-row gap-6">
              {/* Profile avatar */}
              <div className="flex flex-col items-center gap-2">
                <Avatar className="h-24 w-24">
                  <AvatarImage 
                    src={displayData.avatar} 
                    alt={`${displayData.firstName} ${displayData.lastName}`} 
                  />
                  <AvatarFallback className="text-2xl">
                    {displayData.firstName.charAt(0)}{displayData.lastName.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <div className="text-sm text-muted-foreground">
                  {userData.employeeId ? 'Employee ID: ' + userData.employeeId : 'User Account'}
                </div>
              </div>

              {/* Profile details */}
              <div className="flex-1">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h3 className="font-medium text-sm">Username</h3>
                    <p>{displayData.username}</p>
                  </div>
                  
                  <div>
                    <h3 className="font-medium text-sm">Name</h3>
                    <p>{displayData.firstName} {displayData.lastName}</p>
                  </div>
                  
                  <div>
                    <h3 className="font-medium text-sm">Email</h3>
                    <p>{displayData.email || "Not set"}</p>
                  </div>

                  {displayData.phone && (
                    <div>
                      <h3 className="font-medium text-sm">Phone</h3>
                      <p>{displayData.phone}</p>
                    </div>
                  )}
                  
                  <div>
                    <h3 className="font-medium text-sm">Role</h3>
                    <p>{displayData.isAdmin ? "Administrator" : "User"}</p>
                  </div>
                  
                  {displayData.position && (
                    <div>
                      <h3 className="font-medium text-sm">Position</h3>
                      <p>{typeof displayData.position === 'object' ? displayData.position.title : displayData.position}</p>
                    </div>
                  )}
                  
                  {displayData.department && (
                    <div>
                      <h3 className="font-medium text-sm">Department</h3>
                      <p>{typeof displayData.department === 'object' ? displayData.department.name : displayData.department}</p>
                    </div>
                  )}

                  {displayData.status && (
                    <div>
                      <h3 className="font-medium text-sm">Status</h3>
                      <p className="capitalize">{displayData.status}</p>
                    </div>
                  )}

                  {displayData.hireDate && (
                    <div>
                      <h3 className="font-medium text-sm">Hire Date</h3>
                      <p>{new Date(displayData.hireDate).toLocaleDateString()}</p>
                    </div>
                  )}
                </div>

                {employeeData && (
                  <div className="mt-4 pt-4 border-t">
                    <Button asChild size="sm" variant="outline">
                      <Link href={`/employee/${userData.employeeId}`}>View Full Profile</Link>
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}