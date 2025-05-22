import { useState, useEffect } from "react";
import { AuthOptions } from "@/components/auth/auth-options";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, Loader2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useLocation } from "wouter";
import { queryClient } from "../lib/queryClient";

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { isAuthenticated } = useAuth();
  const [, navigate] = useLocation();

  // Redirect to dashboard if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      navigate("/");
    }
  }, [isAuthenticated, navigate]);

  const handleDirectLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!username || !password) {
      setError("Username and password are required");
      return;
    }
    
    setError(null);
    setIsLoading(true);
    
    try {
      console.log("Attempting direct login with:", { username });
      const response = await fetch("/api/login/direct", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username, password }),
        credentials: "include", // Important for session cookies
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || "Invalid username or password");
      }
      
      // Successful login - save user data and redirect
      console.log("Login successful:", data);
      
      // Special handling for admin login
      if (username === 'admin' && data.user) {
        console.log("Admin login detected, setting special flags");
        
        // Ensure admin flag is set correctly for admin user
        const adminUser = {
          ...data.user,
          isAdmin: true
        };
        
        localStorage.setItem("auth_user", JSON.stringify(adminUser));
      } 
      // Regular user login
      else if (data.user) {
        localStorage.setItem("auth_user", JSON.stringify(data.user));
      } else {
        throw new Error("No user data received from server");
      }
      
      // Invalidate previous queries to ensure fresh data
      // Using any here to bypass the TypeScript error with the query invalidation
      (queryClient.invalidateQueries as any)(["/api/auth/user"]);
      
      // Add a small delay to let the session be properly set
      setTimeout(() => {
        // Navigate using window.location for a full page reload
        // This ensures all contexts and providers are re-initialized with the new auth state
        window.location.href = "/";
      }, 500);
      
      return;
    } catch (err: any) {
      console.error("Login error:", err);
      setError(err.message || "Login failed");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-6 md:mb-8">
          <h1 className="text-2xl font-bold text-primary">HC Staff</h1>
          <p className="text-sm text-muted-foreground">Management System</p>
        </div>
        
        <Card className="shadow-lg border-t-4 border-t-primary">
          <CardHeader className="pb-4">
            <CardTitle className="text-xl md:text-2xl">Sign in</CardTitle>
            <CardDescription>
              Choose your preferred authentication method
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="direct" className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-4">
                <TabsTrigger value="direct">Username & Password</TabsTrigger>
                <TabsTrigger value="replit">Replit</TabsTrigger>
              </TabsList>
              
              <TabsContent value="direct">
                <form onSubmit={handleDirectLogin} className="space-y-4">
                  {error && (
                    <Alert variant="destructive">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>{error}</AlertDescription>
                    </Alert>
                  )}
                  
                  <div className="space-y-2">
                    <Label htmlFor="username">Username</Label>
                    <Input
                      id="username"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder="Enter your username"
                      className="h-10"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="password">Password</Label>
                    <Input
                      id="password"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter your password"
                      className="h-10"
                    />
                  </div>
                  
                  <Button type="submit" className="w-full h-10 mt-2" disabled={isLoading}>
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Signing in...
                      </>
                    ) : (
                      "Sign in"
                    )}
                  </Button>
                </form>
              </TabsContent>
              
              <TabsContent value="replit">
                <div className="text-center space-y-4 py-4">
                  <img 
                    src="https://replit.com/public/images/logo-small.png" 
                    alt="Replit Logo" 
                    className="h-12 w-12 mx-auto mb-2"
                  />
                  <p className="text-sm text-muted-foreground mb-4">
                    Continue with your Replit account for secure, quick access
                  </p>
                  
                  <Button 
                    type="button" 
                    variant="outline" 
                    className="w-full h-10 flex items-center justify-center bg-white hover:bg-gray-50 border-gray-300 text-gray-800"
                    onClick={() => window.location.href = "/api/replit/login"}
                  >
                    <span className="flex items-center">
                      Sign in with Replit
                    </span>
                  </Button>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}