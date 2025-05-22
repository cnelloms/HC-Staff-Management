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
  
  // On mount, load cached user data - this needs to happen first to prevent loading flicker
  useEffect(() => {
    try {
      // Check for direct login data - higher priority for this project
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
  
  // Try to get user from server
  const { data: userData, isLoading: isServerLoading, error: authError } = useQuery({
    queryKey: ["/api/auth/user"],
    retry: 1, // Retry once in case of temporary network issue
    refetchOnWindowFocus: true, // Refetch on window focus to detect session timeouts
    staleTime: 2 * 60 * 1000, // 2 minutes - more frequent checking for auth changes
    onError: (error: any) => {
      // If we get a 401 error (unauthorized), clear the local storage
      if (error?.response?.status === 401 || error?.message?.includes('Unauthorized')) {
        console.log('Authentication error detected, clearing local session');
        localStorage.removeItem("auth_user");
        localStorage.removeItem("auth_employee");
        setLocalUser(null);
        setLocalEmployee(null);
      }
    }
  });
  
  // Get employee data if we have a user with employeeId
  const { data: employeeData } = useQuery({
    queryKey: ["/api/employees", localUser?.employeeId],
    enabled: !!localUser?.employeeId, 
    refetchOnWindowFocus: false,
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
  
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
      } catch (err) {
        console.error("Error saving auth to localStorage:", err);
      }
    }
  }, [userData]);
  
  // Use either server data or local cache
  const user = userData || localUser;
  const employee = employeeData || localEmployee;
  
  // Only consider loading if we're querying the server and don't have a cached user
  const isLoading = isServerLoading && !localUser;
  
  // Determine authentication status
  const isAuthenticated = !!user;
  const isAdmin = !!user?.isAdmin;
  
  // Debug: Log authentication state for troubleshooting
  console.log("Auth state:", { 
    user: user ? { ...user } : null, 
    isAuthenticated,
    isAdmin,
    isLoading
  });
  
  // Return authentication details
  return {
    user,
    isLoading,
    isAuthenticated,
    isAdmin,
    employee
  };
}