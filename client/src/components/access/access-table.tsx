import { useQuery } from "@tanstack/react-query";
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
import { StatusBadge } from "@/components/ui/status-badge";
import { SystemAccess } from "@/types";
import { useState, useMemo } from "react";
import { PlusIcon, SearchIcon } from "lucide-react";
import { format } from "date-fns";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export function AccessTable() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { data: accessEntries, isLoading } = useQuery<SystemAccess[]>({
    queryKey: ['/api/system-access'],
  });

  const [searchTerm, setSearchTerm] = useState('');
  const [systemFilter, setSystemFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  // Get unique systems for filtering
  const systems = useMemo(() => {
    if (!accessEntries) return [];
    
    const systemMap = new Map();
    accessEntries.forEach(entry => {
      if (entry.system) {
        systemMap.set(entry.system.id, entry.system.name);
      }
    });
    
    return Array.from(systemMap.entries()).map(([id, name]) => ({ id, name }));
  }, [accessEntries]);

  const filteredAccessEntries = useMemo(() => {
    if (!accessEntries) return [];
    
    return accessEntries.filter(entry => {
      const matchesSearch = searchTerm === '' || 
        (entry.employee?.name && entry.employee.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (entry.system?.name && entry.system.name.toLowerCase().includes(searchTerm.toLowerCase()));
        
      const matchesSystem = systemFilter === 'all' || 
        (entry.system && entry.system.id.toString() === systemFilter);
        
      const matchesStatus = statusFilter === 'all' || entry.status === statusFilter;
      
      return matchesSearch && matchesSystem && matchesStatus;
    });
  }, [accessEntries, searchTerm, systemFilter, statusFilter]);

  const approveAccessMutation = useMutation({
    mutationFn: async (accessId: number) => {
      return apiRequest("PATCH", `/api/system-access/${accessId}`, {
        granted: true,
        grantedAt: new Date().toISOString(),
        grantedById: 1, // Using admin ID 1 for now
        status: 'active'
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/system-access'] });
      toast({
        title: "Access granted",
        description: "System access has been successfully granted.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to grant access. Please try again.",
        variant: "destructive",
      });
    },
  });

  const revokeAccessMutation = useMutation({
    mutationFn: async (accessId: number) => {
      return apiRequest("PATCH", `/api/system-access/${accessId}`, {
        granted: false,
        status: 'revoked'
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/system-access'] });
      toast({
        title: "Access revoked",
        description: "System access has been successfully revoked.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to revoke access. Please try again.",
        variant: "destructive",
      });
    },
  });

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-2">
          <div className="relative">
            <SearchIcon className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search users or systems..."
              className="pl-8 w-[300px]"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Select value={systemFilter} onValueChange={setSystemFilter}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="All Systems" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Systems</SelectItem>
              {systems.map(system => (
                <SelectItem key={system.id} value={system.id.toString()}>
                  {system.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="All Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="revoked">Revoked</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button>
          <PlusIcon className="mr-2 h-4 w-4" />
          New Access Request
        </Button>
      </div>
      
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>User</TableHead>
              <TableHead>System</TableHead>
              <TableHead>Access Level</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Granted By</TableHead>
              <TableHead>Granted Date</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, index) => (
                <TableRow key={index} className="animate-pulse">
                  <TableCell><div className="h-4 w-32 bg-muted rounded" /></TableCell>
                  <TableCell><div className="h-4 w-40 bg-muted rounded" /></TableCell>
                  <TableCell><div className="h-4 w-16 bg-muted rounded" /></TableCell>
                  <TableCell><div className="h-6 w-16 bg-muted rounded" /></TableCell>
                  <TableCell><div className="h-4 w-24 bg-muted rounded" /></TableCell>
                  <TableCell><div className="h-4 w-24 bg-muted rounded" /></TableCell>
                  <TableCell className="text-right"><div className="h-8 w-16 bg-muted rounded ml-auto" /></TableCell>
                </TableRow>
              ))
            ) : filteredAccessEntries.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                  No system access entries found matching the current filters
                </TableCell>
              </TableRow>
            ) : (
              filteredAccessEntries.map((access) => (
                <TableRow key={access.id}>
                  <TableCell>
                    <div className="font-medium">{access.employee?.name}</div>
                    <div className="text-sm text-muted-foreground">
                      {access.employee?.position}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="font-medium">{access.system?.name}</div>
                  </TableCell>
                  <TableCell className="capitalize">{access.accessLevel}</TableCell>
                  <TableCell>
                    <StatusBadge status={access.status as any} />
                  </TableCell>
                  <TableCell>
                    {access.grantedBy?.name || '-'}
                  </TableCell>
                  <TableCell>
                    {access.grantedAt 
                      ? format(new Date(access.grantedAt), 'MMM d, yyyy')
                      : '-'
                    }
                  </TableCell>
                  <TableCell className="text-right">
                    {access.status === 'pending' && (
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="mr-2"
                        onClick={() => approveAccessMutation.mutate(access.id)}
                        disabled={approveAccessMutation.isPending}
                      >
                        Approve
                      </Button>
                    )}
                    {access.status === 'active' && (
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => revokeAccessMutation.mutate(access.id)}
                        disabled={revokeAccessMutation.isPending}
                      >
                        Revoke
                      </Button>
                    )}
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
