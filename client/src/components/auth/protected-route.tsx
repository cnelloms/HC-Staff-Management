import { ReactNode, useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "../../hooks/useAuth";
import { Loader2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

interface ProtectedRouteProps {
  children: ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { isAuthenticated, isLoading } = useAuth();
  const [, navigate] = useLocation();
  
  useEffect(() => {
    // First check localStorage for a cached auth state
    const cachedUser = localStorage.getItem("auth_user");
    
    // If we have a cached user, we'll consider them authenticated temporarily
    const hasLocalAuth = !!cachedUser;
    
    // Only redirect if not authenticated, not loading, and no local auth
    if (!isLoading && !isAuthenticated && !hasLocalAuth) {
      console.log("Not authenticated, redirecting to login...");
      navigate("/direct-login");
    }
  }, [isAuthenticated, isLoading, navigate]);

  // Show loading state
  if (isLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4 max-w-md text-center p-8">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
          <h2 className="text-2xl font-semibold">Loading...</h2>
          <p className="text-muted-foreground">Please wait while we verify your authentication.</p>
        </div>
      </div>
    );
  }

  // Check for cached auth before showing error
  const cachedUser = localStorage.getItem("auth_user");
  const hasLocalAuth = !!cachedUser;
  
  // Show authentication error message only if there's no cached auth
  if (!isAuthenticated && !hasLocalAuth) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <Card className="w-full max-w-md mx-auto">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-destructive" />
              Authentication Required
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p>You need to be logged in to access this page.</p>
          </CardContent>
          <CardFooter>
            <Button onClick={() => navigate("/direct-login")} className="w-full">
              Go to Login
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }
  
  // If we have a cached user but server auth is failing,
  // still show the page but try to redirect in the background
  if (!isAuthenticated && hasLocalAuth) {
    // Try to silently redirect in the background after a delay
    setTimeout(() => {
      navigate("/direct-login");
    }, 3000);
  }

  // Only render children when authenticated
  return <>{children}</>;
}