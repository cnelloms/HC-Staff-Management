import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, Loader2, CheckCircle } from "lucide-react";
import { useLocation } from "wouter";

export default function DirectLoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [, navigate] = useLocation();

  // Check if we're already logged in
  useEffect(() => {
    // Clear existing auth data on login page load
    localStorage.removeItem("auth_user");
    
    const checkAuth = async () => {
      try {
        const response = await fetch("/api/auth/user", {
          credentials: "include"
        });
        
        if (response.ok) {
          // Already authenticated, redirect to home
          navigate("/");
        }
      } catch (error) {
        console.error("Auth check error:", error);
      }
    };
    
    checkAuth();
  }, [navigate]);

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
      
      // Clear any cached data
      localStorage.removeItem("auth_user");
      sessionStorage.clear();
      
      const response = await fetch("/api/login/direct", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username, password }),
        credentials: "include" // Important for session cookies
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || "Invalid username or password");
      }
      
      // Show success message
      setSuccess(true);
      
      // Store user data from response in localStorage to ensure immediate auth state
      try {
        // Important: This ensures we have user data cached for authentication
        const userData = data.user || {
          id: username, 
          username,
          isAdmin: data.isAdmin,
          authProvider: 'direct'
        };
        
        // Ensure organization structure data is included
        if (!userData.businessUnit) {
          userData.businessUnit = "Health Carousel";
        }
        
        console.log("Saving user data to localStorage:", userData);
        localStorage.setItem("auth_user", JSON.stringify(userData));
        
        // Clear any stale data
        sessionStorage.removeItem("last_auth_error");
        
        // Force a longer delay to ensure session is properly saved
        setTimeout(() => {
          // Successful login - redirect to dashboard
          window.location.href = "/";
        }, 1500);
      } catch (err) {
        console.error("Error during login process:", err);
        // Still try to redirect even if localStorage fails
        setTimeout(() => {
          window.location.href = "/";
        }, 1500);
      }
      
    } catch (err: any) {
      console.error("Login error:", err);
      setError(err.message || "Login failed");
      setSuccess(false);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-primary">Staff Management</h1>
          <p className="text-sm text-muted-foreground">Health Carousel</p>
        </div>
        
        <Card className="border-2 shadow-lg">
          <CardHeader className="pb-4">
            <CardTitle className="text-xl font-bold">Sign in to your account</CardTitle>
          </CardHeader>
          <CardContent>
            {success ? (
              <div className="text-center py-4">
                <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">Login Successful!</h3>
                <p className="text-muted-foreground mb-4">
                  You will be redirected to the dashboard shortly...
                </p>
                <div className="w-full bg-gray-200 h-1 rounded-full overflow-hidden">
                  <div className="bg-green-500 h-1 animate-pulse rounded-full"></div>
                </div>
              </div>
            ) : (
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
                    autoComplete="username"
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
                    autoComplete="current-password"
                    className="h-10"
                  />
                </div>
                
                <Button type="submit" className="w-full h-10" disabled={isLoading}>
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
            )}
          </CardContent>
          <CardFooter className="flex justify-center pt-0 pb-4">
            <p className="text-sm text-muted-foreground">
              Staff Management System • {new Date().getFullYear()}
            </p>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}