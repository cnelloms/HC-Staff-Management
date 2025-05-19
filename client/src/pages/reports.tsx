import Layout from "@/components/layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend
} from "recharts";
import { useQuery } from "@tanstack/react-query";
import { Employee, Ticket, SystemAccess } from "@/types";

export default function Reports() {
  // Get data for reports
  const { data: employees } = useQuery<Employee[]>({
    queryKey: ['/api/employees'],
  });

  const { data: tickets } = useQuery<Ticket[]>({
    queryKey: ['/api/tickets'],
  });

  const { data: systemAccess } = useQuery<SystemAccess[]>({
    queryKey: ['/api/system-access'],
  });

  // Processing data for department distribution
  const departmentData = React.useMemo(() => {
    if (!employees) return [];
    
    const deptCount = employees.reduce((acc, employee) => {
      const deptId = employee.departmentId;
      const deptName = employee.department?.name || `Department ${deptId}`;
      
      if (!acc[deptName]) {
        acc[deptName] = 0;
      }
      
      acc[deptName]++;
      return acc;
    }, {} as Record<string, number>);
    
    return Object.entries(deptCount).map(([name, value]) => ({ name, value }));
  }, [employees]);

  // Processing data for ticket status
  const ticketStatusData = React.useMemo(() => {
    if (!tickets) return [];
    
    const statusCount = tickets.reduce((acc, ticket) => {
      if (!acc[ticket.status]) {
        acc[ticket.status] = 0;
      }
      
      acc[ticket.status]++;
      return acc;
    }, {} as Record<string, number>);
    
    return Object.entries(statusCount).map(([name, value]) => ({ 
      name: name === 'in_progress' ? 'In Progress' : name.charAt(0).toUpperCase() + name.slice(1), 
      value 
    }));
  }, [tickets]);

  // Processing data for system access levels
  const accessLevelData = React.useMemo(() => {
    if (!systemAccess) return [];
    
    const levelCount = systemAccess.reduce((acc, access) => {
      if (!acc[access.accessLevel]) {
        acc[access.accessLevel] = 0;
      }
      
      acc[access.accessLevel]++;
      return acc;
    }, {} as Record<string, number>);
    
    return Object.entries(levelCount).map(([name, value]) => ({ 
      name: name.charAt(0).toUpperCase() + name.slice(1), 
      value 
    }));
  }, [systemAccess]);

  // Processing data for system usage
  const systemUsageData = React.useMemo(() => {
    if (!systemAccess) return [];
    
    const systemCount = systemAccess.reduce((acc, access) => {
      const systemName = access.system?.name || `System ${access.systemId}`;
      
      if (!acc[systemName]) {
        acc[systemName] = 0;
      }
      
      acc[systemName]++;
      return acc;
    }, {} as Record<string, number>);
    
    return Object.entries(systemCount)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5); // Top 5 systems
  }, [systemAccess]);

  // Chart colors
  const COLORS = ['#0052CC', '#36B37E', '#FF5630', '#6554C0', '#FFAB00'];

  return (
    <Layout title="Reports">
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold tracking-tight mb-6">Analytics & Reports</h2>
          <p className="text-muted-foreground mb-6">
            View key metrics and reports on staff distribution, system usage, and ticket management.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          {/* Department Distribution */}
          <Card>
            <CardHeader>
              <CardTitle>Staff by Department</CardTitle>
              <CardDescription>Distribution of employees across departments</CardDescription>
            </CardHeader>
            <CardContent className="h-[300px]">
              {departmentData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={departmentData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      fill="#8884d8"
                      paddingAngle={5}
                      dataKey="value"
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      labelLine={false}
                    >
                      {departmentData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Legend />
                    <Tooltip formatter={(value) => [`${value} employees`, 'Count']} />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex h-full items-center justify-center">
                  <p className="text-muted-foreground">No department data available</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Ticket Status */}
          <Card>
            <CardHeader>
              <CardTitle>Ticket Status</CardTitle>
              <CardDescription>Current distribution of ticket statuses</CardDescription>
            </CardHeader>
            <CardContent className="h-[300px]">
              {ticketStatusData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={ticketStatusData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="value" name="Tickets" fill="#0052CC" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex h-full items-center justify-center">
                  <p className="text-muted-foreground">No ticket data available</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* System Access Levels */}
          <Card>
            <CardHeader>
              <CardTitle>Access Level Distribution</CardTitle>
              <CardDescription>Distribution of system access levels</CardDescription>
            </CardHeader>
            <CardContent className="h-[300px]">
              {accessLevelData.length > 0 ? (
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
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => [`${value} users`, 'Count']} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex h-full items-center justify-center">
                  <p className="text-muted-foreground">No access level data available</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Top Systems by Usage */}
          <Card>
            <CardHeader>
              <CardTitle>Top Systems by Usage</CardTitle>
              <CardDescription>Most accessed systems in the organization</CardDescription>
            </CardHeader>
            <CardContent className="h-[300px]">
              {systemUsageData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={systemUsageData}
                    layout="vertical"
                    margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" />
                    <YAxis dataKey="name" type="category" width={150} />
                    <Tooltip />
                    <Bar dataKey="value" name="Users" fill="#36B37E" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex h-full items-center justify-center">
                  <p className="text-muted-foreground">No system usage data available</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
}
