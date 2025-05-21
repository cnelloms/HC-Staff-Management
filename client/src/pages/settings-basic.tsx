import React from "react";
import { useQuery } from "@tanstack/react-query";
import Layout from "@/components/layout";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

// A simple, clean settings page that will definitely work
export default function UserSettings() {
  const { data: userData, isLoading } = useQuery({
    queryKey: ["/api/auth/user"],
    retry: false,
  });

  if (isLoading) {
    return (
      <Layout title="Settings">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </Layout>
    );
  }

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
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {userData.username && (
                  <div>
                    <h3 className="font-medium text-sm">Username</h3>
                    <p>{userData.username}</p>
                  </div>
                )}
                
                {(userData.firstName || userData.lastName) && (
                  <div>
                    <h3 className="font-medium text-sm">Name</h3>
                    <p>{userData.firstName || ''} {userData.lastName || ''}</p>
                  </div>
                )}
                
                {userData.email && (
                  <div>
                    <h3 className="font-medium text-sm">Email</h3>
                    <p>{userData.email}</p>
                  </div>
                )}
                
                <div>
                  <h3 className="font-medium text-sm">Role</h3>
                  <p>{userData.isAdmin ? "Administrator" : "User"}</p>
                </div>
                
                {userData.position && (
                  <div>
                    <h3 className="font-medium text-sm">Position</h3>
                    <p>{userData.position}</p>
                  </div>
                )}
                
                {userData.department && (
                  <div>
                    <h3 className="font-medium text-sm">Department</h3>
                    <p>{userData.department}</p>
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