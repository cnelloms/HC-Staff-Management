import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { apiRequest } from "@/lib/queryClient";
import React, { useEffect } from "react";
import { useCurrentUser } from "@/context/user-context";
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
  positionId: z.coerce.number({ required_error: "Job title/position is required" }),
  reportingManagerId: z.coerce.number({ required_error: "Reporting manager is required" }),
  startDate: z.string().min(1, { message: "Start date is required" }),
  departmentId: z.coerce.number({ required_error: "Department is required" }),
  email: z.string().email({ message: "Invalid email address" }).optional(),
  phone: z.string().optional(),
  expectedCompletionDate: z.string().optional(),
  priority: z.enum(["low", "medium", "high"]).default("medium"),
  notes: z.string().optional(),
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
  type: z.enum(["new_staff_request"], {
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
  const { currentUser } = useCurrentUser();

  const { data: employees } = useQuery({
    queryKey: ['/api/employees'],
  });

  const { data: systems } = useQuery({
    queryKey: ['/api/systems'],
  });
  
  const { data: departments } = useQuery({
    queryKey: ['/api/departments'],
  });
  
  const { data: positions } = useQuery({
    queryKey: ['/api/positions'],
  });

  // Determine the initial requestor ID in this order of priority:
  // 1. If employeeId is provided (creating from employee profile), use that
  // 2. If currentUser is available, use that
  // 3. Otherwise, use what's in defaultValues if available
  let initialRequestorId = undefined;
  
  if (employeeId) {
    initialRequestorId = employeeId;
  } else if (currentUser && currentUser.id) {
    initialRequestorId = currentUser.id;
  }
  
  const initialFormValues = {
    ...defaultValues,
    requestorId: initialRequestorId
  };

  const form = useForm<z.infer<typeof ticketFormSchema>>({
    resolver: zodResolver(ticketFormSchema),
    defaultValues: initialFormValues || {
      title: "",
      description: "",
      requestorId: undefined,
      assigneeId: undefined,
      status: "open",
      priority: "medium",
      type: "new_staff_request",
      systemId: undefined,
    },
  });

  const createMutation = useMutation({
    mutationFn: async (values: z.infer<typeof ticketFormSchema>) => {
      return apiRequest("POST", "/api/tickets", values);
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/tickets'] });
      toast({
        title: "Ticket created",
        description: "The ticket has been successfully created.",
      });
      // The API response contains the new ticket directly
      if (data && data.id) {
        navigate(`/tickets/${data.id}`);
      } else {
        // Fallback to tickets page if we can't get the ID for some reason
        navigate('/tickets');
      }
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
    // Prepare form values for submission
    const formData = { ...values };
    
    // For new staff request tickets, validate the required metadata fields
    if (values.type === 'new_staff_request') {
      // Validate required fields for new staff request
      const requiredFields = ['firstName', 'lastName', 'positionId', 'reportingManagerId', 'departmentId', 'startDate'];
      const missingFields = requiredFields.filter(field => !values.metadata?.[field]);
      
      if (missingFields.length > 0) {
        toast({
          title: "Validation Error",
          description: `Please fill in all required staff information fields: ${missingFields.join(', ')}`,
          variant: "destructive",
        });
        return;
      }
      
      // Create a default title if not provided or generic
      if (!values.title || values.title === 'New Staff Request') {
        const firstName = values.metadata.firstName;
        const lastName = values.metadata.lastName;
        
        // Get position title from positionId
        const positionObj = positions?.find(p => p.id === values.metadata.positionId);
        const positionTitle = positionObj ? positionObj.title : "New Position";
        
        formData.title = `New Staff Request: ${firstName} ${lastName} (${positionTitle})`;
      }
      
      // Add checklist items to metadata
      formData.metadata = {
        ...values.metadata,
        checklist: [
          // Account setup
          { task: "Create network user account", completed: false, category: "accounts" },
          { task: "Set up corporate email address", completed: false, category: "accounts" },
          { task: "Configure access permissions", completed: false, category: "accounts" },
          
          // Equipment
          { task: "Prepare workstation/laptop", completed: false, category: "equipment" },
          { task: "Set up phone/extension", completed: false, category: "equipment" },
          { task: "Order and configure mobile device", completed: false, category: "equipment" },
          
          // System access
          { task: "Grant EHR system access", completed: false, category: "systems" },
          { task: "Configure financial system permissions", completed: false, category: "systems" },
          { task: "Set up scheduling system access", completed: false, category: "systems" },
          
          // Onboarding
          { task: "Schedule orientation session", completed: false, category: "onboarding" },
          { task: "Prepare welcome package", completed: false, category: "onboarding" },
          { task: "Assign onboarding buddy", completed: false, category: "onboarding" },
          
          // Communication
          { task: "Notify department team", completed: false, category: "communication" },
          { task: "Inform reporting manager", completed: false, category: "communication" },
          { task: "Add to relevant email groups", completed: false, category: "communication" }
        ],
        progress: 0,
        status: "pending"
      };
    }
    
    if (isEditing) {
      updateMutation.mutate(formData);
    } else {
      createMutation.mutate(formData);
    }
  }

  // Initialize metadata object for new staff request form
  React.useEffect(() => {
    // Initialize metadata object if not already set
    if (!form.getValues().metadata) {
      form.setValue('metadata', {});
    }
  }, [form]);

  // Function to auto-generate title when staff details change
  const updateTitle = (firstName: string, lastName: string) => {
    if (firstName && lastName) {
      form.setValue('title', `New Staff Request for ${firstName} ${lastName}`);
    }
  };

  // Function to auto-generate description based on staff details
  const updateDescription = (metadata: any) => {
    if (!metadata) return;
    
    const firstName = metadata.firstName || '';
    const lastName = metadata.lastName || '';
    const position = positions?.find(p => p.id === metadata.positionId)?.title || '';
    const department = departments?.find(d => d.id === metadata.departmentId)?.name || '';
    const manager = employees?.find(e => e.id === metadata.reportingManagerId);
    const managerName = manager ? `${manager.firstName} ${manager.lastName}` : '';
    const startDate = metadata.startDate ? format(new Date(metadata.startDate), 'PPP') : '';
    
    const description = `
New Staff Request Details:
- Name: ${firstName} ${lastName}
- Position: ${position}
- Department: ${department}
- Reporting Manager: ${managerName}
- Start Date: ${startDate}
${metadata.email ? `- Email: ${metadata.email}` : ''}
${metadata.phone ? `- Phone: ${metadata.phone}` : ''}

This ticket is for onboarding a new staff member. The onboarding process includes:
1. Creating a work email account
2. Generating a secure password
3. Sending login information to the reporting manager
`;
    
    form.setValue('description', description.trim());
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{isEditing ? "Edit Ticket" : "New Staff Request"}</CardTitle>
        <CardDescription>
          {isEditing 
            ? "Update the staff information below." 
            : "Complete this form to request onboarding for a new staff member."}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Hidden fields for internal use */}
            <input type="hidden" {...form.register("type")} value="new_staff_request" />
            
            {/* New Staff Details section - moved to the top */}
            <div className="space-y-6 border border-border rounded-md p-4">
              <h3 className="font-medium text-lg">New Staff Details</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Please provide the details for the new staff member.
              </p>

                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="metadata.firstName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>First Name*</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="Enter first name" 
                            {...field} 
                            onChange={(e) => {
                              field.onChange(e);
                              // Auto-update title when first name changes
                              const lastName = form.getValues().metadata?.lastName || '';
                              updateTitle(e.target.value, lastName);
                              updateDescription({
                                ...form.getValues().metadata,
                                firstName: e.target.value
                              });
                            }}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="metadata.lastName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Last Name*</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="Enter last name" 
                            {...field} 
                            onChange={(e) => {
                              field.onChange(e);
                              // Auto-update title when last name changes
                              const firstName = form.getValues().metadata?.firstName || '';
                              updateTitle(firstName, e.target.value);
                              updateDescription({
                                ...form.getValues().metadata,
                                lastName: e.target.value
                              });
                            }}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="metadata.email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input 
                            type="email" 
                            placeholder="Enter email address (if known)" 
                            {...field} 
                          />
                        </FormControl>
                        <FormDescription>
                          Optional if not yet known
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="metadata.phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Phone Number</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="Enter phone number (if known)" 
                            {...field} 
                          />
                        </FormControl>
                        <FormDescription>
                          Optional if not yet known
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="metadata.positionId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Job Title/Position*</FormLabel>
                        <Select
                          onValueChange={(value) => {
                            field.onChange(parseInt(value));
                            // Update description when position changes
                            updateDescription({
                              ...form.getValues().metadata,
                              positionId: parseInt(value)
                            });
                          }}
                          defaultValue={field.value?.toString()}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select a position" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {Array.isArray(positions) ? positions.map((position: any) => (
                              <SelectItem 
                                key={position.id} 
                                value={position.id.toString()}
                              >
                                {position.title}
                              </SelectItem>
                            )) : (
                              <SelectItem value="loading">Loading positions...</SelectItem>
                            )}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="metadata.departmentId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Department*</FormLabel>
                        <Select
                          onValueChange={(value) => {
                            field.onChange(parseInt(value));
                            // Update description when department changes
                            updateDescription({
                              ...form.getValues().metadata,
                              departmentId: parseInt(value)
                            });
                          }}
                          defaultValue={field.value?.toString()}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select department" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {Array.isArray(departments) ? departments.map((department: any) => (
                              <SelectItem 
                                key={department.id} 
                                value={department.id.toString()}
                              >
                                {department.name}
                              </SelectItem>
                            )) : (
                              <SelectItem value="loading">Loading departments...</SelectItem>
                            )}
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
                    name="metadata.reportingManagerId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Reporting Manager*</FormLabel>
                        <Select
                          onValueChange={(value) => {
                            field.onChange(parseInt(value));
                            // Update description when reporting manager changes
                            updateDescription({
                              ...form.getValues().metadata,
                              reportingManagerId: parseInt(value)
                            });
                          }}
                          defaultValue={field.value?.toString()}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select reporting manager" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {Array.isArray(employees) ? employees.map((employee: any) => (
                              <SelectItem 
                                key={employee.id} 
                                value={employee.id.toString()}
                              >
                                {employee.firstName} {employee.lastName}
                              </SelectItem>
                            )) : (
                              <SelectItem value="loading">Loading employees...</SelectItem>
                            )}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="metadata.startDate"
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel>Start Date*</FormLabel>
                        <Popover>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button
                                variant={"outline"}
                                className={`pl-3 text-left font-normal ${!field.value ? "text-muted-foreground" : ""}`}
                              >
                                {field.value ? (
                                  format(new Date(field.value), "PPP")
                                ) : (
                                  <span>Select start date</span>
                                )}
                                <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                              </Button>
                            </FormControl>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                              mode="single"
                              selected={field.value ? new Date(field.value) : undefined}
                              onSelect={(date) => {
                                const dateValue = date ? date.toISOString() : "";
                                field.onChange(dateValue);
                                // Update description when start date changes
                                updateDescription({
                                  ...form.getValues().metadata,
                                  startDate: dateValue
                                });
                              }}
                              disabled={(date) => date < new Date()}
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>
              
              {/* Hidden fields (requestor, priority, status) */}
              <div className="mt-8 p-4 bg-muted/50 rounded-md">
                <h3 className="font-medium text-sm mb-3">Ticket Information</h3>
                
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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
                          value={field.value?.toString()}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select requestor" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {Array.isArray(employees) ? employees.map((employee: any) => (
                              <SelectItem 
                                key={employee.id} 
                                value={employee.id.toString()}
                              >
                                {employee.firstName} {employee.lastName}
                              </SelectItem>
                            )) : (
                              <SelectItem value="loading">Loading employees...</SelectItem>
                            )}
                          </SelectContent>
                        </Select>
                        <FormDescription>
                          This is automatically set to your account.
                        </FormDescription>
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
                </div>
                
                {/* Hidden form fields for title and description */}
                <input type="hidden" {...form.register("title")} />
                <input type="hidden" {...form.register("description")} />
                <input type="hidden" {...form.register("status")} value="open" />
              </div>
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
          {isEditing ? "Update Staff Request" : "Submit Staff Request"}
        </Button>
      </CardFooter>
    </Card>
  );
}
