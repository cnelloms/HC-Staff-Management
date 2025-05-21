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
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Checkbox } from "@/components/ui/checkbox";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { format } from "date-fns";
import { 
  Trash2, 
  Plus, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  HelpCircle, 
  RefreshCcw,
  Server,
  Shield,
  MonitorSmartphone
} from "lucide-react";

const systemAccessSchema = z.object({
  employeeId: z.number().positive({ message: "Employee is required" }),
  systemId: z.number().positive({ message: "System is required" }),
  accessLevel: z.string().min(1, { message: "Access level is required" }),
  granted: z.boolean().default(false),
  status: z.string().default("pending"),
  expiresAt: z.string().optional(),
});

type SystemAccessFormValues = z.infer<typeof systemAccessSchema>;

interface SystemAccessTabProps {
  employeeId: number;
  isAdmin: boolean;
}

export function SystemAccessTab({ employeeId, isAdmin }: SystemAccessTabProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [selectedAccess, setSelectedAccess] = useState<any>(null);

  // Fetch systems
  const { data: systems, isLoading: isLoadingSystems } = useQuery({
    queryKey: ['/api/systems'],
    queryFn: async () => {
      const response = await fetch('/api/systems');
      if (!response.ok) {
        throw new Error('Failed to fetch systems');
      }
      return await response.json();
    }
  });

  // Fetch system access entries for the employee
  const { data: systemAccess, isLoading: isLoadingAccess } = useQuery({
    queryKey: ['/api/employees', employeeId, 'systems'],
    queryFn: async () => {
      const response = await fetch(`/api/employees/${employeeId}/systems`);
      if (!response.ok) {
        throw new Error('Failed to fetch system access');
      }
      return await response.json();
    },
    enabled: !!employeeId
  });

  // Form for adding/editing system access
  const form = useForm<SystemAccessFormValues>({
    resolver: zodResolver(systemAccessSchema),
    defaultValues: {
      employeeId: employeeId,
      systemId: 0,
      accessLevel: "read",
      granted: false,
      status: "pending",
      expiresAt: "",
    }
  });

  // Reset form when dialog opens/closes
  const resetForm = () => {
    form.reset({
      employeeId: employeeId,
      systemId: 0,
      accessLevel: "read",
      granted: false,
      status: "pending",
      expiresAt: "",
    });
    setSelectedAccess(null);
  };

  // Load selected access into form
  const editAccess = (access: any) => {
    setSelectedAccess(access);
    form.reset({
      employeeId: access.employeeId,
      systemId: access.systemId,
      accessLevel: access.accessLevel,
      granted: access.granted,
      status: access.status,
      expiresAt: access.expiresAt ? format(new Date(access.expiresAt), 'yyyy-MM-dd') : '',
    });
    setIsAddDialogOpen(true);
  };

  // Add/Edit system access mutation
  const addEditMutation = useMutation({
    mutationFn: async (values: SystemAccessFormValues) => {
      // Format expiration date if provided
      const formattedValues = {
        ...values,
        expiresAt: values.expiresAt ? new Date(values.expiresAt).toISOString() : undefined,
      };

      if (selectedAccess) {
        // Edit existing access
        return await apiRequest('PATCH', `/api/system-access/${selectedAccess.id}`, formattedValues);
      } else {
        // Add new access
        return await apiRequest('POST', '/api/system-access', formattedValues);
      }
    },
    onSuccess: () => {
      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['/api/system-access'] });
      queryClient.invalidateQueries({ queryKey: ['/api/employees', employeeId, 'systems'] });

      // Show success toast
      toast({
        title: selectedAccess ? "System access updated" : "System access added",
        description: selectedAccess 
          ? "System access has been updated successfully" 
          : "System access has been added successfully",
      });

      // Close dialog and reset form
      setIsAddDialogOpen(false);
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

  // Delete system access mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      return await apiRequest('DELETE', `/api/system-access/${id}`);
    },
    onSuccess: () => {
      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['/api/system-access'] });
      queryClient.invalidateQueries({ queryKey: ['/api/employees', employeeId, 'systems'] });

      toast({
        title: "System access deleted",
        description: "System access has been deleted successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete system access",
        variant: "destructive",
      });
    }
  });

  // Quick update status mutation
  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status, granted }: { id: number, status: string, granted: boolean }) => {
      return await apiRequest('PATCH', `/api/system-access/${id}`, { status, granted });
    },
    onSuccess: () => {
      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['/api/system-access'] });
      queryClient.invalidateQueries({ queryKey: ['/api/employees', employeeId, 'systems'] });

      toast({
        title: "System access updated",
        description: "System access status has been updated successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update system access status",
        variant: "destructive",
      });
    }
  });

  // Handle form submission
  const onSubmit = (values: SystemAccessFormValues) => {
    addEditMutation.mutate(values);
  };

  // Function to get status badge
  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case 'active':
        return (
          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 dark:bg-green-950/20 dark:text-green-400 dark:border-green-800">
            <CheckCircle2 className="h-3.5 w-3.5 mr-1" />
            Active
          </Badge>
        );
      case 'pending':
        return (
          <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200 dark:bg-yellow-950/20 dark:text-yellow-400 dark:border-yellow-800">
            <Clock className="h-3.5 w-3.5 mr-1" />
            Pending
          </Badge>
        );
      case 'revoked':
        return (
          <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200 dark:bg-red-950/20 dark:text-red-400 dark:border-red-800">
            <AlertCircle className="h-3.5 w-3.5 mr-1" />
            Revoked
          </Badge>
        );
      default:
        return (
          <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-200 dark:bg-gray-900/20 dark:text-gray-400 dark:border-gray-800">
            <HelpCircle className="h-3.5 w-3.5 mr-1" />
            {status}
          </Badge>
        );
    }
  };

  // Function to get access level badge
  const getAccessLevelBadge = (level: string) => {
    switch (level.toLowerCase()) {
      case 'admin':
        return (
          <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/20 dark:text-purple-400 dark:border-purple-800">
            <Shield className="h-3.5 w-3.5 mr-1" />
            Admin
          </Badge>
        );
      case 'write':
        return (
          <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/20 dark:text-blue-400 dark:border-blue-800">
            Write
          </Badge>
        );
      case 'read':
        return (
          <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-200 dark:bg-gray-900/20 dark:text-gray-400 dark:border-gray-800">
            Read
          </Badge>
        );
      default:
        return (
          <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-200 dark:bg-gray-900/20 dark:text-gray-400 dark:border-gray-800">
            {level}
          </Badge>
        );
    }
  };

  // Generate system icon based on category
  const getSystemIcon = (category: string) => {
    switch (category?.toLowerCase()) {
      case 'hr':
        return <Avatar className="h-8 w-8 bg-blue-100 text-blue-600"><AvatarFallback>HR</AvatarFallback></Avatar>;
      case 'finance':
        return <Avatar className="h-8 w-8 bg-green-100 text-green-600"><AvatarFallback>FN</AvatarFallback></Avatar>;
      case 'communication':
        return <Avatar className="h-8 w-8 bg-purple-100 text-purple-600"><AvatarFallback>CM</AvatarFallback></Avatar>;
      case 'sales':
        return <Avatar className="h-8 w-8 bg-yellow-100 text-yellow-600"><AvatarFallback>SL</AvatarFallback></Avatar>;
      case 'operations':
        return <Avatar className="h-8 w-8 bg-orange-100 text-orange-600"><AvatarFallback>OP</AvatarFallback></Avatar>;
      default:
        return <Avatar className="h-8 w-8 bg-gray-100 text-gray-600"><AvatarFallback>SY</AvatarFallback></Avatar>;
    }
  };

  // Format date
  const formatDate = (date: string | null | undefined) => {
    if (!date) return 'N/A';
    return format(new Date(date), 'MMM d, yyyy');
  };

  // Quick actions to approve or revoke access
  const approveAccess = (access: any) => {
    updateStatusMutation.mutate({ id: access.id, status: 'active', granted: true });
  };

  const revokeAccess = (access: any) => {
    updateStatusMutation.mutate({ id: access.id, status: 'revoked', granted: false });
  };

  const isLoading = isLoadingSystems || isLoadingAccess;

  return (
    <div className="space-y-4">
      {isAdmin && (
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="gap-1">
              <Server className="h-3.5 w-3.5 mr-1" />
              {systemAccess?.length || 0} System{systemAccess?.length !== 1 ? 's' : ''}
            </Badge>
          </div>
          <Button 
            onClick={() => {
              resetForm();
              setIsAddDialogOpen(true);
            }}
            className="flex items-center"
            size="sm"
          >
            <Plus className="mr-2 h-4 w-4" />
            Add System Access
          </Button>
        </div>
      )}

      {isLoading ? (
        <div className="flex items-center justify-center p-8">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
        </div>
      ) : !systemAccess || systemAccess.length === 0 ? (
        <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-8 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-muted">
            <MonitorSmartphone className="h-6 w-6 text-muted-foreground" />
          </div>
          <h3 className="mt-4 text-lg font-medium">No System Access Found</h3>
          <p className="mt-2 text-sm text-muted-foreground">
            No system access records have been assigned yet.
          </p>
          {isAdmin && (
            <Button
              className="mt-4"
              onClick={() => {
                resetForm();
                setIsAddDialogOpen(true);
              }}
            >
              Add System Access
            </Button>
          )}
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>System</TableHead>
              <TableHead>Access Level</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Granted Date</TableHead>
              <TableHead>Expires</TableHead>
              {isAdmin && <TableHead className="text-right">Actions</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {systemAccess.map((access: any) => (
              <TableRow key={access.id}>
                <TableCell>
                  <div className="flex items-center gap-3">
                    {getSystemIcon(access.system?.category)}
                    <div>
                      <div className="font-medium">{access.system?.name || 'Unknown System'}</div>
                      <div className="text-xs text-muted-foreground">{access.system?.description || ''}</div>
                    </div>
                  </div>
                </TableCell>
                <TableCell>{getAccessLevelBadge(access.accessLevel)}</TableCell>
                <TableCell>{getStatusBadge(access.status)}</TableCell>
                <TableCell>{formatDate(access.grantedAt)}</TableCell>
                <TableCell>{formatDate(access.expiresAt) || 'No expiration'}</TableCell>
                {isAdmin && (
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      {access.status === 'pending' && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-8 gap-1 px-2 text-green-700 dark:text-green-400"
                          title="Approve"
                          onClick={() => approveAccess(access)}
                          disabled={updateStatusMutation.isPending}
                        >
                          <CheckCircle2 className="h-4 w-4" />
                        </Button>
                      )}
                      {access.status === 'active' && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-8 gap-1 px-2 text-red-700 dark:text-red-400"
                          title="Revoke"
                          onClick={() => revokeAccess(access)}
                          disabled={updateStatusMutation.isPending}
                        >
                          <AlertCircle className="h-4 w-4" />
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 gap-1 px-2"
                        onClick={() => editAccess(access)}
                        disabled={addEditMutation.isPending}
                      >
                        Edit
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 gap-1 px-2 text-red-700 dark:text-red-400"
                        title="Delete"
                        onClick={() => deleteMutation.mutate(access.id)}
                        disabled={deleteMutation.isPending}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      {/* Add/Edit System Access Dialog */}
      {isAdmin && (
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogContent className="sm:max-w-[550px]">
            <DialogHeader>
              <DialogTitle>{selectedAccess ? "Edit System Access" : "Add System Access"}</DialogTitle>
              <DialogDescription>
                {selectedAccess
                  ? "Update system access settings for this employee"
                  : "Assign system access to this employee"}
              </DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                {/* System Selection */}
                <FormField
                  control={form.control}
                  name="systemId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>System</FormLabel>
                      <Select
                        value={field.value ? field.value.toString() : ""}
                        onValueChange={(value) => field.onChange(parseInt(value))}
                        disabled={!!selectedAccess}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select system" />
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
                      <Select value={field.value} onValueChange={field.onChange}>
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
                      <Select value={field.value} onValueChange={field.onChange}>
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

                {/* Granted Checkbox */}
                <FormField
                  control={form.control}
                  name="granted"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>
                          Access Granted
                        </FormLabel>
                        <FormDescription>
                          This will mark the access as granted and record the current time
                        </FormDescription>
                      </div>
                    </FormItem>
                  )}
                />

                {/* Expiration Date */}
                <FormField
                  control={form.control}
                  name="expiresAt"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Expiration Date (Optional)</FormLabel>
                      <FormControl>
                        <Input
                          type="date"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        Leave blank for no expiration
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={addEditMutation.isPending}>
                    {addEditMutation.isPending && (
                      <RefreshCcw className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    {selectedAccess ? "Update" : "Add"} System Access
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}