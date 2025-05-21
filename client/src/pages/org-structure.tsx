import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Layout from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { z } from "zod";
import { Pencil, Plus, Trash2, Loader2, Building2 } from "lucide-react";

/**
 * Organizational Structure Management Page
 * Admin section for managing departments, positions, and business units
 */
export default function OrgStructurePage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("departments");
  const [isAddDepartmentOpen, setIsAddDepartmentOpen] = useState(false);
  const [isAddPositionOpen, setIsAddPositionOpen] = useState(false);
  const [isEditDepartmentOpen, setIsEditDepartmentOpen] = useState(false);
  const [isEditPositionOpen, setIsEditPositionOpen] = useState(false);
  const [currentDepartment, setCurrentDepartment] = useState<any>(null);
  const [currentPosition, setCurrentPosition] = useState<any>(null);

  // Form schema for department
  const departmentFormSchema = z.object({
    name: z.string().min(2, { message: "Department name must be at least 2 characters" }),
    description: z.string().optional(),
    businessUnit: z.string().optional(),
    managerId: z.number().optional().nullable()
  });

  // Form schema for position
  const positionFormSchema = z.object({
    title: z.string().min(2, { message: "Position title must be at least 2 characters" }),
    description: z.string().optional(),
    departmentId: z.number({ required_error: "Please select a department" })
  });

  // Get departments data
  const { data: departments, isLoading: isLoadingDepartments } = useQuery({
    queryKey: ['/api/departments'],
    retry: 1,
    refetchOnWindowFocus: false
  });

  // Get positions data
  const { data: positions, isLoading: isLoadingPositions } = useQuery({
    queryKey: ['/api/positions'],
    retry: 1,
    refetchOnWindowFocus: false
  });

  // Get employees data for manager selection
  const { data: employees, isLoading: isLoadingEmployees } = useQuery({
    queryKey: ['/api/employees'],
    retry: 1,
    refetchOnWindowFocus: false
  });

  // Add department mutation
  const addDepartmentMutation = useMutation({
    mutationFn: (data: any) => {
      return apiRequest("POST", "/api/departments", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/departments'] });
      setIsAddDepartmentOpen(false);
      toast({
        title: "Department Added",
        description: "The department has been added successfully."
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to add department.",
        variant: "destructive"
      });
    }
  });

  // Update department mutation
  const updateDepartmentMutation = useMutation({
    mutationFn: (data: any) => {
      return apiRequest("PATCH", `/api/departments/${data.id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/departments'] });
      setIsEditDepartmentOpen(false);
      toast({
        title: "Department Updated",
        description: "The department has been updated successfully."
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update department.",
        variant: "destructive"
      });
    }
  });

  // Delete department mutation
  const deleteDepartmentMutation = useMutation({
    mutationFn: (id: number) => {
      return apiRequest("DELETE", `/api/departments/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/departments'] });
      toast({
        title: "Department Deleted",
        description: "The department has been deleted successfully."
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete department. It may be in use by employees or positions.",
        variant: "destructive"
      });
    }
  });

  // Add position mutation
  const addPositionMutation = useMutation({
    mutationFn: (data: any) => {
      return apiRequest("POST", "/api/positions", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/positions'] });
      setIsAddPositionOpen(false);
      toast({
        title: "Position Added",
        description: "The position has been added successfully."
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to add position.",
        variant: "destructive"
      });
    }
  });

  // Update position mutation
  const updatePositionMutation = useMutation({
    mutationFn: (data: any) => {
      return apiRequest("PATCH", `/api/positions/${data.id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/positions'] });
      setIsEditPositionOpen(false);
      toast({
        title: "Position Updated",
        description: "The position has been updated successfully."
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update position.",
        variant: "destructive"
      });
    }
  });

  // Delete position mutation
  const deletePositionMutation = useMutation({
    mutationFn: (id: number) => {
      return apiRequest("DELETE", `/api/positions/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/positions'] });
      toast({
        title: "Position Deleted",
        description: "The position has been deleted successfully."
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete position. It may be in use by employees.",
        variant: "destructive"
      });
    }
  });

  // Department form
  const departmentForm = useForm<z.infer<typeof departmentFormSchema>>({
    resolver: zodResolver(departmentFormSchema),
    defaultValues: {
      name: "",
      description: "",
      businessUnit: "",
      managerId: null
    }
  });

  // Edit department form
  const editDepartmentForm = useForm<z.infer<typeof departmentFormSchema>>({
    resolver: zodResolver(departmentFormSchema),
    defaultValues: {
      name: "",
      description: "",
      businessUnit: "",
      managerId: null
    }
  });

  // Position form
  const positionForm = useForm<z.infer<typeof positionFormSchema>>({
    resolver: zodResolver(positionFormSchema),
    defaultValues: {
      title: "",
      description: "",
      departmentId: undefined
    }
  });

  // Edit position form
  const editPositionForm = useForm<z.infer<typeof positionFormSchema>>({
    resolver: zodResolver(positionFormSchema),
    defaultValues: {
      title: "",
      description: "",
      departmentId: undefined
    }
  });

  // Handle department form submission
  const onSubmitDepartment = (values: z.infer<typeof departmentFormSchema>) => {
    addDepartmentMutation.mutate(values);
  };

  // Handle edit department form submission
  const onSubmitEditDepartment = (values: z.infer<typeof departmentFormSchema>) => {
    if (!currentDepartment) return;
    updateDepartmentMutation.mutate({ ...values, id: currentDepartment.id });
  };

  // Handle position form submission
  const onSubmitPosition = (values: z.infer<typeof positionFormSchema>) => {
    addPositionMutation.mutate(values);
  };

  // Handle edit position form submission
  const onSubmitEditPosition = (values: z.infer<typeof positionFormSchema>) => {
    if (!currentPosition) return;
    updatePositionMutation.mutate({ ...values, id: currentPosition.id });
  };

  // Handle edit department button click
  const handleEditDepartment = (department: any) => {
    setCurrentDepartment(department);
    editDepartmentForm.reset({
      name: department.name,
      description: department.description || "",
      businessUnit: department.businessUnit || "",
      managerId: department.managerId
    });
    setIsEditDepartmentOpen(true);
  };

  // Handle edit position button click
  const handleEditPosition = (position: any) => {
    setCurrentPosition(position);
    editPositionForm.reset({
      title: position.title,
      description: position.description || "",
      departmentId: position.departmentId
    });
    setIsEditPositionOpen(true);
  };

  // Handle delete department button click
  const handleDeleteDepartment = (id: number) => {
    if (window.confirm("Are you sure you want to delete this department? This action cannot be undone.")) {
      deleteDepartmentMutation.mutate(id);
    }
  };

  // Handle delete position button click
  const handleDeletePosition = (id: number) => {
    if (window.confirm("Are you sure you want to delete this position? This action cannot be undone.")) {
      deletePositionMutation.mutate(id);
    }
  };

  // Get manager name by ID
  const getManagerName = (managerId: number | null | undefined) => {
    if (!managerId || !employees) return "None";
    const manager = employees.find((emp: any) => emp.id === managerId);
    return manager ? `${manager.firstName} ${manager.lastName}` : "None";
  };

  // Get department name by ID
  const getDepartmentName = (departmentId: number | undefined) => {
    if (!departmentId || !departments) return "Unknown";
    const department = departments.find((dept: any) => dept.id === departmentId);
    return department ? department.name : "Unknown";
  };

  return (
    <Layout title="Organization Structure">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Organization Structure</h1>
            <p className="text-muted-foreground">
              Manage departments, positions, and business units
            </p>
          </div>
          <Button variant="outline" asChild>
            <a href="/settings">Back to Settings</a>
          </Button>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="departments">Departments</TabsTrigger>
            <TabsTrigger value="positions">Positions</TabsTrigger>
          </TabsList>

          {/* Departments Tab */}
          <TabsContent value="departments" className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold">Departments</h2>
              <Dialog open={isAddDepartmentOpen} onOpenChange={setIsAddDepartmentOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="mr-2 h-4 w-4" />
                    Add Department
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Add New Department</DialogTitle>
                    <DialogDescription>
                      Create a new department for your organization.
                    </DialogDescription>
                  </DialogHeader>
                  <Form {...departmentForm}>
                    <form onSubmit={departmentForm.handleSubmit(onSubmitDepartment)} className="space-y-4">
                      <FormField
                        control={departmentForm.control}
                        name="name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Name</FormLabel>
                            <FormControl>
                              <Input placeholder="Department name" {...field} />
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
                              <Input placeholder="Department description" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={departmentForm.control}
                        name="businessUnit"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Business Unit</FormLabel>
                            <FormControl>
                              <Input placeholder="Business unit" {...field} />
                            </FormControl>
                            <FormDescription>
                              The business unit this department belongs to
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
                              onValueChange={(value) => field.onChange(value ? parseInt(value) : null)}
                              value={field.value?.toString() || ""}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select a manager" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="">None</SelectItem>
                                {employees?.map((employee: any) => (
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
                      <DialogFooter>
                        <Button
                          type="submit"
                          disabled={addDepartmentMutation.isPending}
                        >
                          {addDepartmentMutation.isPending ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Saving...
                            </>
                          ) : (
                            "Add Department"
                          )}
                        </Button>
                      </DialogFooter>
                    </form>
                  </Form>
                </DialogContent>
              </Dialog>
            </div>

            {isLoadingDepartments ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : departments?.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <Building2 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-lg font-medium">No departments found</p>
                  <p className="text-muted-foreground mb-4">
                    Create your first department to get started
                  </p>
                  <Button onClick={() => setIsAddDepartmentOpen(true)}>
                    <Plus className="mr-2 h-4 w-4" />
                    Add Department
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Business Unit</TableHead>
                    <TableHead>Manager</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {departments?.map((department: any) => (
                    <TableRow key={department.id}>
                      <TableCell className="font-medium">{department.id}</TableCell>
                      <TableCell>{department.name}</TableCell>
                      <TableCell>{department.description || "-"}</TableCell>
                      <TableCell>{department.businessUnit || "-"}</TableCell>
                      <TableCell>{getManagerName(department.managerId)}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEditDepartment(department)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDeleteDepartment(department.id)}
                            disabled={deleteDepartmentMutation.isPending}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}

            {/* Edit Department Dialog */}
            <Dialog open={isEditDepartmentOpen} onOpenChange={setIsEditDepartmentOpen}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Edit Department</DialogTitle>
                  <DialogDescription>
                    Update department information.
                  </DialogDescription>
                </DialogHeader>
                <Form {...editDepartmentForm}>
                  <form onSubmit={editDepartmentForm.handleSubmit(onSubmitEditDepartment)} className="space-y-4">
                    <FormField
                      control={editDepartmentForm.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Name</FormLabel>
                          <FormControl>
                            <Input placeholder="Department name" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={editDepartmentForm.control}
                      name="description"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Description</FormLabel>
                          <FormControl>
                            <Input placeholder="Department description" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={editDepartmentForm.control}
                      name="businessUnit"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Business Unit</FormLabel>
                          <FormControl>
                            <Input placeholder="Business unit" {...field} />
                          </FormControl>
                          <FormDescription>
                            The business unit this department belongs to
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={editDepartmentForm.control}
                      name="managerId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Department Manager</FormLabel>
                          <Select
                            onValueChange={(value) => field.onChange(value ? parseInt(value) : null)}
                            value={field.value?.toString() || ""}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select a manager" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="">None</SelectItem>
                              {employees?.map((employee: any) => (
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
                    <DialogFooter>
                      <Button
                        type="submit"
                        disabled={updateDepartmentMutation.isPending}
                      >
                        {updateDepartmentMutation.isPending ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Saving...
                          </>
                        ) : (
                          "Save Changes"
                        )}
                      </Button>
                    </DialogFooter>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          </TabsContent>

          {/* Positions Tab */}
          <TabsContent value="positions" className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold">Positions</h2>
              <Dialog open={isAddPositionOpen} onOpenChange={setIsAddPositionOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="mr-2 h-4 w-4" />
                    Add Position
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Add New Position</DialogTitle>
                    <DialogDescription>
                      Create a new position in your organization.
                    </DialogDescription>
                  </DialogHeader>
                  <Form {...positionForm}>
                    <form onSubmit={positionForm.handleSubmit(onSubmitPosition)} className="space-y-4">
                      <FormField
                        control={positionForm.control}
                        name="title"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Title</FormLabel>
                            <FormControl>
                              <Input placeholder="Position title" {...field} />
                            </FormControl>
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
                              <Input placeholder="Position description" {...field} />
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
                            <FormLabel>Department</FormLabel>
                            <Select
                              onValueChange={(value) => field.onChange(parseInt(value))}
                              value={field.value?.toString() || ""}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select a department" />
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
                      <DialogFooter>
                        <Button
                          type="submit"
                          disabled={addPositionMutation.isPending}
                        >
                          {addPositionMutation.isPending ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Saving...
                            </>
                          ) : (
                            "Add Position"
                          )}
                        </Button>
                      </DialogFooter>
                    </form>
                  </Form>
                </DialogContent>
              </Dialog>
            </div>

            {isLoadingPositions ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : positions?.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <Building2 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-lg font-medium">No positions found</p>
                  <p className="text-muted-foreground mb-4">
                    Create your first position to get started
                  </p>
                  <Button onClick={() => setIsAddPositionOpen(true)}>
                    <Plus className="mr-2 h-4 w-4" />
                    Add Position
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Title</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Department</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {positions?.map((position: any) => (
                    <TableRow key={position.id}>
                      <TableCell className="font-medium">{position.id}</TableCell>
                      <TableCell>{position.title}</TableCell>
                      <TableCell>{position.description || "-"}</TableCell>
                      <TableCell>{getDepartmentName(position.departmentId)}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEditPosition(position)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDeletePosition(position.id)}
                            disabled={deletePositionMutation.isPending}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}

            {/* Edit Position Dialog */}
            <Dialog open={isEditPositionOpen} onOpenChange={setIsEditPositionOpen}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Edit Position</DialogTitle>
                  <DialogDescription>
                    Update position information.
                  </DialogDescription>
                </DialogHeader>
                <Form {...editPositionForm}>
                  <form onSubmit={editPositionForm.handleSubmit(onSubmitEditPosition)} className="space-y-4">
                    <FormField
                      control={editPositionForm.control}
                      name="title"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Title</FormLabel>
                          <FormControl>
                            <Input placeholder="Position title" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={editPositionForm.control}
                      name="description"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Description</FormLabel>
                          <FormControl>
                            <Input placeholder="Position description" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={editPositionForm.control}
                      name="departmentId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Department</FormLabel>
                          <Select
                            onValueChange={(value) => field.onChange(parseInt(value))}
                            value={field.value?.toString() || ""}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select a department" />
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
                    <DialogFooter>
                      <Button
                        type="submit"
                        disabled={updatePositionMutation.isPending}
                      >
                        {updatePositionMutation.isPending ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Saving...
                          </>
                        ) : (
                          "Save Changes"
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
    </Layout>
  );
}