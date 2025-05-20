import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";

// Type definitions for authentication
interface User {
  id: string;
  firstName: string;
  lastName: string;
  email?: string | null;
  username?: string;
  isAdmin: boolean;
  authProvider?: string;
  employeeId?: number | null;
  impersonatingId?: number;
  department?: string;
  position?: string;
}

interface Employee {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  departmentId?: number;
  position?: string;
  status?: string;
}

interface AuthState {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  isAdmin: boolean;
  employee: Employee | null;
  isImpersonating: boolean;
  impersonatingEmployee: Employee | null;
  rawIsAdmin: boolean; // Original admin status before impersonation
}

export function useAuth(): AuthState {
  // Local state for user info from localStorage
  const [localUser, setLocalUser] = useState<User | null>(null);
  
  // Try to get user from server first
  const { data: userData, isLoading: isServerLoading, error } = useQuery<User>({
    queryKey: ["/api/auth/user"],
    retry: 2,
    retryDelay: 1000, // Retry after 1 second
    refetchOnWindowFocus: false,
    staleTime: 5 * 60 * 1000, // 5 minutes
    onError: (err) => {
      console.error("Error fetching user data:", err);
      // Clear local storage on auth errors to force re-login
      if ((err as any)?.response?.status === 401) {
        localStorage.removeItem("auth_user");
      }
    }
  });
  
  // Get the employee details if we have a user
  const { data: employeeData } = useQuery<Employee>({
    queryKey: ["/api/employees", userData?.employeeId],
    enabled: !!userData?.employeeId,
    refetchOnWindowFocus: false,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
  
  // Get impersonated employee details if the user is impersonating
  const { data: impersonatedEmployee } = useQuery<Employee>({
    queryKey: ["/api/employees", userData?.impersonatingId],
    enabled: !!userData?.impersonatingId,
    refetchOnWindowFocus: false,
    staleTime: 5 * 60 * 1000, // 5 minutes
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
  
  // When user data comes from the server, save it to localStorage
  useEffect(() => {
    if (userData) {
      try {
        localStorage.setItem("auth_user", JSON.stringify(userData));
      } catch (err) {
        console.error("Error saving auth to localStorage:", err);
      }
    }
  }, [userData]);
  
  // Clear localStorage if server returns an auth error
  useEffect(() => {
    if (error && (error as any)?.response?.status === 401) {
      localStorage.removeItem("auth_user");
      setLocalUser(null);
    }
  }, [error]);
  
  // Use server user if available, fall back to localStorage user
  const user = userData || localUser;
  const isLoading = isServerLoading && !localUser;
  const isImpersonating = !!user?.impersonatingId;
  
  // Store the original admin status before impersonation
  const rawIsAdmin = user?.isAdmin === true;
  
  // For impersonated users, we respect their permission level, not the admin's
  const effectiveIsAdmin = isImpersonating ? false : rawIsAdmin;
  
  // Log auth state for debugging
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      console.log('Auth state:', {
        user,
        isAuthenticated: !!user,
        isAdmin: effectiveIsAdmin,
        rawIsAdmin,
        isImpersonating
      });
    }
  }, [user, effectiveIsAdmin, rawIsAdmin, isImpersonating]);
  
  return {
    user,
    isLoading,
    isAuthenticated: !!user,
    isAdmin: effectiveIsAdmin,
    employee: employeeData || null,
    isImpersonating,
    impersonatingEmployee: impersonatedEmployee || null,
    rawIsAdmin
  };
}