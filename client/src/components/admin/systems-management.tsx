import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { 
  Trash2, 
  Plus, 
  Edit, 
  RefreshCcw,
  Server,
  Search
} from "lucide-react";

const systemSchema = z.object({
  name: z.string().min(1, { message: "System name is required" }),
  description: z.string().min(1, { message: "Description is required" }),
  category: z.string().min(1, { message: "Category is required" }),
});

type SystemFormValues = z.infer<typeof systemSchema>;

export function SystemsManagement() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedSystem, setSelectedSystem] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState("");

  // Fetch systems
  const { data: systems, isLoading } = useQuery({
    queryKey: ['/api/systems'],
    queryFn: async () => {
      const response = await fetch('/api/systems');
      if (!response.ok) {
        throw new Error('Failed to fetch systems');
      }
      return await response.json();
    }
  });

  // Form for adding/editing systems
  const form = useForm<SystemFormValues>({
    resolver: zodResolver(systemSchema),
    defaultValues: {
      name: "",
      description: "",
      category: "",
    }
  });

  // Reset form when dialog opens/closes
  const resetForm = () => {
    form.reset({
      name: "",
      description: "",
      category: "",
    });
    setSelectedSystem(null);
  };

  // Load selected system into form
  const editSystem = (system: any) => {
    setSelectedSystem(system);
    form.reset({
      name: system.name,
      description: system.description,
      category: system.category,
    });
    setIsDialogOpen(true);
  };

  // Add/Edit system mutation
  const addEditMutation = useMutation({
    mutationFn: async (values: SystemFormValues) => {
      if (selectedSystem) {
        // Edit existing system
        return await apiRequest('PATCH', `/api/systems/${selectedSystem.id}`, values);
      } else {
        // Add new system
        return await apiRequest('POST', '/api/systems', values);
      }
    },
    onSuccess: () => {
      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['/api/systems'] });

      // Show success toast
      toast({
        title: selectedSystem ? "System updated" : "System added",
        description: selectedSystem 
          ? "System has been updated successfully" 
          : "System has been added successfully",
      });

      // Close dialog and reset form
      setIsDialogOpen(false);
      resetForm();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to save system",
        variant: "destructive",
      });
    }
  });

  // Delete system mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      return await apiRequest('DELETE', `/api/systems/${id}`);
    },
    onSuccess: () => {
      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['/api/systems'] });

      toast({
        title: "System deleted",
        description: "System has been deleted successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete system. It may be in use by employees.",
        variant: "destructive",
      });
    }
  });

  // Handle form submission
  const onSubmit = (values: SystemFormValues) => {
    addEditMutation.mutate(values);
  };

  // Generate system icon based on category
  const getSystemIcon = (category: string) => {
    switch (category?.toLowerCase()) {
      case 'hr':
        return <Avatar className="h-8 w-8 bg-blue-100 text-blue-600"><AvatarFallback>HR</AvatarFallback></Avatar>;
      case 'finance':
        return <Avatar className="h-8 w-8 bg-green-100 text-green-600"><AvatarFallback>FN</AvatarFallback></Avatar>;
      case 'communication':
        return <Avatar className="h-8 w-8 bg-purple-100 text-purple-600"><AvatarFallback>CM</AvatarFallback></Avatar>;
      case 'sales':
        return <Avatar className="h-8 w-8 bg-yellow-100 text-yellow-600"><AvatarFallback>SL</AvatarFallback></Avatar>;
      case 'operations':
        return <Avatar className="h-8 w-8 bg-orange-100 text-orange-600"><AvatarFallback>OP</AvatarFallback></Avatar>;
      default:
        return <Avatar className="h-8 w-8 bg-gray-100 text-gray-600"><AvatarFallback>SY</AvatarFallback></Avatar>;
    }
  };

  // Filter systems based on search query
  const filteredSystems = systems?.filter((system: any) => {
    const searchLower = searchQuery.toLowerCase();
    return (
      system.name.toLowerCase().includes(searchLower) ||
      system.description.toLowerCase().includes(searchLower) ||
      system.category.toLowerCase().includes(searchLower)
    );
  });

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">System Management</h2>
        <Button 
          onClick={() => {
            resetForm();
            setIsDialogOpen(true);
          }}
          className="flex items-center"
          size="sm"
        >
          <Plus className="mr-2 h-4 w-4" />
          Add System
        </Button>
      </div>

      <div className="relative">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search systems..."
          className="pl-8"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center p-8">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
        </div>
      ) : !systems || systems.length === 0 ? (
        <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-8 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-muted">
            <Server className="h-6 w-6 text-muted-foreground" />
          </div>
          <h3 className="mt-4 text-lg font-medium">No Systems Found</h3>
          <p className="mt-2 text-sm text-muted-foreground">
            No systems have been added yet.
          </p>
          <Button
            className="mt-4"
            onClick={() => {
              resetForm();
              setIsDialogOpen(true);
            }}
          >
            Add System
          </Button>
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>System</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Description</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredSystems.map((system: any) => (
              <TableRow key={system.id}>
                <TableCell>
                  <div className="flex items-center gap-3">
                    {getSystemIcon(system.category)}
                    <div className="font-medium">{system.name}</div>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant="outline" className="capitalize">
                    {system.category}
                  </Badge>
                </TableCell>
                <TableCell>{system.description}</TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 gap-1 px-2"
                      onClick={() => editSystem(system)}
                      disabled={addEditMutation.isPending}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 gap-1 px-2 text-red-700 dark:text-red-400"
                      title="Delete"
                      onClick={() => deleteMutation.mutate(system.id)}
                      disabled={deleteMutation.isPending}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      {/* Add/Edit System Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[550px]">
          <DialogHeader>
            <DialogTitle>{selectedSystem ? "Edit System" : "Add System"}</DialogTitle>
            <DialogDescription>
              {selectedSystem
                ? "Update system details"
                : "Add a new system to the management platform"}
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              {/* System Name */}
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>System Name</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Enter system name" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Category */}
              <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Category</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="e.g., hr, finance, operations" />
                    </FormControl>
                    <FormDescription>
                      Common categories: hr, finance, communication, sales, operations
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Description */}
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Enter system description" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={addEditMutation.isPending}>
                  {addEditMutation.isPending && (
                    <RefreshCcw className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  {selectedSystem ? "Update" : "Add"} System
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}