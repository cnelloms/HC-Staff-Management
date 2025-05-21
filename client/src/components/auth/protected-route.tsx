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
    // Redirect to login if not authenticated and not still loading
    if (!isLoading && !isAuthenticated) {
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

  // Only render children when authenticated
  return <>{children}</>;
}