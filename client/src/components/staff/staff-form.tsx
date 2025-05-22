import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { apiRequest } from "@/lib/queryClient";

import { Button } from "@/components/ui/button";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Employee } from "@/types";

interface StaffFormProps {
  employeeId?: number;
  defaultValues?: Partial<Employee>;
}

const employeeFormSchema = z.object({
  firstName: z.string().min(2, {
    message: "First name must be at least 2 characters.",
  }),
  lastName: z.string().min(2, {
    message: "Last name must be at least 2 characters.",
  }),
  email: z.string().email({
    message: "Please enter a valid email address.",
  }),
  phone: z.string().optional(),
  position: z.string().min(1, {
    message: "Position is required.",
  }),
  departmentId: z.coerce.number({
    required_error: "Please select a department.",
  }),
  managerId: z.coerce.number().optional(),
  status: z.enum(["active", "inactive", "onboarding"], {
    required_error: "Please select a status.",
  }),
  avatar: z.string().optional(),
});

export function StaffForm({ employeeId, defaultValues }: StaffFormProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [, navigate] = useLocation();
  const isEditing = !!employeeId;

  const { data: departments = [] } = useQuery<any[]>({
    queryKey: ['/api/departments'],
  });

  const { data: positions = [] } = useQuery<any[]>({
    queryKey: ['/api/positions'],
  });
  
  const { data: employees = [] } = useQuery<any[]>({
    queryKey: ['/api/employees'],
  });

  const form = useForm<z.infer<typeof employeeFormSchema>>({
    resolver: zodResolver(employeeFormSchema),
    defaultValues: {
      firstName: defaultValues?.firstName || "",
      lastName: defaultValues?.lastName || "",
      email: defaultValues?.email || "",
      phone: defaultValues?.phone || "",
      position: defaultValues?.position || "",
      departmentId: defaultValues?.departmentId,
      managerId: defaultValues?.managerId,
      status: defaultValues?.status || "active",
      avatar: defaultValues?.avatar || "",
    },
  });

  const createMutation = useMutation({
    mutationFn: async (values: z.infer<typeof employeeFormSchema>) => {
      return apiRequest("POST", "/api/employees", values);
    },
    onSuccess: async (response) => {
      const data = await response.json();
      queryClient.invalidateQueries({ queryKey: ['/api/employees'] });
      toast({
        title: "Employee created",
        description: "The employee has been successfully created.",
      });
      navigate(`/employee/${data.id}`);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create employee. Please try again.",
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (values: z.infer<typeof employeeFormSchema>) => {
      return apiRequest("PATCH", `/api/employees/${employeeId}`, values);
    },
    onSuccess: async (response) => {
      // Get the updated employee data with ID
      const data = await response.json();
      
      // More targeted approach to cache invalidation
      // First, remove the specific employee from cache to force a fresh fetch
      queryClient.removeQueries({ queryKey: [`/api/employees/${employeeId}`] });
      
      // Then invalidate collections that might contain this employee
      queryClient.invalidateQueries({ queryKey: ['/api/employees'] });
      
      // Make sure to invalidate the activities for this employee
      queryClient.invalidateQueries({ queryKey: [`/api/employees/${employeeId}/activities`] });
      
      // If this employee is also a manager for others, those need to be refreshed too
      queryClient.invalidateQueries({ 
        predicate: (query) => {
          // This will match any query for a specific employee
          return query.queryKey.length > 0 && 
                 typeof query.queryKey[0] === 'string' && 
                 query.queryKey[0].startsWith('/api/employees/');
        }
      });
      
      // Also invalidate any profile data that might be using this employee's data
      queryClient.invalidateQueries({ queryKey: ['/api/auth/user'] });
      queryClient.invalidateQueries({ queryKey: ['/api/profile'] });
      
      // Show success message
      toast({
        title: "Employee updated",
        description: "The employee has been successfully updated.",
      });
      
      // Force a refresh from server before navigating
      await queryClient.refetchQueries({ queryKey: [`/api/employees/${employeeId}`] });
      
      // Navigate to the correct profile page using the employee ID
      navigate(`/employee/${employeeId}`);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update employee. Please try again.",
        variant: "destructive",
      });
    },
  });

  function onSubmit(values: z.infer<typeof employeeFormSchema>) {
    if (isEditing) {
      updateMutation.mutate(values);
    } else {
      createMutation.mutate(values);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{isEditing ? "Edit Employee" : "Add New Employee"}</CardTitle>
        <CardDescription>
          {isEditing 
            ? "Update the employee information below." 
            : "Enter the details to create a new employee."}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="firstName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>First Name</FormLabel>
                    <FormControl>
                      <Input placeholder="John" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="lastName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Last Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Doe" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input placeholder="john.doe@example.com" type="email" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Phone</FormLabel>
                    <FormControl>
                      <Input placeholder="555-123-4567" value={field.value || ""} onChange={field.onChange} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="departmentId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Department</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value?.toString()}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a department" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {Array.isArray(departments) && departments.map((department: any) => (
                          <SelectItem 
                            key={department.id} 
                            value={department.id.toString()}
                          >
                            {department.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="position"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Position</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a position" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {Array.isArray(positions) && positions
                          .map((position: any) => (
                            <SelectItem 
                              key={position.id} 
                              value={position.title}
                            >
                              {position.title}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="managerId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Manager</FormLabel>
                    <Select
                      onValueChange={(value) => {
                        if (value === "none") {
                          field.onChange(null);
                        } else {
                          field.onChange(parseInt(value));
                        }
                      }}
                      value={field.value?.toString() || "none"}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a manager (optional)" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="none">No Manager</SelectItem>
                        {Array.isArray(employees) && employees
                          .filter((e: any) => e.id !== employeeId && e.status === 'active')
                          .map((employee: any) => (
                            <SelectItem 
                              key={employee.id} 
                              value={employee.id.toString()}
                            >
                              {employee.firstName} {employee.lastName}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      The employee's direct manager.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
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
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="inactive">Inactive</SelectItem>
                        <SelectItem value="onboarding">Onboarding</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="avatar"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Avatar URL</FormLabel>
                  <FormControl>
                    <Input placeholder="https://example.com/avatar.jpg" value={field.value || ""} onChange={field.onChange} />
                  </FormControl>
                  <FormDescription>
                    Link to the employee's profile picture.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </form>
        </Form>
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button variant="outline" onClick={() => navigate("/directory")}>
          Cancel
        </Button>
        <Button 
          onClick={form.handleSubmit(onSubmit)}
          disabled={createMutation.isPending || updateMutation.isPending}
        >
          {(createMutation.isPending || updateMutation.isPending) && (
            <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
          )}
          {isEditing ? "Update Employee" : "Create Employee"}
        </Button>
      </CardFooter>
    </Card>
  );
}
