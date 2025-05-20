import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";

export function useAuth() {
  // Local state for user info from localStorage
  const [localUser, setLocalUser] = useState<any>(null);
  
  // Try to get user from server first
  const { data: userData, isLoading: isServerLoading } = useQuery({
    queryKey: ["/api/auth/user"],
    retry: false,
  });
  
  // Get the employee details if we have a user
  const { data: employeeData } = useQuery({
    queryKey: ["/api/employees", userData?.employeeId],
    enabled: !!userData?.employeeId,
  });
  
  // Get impersonated employee details if the user is impersonating
  const { data: impersonatedEmployee } = useQuery({
    queryKey: ["/api/employees", userData?.impersonatingId],
    enabled: !!userData?.impersonatingId,
  });
  
  // On mount, check localStorage for saved user data
  useEffect(() => {
    try {
      const savedUser = localStorage.getItem("auth_user");
      if (savedUser) {
        setLocalUser(JSON.parse(savedUser));
      }
    } catch (err) {
      console.error("Error reading auth from localStorage:", err);
      localStorage.removeItem("auth_user");
    }
  }, []);
  
  // Use server user if available, fall back to localStorage user
  const user = userData || localUser;
  const isLoading = isServerLoading && !localUser;
  const isImpersonating = !!user?.impersonatingId;
  
  // For debugging purposes, log the user details
  console.log('Auth state:', { 
    user, 
    isAuthenticated: !!user,
    isAdmin: user?.isAdmin === true,
    rawIsAdmin: user?.isAdmin
  });
  
  return {
    user,
    isLoading,
    isAuthenticated: !!user,
    isAdmin: user?.isAdmin === true || false, // Ensure it's always a boolean
    employee: employeeData || null,
    isImpersonating,
    impersonatingEmployee: impersonatedEmployee || null
  };
}