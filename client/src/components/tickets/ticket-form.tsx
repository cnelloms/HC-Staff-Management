import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { apiRequest } from "@/lib/queryClient";
import React from "react";
import { CalendarIcon } from "lucide-react";

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
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
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
import { Ticket } from "@/types";

interface TicketFormProps {
  ticketId?: number;
  defaultValues?: Partial<Ticket>;
  employeeId?: number;
}

const newStaffMetadataSchema = z.object({
  firstName: z.string().min(1, { message: "First name is required" }),
  lastName: z.string().min(1, { message: "Last name is required" }),
  position: z.string().min(1, { message: "Job title/position is required" }),
  reportingManagerId: z.coerce.number({ required_error: "Reporting manager is required" }),
  startDate: z.string().min(1, { message: "Start date is required" }),
  departmentId: z.coerce.number({ required_error: "Department is required" }),
  email: z.string().email({ message: "Invalid email address" }).optional(),
  phone: z.string().optional(),
}).optional();

const ticketFormSchema = z.object({
  title: z.string().min(5, {
    message: "Title must be at least 5 characters.",
  }),
  description: z.string().min(10, {
    message: "Description must be at least 10 characters.",
  }),
  requestorId: z.coerce.number({
    required_error: "Please select a requestor.",
  }),
  assigneeId: z.coerce.number().optional(),
  status: z.enum(["open", "in_progress", "closed"], {
    required_error: "Please select a status.",
  }),
  priority: z.enum(["low", "medium", "high"], {
    required_error: "Please select a priority.",
  }),
  type: z.enum(["system_access", "onboarding", "issue", "request", "new_staff_request"], {
    required_error: "Please select a ticket type.",
  }),
  systemId: z.coerce.number().optional(),
  metadata: z.any().optional(), // Will contain different structures based on ticket type
});

export function TicketForm({ ticketId, defaultValues, employeeId }: TicketFormProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [, navigate] = useLocation();
  const isEditing = !!ticketId;

  const { data: employees } = useQuery({
    queryKey: ['/api/employees'],
  });

  const { data: systems } = useQuery({
    queryKey: ['/api/systems'],
  });

  // If employeeId is provided (creating from employee profile), set as requestor
  const initialFormValues = employeeId 
    ? { ...defaultValues, requestorId: employeeId } 
    : defaultValues;

  const form = useForm<z.infer<typeof ticketFormSchema>>({
    resolver: zodResolver(ticketFormSchema),
    defaultValues: initialFormValues || {
      title: "",
      description: "",
      requestorId: undefined,
      assigneeId: undefined,
      status: "open",
      priority: "medium",
      type: "issue",
      systemId: undefined,
    },
  });

  const createMutation = useMutation({
    mutationFn: async (values: z.infer<typeof ticketFormSchema>) => {
      return apiRequest("POST", "/api/tickets", values);
    },
    onSuccess: async (response) => {
      const data = await response.json();
      queryClient.invalidateQueries({ queryKey: ['/api/tickets'] });
      toast({
        title: "Ticket created",
        description: "The ticket has been successfully created.",
      });
      navigate(`/tickets/${data.id}`);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create ticket. Please try again.",
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (values: z.infer<typeof ticketFormSchema>) => {
      return apiRequest("PATCH", `/api/tickets/${ticketId}`, values);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/tickets'] });
      queryClient.invalidateQueries({ queryKey: [`/api/tickets/${ticketId}`] });
      toast({
        title: "Ticket updated",
        description: "The ticket has been successfully updated.",
      });
      navigate(`/tickets/${ticketId}`);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update ticket. Please try again.",
        variant: "destructive",
      });
    },
  });

  function onSubmit(values: z.infer<typeof ticketFormSchema>) {
    if (isEditing) {
      updateMutation.mutate(values);
    } else {
      createMutation.mutate(values);
    }
  }

  // Get the current ticket type
  const ticketType = form.watch('type');
  
  // Only show system selection for system_access ticket type
  const showSystemField = ticketType === 'system_access';
  
  // Show new staff request fields
  const showNewStaffFields = ticketType === 'new_staff_request';

  // When ticket type changes, handle metadata fields appropriately
  React.useEffect(() => {
    // If changing to new staff request, initialize metadata object
    if (ticketType === 'new_staff_request' && !form.getValues().metadata) {
      form.setValue('metadata', {});
    }
    
    // If switching from new staff request to another type, clean up
    if (ticketType !== 'new_staff_request' && form.getValues().metadata) {
      // Keep other metadata for other ticket types, but remove staff-specific fields
      const metadata = form.getValues().metadata;
      const newMetadata = { ...metadata };
      
      ['firstName', 'lastName', 'position', 'reportingManagerId', 
       'startDate', 'departmentId', 'email', 'phone'].forEach(field => {
        delete newMetadata[field];
      });
      
      form.setValue('metadata', Object.keys(newMetadata).length ? newMetadata : undefined);
    }
  }, [ticketType, form]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>{isEditing ? "Edit Ticket" : "Create New Ticket"}</CardTitle>
        <CardDescription>
          {isEditing 
            ? "Update the ticket information below." 
            : "Enter the details to create a new support ticket."}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Title</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter a concise title" {...field} />
                  </FormControl>
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
                      placeholder="Provide detailed information about the issue or request" 
                      className="min-h-32"
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="requestorId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Requestor</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value?.toString()}
                      disabled={!!employeeId} // Disable if employeeId is provided
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select requestor" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {employees?.map((employee) => (
                          <SelectItem 
                            key={employee.id} 
                            value={employee.id.toString()}
                          >
                            {employee.firstName} {employee.lastName}
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
                name="assigneeId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Assignee</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value?.toString()}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select assignee (optional)" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="">Unassigned</SelectItem>
                        {employees?.map((employee) => (
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
                      Leave unassigned if not yet assigned to anyone.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Ticket Type</FormLabel>
                    <Select
                      onValueChange={(value) => {
                        field.onChange(value);
                        // Clear systemId if not system_access
                        if (value !== 'system_access') {
                          form.setValue('systemId', undefined);
                        }
                      }}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="system_access">System Access</SelectItem>
                        <SelectItem value="onboarding">Onboarding</SelectItem>
                        <SelectItem value="issue">Technical Issue</SelectItem>
                        <SelectItem value="request">General Request</SelectItem>
                        <SelectItem value="new_staff_request">New Staff Request</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="priority"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Priority</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select priority" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="low">Low</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                      </SelectContent>
                    </Select>
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
                        <SelectItem value="open">Open</SelectItem>
                        <SelectItem value="in_progress">In Progress</SelectItem>
                        <SelectItem value="closed">Closed</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {showSystemField && (
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
                          <SelectValue placeholder="Select system for access" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="">No specific system</SelectItem>
                        {systems?.map((system) => (
                          <SelectItem 
                            key={system.id} 
                            value={system.id.toString()}
                          >
                            {system.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      Required for system access requests.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
          </form>
        </Form>
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button variant="outline" onClick={() => navigate("/tickets")}>
          Cancel
        </Button>
        <Button 
          onClick={form.handleSubmit(onSubmit)}
          disabled={createMutation.isPending || updateMutation.isPending}
        >
          {(createMutation.isPending || updateMutation.isPending) && (
            <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
          )}
          {isEditing ? "Update Ticket" : "Create Ticket"}
        </Button>
      </CardFooter>
    </Card>
  );
}
