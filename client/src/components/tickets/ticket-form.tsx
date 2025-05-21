import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { apiRequest } from "@/lib/queryClient";
import React, { useState } from "react";
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
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Ticket } from "@/types";

interface TicketFormProps {
  ticketId?: number;
  defaultValues?: Partial<Ticket>;
  employeeId?: number;
}

// Define ticket schema - this needs to match what our API expects
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
  priority: z.enum(["low", "medium", "high"]).default("low"),
  // Make sure we only allow these two ticket types in the form, regardless of what's in the API
  type: z.enum(["new_staff_request", "it_support"]),
  systemId: z.coerce.number().optional(),
  metadata: z.any().optional(), // Will contain different structures based on ticket type
});

export function TicketForm({ ticketId, defaultValues, employeeId }: TicketFormProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [, navigate] = useLocation();
  const isEditing = !!ticketId;
  const { currentUser } = useCurrentUser();

  // Determine ticket type - default to staff request
  let initialTicketType = "new_staff_request";

  const [selectedTicketType, setSelectedTicketType] = useState(initialTicketType);

  // Load supporting data
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

  // Determine the initial requestor ID
  let initialRequestorId = undefined;
  
  if (employeeId) {
    initialRequestorId = employeeId;
  } else if (currentUser?.employeeId) {
    initialRequestorId = currentUser.employeeId;
  }
  
  // Set initial form values with default type of "new_staff_request"
  const initialFormValues = {
    requestorId: defaultValues?.requestorId || initialRequestorId || undefined,
    title: defaultValues?.title || "",
    description: defaultValues?.description || "",
    status: defaultValues?.status || "open",
    priority: defaultValues?.priority || "low",
    type: "new_staff_request", // Always start with new staff request type
    systemId: defaultValues?.systemId,
    metadata: defaultValues?.metadata || {}
  };

  // Initialize form
  const form = useForm<z.infer<typeof ticketFormSchema>>({
    resolver: zodResolver(ticketFormSchema),
    defaultValues: initialFormValues,
  });

  // Initialize metadata object if not already set
  React.useEffect(() => {
    if (!form.getValues().metadata) {
      form.setValue('metadata', {});
    }
  }, [form]);

  // Create ticket mutation
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
      // Navigate to the new ticket
      if (data && data.id) {
        navigate(`/tickets/${data.id}`);
      } else {
        navigate('/tickets');
      }
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create ticket. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Update ticket mutation
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
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update ticket. Please try again.",
        variant: "destructive",
      });
    },
  });

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
    const position = positions && positions.find ? positions.find((p: any) => p.id === metadata.positionId)?.title || '' : '';
    const department = departments && departments.find ? departments.find((d: any) => d.id === metadata.departmentId)?.name || '' : '';
    const manager = employees && employees.find ? employees.find((e: any) => e.id === metadata.reportingManagerId) : null;
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

Onboarding Tasks (IT Department):
1. Create work email for new staff (with validation for email format)
2. Generate a secure 12-character password (letters and numbers, human-readable)
3. Copy login information using the provided button for manual sharing

