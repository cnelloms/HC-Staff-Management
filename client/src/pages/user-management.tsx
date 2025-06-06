import { useState, useEffect } from "react";
import { useAuth } from "../hooks/useAuth";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from "@/components/ui/tabs";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
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
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import Layout from "@/components/layout";
import { 
  Shield, 
  UserCog, 
  Settings2, 
  RefreshCw, 
  UserPlus, 
  Key, 
  ToggleLeft,
  CheckCircle,
  XCircle,
  Users,
  Trash2,
  AlertTriangle,
  AlertCircle
} from "lucide-react";
import { queryClient } from "../lib/queryClient";
// Removed impersonation panel import

export default function UserManagementPage() {
  // We can simplify this since AdminRoute handles the auth check
  const { isAdmin } = useAuth();
  
  return (
    <Layout>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">User Management</h1>
          <p className="text-muted-foreground">
            Manage users, authentication methods, and credentials
          </p>
        </div>
      </div>
      
      <Tabs defaultValue="users" className="space-y-4">
        <TabsList>
          <TabsTrigger value="users">
            <UserCog className="h-4 w-4 mr-2" />
            Users
          </TabsTrigger>
          <TabsTrigger value="auth-settings">
            <Settings2 className="h-4 w-4 mr-2" />
            Authentication Settings
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="users" className="space-y-4">
          <UserManagement />
        </TabsContent>
        
        <TabsContent value="auth-settings" className="space-y-4">
          <AuthSettings />
        </TabsContent>
      </Tabs>
    </Layout>
  );
}

