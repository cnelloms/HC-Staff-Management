import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Edit, Trash, Plus } from "lucide-react";

const permissionFormSchema = z.object({
  name: z.string().min(3, "Name must be at least 3 characters"),
  description: z.string().optional(),
  resource: z.string().min(1, "Resource is required"),
  action: z.string().min(1, "Action is required"),
  scope: z.string().min(1, "Scope is required"),
  fieldLevel: z.any().optional(),
});

export function PermissionsList() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingPermission, setEditingPermission] = useState<any>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [deletingPermissionId, setDeletingPermissionId] = useState<number | null>(null);

  const { data: permissions, isLoading } = useQuery({
    queryKey: ['/api/permissions'],
  });

  const form = useForm({
    resolver: zodResolver(permissionFormSchema),
    defaultValues: {
      name: "",
      description: "",
      resource: "",
      action: "",
      scope: "all",
      fieldLevel: null,
    },
  });

  const createPermissionMutation = useMutation({
    mutationFn: async (values: z.infer<typeof permissionFormSchema>) => {
      return apiRequest("POST", "/api/permissions", values);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/permissions'] });
      toast({
        title: "Permission created",
        description: "The permission has been created successfully.",
      });
      setIsAddDialogOpen(false);
      form.reset();
    },
    onError: (error) => {
      toast({
        title: "Failed to create permission",
        description: error.message || "An error occurred while creating the permission.",
        variant: "destructive",
      });
    },
  });

  const updatePermissionMutation = useMutation({
    mutationFn: async (values: z.infer<typeof permissionFormSchema> & { id: number }) => {
      const { id, ...data } = values;
      return apiRequest("PATCH", `/api/permissions/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/permissions'] });
      toast({
        title: "Permission updated",
        description: "The permission has been updated successfully.",
      });
      setIsAddDialogOpen(false);
      setEditingPermission(null);
      form.reset();
    },
    onError: (error) => {
      toast({
        title: "Failed to update permission",
        description: error.message || "An error occurred while updating the permission.",
        variant: "destructive",
      });
    },
  });

  const deletePermissionMutation = useMutation({
    mutationFn: async (id: number) => {
      return apiRequest("DELETE", `/api/permissions/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/permissions'] });
      toast({
        title: "Permission deleted",
        description: "The permission has been deleted successfully.",
      });
      setIsDeleteDialogOpen(false);
      setDeletingPermissionId(null);
    },
    onError: (error) => {
      toast({
        title: "Failed to delete permission",
        description: error.message || "An error occurred while deleting the permission.",
        variant: "destructive",
      });
    },
  });

  function onSubmit(values: z.infer<typeof permissionFormSchema>) {
    if (editingPermission) {
      updatePermissionMutation.mutate({ ...values, id: editingPermission.id });
    } else {
      createPermissionMutation.mutate(values);
    }
  }

  function handleEditPermission(permission: any) {
    setEditingPermission(permission);
    form.reset({
      name: permission.name,
      description: permission.description || "",
      resource: permission.resource,
      action: permission.action,
      scope: permission.scope,
      fieldLevel: permission.fieldLevel,
    });
    setIsAddDialogOpen(true);
  }

  function handleDeletePermission(id: number) {
    setDeletingPermissionId(id);
    setIsDeleteDialogOpen(true);
  }

  if (isLoading) {
    return <div className="py-4 text-center">Loading permissions...</div>;
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-medium">System Permissions</h3>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => {
              setEditingPermission(null);
              form.reset({
                name: "",
                description: "",
                resource: "",
                action: "",
                scope: "all",
                fieldLevel: null,
              });
            }}>
              <Plus className="mr-2 h-4 w-4" />
              Add Permission
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>{editingPermission ? "Edit Permission" : "Create Permission"}</DialogTitle>
              <DialogDescription>
                {editingPermission 
                  ? "Update the permission details below." 
                  : "Fill in the details to create a new permission."}
              </DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Name</FormLabel>
                      <FormControl>
                        <Input placeholder="View Employees" {...field} />
                      </FormControl>
                      <FormDescription>
                        A descriptive name for the permission
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Allows viewing employee directory" 
                          {...field} 
                          value={field.value || ""}
                        />
                      </FormControl>
                      <FormDescription>
                        Optional description of what this permission allows
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="resource"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Resource</FormLabel>
                        <FormControl>
                          <Select 
                            value={field.value} 
                            onValueChange={field.onChange}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select resource" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="employee">Employee</SelectItem>
                              <SelectItem value="ticket">Ticket</SelectItem>
                              <SelectItem value="system_access">System Access</SelectItem>
                              <SelectItem value="report">Report</SelectItem>
                              <SelectItem value="role">Role</SelectItem>
                              <SelectItem value="permission">Permission</SelectItem>
                            </SelectContent>
                          </Select>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="action"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Action</FormLabel>
                        <FormControl>
                          <Select 
                            value={field.value} 
                            onValueChange={field.onChange}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select action" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="view">View</SelectItem>
                              <SelectItem value="create">Create</SelectItem>
                              <SelectItem value="edit">Edit</SelectItem>
                              <SelectItem value="delete">Delete</SelectItem>
                              <SelectItem value="manage">Manage</SelectItem>
                            </SelectContent>
                          </Select>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <FormField
                  control={form.control}
                  name="scope"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Scope</FormLabel>
                      <FormControl>
                        <Select 
                          value={field.value} 
                          onValueChange={field.onChange}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select scope" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All</SelectItem>
                            <SelectItem value="own">Own</SelectItem>
                            <SelectItem value="department">Department</SelectItem>
                          </SelectContent>
                        </Select>
                      </FormControl>
                      <FormDescription>
                        Scope of the permission (all resources, own resources, or department resources)
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <DialogFooter>
                  <Button 
                    type="submit" 
                    disabled={createPermissionMutation.isPending || updatePermissionMutation.isPending}
                  >
                    {editingPermission ? "Update" : "Create"}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      {permissions && permissions.length > 0 ? (
        <div className="border rounded-md">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Resource</TableHead>
                <TableHead>Action</TableHead>
                <TableHead>Scope</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {permissions.map((permission: any) => (
                <TableRow key={permission.id}>
                  <TableCell className="font-medium">
                    {permission.name}
                    {permission.description && (
                      <p className="text-sm text-muted-foreground">{permission.description}</p>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="capitalize">
                      {permission.resource.replace('_', ' ')}
                    </Badge>
                  </TableCell>
                  <TableCell className="capitalize">{permission.action}</TableCell>
                  <TableCell className="capitalize">{permission.scope}</TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleEditPermission(permission)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <AlertDialog
                      open={isDeleteDialogOpen && deletingPermissionId === permission.id}
                      onOpenChange={(open) => {
                        setIsDeleteDialogOpen(open);
                        if (!open) setDeletingPermissionId(null);
                      }}
                    >
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeletePermission(permission.id)}
                        >
                          <Trash className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete Permission</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to delete this permission? This action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction 
                            onClick={() => deletePermissionMutation.mutate(permission.id)}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          >
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      ) : (
        <div className="text-center py-10 border rounded-md">
          <p className="text-muted-foreground mb-4">No permissions found</p>
          <DialogTrigger asChild>
            <Button onClick={() => {
              setEditingPermission(null);
              form.reset();
              setIsAddDialogOpen(true);
            }}>
              Create your first permission
            </Button>
          </DialogTrigger>
        </div>
      )}
    </div>
  );
}