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
import { SystemAccess } from "@/types";

interface AccessFormProps {
  accessId?: number;
  defaultValues?: Partial<SystemAccess>;
  employeeId?: number;
}

const accessFormSchema = z.object({
  employeeId: z.coerce.number({
    required_error: "Please select an employee.",
  }),
  systemId: z.coerce.number({
    required_error: "Please select a system.",
  }),
  accessLevel: z.enum(["read", "write", "admin"], {
    required_error: "Please select an access level.",
  }),
});

export function AccessForm({ accessId, defaultValues, employeeId }: AccessFormProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [, navigate] = useLocation();
  const isEditing = !!accessId;

  const { data: employees } = useQuery({
    queryKey: ['/api/employees'],
  });

  const { data: systems } = useQuery({
    queryKey: ['/api/systems'],
  });

  // If employeeId is provided, set as employee
  const initialFormValues = employeeId 
    ? { ...defaultValues, employeeId } 
    : defaultValues;

  const form = useForm<z.infer<typeof accessFormSchema>>({
    resolver: zodResolver(accessFormSchema),
    defaultValues: initialFormValues || {
      employeeId: undefined,
      systemId: undefined,
      accessLevel: "read",
    },
  });

  const createMutation = useMutation({
    mutationFn: async (values: z.infer<typeof accessFormSchema>) => {
      // New access requests start as pending
      const requestData = {
        ...values,
        granted: false,
        status: 'pending'
      };
      return apiRequest("POST", "/api/system-access", requestData);
    },
    onSuccess: async () => {
      queryClient.invalidateQueries({ queryKey: ['/api/system-access'] });
      toast({
        title: "Access request submitted",
        description: "The system access request has been successfully submitted.",
      });
      navigate("/access-management");
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to submit access request. Please try again.",
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (values: z.infer<typeof accessFormSchema>) => {
      return apiRequest("PATCH", `/api/system-access/${accessId}`, values);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/system-access'] });
      toast({
        title: "Access updated",
        description: "The system access has been successfully updated.",
      });
      navigate("/access-management");
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update access. Please try again.",
        variant: "destructive",
      });
    },
  });

  function onSubmit(values: z.infer<typeof accessFormSchema>) {
    if (isEditing) {
      updateMutation.mutate(values);
    } else {
      createMutation.mutate(values);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{isEditing ? "Edit System Access" : "Request System Access"}</CardTitle>
        <CardDescription>
          {isEditing 
            ? "Update system access permissions." 
            : "Submit a request for system access."}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="employeeId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Employee</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value?.toString()}
                    disabled={!!employeeId} // Disable if employeeId is provided
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select employee" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {employees?.map((employee) => (
                        <SelectItem 
                          key={employee.id} 
                          value={employee.id.toString()}
                        >
                          {employee.firstName} {employee.lastName} - {employee.position}
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
              name="systemId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>System</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value?.toString()}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select system" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {systems?.map((system) => (
                        <SelectItem 
                          key={system.id} 
                          value={system.id.toString()}
                        >
                          {system.name} {system.description ? `- ${system.description}` : ''}
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
                      <SelectItem value="read">Read Only</SelectItem>
                      <SelectItem value="write">Read/Write</SelectItem>
                      <SelectItem value="admin">Administrator</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    <ul className="list-disc pl-5 text-xs mt-2">
                      <li>Read Only: Can view information but not modify</li>
                      <li>Read/Write: Can view and modify information</li>
                      <li>Administrator: Complete access including configuration</li>
                    </ul>
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </form>
        </Form>
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button variant="outline" onClick={() => navigate("/access-management")}>
          Cancel
        </Button>
        <Button 
          onClick={form.handleSubmit(onSubmit)}
          disabled={createMutation.isPending || updateMutation.isPending}
        >
          {(createMutation.isPending || updateMutation.isPending) && (
            <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
          )}
          {isEditing ? "Update Access" : "Submit Request"}
        </Button>
      </CardFooter>
    </Card>
  );
}