function UserManagement() {
  const { toast } = useToast();
  const [isCreateUserDialogOpen, setIsCreateUserDialogOpen] = useState(false);
  
  // Define a user type to properly type the API response
  type User = {
    id: string;
    username: string;
    firstName: string;
    lastName: string;
    email: string;
    authProvider: string;
    isAdmin: boolean;
    isEnabled: boolean;
  };

  // Fetch users with React Query
  const { data, isLoading, error } = useQuery<User[]>({
    queryKey: ['/api/users'],
    staleTime: 1000 * 60 * 5, // 5 minutes
    retry: false
  });
  
  // Ensure users is always an array
  const users = data || [];
  
  // Show error toast if fetching users fails
  useEffect(() => {
    if (error) {
      toast({
        title: "Error",
        description: "Failed to load users",
        variant: "destructive"
      });
    }
  }, [error, toast]);
  
  const handleToggleUserStatus = async (userId: string, isEnabled: boolean) => {
    try {
      const response = await fetch(`/api/users/${userId}/toggle-status`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ isEnabled })
      });
      
      if (response.ok) {
        toast({
          title: "Success",
          description: `User ${isEnabled ? 'enabled' : 'disabled'} successfully`
        });
        
        // Invalidate the users query to refresh the data
        queryClient.invalidateQueries({ queryKey: ['/api/users'] });
      } else {
        throw new Error('Failed to update user status');
      }
    } catch (error) {
      console.error('Error updating user status:', error);
      toast({
        title: "Error",
        description: "Failed to update user status",
        variant: "destructive"
      });
    }
  };
  
  const handleDeleteUser = async (userId: string, userName: string) => {
    try {
      // Close the dialog
      document.querySelector('dialog')?.close();
      
      // Show a loading toast
      toast({
        title: "Deleting user...",
        description: "Please wait while the user is removed from the system"
      });
      
      const response = await fetch(`/api/users/${userId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        toast({
          title: "User Deleted",
          description: `${userName} has been successfully removed from the system`,
          variant: "default"
        });
        
        // Refresh the user list
        queryClient.invalidateQueries({ queryKey: ['/api/users'] });
      } else {
        const data = await response.json();
        throw new Error(data.message || 'Failed to delete user');
      }
    } catch (error: any) {
      console.error('Error deleting user:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to delete user",
        variant: "destructive"
      });
    }
  };
  
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">User Accounts</h2>
        <Dialog open={isCreateUserDialogOpen} onOpenChange={setIsCreateUserDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <UserPlus className="mr-2 h-4 w-4" />
              Create User
            </Button>
          </DialogTrigger>
          <DialogContent>
            <CreateUserForm onSuccess={() => {
              setIsCreateUserDialogOpen(false);
              // Refresh the user list
              queryClient.invalidateQueries({ queryKey: ['/api/users'] });
            }} />
          </DialogContent>
        </Dialog>
      </div>
      
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex justify-center items-center p-6">
              <RefreshCw className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : users.length === 0 ? (
            <div className="text-center p-6 text-muted-foreground">
              No users found. Create one to get started.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Username</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Auth Provider</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((user: any) => (
                  <TableRow key={user.id}>
                    <TableCell>{user.username || '-'}</TableCell>
                    <TableCell>{user.firstName} {user.lastName}</TableCell>
                    <TableCell>{user.email || '-'}</TableCell>
                    <TableCell>
                      {user.authProvider === 'direct' ? 'Username/Password' : 
                       user.authProvider === 'microsoft' ? 'Microsoft' : 
                       user.authProvider === 'replit' ? 'Replit' : 
                       user.authProvider || 'Unknown'}
                    </TableCell>
                    <TableCell>
                      {user.isAdmin ? (
                        <div className="flex items-center text-primary">
                          <Shield className="h-4 w-4 mr-1" />
                          Admin
                        </div>
                      ) : 'User'}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center">
                        {user.authProvider === 'direct' ? (
                          <>
                            <Switch 
                              checked={user.isEnabled !== false} 
                              onCheckedChange={(checked) => handleToggleUserStatus(user.id, checked)}
                            />
                            <span className="ml-2">
                              {user.isEnabled !== false ? 'Active' : 'Disabled'}
                            </span>
                          </>
                        ) : (
                          <span className="flex items-center">
                            <CheckCircle className="h-4 w-4 mr-1 text-green-500" />
                            Active
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        {user.authProvider === 'direct' && (
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <Key className="h-4 w-4 mr-1" />
                                Reset Password
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <ChangePasswordForm userId={user.id} />
                            </DialogContent>
                          </Dialog>
                        )}
                        
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button variant="ghost" size="sm" className="text-red-500 hover:text-red-700 hover:bg-red-50">
                              <Trash2 className="h-4 w-4 mr-1" />
                              Delete
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle className="flex items-center text-red-600">
                                <AlertTriangle className="h-5 w-5 mr-2" />
                                Confirm User Deletion
                              </DialogTitle>
                              <DialogDescription>
                                This action will completely remove the user from the system. This cannot be undone.
                              </DialogDescription>
                            </DialogHeader>
                            
                            <div className="my-4 p-4 border rounded-md bg-amber-50">
                              <h4 className="font-medium mb-2">You're about to delete:</h4>
                              <p><span className="font-medium">User:</span> {user.firstName} {user.lastName}</p>
                              <p><span className="font-medium">Email:</span> {user.email || 'N/A'}</p>
                              <p><span className="font-medium">Username:</span> {user.username || 'N/A'}</p>
                              <p><span className="font-medium">Role:</span> {user.isAdmin ? 'Administrator' : 'Regular User'}</p>
                              {user.employeeId && (
                                <p className="text-amber-700 mt-2">
                                  <AlertCircle className="h-4 w-4 inline mr-1" />
                                  This user has an associated employee record which will be retained.
                                </p>
                              )}
                            </div>
                            
                            <DialogFooter>
                              <Button variant="outline" onClick={() => (document.querySelector('dialog')?.close())}>
                                Cancel
                              </Button>
                              <Button 
                                variant="destructive"
                                onClick={() => handleDeleteUser(user.id, `${user.firstName} ${user.lastName}`)}
                              >
                                Delete User
                              </Button>
                            </DialogFooter>
                          </DialogContent>
                        </Dialog>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function CreateUserForm({ onSuccess }: { onSuccess: () => void }) {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    username: '',
    password: '',
    isAdmin: false,
    departmentId: ''
  });
  
  // Fetch departments for dropdown
  const { data: departments = [] } = useQuery<any[]>({
    queryKey: ['/api/departments'],
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.firstName || !formData.lastName || !formData.email || !formData.username || !formData.password) {
      setError('All fields are required');
      return;
    }
    
    setError(null);
    setIsLoading(true);
    
    try {
      // Create a ticket that will automatically create the staff member and user
      const ticketResponse = await fetch('/api/tickets', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          title: `New User Account - ${formData.firstName} ${formData.lastName}`,
          description: `Create a new user account for ${formData.firstName} ${formData.lastName} with login credentials.`,
          requestorId: 1, // Default to system admin (Sarah Johnson)
          status: 'open',
          priority: 'high',
          type: 'new_staff_request',
          metadata: {
            firstName: formData.firstName,
            lastName: formData.lastName,
            email: formData.email,
            departmentId: formData.departmentId ? parseInt(formData.departmentId) : 1,
            position: "Staff",
            startDate: new Date().toISOString(),
            // Pre-populate with the requested username and password
            requestedUsername: formData.username,
            requestedPassword: formData.password,
            isAdmin: formData.isAdmin
          }
        })
      });
      
      if (!ticketResponse.ok) {
        const data = await ticketResponse.json();
        throw new Error(data.message || 'Failed to create ticket for user');
      }
      
      const ticketData = await ticketResponse.json();
      
      // Immediately close the ticket to trigger the employee/user creation process
      const updateResponse = await fetch(`/api/tickets/${ticketData.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          status: 'closed',
          closedAt: new Date().toISOString(),
          metadata: {
            ...ticketData.metadata,
            // Add required fields for ticket processing
            workEmail: formData.email,
            emailCreated: true,
            passwordGenerated: true,
            loginInfoProvided: true,
            allTasksComplete: true
          }
        })
      });
      
      if (!updateResponse.ok) {
        const data = await updateResponse.json();
        throw new Error(data.message || 'Failed to process user creation ticket');
      }
      
      toast({
        title: "Success",
        description: `User account for ${formData.firstName} ${formData.lastName} has been created successfully`
      });
      
      // Refresh all relevant data
      queryClient.invalidateQueries({ queryKey: ['/api/users'] });
      queryClient.invalidateQueries({ queryKey: ['/api/employees'] });
      queryClient.invalidateQueries({ queryKey: ['/api/tickets'] });
      
      onSuccess();
    } catch (error: any) {
      console.error('Error creating user:', error);
      setError(error.message || 'Failed to create user');
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <>
      <DialogHeader>
        <DialogTitle>Create New User</DialogTitle>
        <DialogDescription>
          Create a new user with direct login credentials
        </DialogDescription>
      </DialogHeader>
      
      <form onSubmit={handleSubmit} className="space-y-4 py-4">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-800 rounded-md p-3 text-sm">
            {error}
          </div>
        )}
        
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="firstName">First Name</Label>
            <Input
              id="firstName"
              value={formData.firstName}
              onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="lastName">Last Name</Label>
            <Input
              id="lastName"
              value={formData.lastName}
              onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
            />
          </div>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="username">Username</Label>
          <Input
            id="username"
            value={formData.username}
            onChange={(e) => setFormData({ ...formData, username: e.target.value })}
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            type="password"
            value={formData.password}
            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="departmentId">Department</Label>
          <select 
            id="departmentId"
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            value={formData.departmentId}
            onChange={(e) => setFormData({ ...formData, departmentId: e.target.value })}
          >
            <option value="">Select a department</option>
            {departments.map((department: any) => (
              <option key={department.id} value={department.id}>
                {department.name}
              </option>
            ))}
          </select>
        </div>
        
        <div className="flex items-center space-x-2">
          <Switch
            id="isAdmin"
            checked={formData.isAdmin}
            onCheckedChange={(checked) => setFormData({ ...formData, isAdmin: checked })}
          />
          <Label htmlFor="isAdmin" className="font-normal">Admin privileges</Label>
        </div>
        
        <DialogFooter>
          <Button type="submit" disabled={isLoading}>
            {isLoading ? (
              <>
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                Creating...
              </>
            ) : (
              'Create User'
            )}
          </Button>
        </DialogFooter>
      </form>
    </>
  );
}

