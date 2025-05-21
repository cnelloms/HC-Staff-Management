import { useState, useMemo } from "react";
import { Link } from "wouter";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from "@/components/ui/table";
import {
  Card, CardContent, CardDescription, CardHeader, CardTitle
} from "@/components/ui/card";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "@/components/ui/select";
import { StatusBadge } from "@/components/ui/status-badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { format } from "date-fns";
import { Employee, Ticket } from "@/types";
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

interface TicketDetailReportProps {
  tickets: Ticket[];
  employees: Employee[];
}

export default function TicketDetailReport({ tickets, employees }: TicketDetailReportProps) {
  // Filter states
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [assigneeFilter, setAssigneeFilter] = useState<string>("all");
  const [requesterFilter, setRequesterFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Chart colors
  const COLORS = ['#0052CC', '#36B37E', '#FF5630', '#6554C0', '#FFAB00'];

  // Format ticket type for display
  const formatTicketType = (type: string) => {
    switch (type) {
      case 'new_staff_request':
        return 'New Staff Request';
      case 'it_support':
        return 'IT Support';
      case 'system_access':
        return 'System Access';
      case 'onboarding':
        return 'Onboarding';
      case 'issue':
        return 'Issue';
      case 'request':
        return 'Request';
      default:
        return type.charAt(0).toUpperCase() + type.slice(1).replace('_', ' ');
    }
  };

  // Get unique categories, assignees, and requesters
  const uniqueCategories = useMemo(() => {
    if (!tickets) return [];
    const categories = new Set(tickets.map(ticket => ticket.type));
    return Array.from(categories);
  }, [tickets]);

  const uniqueAssignees = useMemo(() => {
    if (!tickets) return [];
    const assignees = new Set();
    tickets.forEach(ticket => {
      if (ticket.assigneeId) {
        assignees.add(ticket.assigneeId);
      }
    });
    return Array.from(assignees);
  }, [tickets]);

  const uniqueRequesters = useMemo(() => {
    if (!tickets) return [];
    const requesters = new Set(tickets.map(ticket => ticket.requestorId));
    return Array.from(requesters);
  }, [tickets]);

  // Filter tickets based on selected filters
  const filteredTickets = useMemo(() => {
    if (!tickets) return [];

    return tickets.filter(ticket => {
      // Filter by category
      if (categoryFilter !== "all" && ticket.type !== categoryFilter) {
        return false;
      }

      // Filter by assignee
      if (assigneeFilter !== "all" && ticket.assigneeId !== parseInt(assigneeFilter)) {
        return false;
      }

      // Filter by requester
      if (requesterFilter !== "all" && ticket.requestorId !== parseInt(requesterFilter)) {
        return false;
      }

      // Filter by status
      if (statusFilter !== "all" && ticket.status !== statusFilter) {
        return false;
      }

      // Filter by search query
      if (searchQuery && !ticket.title.toLowerCase().includes(searchQuery.toLowerCase())) {
        return false;
      }

      return true;
    });
  }, [tickets, categoryFilter, assigneeFilter, requesterFilter, statusFilter, searchQuery]);

  // Generate chart data
  const assigneeDistribution = useMemo(() => {
    if (!filteredTickets || filteredTickets.length === 0) return [];

    const assigneeCounts = filteredTickets.reduce((acc, ticket) => {
      const assigneeId = ticket.assigneeId || 0;
      const assigneeName = ticket.assignee 
        ? `${ticket.assignee.firstName} ${ticket.assignee.lastName}`
        : (assigneeId === 0 ? "Unassigned" : `ID: ${assigneeId}`);

      if (!acc[assigneeName]) {
        acc[assigneeName] = 0;
      }
      acc[assigneeName]++;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(assigneeCounts)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 10); // Top 10 assignees
  }, [filteredTickets]);

  const requesterDistribution = useMemo(() => {
    if (!filteredTickets || filteredTickets.length === 0) return [];

    const requesterCounts = filteredTickets.reduce((acc, ticket) => {
      const requesterId = ticket.requestorId;
      const requesterName = ticket.requestor 
        ? `${ticket.requestor.firstName} ${ticket.requestor.lastName}`
        : `ID: ${requesterId}`;

      if (!acc[requesterName]) {
        acc[requesterName] = 0;
      }
      acc[requesterName]++;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(requesterCounts)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 10); // Top 10 requesters
  }, [filteredTickets]);

  const categoryDistribution = useMemo(() => {
    if (!filteredTickets || filteredTickets.length === 0) return [];

    const categoryCounts = filteredTickets.reduce((acc, ticket) => {
      const categoryName = formatTicketType(ticket.type);

      if (!acc[categoryName]) {
        acc[categoryName] = 0;
      }
      acc[categoryName]++;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(categoryCounts)
      .map(([name, value]) => ({ name, value }));
  }, [filteredTickets]);

  const statusDistribution = useMemo(() => {
    if (!filteredTickets || filteredTickets.length === 0) return [];

    const statusCounts = filteredTickets.reduce((acc, ticket) => {
      const statusName = ticket.status === 'in_progress' 
        ? 'In Progress' 
        : ticket.status.charAt(0).toUpperCase() + ticket.status.slice(1);

      if (!acc[statusName]) {
        acc[statusName] = 0;
      }
      acc[statusName]++;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(statusCounts)
      .map(([name, value]) => ({ name, value }));
  }, [filteredTickets]);

  // Find employee name by ID
  const getEmployeeName = (id: number | undefined) => {
    if (!id || !employees) return "Unassigned";
    const employee = employees.find(emp => emp.id === id);
    return employee ? `${employee.firstName} ${employee.lastName}` : `ID: ${id}`;
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Ticket Detail Report</CardTitle>
          <CardDescription>
            Analysis of tickets by category, assignee, and requester
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Filters */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              <div>
                <Select
                  value={categoryFilter}
                  onValueChange={setCategoryFilter}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Filter by Category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    {uniqueCategories.map((category) => (
                      <SelectItem key={category} value={category}>
                        {formatTicketType(category)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Select
                  value={assigneeFilter}
                  onValueChange={setAssigneeFilter}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Filter by Assignee" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Assignees</SelectItem>
                    <SelectItem value="0">Unassigned</SelectItem>
                    {uniqueAssignees.map((assigneeId) => (
                      <SelectItem key={assigneeId.toString()} value={assigneeId.toString()}>
                        {getEmployeeName(Number(assigneeId))}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Select
                  value={requesterFilter}
                  onValueChange={setRequesterFilter}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Filter by Requester" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Requesters</SelectItem>
                    {uniqueRequesters.map((requesterId) => (
                      <SelectItem key={requesterId.toString()} value={requesterId.toString()}>
                        {getEmployeeName(Number(requesterId))}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Select
                  value={statusFilter}
                  onValueChange={setStatusFilter}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Filter by Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="open">Open</SelectItem>
                    <SelectItem value="in_progress">In Progress</SelectItem>
                    <SelectItem value="closed">Closed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Input
                  placeholder="Search by title..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>

            {/* Chart Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
              {/* Tickets by Category */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">Tickets by Category</CardTitle>
                </CardHeader>
                <CardContent className="h-[300px]">
                  {categoryDistribution.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={categoryDistribution}
                          cx="50%"
                          cy="50%"
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                          label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                        >
                          {categoryDistribution.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <RechartsTooltip formatter={(value) => [`${value} tickets`, 'Count']} />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex h-full items-center justify-center">
                      <p className="text-muted-foreground">No data available</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Tickets by Status */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">Tickets by Status</CardTitle>
                </CardHeader>
                <CardContent className="h-[300px]">
                  {statusDistribution.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={statusDistribution}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <RechartsTooltip formatter={(value) => [`${value} tickets`, 'Count']} />
                        <Bar dataKey="value" name="Tickets" fill="#0052CC" />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex h-full items-center justify-center">
                      <p className="text-muted-foreground">No data available</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Top Assignees */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">Top Assignees</CardTitle>
                </CardHeader>
                <CardContent className="h-[300px]">
                  {assigneeDistribution.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart 
                        data={assigneeDistribution}
                        layout="vertical"
                        margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis type="number" />
                        <YAxis 
                          dataKey="name" 
                          type="category" 
                          width={150}
                          tick={{ fontSize: 12 }}
                        />
                        <RechartsTooltip formatter={(value) => [`${value} tickets`, 'Count']} />
                        <Bar dataKey="value" name="Tickets" fill="#36B37E" />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex h-full items-center justify-center">
                      <p className="text-muted-foreground">No data available</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Top Requesters */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">Top Requesters</CardTitle>
                </CardHeader>
                <CardContent className="h-[300px]">
                  {requesterDistribution.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart 
                        data={requesterDistribution}
                        layout="vertical"
                        margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis type="number" />
                        <YAxis 
                          dataKey="name" 
                          type="category" 
                          width={150}
                          tick={{ fontSize: 12 }}
                        />
                        <RechartsTooltip formatter={(value) => [`${value} tickets`, 'Count']} />
                        <Bar dataKey="value" name="Tickets" fill="#6554C0" />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex h-full items-center justify-center">
                      <p className="text-muted-foreground">No data available</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Detailed Tickets Table */}
            <Card className="mt-6">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Detailed Ticket List</CardTitle>
                <CardDescription>
                  {filteredTickets.length} tickets found with the current filters
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>ID</TableHead>
                        <TableHead>Title</TableHead>
                        <TableHead>Category</TableHead>
                        <TableHead>Requester</TableHead>
                        <TableHead>Assignee</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Priority</TableHead>
                        <TableHead>Created</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredTickets.length > 0 ? (
                        filteredTickets.map((ticket) => (
                          <TableRow key={ticket.id}>
                            <TableCell>#{ticket.id}</TableCell>
                            <TableCell className="font-medium">{ticket.title}</TableCell>
                            <TableCell>{formatTicketType(ticket.type)}</TableCell>
                            <TableCell>{getEmployeeName(ticket.requestorId)}</TableCell>
                            <TableCell>{getEmployeeName(ticket.assigneeId)}</TableCell>
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
                        ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan={9} className="text-center py-4">
                            No tickets found matching current filters
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}