import Layout from "@/components/layout";
import { useAuth } from "@/hooks/useAuth";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import {
  HelpCircle,
  UserPlus,
  Clock,
  Users,
  Server,
  Activity,
  BarChart3,
  Settings,
  Shield,
  ExternalLink
} from "lucide-react";
import { SystemAccessDashboard } from "@/components/admin/system-access-dashboard";

export default function AdminDashboardPage() {
  const { isAdmin, isAuthenticated } = useAuth();
  const [, navigate] = useLocation();

  // Redirect non-admins
  if (!isAuthenticated) {
    navigate("/login");
    return null;
  }

  if (!isAdmin) {
    navigate("/");
    return null;
  }

  // Fetch dashboard data
  const { data: dashboardStats, isLoading: statsLoading } = useQuery({
    queryKey: ['/api/dashboard/stats'],
    queryFn: async () => {
      const response = await fetch('/api/dashboard/stats');
      if (!response.ok) {
        throw new Error('Failed to fetch dashboard statistics');
      }
      return response.json();
    }
  });

  return (
    <Layout title="Admin Dashboard">
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold tracking-tight mb-2">Admin Dashboard</h2>
          <p className="text-muted-foreground mb-6">
            Monitor system usage, manage access, and track organizational metrics
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Quick stats & links */}
          <div className="col-span-1">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle>Quick Access</CardTitle>
                <CardDescription>Common admin tasks</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 gap-3">
                  <Button variant="outline" className="justify-start" asChild>
                    <a href="/employee/new">
                      <UserPlus className="mr-2 h-4 w-4" />
                      New Employee
                    </a>
                  </Button>
                  <Button variant="outline" className="justify-start" asChild>
                    <a href="/systems">
                      <Server className="mr-2 h-4 w-4" />
                      Manage Systems
                    </a>
                  </Button>
                  <Button variant="outline" className="justify-start" asChild>
                    <a href="/user-management">
                      <Users className="mr-2 h-4 w-4" />
                      User Management
                    </a>
                  </Button>
                  <Button variant="outline" className="justify-start" asChild>
                    <a href="/permissions">
                      <Shield className="mr-2 h-4 w-4" />
                      Permissions
                    </a>
                  </Button>
                  <Button variant="outline" className="justify-start" asChild>
                    <a href="/reports">
                      <BarChart3 className="mr-2 h-4 w-4" />
                      Reports
                    </a>
                  </Button>
                  <Button variant="outline" className="justify-start" asChild>
                    <a href="/settings">
                      <Settings className="mr-2 h-4 w-4" />
                      System Settings
                    </a>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Organization Stats */}
          <div className="col-span-1 md:col-span-2">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle>Organization Overview</CardTitle>
                <CardDescription>Key metrics and statistics</CardDescription>
              </CardHeader>
              <CardContent>
                {statsLoading ? (
                  <div className="flex items-center justify-center p-8">
                    <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-4">
                    <div className="col-span-1">
                      <div className="bg-slate-100 dark:bg-slate-800 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="text-sm font-medium text-muted-foreground">Total Employees</h3>
                          <Users className="h-4 w-4 text-muted-foreground" />
                        </div>
                        <div className="text-2xl font-bold">{dashboardStats?.totalEmployees || 0}</div>
                        <div className="text-xs text-muted-foreground flex items-center mt-1">
                          <span className={dashboardStats?.employeeGrowth > 0 ? "text-green-500" : "text-red-500"}>
                            {dashboardStats?.employeeGrowth > 0 ? "+" : ""}{dashboardStats?.employeeGrowth || 0}%
                          </span>
                          <span className="ml-1">vs. last month</span>
                        </div>
                      </div>
                    </div>
                    <div className="col-span-1">
                      <div className="bg-slate-100 dark:bg-slate-800 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="text-sm font-medium text-muted-foreground">System Access Rate</h3>
                          <Server className="h-4 w-4 text-muted-foreground" />
                        </div>
                        <div className="text-2xl font-bold">{dashboardStats?.systemAccessRate || 0}%</div>
                        <div className="text-xs text-muted-foreground flex items-center mt-1">
                          <span className={dashboardStats?.systemAccessGrowth > 0 ? "text-green-500" : "text-red-500"}>
                            {dashboardStats?.systemAccessGrowth > 0 ? "+" : ""}{dashboardStats?.systemAccessGrowth || 0}%
                          </span>
                          <span className="ml-1">vs. last month</span>
                        </div>
                      </div>
                    </div>
                    <div className="col-span-1">
                      <div className="bg-slate-100 dark:bg-slate-800 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="text-sm font-medium text-muted-foreground">Pending Tickets</h3>
                          <Clock className="h-4 w-4 text-muted-foreground" />
                        </div>
                        <div className="text-2xl font-bold">{dashboardStats?.pendingTickets || 0}</div>
                        <div className="text-xs text-muted-foreground flex items-center mt-1">
                          <span className={dashboardStats?.ticketGrowth <= 0 ? "text-green-500" : "text-amber-500"}>
                            {dashboardStats?.ticketGrowth > 0 ? "+" : ""}{dashboardStats?.ticketGrowth || 0}%
                          </span>
                          <span className="ml-1">vs. last month</span>
                        </div>
                      </div>
                    </div>
                    <div className="col-span-1">
                      <div className="bg-slate-100 dark:bg-slate-800 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="text-sm font-medium text-muted-foreground">Onboarding</h3>
                          <Activity className="h-4 w-4 text-muted-foreground" />
                        </div>
                        <div className="text-2xl font-bold">{dashboardStats?.onboardingCount || 0}</div>
                        <div className="text-xs text-muted-foreground mt-1">
                          Active onboarding processes
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        <Tabs defaultValue="system-access" className="space-y-4">
          <TabsList>
            <TabsTrigger value="system-access" className="flex items-center gap-2">
              <Server className="h-4 w-4" />
              <span>System Access</span>
            </TabsTrigger>
            <TabsTrigger value="employee" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              <span>Employee Analytics</span>
            </TabsTrigger>
            <TabsTrigger value="activity" className="flex items-center gap-2">
              <Activity className="h-4 w-4" />
              <span>Activity Log</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="system-access">
            <Card>
              <CardHeader>
                <CardTitle>System Access Analytics</CardTitle>
                <CardDescription>
                  Monitor system access metrics and trends across the organization
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <SystemAccessDashboard />
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="employee">
            <Card>
              <CardHeader>
                <CardTitle>Employee Analytics</CardTitle>
                <CardDescription>
                  Employee demographics, growth trends, and department metrics
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-center p-12 text-muted-foreground">
                  <div className="text-center">
                    <HelpCircle className="mx-auto h-12 w-12 text-muted-foreground/50" />
                    <h3 className="mt-4 text-lg font-medium">Coming Soon</h3>
                    <p className="mt-2 text-sm">
                      Employee analytics will be available in the next update.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="activity">
            <Card>
              <CardHeader>
                <CardTitle>Activity Log</CardTitle>
                <CardDescription>
                  System-wide activity tracking and audit log
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-center p-12 text-muted-foreground">
                  <div className="text-center">
                    <HelpCircle className="mx-auto h-12 w-12 text-muted-foreground/50" />
                    <h3 className="mt-4 text-lg font-medium">Coming Soon</h3>
                    <p className="mt-2 text-sm">
                      Comprehensive activity log will be available in the next update.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}