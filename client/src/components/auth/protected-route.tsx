import { ReactNode, useEffect, useState } from "react";
import { useLocation } from "wouter";
import { useAuth } from "../../hooks/useAuth";
import { Loader2 } from "lucide-react";

interface ProtectedRouteProps {
  children: ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { isAuthenticated, isLoading } = useAuth();
  const [, navigate] = useLocation();
  const [isInitialized, setIsInitialized] = useState(false);
  
  useEffect(() => {
    // Only check after initial load
    if (!isLoading) {
      setIsInitialized(true);
      if (!isAuthenticated) {
        navigate("/login");
      }
    }
  }, [isAuthenticated, isLoading, navigate]);

  // Show loading while authentication is being determined
  if (isLoading || !isInitialized) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // Show children once we know user is authenticated
  return isAuthenticated ? <>{children}</> : null;
}