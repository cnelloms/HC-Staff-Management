import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";

export function useAuth() {
  // Define user interface to make TypeScript happy
  interface User {
    id: string;
    username: string;
    email?: string;
    firstName?: string;
    lastName?: string;
    isAdmin: boolean;
    employeeId?: number;
    authProvider?: string;
    businessUnit?: string;
  }
  
  interface Employee {
    id: number;
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
    avatar?: string;
    departmentId?: number;
    department?: { id: number; name: string; businessUnit?: string };
    positionId?: number;
    position?: { id: number; title: string };
    hireDate?: string;
    status?: string;
  }

  // Local state for user info from localStorage
  const [localUser, setLocalUser] = useState<User | null>(null);
  const [localEmployee, setLocalEmployee] = useState<Employee | null>(null);
  
  // Track login status and errors
  const [loginAttempted, setLoginAttempted] = useState(false);
  const [authError, setAuthError] = useState<Error | null>(null);
  
  // Try to get user from server with more fault tolerance
  const { data: userData, isLoading: isServerLoading, error } = useQuery<User>({
    queryKey: ["/api/auth/user"],
    retry: 2, 
    retryDelay: 1000,
    refetchOnWindowFocus: false, // Don't refetch too aggressively
    staleTime: 5 * 60 * 1000, // 5 minutes
    // Capture server errors but don't let them disrupt the app
    onError: (err) => {
      console.error("Auth API error:", err);
      setAuthError(err as Error);
      setLoginAttempted(true);
    },
    // Don't fail completely on server 500 errors
    onSuccess: (data) => {
      setLoginAttempted(true);
      setAuthError(null);
    }
  });
  
  // Get employee data if we have a user with employeeId
  const { data: employeeData } = useQuery<Employee>({
    queryKey: ["/api/employees", userData?.employeeId || localUser?.employeeId],
    enabled: !!(userData?.employeeId || localUser?.employeeId),
    refetchOnWindowFocus: false,
    staleTime: 10 * 60 * 1000, // 10 minutes
    onSuccess: (data) => {
      if (data) {
        // Cache employee data
        setLocalEmployee(data);
        localStorage.setItem("auth_employee", JSON.stringify(data));
      }
    }
  });
  
  // On mount, load cached user data
  useEffect(() => {
    try {
      // Load cached auth user
      const savedUser = localStorage.getItem("auth_user");
      if (savedUser) {
        const parsedUser = JSON.parse(savedUser);
        
        // Make sure we have the Health Carousel business unit
        if (!parsedUser.businessUnit) {
          parsedUser.businessUnit = "Health Carousel";
        }
        
        setLocalUser(parsedUser);
      }
      
      // Load cached employee data
      const savedEmployee = localStorage.getItem("auth_employee");
      if (savedEmployee) {
        setLocalEmployee(JSON.parse(savedEmployee));
      }
    } catch (err) {
      console.error("Error reading auth from localStorage:", err);
      // Only clear if there's an error reading
      localStorage.removeItem("auth_user");
      localStorage.removeItem("auth_employee");
    }
  }, []);
  
  // Update local storage when server data changes
  useEffect(() => {
    if (userData) {
      try {
        // Ensure we have the default business unit
        const userWithDefaults = {
          ...userData,
          businessUnit: userData.businessUnit || "Health Carousel"
        };
        
        localStorage.setItem("auth_user", JSON.stringify(userWithDefaults));
        setLocalUser(userWithDefaults);
      } catch (err) {
        console.error("Error saving auth to localStorage:", err);
      }
    }
  }, [userData]);
  
  // Use either server data or local cache
  const user = userData || localUser;
  const employee = employeeData || localEmployee;
  
  // Consider the auth to be loading only if we haven't tried yet
  const isLoading = isServerLoading && !loginAttempted && !localUser;
  
  // Determine authentication status with fault tolerance
  const isAuthenticated = !!user;
  const isAdmin = user?.isAdmin === true;
  
  // Add business unit to user if missing
  if (user && !user.businessUnit) {
    user.businessUnit = "Health Carousel";
  }
  
  // Debug: Log authentication state for troubleshooting
  console.log("Auth state:", { 
    user: user ? { ...user } : null, 
    isAuthenticated,
    isAdmin,
    isLoading,
    serverError: authError?.message
  });
  
  // Return authentication details
  return {
    user,
    isLoading,
    isAuthenticated,
    isAdmin,
    employee,
    error: authError
  };
}