import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { StatusBadge } from "@/components/ui/status-badge";
import { Ticket } from "@/types";
import { useState, useMemo } from "react";
import { PlusIcon, SearchIcon, CalendarIcon } from "lucide-react";
import { format } from "date-fns";

export function TicketTable() {
  const { data: tickets, isLoading } = useQuery<Ticket[]>({
    queryKey: ['/api/tickets'],
  });

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');

  const filteredTickets = useMemo(() => {
    if (!tickets) return [];
    
    return tickets.filter(ticket => {
      const matchesSearch = searchTerm === '' || 
        ticket.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        ticket.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (ticket.requestor?.name && ticket.requestor.name.toLowerCase().includes(searchTerm.toLowerCase()));
        
      const matchesStatus = statusFilter === 'all' || ticket.status === statusFilter;
      const matchesType = typeFilter === 'all' || ticket.type === typeFilter;
      
      return matchesSearch && matchesStatus && matchesType;
    });
  }, [tickets, searchTerm, statusFilter, typeFilter]);

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-2">
          <div className="relative">
            <SearchIcon className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search tickets..."
              className="pl-8 w-[300px]"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="All Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="open">Open</SelectItem>
              <SelectItem value="in_progress">In Progress</SelectItem>
              <SelectItem value="closed">Closed</SelectItem>
            </SelectContent>
          </Select>
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="All Types" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="system_access">System Access</SelectItem>
              <SelectItem value="onboarding">Onboarding</SelectItem>
              <SelectItem value="issue">Issue</SelectItem>
              <SelectItem value="request">Request</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button asChild>
          <Link href="/tickets/new">
            <a>
              <PlusIcon className="mr-2 h-4 w-4" />
              New Ticket
            </a>
          </Link>
        </Button>
      </div>
      
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[300px]">Ticket</TableHead>
              <TableHead>Requestor</TableHead>
              <TableHead>Assignee</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Priority</TableHead>
              <TableHead>Created</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, index) => (
                <TableRow key={index} className="animate-pulse">
                  <TableCell>
                    <div className="space-y-1">
                      <div className="h-4 w-32 bg-muted rounded" />
                      <div className="h-3 w-24 bg-muted rounded" />
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <div className="h-8 w-8 rounded-full bg-muted" />
                      <div className="h-4 w-20 bg-muted rounded" />
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="h-4 w-20 bg-muted rounded" />
                  </TableCell>
                  <TableCell><div className="h-6 w-16 bg-muted rounded" /></TableCell>
                  <TableCell><div className="h-6 w-16 bg-muted rounded" /></TableCell>
                  <TableCell><div className="h-4 w-20 bg-muted rounded" /></TableCell>
                  <TableCell className="text-right"><div className="h-8 w-16 bg-muted rounded ml-auto" /></TableCell>
                </TableRow>
              ))
            ) : filteredTickets.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                  No tickets found matching the current filters
                </TableCell>
              </TableRow>
            ) : (
              filteredTickets.map((ticket) => (
                <TableRow key={ticket.id}>
                  <TableCell>
                    <div>
                      <div className="font-medium">
                        <Link href={`/tickets/${ticket.id}`}>
                          <a className="hover:underline">{ticket.title}</a>
                        </Link>
                      </div>
                      <div className="text-sm text-muted-foreground truncate max-w-[250px]">
                        {ticket.description}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    {ticket.requestor ? (
                      <div className="flex items-center space-x-2">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={ticket.requestor.avatar} alt={ticket.requestor.name} />
                          <AvatarFallback>
                            {ticket.requestor.name.split(' ').map(n => n[0]).join('')}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-sm">{ticket.requestor.name}</span>
                      </div>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {ticket.assignee ? (
                      <div className="flex items-center space-x-2">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={ticket.assignee.avatar} alt={ticket.assignee.name} />
                          <AvatarFallback>
                            {ticket.assignee.name.split(' ').map(n => n[0]).join('')}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-sm">{ticket.assignee.name}</span>
                      </div>
                    ) : (
                      <span className="text-muted-foreground">Unassigned</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={ticket.status as any} />
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={ticket.priority as any} />
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center text-sm text-muted-foreground">
                      <CalendarIcon className="mr-1.5 h-4 w-4" />
                      {format(new Date(ticket.createdAt), 'MMM d, yyyy')}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm" asChild>
                      <Link href={`/tickets/${ticket.id}`}>
                        <a>View</a>
                      </Link>
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
