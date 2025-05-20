import { ReactNode, useEffect, useState } from "react";
import { useLocation } from "wouter";
import { useAuth } from "../../hooks/useAuth";
import { Loader2, AlertCircle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { queryClient } from "@/lib/queryClient";

interface ProtectedRouteProps {
  children: ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { isAuthenticated, isLoading, user } = useAuth();
  const [, navigate] = useLocation();
  const [retryCount, setRetryCount] = useState(0);
  const [showError, setShowError] = useState(false);
  
  // Handle retry logic
  useEffect(() => {
    let timeoutId: number;
    
    // If not authenticated and not loading but we still have retries left
    if (!isLoading && !isAuthenticated && retryCount < 2) {
      console.log(`Auth retry attempt ${retryCount + 1}`);
      
      // Refresh auth data and increment retry count
      timeoutId = window.setTimeout(() => {
        // Refetch authentication data
        queryClient.invalidateQueries({queryKey: ["/api/auth/user"]});
        setRetryCount(prev => prev + 1);
        
        // Show error message after first retry
        if (retryCount === 1) {
          setShowError(true);
        }
      }, 1500); // 1.5 second delay between retries
    }
    
    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [isAuthenticated, isLoading, retryCount]);
  
  // Redirect to login if auth failed after retries
  useEffect(() => {
    if (!isLoading && !isAuthenticated && retryCount >= 2) {
      // Clear any stale data
      localStorage.removeItem("auth_user");
      
      // Redirect after a brief delay to ensure state updates are complete
      const redirectTimeout = window.setTimeout(() => {
        navigate("/login");
      }, 500);
      
      return () => clearTimeout(redirectTimeout);
    }
  }, [isAuthenticated, isLoading, navigate, retryCount]);

  // Show loading state while checking auth
  if (isLoading || (!isAuthenticated && retryCount < 2)) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4 max-w-md text-center p-8">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
          <h2 className="text-2xl font-semibold">Loading...</h2>
          <p className="text-muted-foreground">
            {retryCount > 0 
              ? "Verifying your authentication status..." 
              : "Please wait while we verify your authentication."}
          </p>
          
          {/* Show refresh button after first retry */}
          {retryCount > 0 && (
            <Button 
              variant="outline" 
              onClick={() => {
                // Clear cached auth data
                localStorage.removeItem("auth_user");
                queryClient.invalidateQueries({queryKey: ["/api/auth/user"]});
                window.location.reload();
              }}
              className="mt-2"
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              Refresh page
            </Button>
          )}
        </div>
      </div>
    );
  }

  // Show authentication error message
  if (!isAuthenticated) {
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
            {/* If we had a local user but server auth failed, show troubleshooting message */}
            {localStorage.getItem("auth_user") && (
              <p className="mt-2 text-sm text-muted-foreground">
                There was a problem verifying your session. This may be due to an expired session or server connectivity issue.
              </p>
            )}
          </CardContent>
          <CardFooter>
            <Button 
              onClick={() => {
                // Clear any cached data
                localStorage.removeItem("auth_user");
                navigate("/login");
              }} 
              className="w-full"
            >
              Go to Login
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  // Only render children when authenticated
  return <>{children}</>;
}