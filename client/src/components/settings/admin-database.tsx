import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

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
import { Button } from "@/components/ui/button";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
  PlusCircle, 
  Save, 
  Edit, 
  Trash2, 
  Loader2,
  Database,
  Building,
  Briefcase,
  ShieldAlert
} from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// Define schemas for different database entities
const departmentSchema = z.object({
  id: z.number().optional(),
  name: z.string().min(2, "Name is required and must be at least 2 characters"),
  description: z.string().optional(),
  managerId: z.number().optional(),
});

const positionSchema = z.object({
  id: z.number().optional(),
  title: z.string().min(2, "Title is required and must be at least 2 characters"),
  description: z.string().optional(),
  departmentId: z.coerce.number({
    required_error: "Department is required",
  }),
});

const systemSchema = z.object({
  id: z.number().optional(),
  name: z.string().min(2, "Name is required and must be at least 2 characters"),
  description: z.string().optional(),
  category: z.string().optional(),
});

// Types derived from schema
type DepartmentFormValues = z.infer<typeof departmentSchema>;
type PositionFormValues = z.infer<typeof positionSchema>;
type SystemFormValues = z.infer<typeof systemSchema>;

export function AdminDatabaseSettings() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [currentTab, setCurrentTab] = useState("departments");
  
  // State for edit/create dialogs
  const [departmentDialogOpen, setDepartmentDialogOpen] = useState(false);
  const [positionDialogOpen, setPositionDialogOpen] = useState(false);
  const [systemDialogOpen, setSystemDialogOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  
  // State for current item being edited
  const [currentDepartment, setCurrentDepartment] = useState<DepartmentFormValues | null>(null);
  const [currentPosition, setCurrentPosition] = useState<PositionFormValues | null>(null);
  const [currentSystem, setCurrentSystem] = useState<SystemFormValues | null>(null);
  
  // State for position filtering
  const [filteredDepartmentId, setFilteredDepartmentId] = useState<number | null>(null);
  
  // Setup query hooks for fetching data
  const { 
    data: departments, 
    isLoading: isDepartmentsLoading 
  } = useQuery({
    queryKey: ['/api/departments'],
  });
  
  const { 
    data: positions, 
    isLoading: isPositionsLoading 
  } = useQuery({
    queryKey: ['/api/positions'],
  });
  
  const { 
    data: systems, 
    isLoading: isSystemsLoading 
  } = useQuery({
    queryKey: ['/api/systems'],
  });
  
  // Get employees for manager selection
  const {
    data: employees,
    isLoading: isEmployeesLoading
  } = useQuery({
    queryKey: ['/api/employees'],
  });
  
  // Setup form hooks for department, position, and system
  const departmentForm = useForm<DepartmentFormValues>({
    resolver: zodResolver(departmentSchema),
    defaultValues: {
      name: "",
      description: "",
      managerId: undefined,
    },
  });
  
  const positionForm = useForm<PositionFormValues>({
    resolver: zodResolver(positionSchema),
    defaultValues: {
      title: "",
      description: "",
      departmentId: undefined,
    },
  });
  
  const systemForm = useForm<SystemFormValues>({
    resolver: zodResolver(systemSchema),
    defaultValues: {
      name: "",
      description: "",
      category: "",
    },
  });
  
  // Reset form when opening dialog in create mode
  const openCreateDepartmentDialog = () => {
    departmentForm.reset({
      name: "",
      description: "",
    });
    setCurrentDepartment(null);
    setIsEditMode(false);
    setDepartmentDialogOpen(true);
  };
  
  const openCreatePositionDialog = () => {
    positionForm.reset({
      title: "",
      description: "",
      departmentId: undefined,
    });
    setCurrentPosition(null);
    setIsEditMode(false);
    setPositionDialogOpen(true);
  };
  
  const openCreateSystemDialog = () => {
    systemForm.reset({
      name: "",
      description: "",
      category: "",
    });
    setCurrentSystem(null);
    setIsEditMode(false);
    setSystemDialogOpen(true);
  };
  
  // Open dialog in edit mode with current item data
  const openEditDepartmentDialog = (department: any) => {
    departmentForm.reset(department);
    setCurrentDepartment(department);
    setIsEditMode(true);
    setDepartmentDialogOpen(true);
  };
  
  const openEditPositionDialog = (position: any) => {
    positionForm.reset(position);
    setCurrentPosition(position);
    setIsEditMode(true);
    setPositionDialogOpen(true);
  };
  
  const openEditSystemDialog = (system: any) => {
    systemForm.reset(system);
    setCurrentSystem(system);
    setIsEditMode(true);
    setSystemDialogOpen(true);
  };
  
  // Mutations for creating/updating data
  const departmentMutation = useMutation({
    mutationFn: async (data: DepartmentFormValues) => {
      if (isEditMode && currentDepartment?.id) {
        return apiRequest("PATCH", `/api/departments/${currentDepartment.id}`, data);
      }
      return apiRequest("POST", "/api/departments", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/departments'] });
      toast({
        title: isEditMode ? "Department updated" : "Department created",
        description: isEditMode
          ? "The department has been updated successfully."
          : "A new department has been created.",
      });
      setDepartmentDialogOpen(false);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to save department. Please try again.",
        variant: "destructive",
      });
    },
  });
  
  const positionMutation = useMutation({
    mutationFn: async (data: PositionFormValues) => {
      if (isEditMode && currentPosition?.id) {
        return apiRequest("PATCH", `/api/positions/${currentPosition.id}`, data);
      }
      return apiRequest("POST", "/api/positions", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/positions'] });
      toast({
        title: isEditMode ? "Position updated" : "Position created",
        description: isEditMode
          ? "The position has been updated successfully."
          : "A new position has been created.",
      });
      setPositionDialogOpen(false);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to save position. Please try again.",
        variant: "destructive",
      });
    },
  });
  
  const systemMutation = useMutation({
    mutationFn: async (data: SystemFormValues) => {
      if (isEditMode && currentSystem?.id) {
        return apiRequest("PATCH", `/api/systems/${currentSystem.id}`, data);
      }
      return apiRequest("POST", "/api/systems", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/systems'] });
      toast({
        title: isEditMode ? "System updated" : "System created",
        description: isEditMode
          ? "The system has been updated successfully."
          : "A new system has been created.",
      });
      setSystemDialogOpen(false);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to save system. Please try again.",
        variant: "destructive",
      });
    },
  });
  
  // Form submission handlers
  const onDepartmentSubmit = (data: DepartmentFormValues) => {
    departmentMutation.mutate(data);
  };
  
  const onPositionSubmit = (data: PositionFormValues) => {
    positionMutation.mutate(data);
  };
  
  const onSystemSubmit = (data: SystemFormValues) => {
    systemMutation.mutate(data);
  };
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Database Management</h2>
          <p className="text-muted-foreground">
            Manage core database records for departments, positions, and systems
          </p>
        </div>
        
        <Alert className="max-w-xs">
          <ShieldAlert className="h-4 w-4" />
          <AlertTitle>Admin access only</AlertTitle>
          <AlertDescription>
            Changes here affect the entire system
          </AlertDescription>
        </Alert>
      </div>
      
      <Tabs value={currentTab} onValueChange={setCurrentTab}>
        <TabsList className="grid grid-cols-3 w-full max-w-md">
          <TabsTrigger value="departments">
            <Building className="mr-2 h-4 w-4" />
            Departments
          </TabsTrigger>
          <TabsTrigger value="positions">
            <Briefcase className="mr-2 h-4 w-4" />
            Positions
          </TabsTrigger>
          <TabsTrigger value="systems">
            <Database className="mr-2 h-4 w-4" />
            Systems
          </TabsTrigger>
        </TabsList>
        
        {/* Departments Tab */}
        <TabsContent value="departments">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div>
                <CardTitle>Departments</CardTitle>
                <CardDescription>
                  Manage organization departments and their descriptions
                </CardDescription>
              </div>
              <Button onClick={openCreateDepartmentDialog}>
                <PlusCircle className="mr-2 h-4 w-4" />
                Add Department
              </Button>
            </CardHeader>
            <CardContent>
              {isDepartmentsLoading ? (
                <div className="flex justify-center items-center h-64">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : (
                <ScrollArea className="h-[400px]">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>ID</TableHead>
                        <TableHead>Name</TableHead>
                        <TableHead>Description</TableHead>
                        <TableHead>Manager</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {Array.isArray(departments) && departments.length > 0 ? (
                        departments.map((department: any) => {
                          // Find manager for this department
                          const manager = Array.isArray(employees) 
                            ? employees.find(emp => emp.id === department.managerId)
                            : null;
                          
                          return (
                            <TableRow key={department.id}>
                              <TableCell className="font-medium">{department.id}</TableCell>
                              <TableCell>{department.name}</TableCell>
                              <TableCell>{department.description || "—"}</TableCell>
                              <TableCell>
                                {manager 
                                  ? `${manager.firstName} ${manager.lastName}`
                                  : "—"}
                              </TableCell>
                              <TableCell className="text-right">
                                <Button 
                                  variant="ghost" 
                                  size="icon"
                                  onClick={() => openEditDepartmentDialog(department)}
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                              </TableCell>
                            </TableRow>
                          );
                        })
                      ) : (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center">
                            No departments found. Add one to get started.
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </ScrollArea>
              )}
            </CardContent>
          </Card>
          
          {/* Department Edit/Create Dialog */}
          <Dialog open={departmentDialogOpen} onOpenChange={setDepartmentDialogOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>
                  {isEditMode ? "Edit Department" : "Create Department"}
                </DialogTitle>
                <DialogDescription>
                  {isEditMode
                    ? "Update the department details below."
                    : "Enter the details for the new department."}
                </DialogDescription>
              </DialogHeader>
              
              <Form {...departmentForm}>
                <form onSubmit={departmentForm.handleSubmit(onDepartmentSubmit)} className="space-y-4">
                  <FormField
                    control={departmentForm.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Department Name*</FormLabel>
                        <FormControl>
                          <Input placeholder="HR, Finance, IT, etc." {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={departmentForm.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Description</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="Brief description of this department" 
                            {...field} 
                            value={field.value || ""}
                          />
                        </FormControl>
                        <FormDescription>
                          Optional: Provide a brief description of this department
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={departmentForm.control}
                    name="managerId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Department Manager</FormLabel>
                        <Select
                          onValueChange={(value) => field.onChange(value ? parseInt(value) : undefined)}
                          value={field.value?.toString()}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select a department manager" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="">None</SelectItem>
                            {Array.isArray(employees) && employees.length > 0
                              ? employees
                                .filter(employee => employee.status === 'active')
                                .map((employee) => (
                                  <SelectItem 
                                    key={employee.id} 
                                    value={employee.id.toString()}
                                  >
                                    {employee.firstName} {employee.lastName} - {employee.position}
                                  </SelectItem>
                                ))
                              : <SelectItem value="" disabled>No active employees found</SelectItem>
                            }
                          </SelectContent>
                        </Select>
                        <FormDescription>
                          Optional: Select an employee to manage this department
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <DialogFooter>
                    <Button 
                      variant="outline" 
                      type="button" 
                      onClick={() => setDepartmentDialogOpen(false)}
                    >
                      Cancel
                    </Button>
                    <Button 
                      type="submit"
                      disabled={departmentMutation.isPending}
                    >
                      {departmentMutation.isPending ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        <>
                          <Save className="mr-2 h-4 w-4" />
                          {isEditMode ? "Update" : "Create"}
                        </>
                      )}
                    </Button>
                  </DialogFooter>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </TabsContent>
        
        {/* Positions Tab */}
        <TabsContent value="positions">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div>
                <CardTitle>Job Positions</CardTitle>
                <CardDescription>
                  Manage organizational positions/job titles
                </CardDescription>
              </div>
              <div className="flex space-x-2">
                <Select
                  onValueChange={(value) => setFilteredDepartmentId(value ? parseInt(value) : null)}
                  value={filteredDepartmentId?.toString() || ""}
                >
                  <SelectTrigger className="w-[200px]">
                    <SelectValue placeholder="Filter by department" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All Departments</SelectItem>
                    {Array.isArray(departments) && departments.map((dept: any) => (
                      <SelectItem key={dept.id} value={dept.id.toString()}>
                        {dept.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button onClick={openCreatePositionDialog}>
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Add Position
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {isPositionsLoading ? (
                <div className="flex justify-center items-center h-64">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : (
                <ScrollArea className="h-[400px]">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>ID</TableHead>
                        <TableHead>Title</TableHead>
                        <TableHead>Department</TableHead>
                        <TableHead>Description</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {Array.isArray(positions) && positions.length > 0 ? (
                        positions
                          .filter((position: any) => 
                            filteredDepartmentId === null || 
                            position.departmentId === filteredDepartmentId
                          )
                          .map((position: any) => (
                          <TableRow key={position.id}>
                            <TableCell className="font-medium">{position.id}</TableCell>
                            <TableCell>{position.title}</TableCell>
                            <TableCell>
                              {Array.isArray(departments) && 
                                departments.find((d: any) => d.id === position.departmentId)?.name || 
                                "—"}
                            </TableCell>
                            <TableCell>{position.description || "—"}</TableCell>
                            <TableCell className="text-right">
                              <Button 
                                variant="ghost" 
                                size="icon"
                                onClick={() => openEditPositionDialog(position)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center">
                            No positions found. Add one to get started.
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </ScrollArea>
              )}
            </CardContent>
          </Card>
          
          {/* Position Edit/Create Dialog */}
          <Dialog open={positionDialogOpen} onOpenChange={setPositionDialogOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>
                  {isEditMode ? "Edit Position" : "Create Position"}
                </DialogTitle>
                <DialogDescription>
                  {isEditMode
                    ? "Update the position details below."
                    : "Enter the details for the new position."}
                </DialogDescription>
              </DialogHeader>
              
              <Form {...positionForm}>
                <form onSubmit={positionForm.handleSubmit(onPositionSubmit)} className="space-y-4">
                  <FormField
                    control={positionForm.control}
                    name="title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Position Title*</FormLabel>
                        <FormControl>
                          <Input placeholder="Manager, Developer, etc." {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={positionForm.control}
                    name="departmentId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Department*</FormLabel>
                        <Select 
                          onValueChange={(value) => field.onChange(parseInt(value))}
                          defaultValue={field.value?.toString()}
                          value={field.value?.toString()}
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
                    control={positionForm.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Description</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="Brief description of this position" 
                            {...field} 
                            value={field.value || ""}
                          />
                        </FormControl>
                        <FormDescription>
                          Optional: Provide a brief description of this position
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <DialogFooter>
                    <Button 
                      variant="outline" 
                      type="button" 
                      onClick={() => setPositionDialogOpen(false)}
                    >
                      Cancel
                    </Button>
                    <Button 
                      type="submit"
                      disabled={positionMutation.isPending}
                    >
                      {positionMutation.isPending ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        <>
                          <Save className="mr-2 h-4 w-4" />
                          {isEditMode ? "Update" : "Create"}
                        </>
                      )}
                    </Button>
                  </DialogFooter>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </TabsContent>
        
        {/* Systems Tab */}
        <TabsContent value="systems">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div>
                <CardTitle>Systems</CardTitle>
                <CardDescription>
                  Manage company systems, software, and applications
                </CardDescription>
              </div>
              <Button onClick={openCreateSystemDialog}>
                <PlusCircle className="mr-2 h-4 w-4" />
                Add System
              </Button>
            </CardHeader>
            <CardContent>
              {isSystemsLoading ? (
                <div className="flex justify-center items-center h-64">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : (
                <ScrollArea className="h-[400px]">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>ID</TableHead>
                        <TableHead>Name</TableHead>
                        <TableHead>Category</TableHead>
                        <TableHead>Description</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {Array.isArray(systems) && systems.length > 0 ? (
                        systems.map((system: any) => (
                          <TableRow key={system.id}>
                            <TableCell className="font-medium">{system.id}</TableCell>
                            <TableCell>{system.name}</TableCell>
                            <TableCell>{system.category || "—"}</TableCell>
                            <TableCell>{system.description || "—"}</TableCell>
                            <TableCell className="text-right">
                              <Button 
                                variant="ghost" 
                                size="icon"
                                onClick={() => openEditSystemDialog(system)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center">
                            No systems found. Add one to get started.
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </ScrollArea>
              )}
            </CardContent>
          </Card>
          
          {/* System Edit/Create Dialog */}
          <Dialog open={systemDialogOpen} onOpenChange={setSystemDialogOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>
                  {isEditMode ? "Edit System" : "Create System"}
                </DialogTitle>
                <DialogDescription>
                  {isEditMode
                    ? "Update the system details below."
                    : "Enter the details for the new system."}
                </DialogDescription>
              </DialogHeader>
              
              <Form {...systemForm}>
                <form onSubmit={systemForm.handleSubmit(onSystemSubmit)} className="space-y-4">
                  <FormField
                    control={systemForm.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>System Name*</FormLabel>
                        <FormControl>
                          <Input placeholder="Company Portal, HR Database, etc." {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={systemForm.control}
                    name="category"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Category</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="HR, Finance, IT, etc." 
                            {...field} 
                            value={field.value || ""}
                          />
                        </FormControl>
                        <FormDescription>
                          Optional: Group similar systems by category
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={systemForm.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Description</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="Brief description of this system" 
                            {...field} 
                            value={field.value || ""}
                          />
                        </FormControl>
                        <FormDescription>
                          Optional: Provide a brief description of this system
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <DialogFooter>
                    <Button 
                      variant="outline" 
                      type="button" 
                      onClick={() => setSystemDialogOpen(false)}
                    >
                      Cancel
                    </Button>
                    <Button 
                      type="submit"
                      disabled={systemMutation.isPending}
                    >
                      {systemMutation.isPending ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        <>
                          <Save className="mr-2 h-4 w-4" />
                          {isEditMode ? "Update" : "Create"}
                        </>
                      )}
                    </Button>
                  </DialogFooter>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </TabsContent>
      </Tabs>
    </div>
  );
}