import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
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
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Shield, PlusCircle, X, RefreshCcw, ExternalLink, Database } from "lucide-react";

// Define schemas for form validation
const systemAccessSchema = z.object({
  systemId: z.string().min(1, { message: "System is required" }),
  accessLevel: z.string().min(1, { message: "Access level is required" }),
  notes: z.string().optional(),
});

type SystemAccessFormValues = z.infer<typeof systemAccessSchema>;

interface SystemAccessTabProps {
  employeeId: number;
  isAdmin?: boolean;
}

export function SystemAccessTab({ employeeId, isAdmin = false }: SystemAccessTabProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedAccess, setSelectedAccess] = useState<any>(null);

  // Fetch employee's system access
  const { data: systemAccess, isLoading: accessLoading } = useQuery({
    queryKey: ['/api/employees', employeeId, 'systems'],
    queryFn: async () => {
      const response = await fetch(`/api/employees/${employeeId}/systems`);
      if (!response.ok) {
        throw new Error('Failed to fetch employee system access');
      }
      return response.json();
    }
  });

  // Fetch available systems for the dropdown
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

  // Form for adding/editing system access
  const form = useForm<SystemAccessFormValues>({
    resolver: zodResolver(systemAccessSchema),
    defaultValues: {
      systemId: "",
      accessLevel: "",
      notes: "",
    }
  });

  // Reset form when dialog opens/closes
  const resetForm = () => {
    form.reset({
      systemId: "",
      accessLevel: "",
      notes: "",
    });
    setSelectedAccess(null);
  };

  // Mutation for adding/editing system access
  const accessMutation = useMutation({
    mutationFn: async (values: SystemAccessFormValues & { accessId?: number }) => {
      const { accessId, ...data } = values;
      
      const systemId = parseInt(data.systemId);
      if (isNaN(systemId)) {
        throw new Error('Invalid system ID');
      }
      
      const payload = {
        ...data,
        systemId,
        employeeId,
        status: 'active'
      };
      
      if (accessId) {
        // Edit existing access
        return await apiRequest('PATCH', `/api/system-access/${accessId}`, payload);
      } else {
        // Add new access
        return await apiRequest('POST', '/api/system-access', payload);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/employees', employeeId, 'systems'] });
      
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
      return await apiRequest('DELETE', `/api/system-access/${accessId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/employees', employeeId, 'systems'] });
      
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
      systemId: access.systemId.toString(),
      accessLevel: access.accessLevel,
      notes: access.notes || "",
    });
    setIsDialogOpen(true);
  };

  // Prepare to delete access
  const confirmDelete = (access: any) => {
    setSelectedAccess(access);
    setIsDeleteDialogOpen(true);
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
        return <Badge variant="outline" className="bg-green-50 text-green-600 border-green-200">Active</Badge>;
      case 'pending':
        return <Badge variant="outline" className="bg-yellow-50 text-yellow-600 border-yellow-200">Pending</Badge>;
      case 'revoked':
        return <Badge variant="outline" className="bg-red-50 text-red-600 border-red-200">Revoked</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  // Handle loading states
  if (accessLoading || systemsLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {isAdmin && (
        <div className="flex justify-end">
          <Button 
            onClick={() => {
              resetForm();
              setIsDialogOpen(true);
            }}
            size="sm"
            disabled={accessMutation.isPending}
          >
            <PlusCircle className="mr-2 h-4 w-4" />
            Grant System Access
          </Button>
        </div>
      )}
      
      {!systemAccess || systemAccess.length === 0 ? (
        <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-8 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-muted">
            <Database className="h-6 w-6 text-muted-foreground" />
          </div>
          <h3 className="mt-4 text-lg font-medium">No System Access</h3>
          <p className="mt-2 text-sm text-muted-foreground">
            This employee doesn't have access to any systems yet.
          </p>
          {isAdmin && (
            <Button
              className="mt-4"
              onClick={() => {
                resetForm();
                setIsDialogOpen(true);
              }}
            >
              Grant System Access
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
              <TableHead>Notes</TableHead>
              {isAdmin && <TableHead className="text-right">Actions</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {systemAccess.map((access: any) => (
              <TableRow key={access.id}>
                <TableCell className="font-medium">{access.systemName}</TableCell>
                <TableCell>{getAccessLevelBadge(access.accessLevel)}</TableCell>
                <TableCell>{getStatusBadge(access.status)}</TableCell>
                <TableCell>{access.notes || '-'}</TableCell>
                {isAdmin && (
                  <TableCell className="text-right">
                    <div className="flex justify-end space-x-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => editAccess(access)}
                        disabled={accessMutation.isPending}
                      >
                        <Shield className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        onClick={() => confirmDelete(access)}
                        disabled={revokeMutation.isPending}
                      >
                        <X className="h-4 w-4" />
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
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>{selectedAccess ? "Edit System Access" : "Grant System Access"}</DialogTitle>
            <DialogDescription>
              {selectedAccess 
                ? "Update this employee's access to the selected system" 
                : "Grant this employee access to a system"}
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
                      disabled={!!selectedAccess}
                      onValueChange={field.onChange} 
                      defaultValue={field.value}
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
            <AlertDialogTitle>Revoke System Access</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to revoke access to{" "}
              <strong className="font-semibold">{selectedAccess?.systemName}</strong>? 
              This action cannot be undone.
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
              Revoke Access
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}