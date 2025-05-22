import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { 
  Trash2, 
  Plus, 
  PlusCircle,
  Edit, 
  RefreshCcw,
  Server,
  Search,
  Shield,
  CheckCircle2,
  AlertCircle,
  Clock
} from "lucide-react";
import { format } from "date-fns";

// Define schemas for form validation
const systemAccessSchema = z.object({
  employeeId: z.number().min(1, { message: "Employee is required" }),
  systemId: z.number().min(1, { message: "System is required" }),
  accessLevel: z.string().min(1, { message: "Access level is required" }),
  status: z.string().default("pending"),
  notes: z.string().optional(),
});

type SystemAccessFormValues = z.infer<typeof systemAccessSchema>;

export function SystemAccessManager() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedAccess, setSelectedAccess] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [employeeFilter, setEmployeeFilter] = useState<number | null>(null);
  const [systemFilter, setSystemFilter] = useState<number | null>(null);
  const [statusFilter, setStatusFilter] = useState<string | null>(null);

  // Fetch all system access entries - use system-access-admin endpoint for admin users
  const { data: accessEntries, isLoading: accessLoading, isError, error } = useQuery({
    queryKey: ['/api/system-access-admin'],
    queryFn: async () => {
      try {
        const response = await fetch('/api/system-access-admin', {
          credentials: 'include', // Include cookies for authentication
          headers: {
            'Content-Type': 'application/json',
          }
        });
        
        if (!response.ok) {
          console.error('Failed to fetch system access:', await response.text());
          throw new Error('Failed to fetch system access entries');
        }
        
        return await response.json();
      } catch (err) {
        console.error('Error fetching system access:', err);
        toast({
          title: "Access Error",
          description: "There was a problem loading the system access data. Please try refreshing the page.",
          variant: "destructive"
        });
        throw err;
      }
    },
    retry: 1
  });

  // Fetch all employees for the dropdown
  const { data: employees, isLoading: employeesLoading } = useQuery({
    queryKey: ['/api/employees'],
    queryFn: async () => {
      const response = await fetch('/api/employees');
      if (!response.ok) {
        throw new Error('Failed to fetch employees');
      }
      return await response.json();
    }
  });

  // Fetch all systems for the dropdown
  const { data: systems, isLoading: systemsLoading } = useQuery({
    queryKey: ['/api/systems'],
    queryFn: async () => {
      const response = await fetch('/api/systems');
      if (!response.ok) {
        throw new Error('Failed to fetch systems');
      }
      return await response.json();
    }
  });

  // Form for adding/editing system access
  const form = useForm<SystemAccessFormValues>({
    resolver: zodResolver(systemAccessSchema),
    defaultValues: {
      employeeId: 0,
      systemId: 0,
      accessLevel: "read",
      status: "pending",
      notes: "",
    }
  });

  // Reset form when dialog opens/closes
  const resetForm = () => {
    form.reset({
      employeeId: 0,
      systemId: 0,
      accessLevel: "read",
      status: "pending",
      notes: "",
    });
    setSelectedAccess(null);
  };

  // Mutation for adding/editing system access
  const accessMutation = useMutation({
    mutationFn: async (values: SystemAccessFormValues & { accessId?: number }) => {
      const { accessId, ...data } = values;
      
      // Include credentials with API requests
      const options = {
        credentials: 'include' as RequestCredentials,
        headers: {
          'Content-Type': 'application/json',
        }
      };
      
      if (accessId) {
        // Edit existing access
        return await fetch(`/api/system-access/${accessId}`, {
          method: 'PATCH',
          ...options,
          body: JSON.stringify(data)
        }).then(async response => {
          if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Failed to update system access: ${errorText}`);
          }
          return await response.json();
        });
      } else {
        // Add new access
        return await fetch('/api/system-access', {
          method: 'POST',
          ...options,
          body: JSON.stringify(data)
        }).then(async response => {
          if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Failed to create system access: ${errorText}`);
          }
          return await response.json();
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/system-access'] });
      
      toast({
        title: selectedAccess ? "Access updated" : "Access granted",
        description: selectedAccess 
          ? "System access has been updated successfully" 
          : "System access has been granted successfully",
      });
      
      setIsDialogOpen(false);
      resetForm();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to save system access",
        variant: "destructive",
      });
    }
  });

  // Mutation for revoking system access
  const revokeMutation = useMutation({
    mutationFn: async (accessId: number) => {
      const response = await fetch(`/api/system-access/${accessId}`, {
        method: 'DELETE',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        }
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to revoke system access: ${errorText}`);
      }
      
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/system-access'] });
      
      toast({
        title: "Access revoked",
        description: "System access has been revoked successfully",
      });
      
      setIsDeleteDialogOpen(false);
      setSelectedAccess(null);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to revoke system access",
        variant: "destructive",
      });
    }
  });

  // Mutation for updating access status
  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: number, status: string }) => {
      const response = await fetch(`/api/system-access/${id}`, {
        method: 'PATCH',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status })
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to update system access status: ${errorText}`);
      }
      
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/system-access'] });
      
      toast({
        title: "Status updated",
        description: "System access status has been updated successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update status",
        variant: "destructive",
      });
    }
  });

  // Handle form submission
  const onSubmit = (values: SystemAccessFormValues) => {
    if (selectedAccess) {
      accessMutation.mutate({ ...values, accessId: selectedAccess.id });
    } else {
      accessMutation.mutate(values);
    }
  };

  // Load selected access into form
  const editAccess = (access: any) => {
    setSelectedAccess(access);
    form.reset({
      employeeId: access.employeeId,
      systemId: access.systemId,
      accessLevel: access.accessLevel,
      status: access.status,
      notes: access.notes || "",
    });
    setIsDialogOpen(true);
  };

  // Prepare to delete access
  const confirmDelete = (access: any) => {
    setSelectedAccess(access);
    setIsDeleteDialogOpen(true);
  };

  // Approve access
  const approveAccess = (access: any) => {
    updateStatusMutation.mutate({ id: access.id, status: 'active' });
  };

  // Revoke access
  const revokeAccess = (access: any) => {
    updateStatusMutation.mutate({ id: access.id, status: 'revoked' });
  };

  // Get appropriate badge color based on access level
  const getAccessLevelBadge = (level: string) => {
    switch (level?.toLowerCase()) {
      case 'read':
        return <Badge variant="outline" className="bg-blue-50 text-blue-600 border-blue-200">Read</Badge>;
      case 'write':
        return <Badge variant="outline" className="bg-green-50 text-green-600 border-green-200">Write</Badge>;
      case 'admin':
        return <Badge variant="outline" className="bg-purple-50 text-purple-600 border-purple-200">Admin</Badge>;
      default:
        return <Badge variant="outline">{level}</Badge>;
    }
  };

  // Get appropriate badge color based on access status
  const getStatusBadge = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'active':
        return (
          <Badge variant="outline" className="bg-green-50 text-green-600 border-green-200">
            <CheckCircle2 className="h-3.5 w-3.5 mr-1" />
            Active
          </Badge>
        );
      case 'pending':
        return (
          <Badge variant="outline" className="bg-yellow-50 text-yellow-600 border-yellow-200">
            <Clock className="h-3.5 w-3.5 mr-1" />
            Pending
          </Badge>
        );
      case 'revoked':
        return (
          <Badge variant="outline" className="bg-red-50 text-red-600 border-red-200">
            <AlertCircle className="h-3.5 w-3.5 mr-1" />
            Revoked
          </Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  // Filter access entries based on search query and filters
  const filteredEntries = accessEntries?.filter((entry: any) => {
    // Check search query
    const searchLower = searchQuery.toLowerCase();
    const employeeName = `${entry.employee?.firstName || ''} ${entry.employee?.lastName || ''}`.toLowerCase();
    const systemName = entry.system?.name?.toLowerCase() || '';
    
    const matchesSearch = 
      employeeName.includes(searchLower) || 
      systemName.includes(searchLower) ||
      entry.status?.toLowerCase().includes(searchLower) ||
      entry.accessLevel?.toLowerCase().includes(searchLower);
    
    // Check filters
    const matchesEmployeeFilter = employeeFilter ? entry.employeeId === employeeFilter : true;
    const matchesSystemFilter = systemFilter ? entry.systemId === systemFilter : true;
    const matchesStatusFilter = statusFilter ? entry.status === statusFilter : true;
    
    return matchesSearch && matchesEmployeeFilter && matchesSystemFilter && matchesStatusFilter;
  });

  // Handle loading states
  const isLoading = accessLoading || employeesLoading || systemsLoading;

  // Format date
  const formatDate = (date: string | null | undefined) => {
    if (!date) return 'N/A';
    return format(new Date(date), 'MMM d, yyyy');
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">System Access Management</h2>
        <Button 
          onClick={() => {
            resetForm();
            setIsDialogOpen(true);
          }}
          className="flex items-center"
          size="sm"
        >
          <PlusCircle className="mr-2 h-4 w-4" />
          Grant System Access
        </Button>
      </div>

      <div className="flex flex-col md:flex-row gap-3">
        <div className="flex-1 relative">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by employee or system..."
            className="pl-8"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="flex flex-wrap gap-2">
          <Select 
            onValueChange={(value) => setEmployeeFilter(value ? parseInt(value) : null)}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by employee" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All Employees</SelectItem>
              {employees?.map((employee: any) => (
                <SelectItem key={employee.id} value={employee.id.toString()}>
                  {employee.firstName} {employee.lastName}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select 
            onValueChange={(value) => setSystemFilter(value ? parseInt(value) : null)}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by system" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All Systems</SelectItem>
              {systems?.map((system: any) => (
                <SelectItem key={system.id} value={system.id.toString()}>
                  {system.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select 
            onValueChange={(value) => setStatusFilter(value || null)}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All Statuses</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="revoked">Revoked</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center p-8">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
        </div>
      ) : !filteredEntries || filteredEntries.length === 0 ? (
        <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-8 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-muted">
            <Server className="h-6 w-6 text-muted-foreground" />
          </div>
          <h3 className="mt-4 text-lg font-medium">No System Access Found</h3>
          <p className="mt-2 text-sm text-muted-foreground">
            {searchQuery || employeeFilter || systemFilter || statusFilter 
              ? "No system access entries match your search criteria." 
              : "No system access entries have been added yet."}
          </p>
          <Button
            className="mt-4"
            onClick={() => {
              resetForm();
              setIsDialogOpen(true);
            }}
          >
            Grant System Access
          </Button>
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Employee</TableHead>
              <TableHead>System</TableHead>
              <TableHead>Access Level</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Last Updated</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredEntries.map((entry: any) => (
              <TableRow key={entry.id}>
                <TableCell>
                  <div className="font-medium">
                    {entry.employee?.firstName} {entry.employee?.lastName}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {entry.employee?.position?.title || entry.employee?.department?.name || ''}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="font-medium">
                    {entry.system?.name || 'Unknown System'}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {entry.system?.category || ''}
                  </div>
                </TableCell>
                <TableCell>{getAccessLevelBadge(entry.accessLevel)}</TableCell>
                <TableCell>{getStatusBadge(entry.status)}</TableCell>
                <TableCell>{formatDate(entry.updatedAt || entry.createdAt)}</TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    {entry.status === 'pending' && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-8 gap-1 px-2 text-green-700"
                        title="Approve"
                        onClick={() => approveAccess(entry)}
                        disabled={updateStatusMutation.isPending}
                      >
                        <CheckCircle2 className="h-4 w-4" />
                      </Button>
                    )}
                    {entry.status === 'active' && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-8 gap-1 px-2 text-red-700"
                        title="Revoke"
                        onClick={() => revokeAccess(entry)}
                        disabled={updateStatusMutation.isPending}
                      >
                        <AlertCircle className="h-4 w-4" />
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 gap-1 px-2"
                      onClick={() => editAccess(entry)}
                      disabled={accessMutation.isPending}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 gap-1 px-2 text-red-700"
                      title="Delete"
                      onClick={() => confirmDelete(entry)}
                      disabled={revokeMutation.isPending}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      {/* Add/Edit System Access Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>{selectedAccess ? "Edit System Access" : "Grant System Access"}</DialogTitle>
            <DialogDescription>
              {selectedAccess 
                ? "Update system access details" 
                : "Grant an employee access to a system"}
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              {/* Employee Selection */}
              <FormField
                control={form.control}
                name="employeeId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Employee</FormLabel>
                    <Select 
                      disabled={!!selectedAccess}
                      onValueChange={(value) => field.onChange(parseInt(value))} 
                      defaultValue={field.value ? field.value.toString() : undefined}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select an employee" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {employees?.map((employee: any) => (
                          <SelectItem key={employee.id} value={employee.id.toString()}>
                            {employee.firstName} {employee.lastName}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              {/* System Selection */}
              <FormField
                control={form.control}
                name="systemId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>System</FormLabel>
                    <Select 
                      disabled={!!selectedAccess}
                      onValueChange={(value) => field.onChange(parseInt(value))} 
                      defaultValue={field.value ? field.value.toString() : undefined}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a system" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {systems?.map((system: any) => (
                          <SelectItem key={system.id} value={system.id.toString()}>
                            {system.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              {/* Access Level */}
              <FormField
                control={form.control}
                name="accessLevel"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Access Level</FormLabel>
                    <Select 
                      onValueChange={field.onChange} 
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select access level" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="read">Read</SelectItem>
                        <SelectItem value="write">Write</SelectItem>
                        <SelectItem value="admin">Admin</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      Controls what the employee can do within the system
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              {/* Status */}
              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status</FormLabel>
                    <Select 
                      onValueChange={field.onChange} 
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="revoked">Revoked</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              {/* Notes */}
              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Notes (Optional)</FormLabel>
                    <FormControl>
                      <textarea
                        className="flex min-h-[80px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        placeholder="Add any relevant notes about this access"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <DialogFooter>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setIsDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={accessMutation.isPending}>
                  {accessMutation.isPending && (
                    <RefreshCcw className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  {selectedAccess ? "Update" : "Grant"} Access
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
      
      {/* Delete Confirmation Dialog */}
      <AlertDialog 
        open={isDeleteDialogOpen} 
        onOpenChange={setIsDeleteDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete System Access</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this system access entry? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => selectedAccess && revokeMutation.mutate(selectedAccess.id)}
              className="bg-red-600 text-white hover:bg-red-700"
            >
              {revokeMutation.isPending && (
                <RefreshCcw className="mr-2 h-4 w-4 animate-spin" />
              )}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}