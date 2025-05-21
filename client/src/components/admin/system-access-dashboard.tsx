import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, 
  CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  LineChart, Line
} from "recharts";
import { 
  Card, CardContent, CardDescription, CardHeader, CardTitle 
} from "@/components/ui/card";
import { 
  Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue 
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { 
  AlertTriangle, FileDown, Filter, RefreshCw, Server, ShieldAlert, User
} from "lucide-react";

// Type definitions for our dashboard data
interface SystemAccessEntry {
  id: number;
  employeeId: number;
  systemId: number;
  accessLevel: string;
  status: string;
  requestDate: string;
  approvedDate?: string;
  employee: {
    firstName: string;
    lastName: string;
    department: string;
  };
  system: {
    name: string;
    category: string;
  };
}

interface AccessStats {
  totalAccess: number;
  pendingCount: number;
  activeCount: number;
  revokedCount: number;
  byAccessLevel: {
    read: number;
    write: number;
    admin: number;
  };
  byDepartment: Record<string, number>;
  bySystem: Record<string, number>;
  recentActivity: {
    date: string;
    count: number;
  }[];
}

export const SystemAccessDashboard = () => {
  const [timeRange, setTimeRange] = useState<string>("30");
  const [selectedSystem, setSelectedSystem] = useState<string>("all");

  // Fetch systems for the dropdown filter
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

  // Fetch system access data
  const { data: accessData, isLoading: accessLoading } = useQuery({
    queryKey: ['/api/system-access'],
    queryFn: async () => {
      const response = await fetch('/api/system-access');
      if (!response.ok) {
        throw new Error('Failed to fetch system access data');
      }
      return response.json();
    }
  });

  // Process the data for visualizations
  const [stats, setStats] = useState<AccessStats | null>(null);

  useEffect(() => {
    if (accessData) {
      // Filter data based on selected system
      const filteredData = selectedSystem === "all" 
        ? accessData 
        : accessData.filter((entry: SystemAccessEntry) => entry.systemId === parseInt(selectedSystem));

      // Calculate stats from the filtered data
      const totalAccess = filteredData.length;
      const pendingCount = filteredData.filter((entry: SystemAccessEntry) => entry.status === 'pending').length;
      const activeCount = filteredData.filter((entry: SystemAccessEntry) => entry.status === 'active').length;
      const revokedCount = filteredData.filter((entry: SystemAccessEntry) => entry.status === 'revoked').length;

      // Access level distribution
      const byAccessLevel = {
        read: filteredData.filter((entry: SystemAccessEntry) => entry.accessLevel === 'read').length,
        write: filteredData.filter((entry: SystemAccessEntry) => entry.accessLevel === 'write').length,
        admin: filteredData.filter((entry: SystemAccessEntry) => entry.accessLevel === 'admin').length,
      };

      // Department distribution
      const byDepartment: Record<string, number> = {};
      filteredData.forEach((entry: SystemAccessEntry) => {
        const dept = entry.employee?.department || 'Unknown';
        byDepartment[dept] = (byDepartment[dept] || 0) + 1;
      });

      // System distribution
      const bySystem: Record<string, number> = {};
      if (selectedSystem === "all") {
        filteredData.forEach((entry: SystemAccessEntry) => {
          const sys = entry.system?.name || 'Unknown';
          bySystem[sys] = (bySystem[sys] || 0) + 1;
        });
      }

      // Generate recent activity data (mock data as we don't have actual timestamps)
      const today = new Date();
      const recentActivity = Array.from({ length: parseInt(timeRange) }, (_, i) => {
        const date = new Date(today);
        date.setDate(today.getDate() - (parseInt(timeRange) - i - 1));
        // Random data for demo purposes
        const dateStr = date.toISOString().split('T')[0];
        const randomCount = Math.floor(Math.random() * 5);
        return { date: dateStr, count: randomCount };
      });

      setStats({
        totalAccess,
        pendingCount,
        activeCount,
        revokedCount,
        byAccessLevel,
        byDepartment,
        bySystem,
        recentActivity
      });
    }
  }, [accessData, selectedSystem, timeRange]);

  // Color schemes for charts
  const STATUS_COLORS = ['#10b981', '#f59e0b', '#ef4444'];
  const ACCESS_LEVEL_COLORS = ['#3b82f6', '#8b5cf6', '#f43f5e'];
  const DEPARTMENT_COLORS = [
    '#6366f1', '#ec4899', '#14b8a6', '#f97316', '#a855f7',
    '#06b6d4', '#f59e0b', '#8b5cf6', '#84cc16', '#64748b'
  ];

  // Prepare data for charts
  const statusData = stats ? [
    { name: 'Active', value: stats.activeCount },
    { name: 'Pending', value: stats.pendingCount },
    { name: 'Revoked', value: stats.revokedCount }
  ] : [];

  const accessLevelData = stats ? [
    { name: 'Read', value: stats.byAccessLevel.read },
    { name: 'Write', value: stats.byAccessLevel.write },
    { name: 'Admin', value: stats.byAccessLevel.admin }
  ] : [];

  const departmentData = stats ? Object.entries(stats.byDepartment).map(([name, value]) => ({
    name,
    value
  })).sort((a, b) => b.value - a.value).slice(0, 10) : [];

  const systemData = stats ? Object.entries(stats.bySystem).map(([name, value]) => ({
    name: name.length > 15 ? name.slice(0, 15) + '...' : name,
    value
  })).sort((a, b) => b.value - a.value).slice(0, 10) : [];

  // Custom tooltip for charts
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white dark:bg-slate-800 p-2 border border-slate-200 dark:border-slate-700 rounded shadow-md">
          <p className="font-medium">{`${label}`}</p>
          <p className="text-sm">{`Count: ${payload[0].value}`}</p>
        </div>
      );
    }
    return null;
  };

  if (accessLoading || systemsLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center pb-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex items-center space-x-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">Filters:</span>
          </div>
          
          <Select value={selectedSystem} onValueChange={setSelectedSystem}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="All Systems" />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectLabel>Systems</SelectLabel>
                <SelectItem value="all">All Systems</SelectItem>
                {systems?.map((system: any) => (
                  <SelectItem key={system.id} value={system.id.toString()}>
                    {system.name}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
          
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Last 30 days" />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectLabel>Time Range</SelectLabel>
                <SelectItem value="7">Last 7 days</SelectItem>
                <SelectItem value="30">Last 30 days</SelectItem>
                <SelectItem value="90">Last 90 days</SelectItem>
                <SelectItem value="365">Last Year</SelectItem>
              </SelectGroup>
            </SelectContent>
          </Select>
        </div>
        
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <FileDown className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>
      
      <Separator />
      
      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Access Rights</p>
                <h3 className="text-2xl font-bold mt-1">{stats?.totalAccess || 0}</h3>
              </div>
              <Server className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Pending Approvals</p>
                <h3 className="text-2xl font-bold mt-1">{stats?.pendingCount || 0}</h3>
              </div>
              <AlertTriangle className="h-8 w-8 text-amber-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Active Access</p>
                <h3 className="text-2xl font-bold mt-1">{stats?.activeCount || 0}</h3>
              </div>
              <User className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Admin Access</p>
                <h3 className="text-2xl font-bold mt-1">{stats?.byAccessLevel.admin || 0}</h3>
              </div>
              <ShieldAlert className="h-8 w-8 text-red-500" />
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Charts - First Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle>Access Status Distribution</CardTitle>
            <CardDescription>
              Overview of active, pending, and revoked access rights
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={statusData}
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  >
                    {statusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={STATUS_COLORS[index % STATUS_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle>Access Level Distribution</CardTitle>
            <CardDescription>
              Distribution of read, write, and admin access levels
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={accessLevelData}
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  >
                    {accessLevelData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={ACCESS_LEVEL_COLORS[index % ACCESS_LEVEL_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Charts - Second Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {selectedSystem === "all" && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle>System Access Distribution</CardTitle>
              <CardDescription>
                Number of employees with access to each system
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    layout="vertical"
                    data={systemData}
                    margin={{ top: 5, right: 30, left: 50, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" />
                    <YAxis type="category" dataKey="name" width={150} />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="value" fill="#8884d8" name="Users" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        )}
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle>Department Distribution</CardTitle>
            <CardDescription>
              System access distribution by department
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  layout="vertical"
                  data={departmentData}
                  margin={{ top: 5, right: 30, left: 80, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis type="category" dataKey="name" width={150} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="value" fill="#8884d8" name="Access Rights">
                    {departmentData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={DEPARTMENT_COLORS[index % DEPARTMENT_COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Recent Activity Chart */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle>Access Rights Activity Trend</CardTitle>
          <CardDescription>
            Trend of system access changes over the last {timeRange} days
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={stats?.recentActivity || []}
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="count" stroke="#8884d8" activeDot={{ r: 8 }} name="New Access Rights" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};