import { useState, useEffect } from "react";
import { useAuth } from "../hooks/useAuth";
import { useLocation } from "wouter";
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
import { Shield, UserCog, Settings2, RefreshCw, UserPlus, Key, ToggleLeft } from "lucide-react";

export default function UserManagementPage() {
  const { isAuthenticated, isAdmin } = useAuth();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  
  // Redirect if not authenticated or not an admin
  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/login");
    } else if (!isAdmin) {
      toast({
        title: "Access Denied",
        description: "You don't have permission to access this page",
        variant: "destructive"
      });
      navigate("/");
    }
  }, [isAuthenticated, isAdmin, navigate, toast]);
  
  if (!isAuthenticated || !isAdmin) {
    return null;
  }
  
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
  const [users, setUsers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  const [isCreateUserDialogOpen, setIsCreateUserDialogOpen] = useState(false);
  
  // Fetch users
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setIsLoading(true);
        const response = await fetch('/api/users');
        if (response.ok) {
          const data = await response.json();
          setUsers(data);
        } else {
          throw new Error('Failed to fetch users');
        }
      } catch (error) {
        console.error('Error fetching users:', error);
        toast({
          title: "Error",
          description: "Failed to load users",
          variant: "destructive"
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchUsers();
  }, [toast]);
  
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
        
        // Update the local state
        setUsers(users.map(user => 
          user.id === userId ? { ...user, isEnabled } : user
        ));
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
              window.location.reload();
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
                {users.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>{user.username || '-'}</TableCell>
                    <TableCell>{user.firstName} {user.lastName}</TableCell>
                    <TableCell>{user.email || '-'}</TableCell>
                    <TableCell>
                      {user.authProvider === 'direct' ? 'Username/Password' : 
                       user.authProvider === 'microsoft' ? 'Microsoft' : 
                       user.authProvider === 'replit' ? 'Replit' : user.authProvider}
                    </TableCell>
                    <TableCell>{user.isAdmin ? 'Admin' : 'User'}</TableCell>
                    <TableCell>
                      <div className="flex items-center">
                        <Switch 
                          checked={user.isEnabled !== false} 
                          onCheckedChange={(checked) => handleToggleUserStatus(user.id, checked)}
                          disabled={user.authProvider !== 'direct'}
                        />
                        <span className="ml-2">
                          {user.isEnabled !== false ? 'Active' : 'Disabled'}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
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
    isAdmin: false
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
      const response = await fetch('/api/users/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Failed to create user');
      }
      
      toast({
        title: "Success",
        description: "User created successfully"
      });
      
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
      const response = await fetch(`/api/users/${userId}/change-password`, {
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
    replitLoginEnabled: true
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
            directLoginEnabled: data.directLoginEnabled,
            microsoftLoginEnabled: data.microsoftLoginEnabled,
            replitLoginEnabled: data.replitLoginEnabled
          });
        } else {
          throw new Error('Failed to fetch authentication settings');
        }
      } catch (error) {
        console.error('Error fetching settings:', error);
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
      console.error('Error saving settings:', error);
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
    <Card>
      <CardHeader>
        <CardTitle>Authentication Methods</CardTitle>
        <CardDescription>
          Configure which authentication methods are available for users
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {isLoading ? (
          <div className="flex justify-center items-center py-4">
            <RefreshCw className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="directLogin">Username & Password</Label>
                <p className="text-sm text-muted-foreground">
                  Allow users to log in with username and password
                </p>
              </div>
              <Switch
                id="directLogin"
                checked={settings.directLoginEnabled}
                onCheckedChange={(checked) => setSettings({ ...settings, directLoginEnabled: checked })}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="microsoftLogin">Microsoft Authentication</Label>
                <p className="text-sm text-muted-foreground">
                  Allow users to log in with Microsoft Entra ID
                </p>
              </div>
              <Switch
                id="microsoftLogin"
                checked={settings.microsoftLoginEnabled}
                onCheckedChange={(checked) => setSettings({ ...settings, microsoftLoginEnabled: checked })}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="replitLogin">Replit Authentication</Label>
                <p className="text-sm text-muted-foreground">
                  Allow users to log in with Replit
                </p>
              </div>
              <Switch
                id="replitLogin"
                checked={settings.replitLoginEnabled}
                onCheckedChange={(checked) => setSettings({ ...settings, replitLoginEnabled: checked })}
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
  );
}