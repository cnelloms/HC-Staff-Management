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
import { Checkbox } from "@/components/ui/checkbox";
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
import { Edit, Trash, Plus, KeyRound, ShieldCheck } from "lucide-react";

const roleFormSchema = z.object({
  name: z.string().min(3, "Name must be at least 3 characters"),
  description: z.string().optional(),
  isDefault: z.boolean().optional(),
});

export function RolesList() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isPermissionsDialogOpen, setIsPermissionsDialogOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<any>(null);
  const [selectedRoleId, setSelectedRoleId] = useState<number | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [deletingRoleId, setDeletingRoleId] = useState<number | null>(null);

  const { data: roles, isLoading: rolesLoading } = useQuery({
    queryKey: ['/api/roles'],
  });

  const { data: permissions, isLoading: permissionsLoading } = useQuery({
    queryKey: ['/api/permissions'],
  });

  const { data: rolePermissions, isLoading: rolePermissionsLoading } = useQuery({
    queryKey: [`/api/roles/${selectedRoleId}/permissions`],
    enabled: !!selectedRoleId,
  });

  const form = useForm({
    resolver: zodResolver(roleFormSchema),
    defaultValues: {
      name: "",
      description: "",
      isDefault: false,
    },
  });

  const createRoleMutation = useMutation({
    mutationFn: async (values: z.infer<typeof roleFormSchema>) => {
      return apiRequest("POST", "/api/roles", values);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/roles'] });
      toast({
        title: "Role created",
        description: "The role has been created successfully.",
      });
      setIsAddDialogOpen(false);
      form.reset();
    },
    onError: (error) => {
      toast({
        title: "Failed to create role",
        description: error.message || "An error occurred while creating the role.",
        variant: "destructive",
      });
    },
  });

  const updateRoleMutation = useMutation({
    mutationFn: async (values: z.infer<typeof roleFormSchema> & { id: number }) => {
      const { id, ...data } = values;
      return apiRequest("PATCH", `/api/roles/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/roles'] });
      toast({
        title: "Role updated",
        description: "The role has been updated successfully.",
      });
      setIsAddDialogOpen(false);
      setEditingRole(null);
      form.reset();
    },
    onError: (error) => {
      toast({
        title: "Failed to update role",
        description: error.message || "An error occurred while updating the role.",
        variant: "destructive",
      });
    },
  });

  const deleteRoleMutation = useMutation({
    mutationFn: async (id: number) => {
      return apiRequest("DELETE", `/api/roles/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/roles'] });
      toast({
        title: "Role deleted",
        description: "The role has been deleted successfully.",
      });
      setIsDeleteDialogOpen(false);
      setDeletingRoleId(null);
    },
    onError: (error) => {
      toast({
        title: "Failed to delete role",
        description: error.message || "An error occurred while deleting the role.",
        variant: "destructive",
      });
    },
  });

  const addPermissionToRoleMutation = useMutation({
    mutationFn: async ({ roleId, permissionId }: { roleId: number; permissionId: number }) => {
      return apiRequest("POST", `/api/roles/${roleId}/permissions`, { permissionId });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/roles/${selectedRoleId}/permissions`] });
      toast({
        title: "Permission added",
        description: "The permission has been added to the role successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Failed to add permission",
        description: error.message || "An error occurred while adding the permission to the role.",
        variant: "destructive",
      });
    },
  });

  const removePermissionFromRoleMutation = useMutation({
    mutationFn: async ({ roleId, permissionId }: { roleId: number; permissionId: number }) => {
      return apiRequest("DELETE", `/api/roles/${roleId}/permissions/${permissionId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/roles/${selectedRoleId}/permissions`] });
      toast({
        title: "Permission removed",
        description: "The permission has been removed from the role successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Failed to remove permission",
        description: error.message || "An error occurred while removing the permission from the role.",
        variant: "destructive",
      });
    },
  });

  function onSubmit(values: z.infer<typeof roleFormSchema>) {
    if (editingRole) {
      updateRoleMutation.mutate({ ...values, id: editingRole.id });
    } else {
      createRoleMutation.mutate(values);
    }
  }

  function handleEditRole(role: any) {
    setEditingRole(role);
    form.reset({
      name: role.name,
      description: role.description || "",
      isDefault: role.isDefault || false,
    });
    setIsAddDialogOpen(true);
  }

  function handleDeleteRole(id: number) {
    setDeletingRoleId(id);
    setIsDeleteDialogOpen(true);
  }

  function handleManagePermissions(role: any) {
    setSelectedRoleId(role.id);
    setIsPermissionsDialogOpen(true);
  }

  function handleTogglePermission(permissionId: number, isAssigned: boolean) {
    if (selectedRoleId) {
      if (isAssigned) {
        removePermissionFromRoleMutation.mutate({
          roleId: selectedRoleId,
          permissionId,
        });
      } else {
        addPermissionToRoleMutation.mutate({
          roleId: selectedRoleId,
          permissionId,
        });
      }
    }
  }

  const isPermissionAssigned = (permissionId: number) => {
    return rolePermissions?.some((p: any) => p.id === permissionId) || false;
  };

  if (rolesLoading) {
    return <div className="py-4 text-center">Loading roles...</div>;
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-medium">System Roles</h3>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => {
              setEditingRole(null);
              form.reset({
                name: "",
                description: "",
                isDefault: false,
              });
            }}>
              <Plus className="mr-2 h-4 w-4" />
              Add Role
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>{editingRole ? "Edit Role" : "Create Role"}</DialogTitle>
              <DialogDescription>
                {editingRole 
                  ? "Update the role details below." 
                  : "Fill in the details to create a new role."}
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
                        <Input placeholder="Administrator" {...field} />
                      </FormControl>
                      <FormDescription>
                        A descriptive name for the role
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
                          placeholder="Full system access" 
                          {...field} 
                          value={field.value || ""}
                        />
                      </FormControl>
                      <FormDescription>
                        Optional description of what this role represents
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="isDefault"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>Default Role</FormLabel>
                        <FormDescription>
                          If checked, all new employees will be assigned this role by default
                        </FormDescription>
                      </div>
                    </FormItem>
                  )}
                />
                <DialogFooter>
                  <Button 
                    type="submit" 
                    disabled={createRoleMutation.isPending || updateRoleMutation.isPending}
                  >
                    {editingRole ? "Update" : "Create"}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Manage Permissions Dialog */}
      <Dialog open={isPermissionsDialogOpen} onOpenChange={setIsPermissionsDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Manage Role Permissions</DialogTitle>
            <DialogDescription>
              {roles?.find((r: any) => r.id === selectedRoleId)?.name} - Select the permissions for this role
            </DialogDescription>
          </DialogHeader>

          {permissionsLoading || rolePermissionsLoading ? (
            <div className="py-4 text-center">Loading permissions...</div>
          ) : (
            <div className="max-h-[400px] overflow-y-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Permission</TableHead>
                    <TableHead>Resource</TableHead>
                    <TableHead>Action</TableHead>
                    <TableHead>Assigned</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {permissions?.map((permission: any) => (
                    <TableRow key={permission.id}>
                      <TableCell>
                        {permission.name}
                        {permission.description && (
                          <p className="text-xs text-muted-foreground">{permission.description}</p>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="capitalize">
                          {permission.resource.replace('_', ' ')}
                        </Badge>
                      </TableCell>
                      <TableCell className="capitalize">{permission.action}</TableCell>
                      <TableCell>
                        <Checkbox
                          checked={isPermissionAssigned(permission.id)}
                          onCheckedChange={(checked) => 
                            handleTogglePermission(
                              permission.id, 
                              isPermissionAssigned(permission.id)
                            )
                          }
                          disabled={
                            addPermissionToRoleMutation.isPending || 
                            removePermissionFromRoleMutation.isPending
                          }
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {roles && roles.length > 0 ? (
        <div className="border rounded-md">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Default</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {roles.map((role: any) => (
                <TableRow key={role.id}>
                  <TableCell className="font-medium">{role.name}</TableCell>
                  <TableCell>{role.description || "-"}</TableCell>
                  <TableCell>{role.isDefault ? "Yes" : "No"}</TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleManagePermissions(role)}
                      title="Manage Permissions"
                    >
                      <KeyRound className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleEditRole(role)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <AlertDialog
                      open={isDeleteDialogOpen && deletingRoleId === role.id}
                      onOpenChange={(open) => {
                        setIsDeleteDialogOpen(open);
                        if (!open) setDeletingRoleId(null);
                      }}
                    >
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteRole(role.id)}
                        >
                          <Trash className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete Role</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to delete this role? This action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction 
                            onClick={() => deleteRoleMutation.mutate(role.id)}
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
          <p className="text-muted-foreground mb-4">No roles found</p>
          <DialogTrigger asChild>
            <Button onClick={() => {
              setEditingRole(null);
              form.reset();
              setIsAddDialogOpen(true);
            }}>
              Create your first role
            </Button>
          </DialogTrigger>
        </div>
      )}
    </div>
  );
}