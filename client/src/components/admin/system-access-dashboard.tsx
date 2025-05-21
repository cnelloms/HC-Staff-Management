import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
  CartesianGrid,
} from "recharts";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  ArrowUpRight,
  Users,
  Shield,
  Server,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  Clock,
  ExternalLink,
  BarChart3,
  PieChart as PieChartIcon,
  LineChart as LineChartIcon
} from "lucide-react";

// Colors for the charts
const COLORS = [
  "#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#A259FF",
  "#4CAF50", "#F44336", "#2196F3", "#FF9800", "#9C27B0"
];

const STATUS_COLORS = {
  active: "#10B981",
  pending: "#F59E0B",
  revoked: "#EF4444"
};

const ACCESS_LEVEL_COLORS = {
  read: "#3B82F6",
  write: "#10B981",
  admin: "#8B5CF6"
};

export function SystemAccessDashboard() {
  const [timeRange, setTimeRange] = useState("30days");
  const [chartType, setChartType] = useState("systemDistribution");

  // Fetch dashboard statistics
  const { data: dashboardStats, isLoading: statsLoading } = useQuery({
    queryKey: ['/api/dashboard/access-stats'],
    queryFn: async () => {
      const response = await fetch('/api/dashboard/access-stats');
      if (!response.ok) {
        throw new Error('Failed to fetch dashboard statistics');
      }
      return response.json();
    }
  });

  // Fetch recent activities
  const { data: recentActivities, isLoading: activitiesLoading } = useQuery({
    queryKey: ['/api/dashboard/recent-activities'],
    queryFn: async () => {
      const response = await fetch('/api/dashboard/recent-activities');
      if (!response.ok) {
        throw new Error('Failed to fetch recent activities');
      }
      return response.json();
    }
  });

  // Fetch system access data
  const { data: systemAccess, isLoading: accessLoading } = useQuery({
    queryKey: ['/api/system-access'],
    queryFn: async () => {
      const response = await fetch('/api/system-access');
      if (!response.ok) {
        throw new Error('Failed to fetch system access data');
      }
      return response.json();
    }
  });

  // Fetch all systems
  const { data: systems, isLoading: systemsLoading } = useQuery({
    queryKey: ['/api/systems'],
    queryFn: async () => {
      const response = await fetch('/api/systems');
      if (!response.ok) {
        throw new Error('Failed to fetch systems');
      }
      return response.json();
    }
  });

  // Loading state
  const isLoading = statsLoading || activitiesLoading || accessLoading || systemsLoading;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[300px]">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
      </div>
    );
  }

  // Prepare data for system distribution chart
  const prepareSystemDistributionData = () => {
    if (!systemAccess || !systems) return [];

    const systemCounts = systems.map((system: any) => {
      const accessCount = systemAccess.filter((access: any) => 
        access.systemId === system.id
      ).length;

      return {
        name: system.name,
        value: accessCount,
        id: system.id
      };
    });

    return systemCounts.sort((a: any, b: any) => b.value - a.value);
  };

  // Prepare data for access status chart
  const prepareAccessStatusData = () => {
    if (!systemAccess) return [];

    const statusCounts: Record<string, number> = {
      active: 0,
      pending: 0,
      revoked: 0
    };

    systemAccess.forEach((access: any) => {
      const status = access.status?.toLowerCase() || 'unknown';
      if (statusCounts[status] !== undefined) {
        statusCounts[status]++;
      }
    });

    return Object.keys(statusCounts).map(status => ({
      name: status.charAt(0).toUpperCase() + status.slice(1),
      value: statusCounts[status]
    }));
  };

  // Prepare data for access level chart
  const prepareAccessLevelData = () => {
    if (!systemAccess) return [];

    const levelCounts: Record<string, number> = {
      read: 0,
      write: 0,
      admin: 0
    };

    systemAccess.forEach((access: any) => {
      const level = access.accessLevel?.toLowerCase() || 'unknown';
      if (levelCounts[level] !== undefined) {
        levelCounts[level]++;
      }
    });

    return Object.keys(levelCounts).map(level => ({
      name: level.charAt(0).toUpperCase() + level.slice(1),
      value: levelCounts[level]
    }));
  };

  // Prepare data for system access trend chart
  const prepareAccessTrendData = () => {
    // This would typically fetch from an API that returns historical data
    // For now, we'll create some sample data
    const mockTrendData = [
      { month: 'Jan', accessCount: 4 },
      { month: 'Feb', accessCount: 7 },
      { month: 'Mar', accessCount: 10 },
      { month: 'Apr', accessCount: 12 },
      { month: 'May', accessCount: 15 },
      { month: 'Jun', accessCount: 20 },
      { month: 'Jul', accessCount: 18 },
      { month: 'Aug', accessCount: 25 },
      { month: 'Sep', accessCount: 30 },
      { month: 'Oct', accessCount: 22 },
      { month: 'Nov', accessCount: 28 },
      { month: 'Dec', accessCount: 32 },
    ];

    return mockTrendData;
  };

  // Get activity icon based on type
  const getActivityIcon = (type: string) => {
    switch (type?.toLowerCase()) {
      case 'access_granted':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'access_revoked':
        return <AlertCircle className="h-4 w-4 text-red-600" />;
      case 'access_requested':
        return <Clock className="h-4 w-4 text-amber-600" />;
      default:
        return <Server className="h-4 w-4 text-gray-600" />;
    }
  };

  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  // Get overview stats
  const totalSystems = systems?.length || 0;
  const totalAccess = systemAccess?.length || 0;
  const pendingRequests = systemAccess?.filter((access: any) => access.status === 'pending').length || 0;
  const accessRate = totalSystems > 0 ? Math.round((totalAccess / (totalSystems * 10)) * 100) : 0;

  // Get chart data based on selected chart type
  const getChartData = () => {
    switch (chartType) {
      case 'systemDistribution':
        return prepareSystemDistributionData();
      case 'accessStatus':
        return prepareAccessStatusData();
      case 'accessLevel':
        return prepareAccessLevelData();
      case 'accessTrend':
        return prepareAccessTrendData();
      default:
        return [];
    }
  };

  const chartData = getChartData();

  // Render the appropriate chart based on the selected type
  const renderChart = () => {
    switch (chartType) {
      case 'systemDistribution':
        return (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart
              data={chartData}
              margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="name" 
                angle={-45} 
                textAnchor="end" 
                height={70} 
              />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="value" name="Access Count" fill="#8884d8">
                {chartData.map((entry: any, index: number) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        );
      case 'accessStatus':
        return (
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                labelLine={false}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
              >
                {chartData.map((entry: any, index: number) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={STATUS_COLORS[entry.name.toLowerCase() as keyof typeof STATUS_COLORS] || COLORS[index % COLORS.length]} 
                  />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        );
      case 'accessLevel':
        return (
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                labelLine={false}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
              >
                {chartData.map((entry: any, index: number) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={ACCESS_LEVEL_COLORS[entry.name.toLowerCase() as keyof typeof ACCESS_LEVEL_COLORS] || COLORS[index % COLORS.length]} 
                  />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        );
      case 'accessTrend':
        return (
          <ResponsiveContainer width="100%" height={300}>
            <LineChart
              data={chartData}
              margin={{ top: 20, right: 30, left: 20, bottom: 10 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="accessCount" name="Access Count" stroke="#8884d8" activeDot={{ r: 8 }} />
            </LineChart>
          </ResponsiveContainer>
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Stats Cards */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between space-x-4">
              <div className="flex flex-col space-y-1">
                <span className="text-muted-foreground text-sm">Total Systems</span>
                <span className="text-2xl font-bold">{totalSystems}</span>
              </div>
              <div className="p-2 bg-blue-100 rounded-full text-blue-600">
                <Server className="h-5 w-5" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between space-x-4">
              <div className="flex flex-col space-y-1">
                <span className="text-muted-foreground text-sm">Total Access Entries</span>
                <span className="text-2xl font-bold">{totalAccess}</span>
              </div>
              <div className="p-2 bg-green-100 rounded-full text-green-600">
                <Shield className="h-5 w-5" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between space-x-4">
              <div className="flex flex-col space-y-1">
                <span className="text-muted-foreground text-sm">Pending Requests</span>
                <span className="text-2xl font-bold">{pendingRequests}</span>
              </div>
              <div className="p-2 bg-amber-100 rounded-full text-amber-600">
                <Clock className="h-5 w-5" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between space-x-4">
              <div className="flex flex-col space-y-1">
                <span className="text-muted-foreground text-sm">Access Rate</span>
                <span className="text-2xl font-bold">{accessRate}%</span>
              </div>
              <div className="p-2 bg-purple-100 rounded-full text-purple-600">
                <TrendingUp className="h-5 w-5" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Main Chart */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle>System Access Insights</CardTitle>
              <div className="flex gap-2">
                <Select
                  value={chartType}
                  onValueChange={setChartType}
                >
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Chart Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="systemDistribution">
                      <div className="flex items-center gap-2">
                        <BarChart3 className="h-4 w-4" />
                        <span>System Distribution</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="accessStatus">
                      <div className="flex items-center gap-2">
                        <PieChartIcon className="h-4 w-4" />
                        <span>Access Status</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="accessLevel">
                      <div className="flex items-center gap-2">
                        <PieChartIcon className="h-4 w-4" />
                        <span>Access Level</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="accessTrend">
                      <div className="flex items-center gap-2">
                        <LineChartIcon className="h-4 w-4" />
                        <span>Access Trend</span>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
                <Select
                  value={timeRange}
                  onValueChange={setTimeRange}
                >
                  <SelectTrigger className="w-[130px]">
                    <SelectValue placeholder="Time Range" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="7days">Last 7 days</SelectItem>
                    <SelectItem value="30days">Last 30 days</SelectItem>
                    <SelectItem value="90days">Last 90 days</SelectItem>
                    <SelectItem value="year">This year</SelectItem>
                    <SelectItem value="all">All time</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <CardDescription>
              {chartType === 'systemDistribution' && "Distribution of access across different systems"}
              {chartType === 'accessStatus' && "Distribution of access status (active, pending, revoked)"}
              {chartType === 'accessLevel' && "Distribution of access levels (read, write, admin)"}
              {chartType === 'accessTrend' && "Trend of system access over time"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {renderChart()}
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Access Activity</CardTitle>
            <CardDescription>Recent system access changes and requests</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentActivities?.slice(0, 6).map((activity: any, index: number) => (
                <div key={index} className="flex items-start space-x-3">
                  <div className="mt-0.5">
                    {getActivityIcon(activity.type)}
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-medium leading-none">
                      {activity.employeeName}
                    </p>
                    <p className="text-sm text-muted-foreground">{activity.description}</p>
                    <div className="flex items-center pt-1">
                      <time className="text-xs text-muted-foreground">
                        {formatDate(activity.createdAt)}
                      </time>
                      {activity.systemName && (
                        <Badge variant="outline" className="ml-2 text-xs">
                          {activity.systemName}
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              ))}
              {(!recentActivities || recentActivities.length === 0) && (
                <div className="text-center py-4">
                  <p className="text-sm text-muted-foreground">No recent activities</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}