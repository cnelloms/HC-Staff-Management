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
import { Trash, Plus, KeyRound, Users, Loader2 } from "lucide-react";

const employeeRoleFormSchema = z.object({
  employeeId: z.number({
    required_error: "Please select an employee",
  }),
  roleId: z.number({
    required_error: "Please select a role",
  }),
});

export function EmployeeRoles() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<number | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [deletingRole, setDeletingRole] = useState<{employeeId: number, roleId: number} | null>(null);

  const { data: employees, isLoading: employeesLoading } = useQuery({
    queryKey: ['/api/employees'],
  });

  const { data: roles, isLoading: rolesLoading } = useQuery({
    queryKey: ['/api/roles'],
  });

  const { data: employeeRoles, isLoading: employeeRolesLoading } = useQuery({
    queryKey: [`/api/employees/${selectedEmployeeId}/roles`],
    enabled: !!selectedEmployeeId,
  });

  const form = useForm({
    resolver: zodResolver(employeeRoleFormSchema),
    defaultValues: {
      employeeId: 0,
      roleId: 0,
    },
  });

  const addRoleToEmployeeMutation = useMutation({
    mutationFn: async (values: z.infer<typeof employeeRoleFormSchema>) => {
      return apiRequest("POST", `/api/employees/${values.employeeId}/roles`, {
        roleId: values.roleId,
        assignedBy: 1 // Assuming current user's ID is 1 for demo
      });
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: [`/api/employees/${variables.employeeId}/roles`] });
      toast({
        title: "Role assigned",
        description: "The role has been assigned to the employee successfully.",
      });
      setIsAddDialogOpen(false);
      form.reset();
      
      // If the employee we just added a role to is currently selected, refresh their roles
      if (selectedEmployeeId === variables.employeeId) {
        queryClient.invalidateQueries({ queryKey: [`/api/employees/${selectedEmployeeId}/roles`] });
      }
    },
    onError: (error) => {
      toast({
        title: "Failed to assign role",
        description: error.message || "An error occurred while assigning the role.",
        variant: "destructive",
      });
    },
  });

  const removeRoleFromEmployeeMutation = useMutation({
    mutationFn: async ({ employeeId, roleId }: { employeeId: number; roleId: number }) => {
      return apiRequest("DELETE", `/api/employees/${employeeId}/roles/${roleId}`);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: [`/api/employees/${variables.employeeId}/roles`] });
      toast({
        title: "Role removed",
        description: "The role has been removed from the employee successfully.",
      });
      setIsDeleteDialogOpen(false);
      setDeletingRole(null);
    },
    onError: (error) => {
      toast({
        title: "Failed to remove role",
        description: error.message || "An error occurred while removing the role.",
        variant: "destructive",
      });
    },
  });

  function onSubmit(values: z.infer<typeof employeeRoleFormSchema>) {
    addRoleToEmployeeMutation.mutate(values);
  }

  function handleViewEmployeeRoles(employeeId: number) {
    setSelectedEmployeeId(employeeId);
  }

  function handleRemoveRole(employeeId: number, roleId: number) {
    setDeletingRole({ employeeId, roleId });
    setIsDeleteDialogOpen(true);
  }

  if (employeesLoading) {
    return (
      <div className="py-8 flex flex-col items-center justify-center gap-4">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        <p className="text-muted-foreground">Loading employees...</p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-medium">Employee Role Assignments</h3>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => {
              form.reset({
                employeeId: 0,
                roleId: 0,
              });
            }}>
              <Plus className="mr-2 h-4 w-4" />
              Assign Role
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Assign Role to Employee</DialogTitle>
              <DialogDescription>
                Select an employee and a role to assign
              </DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="employeeId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Employee</FormLabel>
                      <FormControl>
                        <Select 
                          value={field.value ? field.value.toString() : undefined} 
                          onValueChange={(value) => field.onChange(parseInt(value))}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select employee" />
                          </SelectTrigger>
                          <SelectContent>
                            {employees?.map((employee: any) => (
                              <SelectItem key={employee.id} value={employee.id.toString()}>
                                {employee.firstName} {employee.lastName}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="roleId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Role</FormLabel>
                      <FormControl>
                        <Select 
                          value={field.value ? field.value.toString() : undefined} 
                          onValueChange={(value) => field.onChange(parseInt(value))}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select role" />
                          </SelectTrigger>
                          <SelectContent>
                            {roles?.map((role: any) => (
                              <SelectItem key={role.id} value={role.id.toString()}>
                                {role.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <DialogFooter>
                  <Button 
                    type="submit" 
                    disabled={addRoleToEmployeeMutation.isPending}
                  >
                    Assign Role
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Employee Roles Table */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="border rounded-md p-4">
          <h4 className="text-md font-medium mb-4">Employees</h4>
          {employees && employees.length > 0 ? (
            <div className="max-h-[500px] overflow-y-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Department</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {employees.map((employee: any) => (
                    <TableRow key={employee.id}>
                      <TableCell className="font-medium">
                        {employee.firstName} {employee.lastName}
                      </TableCell>
                      <TableCell>{employee.department?.name || "-"}</TableCell>
                      <TableCell>
                        <Button
                          variant={selectedEmployeeId === employee.id ? "default" : "outline"}
                          size="sm"
                          onClick={() => handleViewEmployeeRoles(employee.id)}
                        >
                          <KeyRound className="mr-2 h-4 w-4" />
                          View Roles
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-6">
              <p className="text-muted-foreground">No employees found</p>
            </div>
          )}
        </div>

        <div className="border rounded-md p-4">
          <h4 className="text-md font-medium mb-4">
            {selectedEmployeeId 
              ? `Roles for ${employees?.find((e: any) => e.id === selectedEmployeeId)?.firstName || ''} ${employees?.find((e: any) => e.id === selectedEmployeeId)?.lastName || ''}` 
              : "Select an employee to view their roles"}
          </h4>
          
          {selectedEmployeeId ? (
            employeeRolesLoading ? (
              <div className="py-8 flex flex-col items-center justify-center gap-4">
                <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                <p className="text-muted-foreground">Loading roles...</p>
              </div>
            ) : employeeRoles && employeeRoles.length > 0 ? (
              <div className="max-h-[450px] overflow-y-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Role</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {employeeRoles.map((role: any) => (
                      <TableRow key={role.id}>
                        <TableCell className="font-medium">{role.name}</TableCell>
                        <TableCell>{role.description || "-"}</TableCell>
                        <TableCell>
                          <AlertDialog
                            open={isDeleteDialogOpen && deletingRole?.roleId === role.id && deletingRole?.employeeId === selectedEmployeeId}
                            onOpenChange={(open) => {
                              setIsDeleteDialogOpen(open);
                              if (!open) setDeletingRole(null);
                            }}
                          >
                            <AlertDialogTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleRemoveRole(selectedEmployeeId, role.id)}
                              >
                                <Trash className="h-4 w-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Remove Role</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Are you sure you want to remove this role from the employee? This might affect their access to system features.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction 
                                  onClick={() => removeRoleFromEmployeeMutation.mutate({
                                    employeeId: selectedEmployeeId,
                                    roleId: role.id
                                  })}
                                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                >
                                  Remove
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
              <div className="text-center py-6">
                <p className="text-muted-foreground mb-4">No roles assigned to this employee</p>
                <Button onClick={() => setIsAddDialogOpen(true)}>
                  Assign Role
                </Button>
              </div>
            )
          ) : (
            <div className="text-center py-20">
              <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">Select an employee to view their assigned roles</p>
            </div>
          )}
        </div>
      </div>

      {/* Add Role Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Assign Role to Employee</DialogTitle>
            <DialogDescription>
              {selectedEmployeeId && employees ? 
                `Select a role to assign to ${employees.find((e: any) => e.id === selectedEmployeeId)?.firstName} ${employees.find((e: any) => e.id === selectedEmployeeId)?.lastName}` : 
                "Select a role to assign to this employee"}
            </DialogDescription>
          </DialogHeader>
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="roleId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Role</FormLabel>
                    <Select 
                      onValueChange={(value) => field.onChange(parseInt(value))} 
                      defaultValue={field.value?.toString()}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a role" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {rolesLoading ? (
                          <SelectItem value="loading" disabled>Loading roles...</SelectItem>
                        ) : roles?.length === 0 ? (
                          <SelectItem value="none" disabled>No roles available</SelectItem>
                        ) : (
                          roles?.map((role: any) => (
                            <SelectItem 
                              key={role.id} 
                              value={role.id.toString()}
                              disabled={employeeRoles?.some((er: any) => er.id === role.id)}
                            >
                              {role.name}
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <DialogFooter>
                <Button type="submit" disabled={addRoleToEmployeeMutation.isPending}>
                  {addRoleToEmployeeMutation.isPending && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Assign Role
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}