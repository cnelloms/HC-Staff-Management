import Layout from "@/components/layout";
import { SystemsManagement } from "@/components/admin/systems-management";
import { SystemAccessManager } from "@/components/admin/system-access-manager";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/hooks/useAuth";
import { useLocation } from "wouter";
import { Server, LockKeyhole } from "lucide-react";

export default function SystemsPage() {
  const { isAdmin, isAuthenticated } = useAuth();

  const [, navigate] = useLocation();
  
  // If not authenticated or not an admin, redirect to home
  if (!isAuthenticated) {
    navigate("/login");
    return null;
  }

  if (!isAdmin) {
    navigate("/");
    return null;
  }

  return (
    <Layout title="Systems Management">
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold tracking-tight mb-2">Systems Management</h2>
          <p className="text-muted-foreground mb-6">
            Manage systems and access control for the organization
          </p>
        </div>

        <Tabs defaultValue="systems" className="space-y-4">
          <TabsList>
            <TabsTrigger value="systems" className="flex items-center gap-2">
              <Server className="h-4 w-4" />
              <span>Systems</span>
            </TabsTrigger>
            <TabsTrigger value="access-management" className="flex items-center gap-2">
              <LockKeyhole className="h-4 w-4" />
              <span>Access Control</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="systems">
            <Card>
              <CardHeader>
                <CardTitle>System Definitions</CardTitle>
                <CardDescription>
                  Manage system definitions available for assignment to employees
                </CardDescription>
              </CardHeader>
              <CardContent>
                <SystemsManagement />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="access-management">
            <Card>
              <CardHeader>
                <CardTitle>Access Management</CardTitle>
                <CardDescription>
                  View and manage system access across all employees
                </CardDescription>
              </CardHeader>
              <CardContent>
                <SystemAccessManager />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}