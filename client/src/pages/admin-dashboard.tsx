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
  ExternalLink,
  User,
  AlertTriangle
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend,
  ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell
} from "recharts";
import { 
  Select, SelectContent, SelectGroup, SelectItem, 
  SelectLabel, SelectTrigger, SelectValue 
} from "@/components/ui/select";
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
                          <h3 className="text-sm font-medium text-muted-foreground">System Count</h3>
                          <Server className="h-4 w-4 text-muted-foreground" />
                        </div>
                        <div className="text-2xl font-bold">{dashboardStats?.systemCount || 0}</div>
                        <div className="text-xs text-muted-foreground mt-1">
                          Total systems tracked
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
              <CardContent className="space-y-6">
                {/* Employee stats cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Card>
                    <CardContent className="pt-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">Department Count</p>
                          <h3 className="text-2xl font-bold mt-1">{dashboardStats?.departmentCount || 0}</h3>
                        </div>
                        <div className="h-8 w-8 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
                          <Users className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardContent className="pt-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">Average Tenure</p>
                          <h3 className="text-2xl font-bold mt-1">{dashboardStats?.averageTenure || 0} years</h3>
                        </div>
                        <div className="h-8 w-8 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center">
                          <Clock className="h-5 w-5 text-green-600 dark:text-green-400" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardContent className="pt-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">New Hires (30d)</p>
                          <h3 className="text-2xl font-bold mt-1">{dashboardStats?.newHires30d || 0}</h3>
                        </div>
                        <div className="h-8 w-8 rounded-full bg-purple-100 dark:bg-purple-900 flex items-center justify-center">
                          <UserPlus className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
                
                {/* Department distribution chart */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle>Department Distribution</CardTitle>
                    <CardDescription>
                      Employee count by department
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="h-[300px] w-full">
                      {statsLoading ? (
                        <div className="flex items-center justify-center h-full">
                          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
                        </div>
                      ) : dashboardStats?.departmentDistribution ? (
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart
                            data={Object.entries(dashboardStats.departmentDistribution || {}).map(([name, count]) => ({
                              name: name.length > 20 ? name.substring(0, 20) + '...' : name,
                              count: count
                            }))}
                            layout="vertical"
                            margin={{ top: 5, right: 30, left: 100, bottom: 5 }}
                          >
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis type="number" />
                            <YAxis type="category" dataKey="name" width={100} />
                            <Tooltip />
                            <Legend />
                            <Bar dataKey="count" fill="#8884d8" name="Employees" />
                          </BarChart>
                        </ResponsiveContainer>
                      ) : (
                        <div className="flex items-center justify-center h-full text-muted-foreground">
                          No department data available
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
                
                {/* Employee growth trend */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle>Employee Growth Trend</CardTitle>
                    <CardDescription>
                      Monthly employee count over the past year
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="h-[300px] w-full">
                      {statsLoading ? (
                        <div className="flex items-center justify-center h-full">
                          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
                        </div>
                      ) : dashboardStats?.employeeGrowthTrend ? (
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart
                            data={dashboardStats.employeeGrowthTrend || []}
                            margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                          >
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="month" />
                            <YAxis />
                            <Tooltip />
                            <Legend />
                            <Line type="monotone" dataKey="count" stroke="#8884d8" activeDot={{ r: 8 }} name="Employee Count" />
                          </LineChart>
                        </ResponsiveContainer>
                      ) : (
                        <div className="flex items-center justify-center h-full text-muted-foreground">
                          No growth trend data available
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
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
              <CardContent className="space-y-6">
                {/* Activity statistics */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <Card>
                    <CardContent className="pt-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">Today's Activities</p>
                          <h3 className="text-2xl font-bold mt-1">{dashboardStats?.todayActivities || 0}</h3>
                        </div>
                        <div className="h-8 w-8 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
                          <Activity className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardContent className="pt-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">Login Events</p>
                          <h3 className="text-2xl font-bold mt-1">{dashboardStats?.loginEvents || 0}</h3>
                        </div>
                        <div className="h-8 w-8 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center">
                          <User className="h-5 w-5 text-green-600 dark:text-green-400" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardContent className="pt-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">Access Changes</p>
                          <h3 className="text-2xl font-bold mt-1">{dashboardStats?.accessChangeEvents || 0}</h3>
                        </div>
                        <div className="h-8 w-8 rounded-full bg-purple-100 dark:bg-purple-900 flex items-center justify-center">
                          <Shield className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardContent className="pt-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">System Alerts</p>
                          <h3 className="text-2xl font-bold mt-1">{dashboardStats?.systemAlerts || 0}</h3>
                        </div>
                        <div className="h-8 w-8 rounded-full bg-amber-100 dark:bg-amber-900 flex items-center justify-center">
                          <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
                
                {/* Activity log table */}
                <Card>
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-center">
                      <div>
                        <CardTitle>Recent Activities</CardTitle>
                        <CardDescription>Last 50 system activities</CardDescription>
                      </div>
                      <Select defaultValue="all">
                        <SelectTrigger className="w-[180px]">
                          <SelectValue placeholder="Filter by Type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectGroup>
                            <SelectLabel>Filter by Type</SelectLabel>
                            <SelectItem value="all">All Activities</SelectItem>
                            <SelectItem value="login">Login Events</SelectItem>
                            <SelectItem value="access">Access Changes</SelectItem>
                            <SelectItem value="system">System Events</SelectItem>
                            <SelectItem value="user">User Management</SelectItem>
                          </SelectGroup>
                        </SelectContent>
                      </Select>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {statsLoading ? (
                      <div className="flex items-center justify-center h-64">
                        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
                      </div>
                    ) : dashboardStats?.recentActivities && dashboardStats.recentActivities.length > 0 ? (
                      <div className="border rounded-md">
                        <div className="relative w-full overflow-auto">
                          <table className="w-full caption-bottom text-sm">
                            <thead className="bg-muted [&_tr]:border-b">
                              <tr className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                                <th className="h-12 px-4 text-left align-middle font-medium">Timestamp</th>
                                <th className="h-12 px-4 text-left align-middle font-medium">User</th>
                                <th className="h-12 px-4 text-left align-middle font-medium">Action</th>
                                <th className="h-12 px-4 text-left align-middle font-medium">Details</th>
                              </tr>
                            </thead>
                            <tbody className="[&_tr:last-child]:border-0">
                              {dashboardStats.recentActivities.map((activity: any, index: number) => (
                                <tr key={index} className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                                  <td className="p-4 align-middle">{activity.timestamp}</td>
                                  <td className="p-4 align-middle">
                                    <div className="flex items-center gap-2">
                                      <div className="h-8 w-8 rounded-full bg-slate-100 flex items-center justify-center">
                                        <Users className="h-4 w-4 text-slate-500" />
                                      </div>
                                      <div>
                                        <div className="font-medium">{activity.username}</div>
                                        <div className="text-xs text-muted-foreground">{activity.role}</div>
                                      </div>
                                    </div>
                                  </td>
                                  <td className="p-4 align-middle">
                                    <div className="flex items-center">
                                      <span className={`inline-flex h-2 w-2 rounded-full mr-2 ${
                                        activity.action.includes('Login') ? 'bg-green-500' :
                                        activity.action.includes('Access') ? 'bg-blue-500' : 
                                        activity.action.includes('Failed') ? 'bg-red-500' : 'bg-slate-500'
                                      }`} />
                                      {activity.action}
                                    </div>
                                  </td>
                                  <td className="p-4 align-middle text-muted-foreground">{activity.details}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center justify-center h-64 text-muted-foreground">
                        No activity data available
                      </div>
                    )}
                  </CardContent>
                </Card>
                
                {/* Activity trend chart */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle>Activity Trend</CardTitle>
                    <CardDescription>
                      System activity trends over the last 30 days
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="h-[300px] w-full">
                      {statsLoading ? (
                        <div className="flex items-center justify-center h-full">
                          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
                        </div>
                      ) : dashboardStats?.activityTrend ? (
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart
                            data={dashboardStats.activityTrend || []}
                            margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                          >
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="date" />
                            <YAxis />
                            <Tooltip />
                            <Legend />
                            <Line type="monotone" dataKey="logins" stroke="#10b981" name="Logins" />
                            <Line type="monotone" dataKey="access" stroke="#3b82f6" name="Access Changes" />
                            <Line type="monotone" dataKey="system" stroke="#f59e0b" name="System Events" />
                          </LineChart>
                        </ResponsiveContainer>
                      ) : (
                        <div className="flex items-center justify-center h-full text-muted-foreground">
                          No activity trend data available
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}