function ChangePasswordForm({ userId }: { userId: string }) {
  const [formData, setFormData] = useState({
    newPassword: '',
    confirmPassword: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.newPassword) {
      setError('New password is required');
      return;
    }
    
    if (formData.newPassword !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    
    setError(null);
    setIsLoading(true);
    
    try {
      // Use the admin route directly for more reliable password changes
      const response = await fetch(`/api/admin/users/${userId}/pass`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ newPassword: formData.newPassword })
      });
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Failed to change password');
      }
      
      toast({
        title: "Success",
        description: "Password changed successfully"
      });
      
      // Reset form
      setFormData({
        newPassword: '',
        confirmPassword: ''
      });
    } catch (error: any) {
      console.error('Error changing password:', error);
      setError(error.message || 'Failed to change password');
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <>
      <DialogHeader>
        <DialogTitle>Change Password</DialogTitle>
        <DialogDescription>
          Set a new password for this user
        </DialogDescription>
      </DialogHeader>
      
      <form onSubmit={handleSubmit} className="space-y-4 py-4">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-800 rounded-md p-3 text-sm">
            {error}
          </div>
        )}
        
        <div className="space-y-2">
          <Label htmlFor="newPassword">New Password</Label>
          <Input
            id="newPassword"
            type="password"
            value={formData.newPassword}
            onChange={(e) => setFormData({ ...formData, newPassword: e.target.value })}
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="confirmPassword">Confirm Password</Label>
          <Input
            id="confirmPassword"
            type="password"
            value={formData.confirmPassword}
            onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
          />
        </div>
        
        <DialogFooter>
          <Button type="submit" disabled={isLoading}>
            {isLoading ? (
              <>
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                Updating...
              </>
            ) : (
              'Save Password'
            )}
          </Button>
        </DialogFooter>
      </form>
    </>
  );
}

