import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { apiRequest } from "@/lib/queryClient";
import React, { useState } from "react";
import { useCurrentUser } from "@/context/user-context";

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

// Define ticket schema - simplified
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
  type: z.enum(["new_staff_request", "it_support"]),
  systemId: z.coerce.number().optional(),
  metadata: z.any().optional(),
});

export function TicketForm({ ticketId, defaultValues, employeeId }: TicketFormProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [, navigate] = useLocation();
  const isEditing = !!ticketId;
  const { currentUser } = useCurrentUser();

  // Simple ticket type state
  const [selectedTicketType, setSelectedTicketType] = useState<"new_staff_request" | "it_support">("new_staff_request");

  // Load supporting data
  const { data: employees = [] } = useQuery({
    queryKey: ['/api/employees'],
  });

  const { data: systems = [] } = useQuery({
    queryKey: ['/api/systems'],
  });
  
  const { data: departments = [] } = useQuery({
    queryKey: ['/api/departments'],
  });
  
  const { data: positions = [] } = useQuery({
    queryKey: ['/api/positions'],
  });

  // Determine the initial requestor ID
  let initialRequestorId = undefined;
  
  if (employeeId) {
    initialRequestorId = employeeId;
  } else if (currentUser?.id) {
    initialRequestorId = currentUser.id;
  }
  
  // Set default form values
  const initialFormValues = {
    requestorId: defaultValues?.requestorId || initialRequestorId || undefined,
    title: defaultValues?.title || "",
    description: defaultValues?.description || "",
    status: defaultValues?.status || "open",
    priority: defaultValues?.priority || "low",
    type: "new_staff_request" as const,
    systemId: defaultValues?.systemId,
    metadata: defaultValues?.metadata || {}
  };

  // Initialize form
  const form = useForm<z.infer<typeof ticketFormSchema>>({
    resolver: zodResolver(ticketFormSchema),
    defaultValues: initialFormValues,
  });

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

  // Generate staff request title and description
  const updateStaffRequestDetails = (metadata: any) => {
    if (!metadata) return;
    
    const firstName = metadata.firstName || '';
    const lastName = metadata.lastName || '';
    
    // Find position title
    let positionTitle = '';
    if (metadata.positionId && positions && Array.isArray(positions)) {
      const position = positions.find((p: any) => p.id === metadata.positionId);
      if (position) positionTitle = position.title;
    }
    
    // Find department name
    let departmentName = '';
    if (metadata.departmentId && departments && Array.isArray(departments)) {
      const department = departments.find((d: any) => d.id === metadata.departmentId);
      if (department) departmentName = department.name;
    }
    
    // Find manager name
    let managerName = '';
    if (metadata.reportingManagerId && employees && Array.isArray(employees)) {
      const manager = employees.find((e: any) => e.id === metadata.reportingManagerId);
      if (manager) managerName = `${manager.firstName} ${manager.lastName}`;
    }
    
    const startDate = metadata.startDate ? format(new Date(metadata.startDate), 'PPP') : '';
    
    if (firstName && lastName) {
      form.setValue('title', `New Staff Request: ${firstName} ${lastName} (${positionTitle})`);
    
      const description = `
New Staff Request Details:
- Name: ${firstName} ${lastName}
- Position: ${positionTitle}
- Department: ${departmentName}
- Reporting Manager: ${managerName}
- Start Date: ${startDate}
${metadata.email ? `- Email: ${metadata.email}` : ''}
${metadata.phone ? `- Phone: ${metadata.phone}` : ''}
${metadata.budgetCodeId ? `- Budget/Cost Code: ${metadata.budgetCodeId}` : ''}
${metadata.equipmentRequested ? `- Equipment Requested: Yes` : '- Equipment Requested: No'}
${metadata.systemAccessRequests && metadata.systemAccessRequests.length > 0 ? `- System Access Requested: Yes` : ''}

Onboarding Tasks (IT Department):
1. Create work email for new staff (with validation for email format)
2. Generate a secure 12-character password (letters and numbers, human-readable)
3. Copy login information using the provided button for manual sharing

Note: All tasks must be manually marked as complete by the assignee. When all tasks are completed, the ticket will automatically close.
`;
      
      form.setValue('description', description.trim());
    }
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
        let positionTitle = "New Position";
        if (positions && Array.isArray(positions)) {
          const positionObj = positions.find((p: any) => p.id === values.metadata.positionId);
          if (positionObj) positionTitle = positionObj.title;
        }
        
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
                    onValueChange={(value: "new_staff_request" | "it_support") => {
                      field.onChange(value);
                      setSelectedTicketType(value);
                      
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
                              updateStaffRequestDetails({
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
                              updateStaffRequestDetails({
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
                            type="email"
                            placeholder="Enter email address"
                            {...field}
                            onChange={(e) => {
                              field.onChange(e);
                              updateStaffRequestDetails({
                                ...form.getValues().metadata,
                                email: e.target.value
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
                    name="metadata.phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Phone</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Enter phone number"
                            {...field}
                            onChange={(e) => {
                              field.onChange(e);
                              updateStaffRequestDetails({
                                ...form.getValues().metadata,
                                phone: e.target.value
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
                    name="metadata.positionId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Position*</FormLabel>
                        <Select
                          onValueChange={(value) => {
                            field.onChange(parseInt(value));
                            updateStaffRequestDetails({
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
                            {Array.isArray(positions) && positions.map((position: any) => (
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
                    name="metadata.departmentId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Department*</FormLabel>
                        <Select
                          onValueChange={(value) => {
                            field.onChange(parseInt(value));
                            updateStaffRequestDetails({
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
                            {Array.isArray(departments) && departments.map((department: any) => (
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
                    name="metadata.reportingManagerId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Reporting Manager*</FormLabel>
                        <Select
                          onValueChange={(value) => {
                            field.onChange(parseInt(value));
                            updateStaffRequestDetails({
                              ...form.getValues().metadata,
                              reportingManagerId: parseInt(value)
                            });
                          }}
                          defaultValue={field.value?.toString()}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select manager" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {Array.isArray(employees) && employees.map((employee: any) => (
                              <SelectItem key={employee.id} value={employee.id.toString()}>
                                {employee.firstName} {employee.lastName} {employee.position ? `(${employee.position})` : ''}
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
                                className={`pl-3 text-left font-normal ${
                                  !field.value ? "text-muted-foreground" : ""
                                }`}
                              >
                                {field.value ? (
                                  format(new Date(field.value), "PPP")
                                ) : (
                                  <span>Pick a date</span>
                                )}
                              </Button>
                            </FormControl>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                              mode="single"
                              selected={field.value ? new Date(field.value) : undefined}
                              onSelect={(date) => {
                                field.onChange(date);
                                if (date) {
                                  updateStaffRequestDetails({
                                    ...form.getValues().metadata,
                                    startDate: date.toISOString()
                                  });
                                }
                              }}
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <FormField
                  control={form.control}
                  name="metadata.additionalNotes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Additional Notes</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Enter any additional details or requirements..."
                          className="min-h-24"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            )}
            
            {/* IT Support Request Form Fields */}
            {selectedTicketType === "it_support" && (
              <div className="space-y-6 border border-border rounded-md p-4">
                <h3 className="font-medium text-lg">IT Support Details</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Please provide details about the IT issue you're experiencing.
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
                              <SelectValue placeholder="Select category" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="Hardware">Hardware</SelectItem>
                            <SelectItem value="Software">Software</SelectItem>
                            <SelectItem value="Network">Network</SelectItem>
                            <SelectItem value="Email">Email</SelectItem>
                            <SelectItem value="Account">Account/Access</SelectItem>
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
                              <SelectValue placeholder="Select device" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="Desktop">Desktop PC</SelectItem>
                            <SelectItem value="Laptop">Laptop</SelectItem>
                            <SelectItem value="Mobile">Mobile Phone</SelectItem>
                            <SelectItem value="Tablet">Tablet</SelectItem>
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
                    name="metadata.urgency"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Urgency*</FormLabel>
                        <Select
                          onValueChange={(value) => {
                            field.onChange(value);
                            // Auto-set the priority based on urgency
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
                              <SelectValue placeholder="Select urgency" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="Low">Low - No rush</SelectItem>
                            <SelectItem value="Medium">Medium - Within 24-48 hours</SelectItem>
                            <SelectItem value="High">High - Within 24 hours</SelectItem>
                            <SelectItem value="Critical">Critical - ASAP (business critical)</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormDescription>
                          This will automatically set the priority level.
                        </FormDescription>
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
                          placeholder="Please describe the issue in detail. Include what you were doing when the issue occurred, any error messages, and steps you've already tried."
                          className="min-h-24"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="metadata.reproducibility"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Can you reproduce the issue?</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select option" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="Always">Always</SelectItem>
                          <SelectItem value="Sometimes">Sometimes</SelectItem>
                          <SelectItem value="Rarely">Rarely</SelectItem>
                          <SelectItem value="Once">Happened once</SelectItem>
                          <SelectItem value="Unknown">Not sure</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="metadata.stepsTaken"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Steps Already Taken</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="What steps have you already taken to try to resolve the issue? (e.g., restarted device, reinstalled application)"
                          className="min-h-16"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            )}

            {/* Common fields for all ticket types */}
            <div className="space-y-6">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Ticket Title</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter ticket title" {...field} />
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
                    <FormLabel>Ticket Description</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Enter detailed description" className="min-h-32" {...field} />
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
                          {Array.isArray(employees) && employees.map((employee: any) => (
                            <SelectItem key={employee.id} value={employee.id.toString()}>
                              {employee.firstName} {employee.lastName}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                {isEditing && (
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
                              <SelectValue placeholder="Select assignee" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="">Not assigned</SelectItem>
                            {Array.isArray(employees) && employees.map((employee: any) => (
                              <SelectItem key={employee.id} value={employee.id.toString()}>
                                {employee.firstName} {employee.lastName}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}
                
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
            </div>
            
            <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
              {createMutation.isPending || updateMutation.isPending ? (
                <span>Processing...</span>
              ) : isEditing ? (
                <span>Update Ticket</span>
              ) : (
                <span>Create Ticket</span>
              )}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}