import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Layout from "@/components/layout";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

// UI components
import { PermissionsList } from "@/components/permissions/permissions-list";
import { RolesList } from "@/components/permissions/roles-list";
import { EmployeeRoles } from "@/components/permissions/employee-roles";

export default function Permissions() {
  const [activeTab, setActiveTab] = useState("permissions");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return (
    <Layout title="Permission Management">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Permission Management</h1>
          <p className="text-muted-foreground mt-2">
            Manage permissions, roles, and field-level access control for employees
          </p>
        </div>

        <Tabs defaultValue="permissions" value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList>
            <TabsTrigger value="permissions">Permissions</TabsTrigger>
            <TabsTrigger value="roles">Roles</TabsTrigger>
            <TabsTrigger value="employee-roles">Employee Roles</TabsTrigger>
          </TabsList>
          
          <TabsContent value="permissions" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Permissions</CardTitle>
                <CardDescription>
                  Define granular permissions for different resources and actions in the system
                </CardDescription>
              </CardHeader>
              <CardContent>
                <PermissionsList />
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="roles" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Roles</CardTitle>
                <CardDescription>
                  Create and manage roles with predefined sets of permissions
                </CardDescription>
              </CardHeader>
              <CardContent>
                <RolesList />
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="employee-roles" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Employee Roles</CardTitle>
                <CardDescription>
                  Assign roles to employees for access control
                </CardDescription>
              </CardHeader>
              <CardContent>
                <EmployeeRoles />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}