function AuthSettings() {
  const [settings, setSettings] = useState({
    directLoginEnabled: true,
    microsoftLoginEnabled: false,
    replitLoginEnabled: false
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();
  
  // Fetch auth settings
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        setIsLoading(true);
        const response = await fetch('/api/auth/settings');
        if (response.ok) {
          const data = await response.json();
          setSettings({
            directLoginEnabled: data.directLoginEnabled ?? true,
            microsoftLoginEnabled: data.microsoftLoginEnabled ?? false,
            replitLoginEnabled: data.replitLoginEnabled ?? false
          });
        } else {
          throw new Error('Failed to fetch authentication settings');
        }
      } catch (error) {
        console.error('Error fetching auth settings:', error);
        toast({
          title: "Error",
          description: "Failed to load authentication settings",
          variant: "destructive"
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchSettings();
  }, [toast]);
  
  const handleSaveSettings = async () => {
    try {
      setIsSaving(true);
      const response = await fetch('/api/auth/settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(settings)
      });
      
      if (response.ok) {
        toast({
          title: "Success",
          description: "Authentication settings updated successfully"
        });
      } else {
        throw new Error('Failed to update authentication settings');
      }
    } catch (error) {
      console.error('Error updating auth settings:', error);
      toast({
        title: "Error",
        description: "Failed to update authentication settings",
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };
  
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Authentication Settings</h2>
        <p className="text-muted-foreground">
          Configure which authentication methods are available for users
        </p>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Login Methods</CardTitle>
          <CardDescription>
            Enable or disable different authentication methods
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {isLoading ? (
            <div className="flex justify-center">
              <RefreshCw className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between py-2">
                <div>
                  <h3 className="font-medium">Username/Password</h3>
                  <p className="text-sm text-muted-foreground">
                    Allow users to log in with a username and password
                  </p>
                </div>
                <Switch
                  checked={settings.directLoginEnabled}
                  onCheckedChange={(checked) => setSettings({ ...settings, directLoginEnabled: checked })}
                />
              </div>
              
              <div className="flex items-center justify-between py-2">
                <div>
                  <h3 className="font-medium">Microsoft Entra ID</h3>
                  <p className="text-sm text-muted-foreground">
                    Allow users to log in with their Microsoft account (Coming Soon)
                  </p>
                </div>
                <Switch
                  checked={settings.microsoftLoginEnabled}
                  onCheckedChange={(checked) => setSettings({ ...settings, microsoftLoginEnabled: checked })}
                  disabled={true}
                />
              </div>
            </>
          )}
        </CardContent>
        <CardFooter>
          <Button onClick={handleSaveSettings} disabled={isLoading || isSaving}>
            {isSaving ? (
              <>
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              'Save Settings'
            )}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}