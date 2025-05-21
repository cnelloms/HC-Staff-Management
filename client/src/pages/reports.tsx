import { useState, useMemo } from "react";
import { Link } from "wouter";
import Layout from "@/components/layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend
} from "recharts";
import { useQuery } from "@tanstack/react-query";
import { Employee, Ticket } from "@/types";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle 
} from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { StatusBadge } from "@/components/ui/status-badge";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";

export default function Reports() {
  // State for drill-down dialog
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedTickets, setSelectedTickets] = useState<Ticket[]>([]);
  const [filterType, setFilterType] = useState<'status' | 'type' | null>(null);
  
  // Get data for reports
  const { data: employees } = useQuery<Employee[]>({
    queryKey: ['/api/employees'],
  });

  const { data: tickets } = useQuery<Ticket[]>({
    queryKey: ['/api/tickets'],
  });

  // Processing data for department distribution
  const departmentData = useMemo(() => {
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
  const ticketStatusData = useMemo(() => {
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

  // Processing data for ticket types
  const ticketTypeData = useMemo(() => {
    if (!tickets) return [];
    
    const typeCount = tickets.reduce((acc, ticket) => {
      if (!acc[ticket.type]) {
        acc[ticket.type] = 0;
      }
      
      acc[ticket.type]++;
      return acc;
    }, {} as Record<string, number>);
    
    return Object.entries(typeCount).map(([name, value]) => ({ 
      name: name === 'new_staff_request' ? 'New Staff Request' : 
            name === 'system_access' ? 'System Access' :
            name === 'in_progress' ? 'In Progress' : 
            name.charAt(0).toUpperCase() + name.slice(1), 
      value 
    }));
  }, [tickets]);

  // Processing data for onboarding status
  const onboardingData = useMemo(() => {
    if (!employees) return [];
    
    const statusCount = employees.reduce((acc, employee) => {
      const status = employee.status || 'unknown';
      
      if (!acc[status]) {
        acc[status] = 0;
      }
      
      acc[status]++;
      return acc;
    }, {} as Record<string, number>);
    
    return Object.entries(statusCount).map(([name, value]) => ({ 
      name: name.charAt(0).toUpperCase() + name.slice(1), 
      value 
    }));
  }, [employees]);

  // Functions to handle drill down
  const handleStatusClick = (data: any) => {
    if (!tickets) return;
    
    // Convert display name back to status value
    let statusValue = data.name.toLowerCase();
    if (statusValue === 'in progress') statusValue = 'in_progress';
    
    const filteredTickets = tickets.filter(ticket => ticket.status === statusValue);
    setSelectedTickets(filteredTickets);
    setSelectedCategory(data.name);
    setFilterType('status');
    setDialogOpen(true);
  };
  
  const handleTypeClick = (data: any) => {
    if (!tickets) return;
    
    // Convert display name back to type value
    let typeValue = data.name.toLowerCase().replace(' ', '_');
    if (typeValue === 'new_staff_request' || typeValue === 'it_support' || typeValue === 'system_access') {
      typeValue = typeValue; // Keep as is
    } else if (typeValue === 'in_progress') {
      typeValue = 'in_progress';
    }
    
    const filteredTickets = tickets.filter(ticket => ticket.type === typeValue);
    setSelectedTickets(filteredTickets);
    setSelectedCategory(data.name);
    setFilterType('type');
    setDialogOpen(true);
  };
  
  // Format ticket type for display
  const formatTicketType = (type: string) => {
    switch (type) {
      case 'new_staff_request':
        return 'New Staff Request';
      case 'it_support':
        return 'IT Support';
      case 'system_access':
        return 'System Access';
      default:
        return type.charAt(0).toUpperCase() + type.slice(1).replace('_', ' ');
    }
  };
  
  // Chart colors
  const COLORS = ['#0052CC', '#36B37E', '#FF5630', '#6554C0', '#FFAB00'];

  return (
    <Layout title="Reports">
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold tracking-tight mb-6">Staff Onboarding Analytics</h2>
          <p className="text-muted-foreground mb-6">
            View key metrics and reports on staff onboarding progress and ticket management.
            Click on chart segments to see related tickets.
          </p>
        </div>
        
        {/* Ticket Drill Down Dialog */}
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="max-w-5xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center justify-between">
                <span>
                  {filterType === 'status' 
                    ? `Tickets with Status: ${selectedCategory}` 
                    : `${selectedCategory} Tickets`}
                </span>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={() => setDialogOpen(false)}
                  className="h-8 w-8 rounded-full"
                >
                  <X className="h-4 w-4" />
                </Button>
              </DialogTitle>
              <DialogDescription>
                Showing {selectedTickets.length} ticket{selectedTickets.length !== 1 ? 's' : ''}
              </DialogDescription>
            </DialogHeader>
            
            {selectedTickets.length > 0 ? (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>ID</TableHead>
                      <TableHead>Title</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Priority</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {selectedTickets.map((ticket) => (
                      <TableRow key={ticket.id}>
                        <TableCell>#{ticket.id}</TableCell>
                        <TableCell className="font-medium">{ticket.title}</TableCell>
                        <TableCell>{formatTicketType(ticket.type)}</TableCell>
                        <TableCell>
                          <StatusBadge status={ticket.status as any} />
                        </TableCell>
                        <TableCell>
                          <StatusBadge status={ticket.priority as any} />
                        </TableCell>
                        <TableCell>
                          {format(new Date(ticket.createdAt), 'MMM d, yyyy')}
                        </TableCell>
                        <TableCell>
                          <Button variant="ghost" size="sm" asChild>
                            <Link href={`/tickets/${ticket.id}`}>
                              View
                            </Link>
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="py-10 text-center">
                <p className="text-muted-foreground">No tickets found for this selection</p>
              </div>
            )}
          </DialogContent>
        </Dialog>

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
                    <RechartsTooltip formatter={(value) => [`${value} employees`, 'Count']} />
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
              <CardDescription>Current distribution of ticket statuses (click for details)</CardDescription>
            </CardHeader>
            <CardContent className="h-[300px]">
              {ticketStatusData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={ticketStatusData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <RechartsTooltip />
                    <Bar 
                      dataKey="value" 
                      name="Tickets" 
                      fill="#0052CC" 
                      onClick={handleStatusClick}
                      cursor="pointer"
                    />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex h-full items-center justify-center">
                  <p className="text-muted-foreground">No ticket data available</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Ticket Types */}
          <Card>
            <CardHeader>
              <CardTitle>Ticket Types</CardTitle>
              <CardDescription>Distribution of different ticket types (click for details)</CardDescription>
            </CardHeader>
            <CardContent className="h-[300px]">
              {ticketTypeData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={ticketTypeData}
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      onClick={handleTypeClick}
                      cursor="pointer"
                    >
                      {ticketTypeData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <RechartsTooltip formatter={(value) => [`${value} tickets`, 'Count']} />
                    <Legend onClick={handleTypeClick} />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex h-full items-center justify-center">
                  <p className="text-muted-foreground">No ticket type data available</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Staff Onboarding Status */}
          <Card>
            <CardHeader>
              <CardTitle>Staff Onboarding Status</CardTitle>
              <CardDescription>Current status of employee onboarding</CardDescription>
            </CardHeader>
            <CardContent className="h-[300px]">
              {onboardingData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={onboardingData}
                    layout="vertical"
                    margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" />
                    <YAxis dataKey="name" type="category" width={150} />
                    <RechartsTooltip />
                    <Bar dataKey="value" name="Employees" fill="#36B37E" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex h-full items-center justify-center">
                  <p className="text-muted-foreground">No onboarding status data available</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
}