Note: All tasks must be manually marked as complete by the assignee. When all tasks are completed, the ticket will automatically close.
`;
    
    form.setValue('description', description.trim());
  };

  // Form submission handler
  function onSubmit(values: z.infer<typeof ticketFormSchema>) {
    // Prepare form values for submission
    const formData = { ...values };
    
    // Process form data based on ticket type
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
        const positionObj = positions && positions.find ? positions.find((p: any) => p.id === values.metadata.positionId) : null;
        const positionTitle = positionObj ? positionObj.title : "New Position";
        
        formData.title = `New Staff Request: ${firstName} ${lastName} (${positionTitle})`;
      }
      
      // Add simplified onboarding checklist with exactly 3 tasks
      formData.metadata = {
        ...values.metadata,
        checklist: [
          // Only 3 specific tasks for onboarding workflow
          { task: "Create work email for new staff", completed: false, category: "accounts" },
          { task: "Generate a secure 12-character password (letters and numbers, human-readable)", completed: false, category: "accounts" },
          { task: "Provide login information with copy button for manual sharing", completed: false, category: "accounts" }
        ],
        progress: 0,
        status: "pending"
      };
    } 
    else if (values.type === 'it_support') {
      // Validate required fields for IT support ticket
      const requiredFields = ['issueCategory', 'deviceType', 'urgency', 'issueDetails'];
      const missingFields = requiredFields.filter(field => !values.metadata?.[field]);
      
      if (missingFields.length > 0) {
        toast({
          title: "Validation Error",
          description: `Please fill in all required IT support fields: ${missingFields.join(', ')}`,
          variant: "destructive",
        });
        return;
      }
      
      // Create a default title if not provided or generic
      if (!values.title || values.title === 'IT Support Request') {
        const issueCategory = values.metadata.issueCategory;
        const deviceType = values.metadata.deviceType;
        formData.title = `IT Support: ${issueCategory} issue with ${deviceType}`;
      }
      
      // Set the priority based on urgency if not explicitly changed
      if (values.metadata.urgency === 'Critical' && values.priority === 'low') {
        formData.priority = 'high';
      }
      
      // Add IT support checklist tasks
      formData.metadata = {
        ...values.metadata,
        checklist: [
          { task: "Run initial diagnostics", completed: false, category: "support" },
          { task: "Implement solution", completed: false, category: "support" },
          { task: "Verify issue is resolved", completed: false, category: "support" }
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

  return (
    <Card>
      <CardHeader>
        <CardTitle>{isEditing ? "Edit Ticket" : selectedTicketType === "new_staff_request" ? "New Staff Request" : "IT Support Ticket"}</CardTitle>
        <CardDescription>
          {isEditing 
            ? "Update the ticket information below." 
            : selectedTicketType === "new_staff_request" 
              ? "Complete this form to request onboarding for a new staff member."
              : "Complete this form to submit an IT support request."}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Ticket Type Selection */}
            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Ticket Type</FormLabel>
                  <Select
                    onValueChange={(value) => {
                      field.onChange(value);
                      setSelectedTicketType(value as any);
                      
                      // Reset metadata when changing ticket type
                      form.setValue('metadata', {});
                      
                      // Set default title based on selected type
                      if (value === 'new_staff_request') {
                        form.setValue('title', 'New Staff Request');
                      } else if (value === 'it_support') {
                        form.setValue('title', 'IT Support Request');
                      }
                    }}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a ticket type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="new_staff_request">New Staff Request</SelectItem>
                      <SelectItem value="it_support">IT Support</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            {/* Staff Request Form Fields */}
            {selectedTicketType === "new_staff_request" && (
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
                              // Update description
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
                              // Update description
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
                  
                  <FormField
                    control={form.control}
                    name="metadata.email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="Enter email address" 
                            {...field} 
                            onChange={(e) => {
                              field.onChange(e);
                              // Update description
                              updateDescription({
                                ...form.getValues().metadata,
                                email: e.target.value
                              });
                            }}
                          />
                        </FormControl>
                        <FormDescription>Optional - Personal or current email</FormDescription>
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
                            placeholder="Enter phone number" 
                            {...field} 
                            onChange={(e) => {
                              field.onChange(e);
                              // Update description
                              updateDescription({
                                ...form.getValues().metadata,
                                phone: e.target.value
                              });
                            }}
                          />
                        </FormControl>
                        <FormDescription>Optional - Phone contact information</FormDescription>
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
                            // Update description
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
                            {departments?.map((department: any) => (
                              <SelectItem key={department.id} value={department.id.toString()}>
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
                    name="metadata.positionId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Position*</FormLabel>
                        <Select
                          onValueChange={(value) => {
                            field.onChange(parseInt(value));
                            // Update description
                            updateDescription({
                              ...form.getValues().metadata,
                              positionId: parseInt(value)
                            });
                          }}
                          defaultValue={field.value?.toString()}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select position" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {positions?.map((position: any) => (
                              <SelectItem key={position.id} value={position.id.toString()}>
                                {position.title}
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
                    name="metadata.reportingManagerId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Reporting Manager*</FormLabel>
                        <Select
                          onValueChange={(value) => {
                            field.onChange(parseInt(value));
                            // Update description
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
                            {employees?.map((employee: any) => (
                              <SelectItem key={employee.id} value={employee.id.toString()}>
                                {`${employee.firstName} ${employee.lastName}`}
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
                    name="metadata.startDate"
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel>Start Date*</FormLabel>
                        <Popover>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button
                                variant={"outline"}
                                className={!field.value ? "text-muted-foreground" : ""}
                              >
                                {field.value ? (
                                  format(new Date(field.value), "PPP")
                                ) : (
                                  <span>Pick a date</span>
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
                                if (date) {
                                  field.onChange(date.toISOString());
                                  // Update description
                                  updateDescription({
                                    ...form.getValues().metadata,
                                    startDate: date.toISOString()
                                  });
                                }
                              }}
                              disabled={(date) => {
                                const today = new Date();
                                return date < today;
                              }}
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>
                        <FormDescription>
                          The employee's start date (must be in the future)
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <FormField
                  control={form.control}
                  name="metadata.comments"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Additional Comments</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Enter any additional information" 
                          {...field} 
                          className="min-h-[100px]"
                        />
                      </FormControl>
                      <FormDescription>
                        Optional - Include any special requirements or additional information
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            )}
            
            {/* IT Support Form Fields */}
            {selectedTicketType === "it_support" && (
              <div className="space-y-6 border border-border rounded-md p-4">
                <h3 className="font-medium text-lg">IT Support Details</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Please provide the details about your technical issue.
                </p>

                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="metadata.issueCategory"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Issue Category*</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select issue category" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="Hardware">Hardware</SelectItem>
                            <SelectItem value="Software">Software</SelectItem>
                            <SelectItem value="Network">Network</SelectItem>
                            <SelectItem value="Account">Account/Access</SelectItem>
                            <SelectItem value="Email">Email</SelectItem>
                            <SelectItem value="Printer">Printer</SelectItem>
                            <SelectItem value="Other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="metadata.deviceType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Device Type*</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select device type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="Desktop">Desktop Computer</SelectItem>
                            <SelectItem value="Laptop">Laptop</SelectItem>
                            <SelectItem value="Mobile">Mobile Device</SelectItem>
                            <SelectItem value="Tablet">Tablet</SelectItem>
                            <SelectItem value="Printer">Printer/Scanner</SelectItem>
                            <SelectItem value="Other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="metadata.urgency"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Urgency*</FormLabel>
                        <Select
                          onValueChange={(value) => {
                            field.onChange(value);
                            // Adjust priority based on urgency
                            if (value === 'Critical') {
                              form.setValue('priority', 'high');
                            } else if (value === 'High') {
                              form.setValue('priority', 'medium');
                            } else {
                              form.setValue('priority', 'low');
                            }
                          }}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select urgency level" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="Low">Low - Not urgent</SelectItem>
                            <SelectItem value="Medium">Medium - Need assistance soon</SelectItem>
                            <SelectItem value="High">High - Significantly impacts work</SelectItem>
                            <SelectItem value="Critical">Critical - Cannot work at all</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormDescription>
                          This will automatically adjust the ticket priority
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="metadata.deviceId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Device ID/Name</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="Enter device ID or name (if known)" 
                            {...field} 
                          />
                        </FormControl>
                        <FormDescription>Optional - Asset tag or device name</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <FormField
                  control={form.control}
                  name="metadata.issueDetails"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Issue Details*</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Describe what's happening and what you've already tried" 
                          {...field} 
                          className="min-h-[100px]"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="metadata.stepsToReproduce"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Steps to Reproduce</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="List steps to reproduce the issue" 
                          {...field} 
                          className="min-h-[100px]"
                        />
                      </FormControl>
                      <FormDescription>
                        Optional - Provide specific steps to reproduce the issue
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            )}
            
            {/* Common Fields for All Ticket Types */}
            <div className="space-y-6">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Ticket Title</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="Enter a short, descriptive title" 
                        {...field} 
                      />
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
                        placeholder="Enter a detailed description" 
                        {...field} 
                        className="min-h-[150px]"
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
                        onValueChange={(value) => field.onChange(parseInt(value))}
                        defaultValue={field.value?.toString()}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select requestor" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {employees?.map((employee: any) => (
                            <SelectItem key={employee.id} value={employee.id.toString()}>
                              {`${employee.firstName} ${employee.lastName}`}
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
                        onValueChange={(value) => field.onChange(parseInt(value))}
                        defaultValue={field.value?.toString()}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select assignee (optional)" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="">Not assigned</SelectItem>
                          {employees?.map((employee: any) => (
                            <SelectItem key={employee.id} value={employee.id.toString()}>
                              {`${employee.firstName} ${employee.lastName}`}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        Optional - Person responsible for handling this ticket
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
                
                {isEditing && (
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
                )}
                
                {systems && systems.length > 0 && (
                  <FormField
                    control={form.control}
                    name="systemId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>System</FormLabel>
                        <Select
                          onValueChange={(value) => field.onChange(parseInt(value))}
                          defaultValue={field.value?.toString()}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select system (optional)" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="">None</SelectItem>
                            {systems.map((system: any) => (
                              <SelectItem key={system.id} value={system.id.toString()}>
                                {system.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormDescription>
                          Optional - Related system for this ticket
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}
              </div>
            </div>
            
            <div className="flex justify-end gap-2">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => navigate(isEditing ? `/tickets/${ticketId}` : '/tickets')}
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={createMutation.isPending || updateMutation.isPending}
              >
                {(createMutation.isPending || updateMutation.isPending) 
                  ? "Saving..." 
                  : isEditing ? "Update Ticket" : "Create Ticket"}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}