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
  }
  
  interface Employee {
    id: number;
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
    avatar?: string;
    departmentId?: number;
    department?: { id: number; name: string };
    positionId?: number;
    position?: { id: number; title: string };
    hireDate?: string;
    status?: string;
  }

  // Local state for user info from localStorage
  const [localUser, setLocalUser] = useState<User | null>(null);
  
  // Try to get user from server first
  const { data: userData, isLoading: isServerLoading, error } = useQuery<User>({
    queryKey: ["/api/auth/user"],
    retry: false,
    refetchOnWindowFocus: false,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
  
  // Get the employee details if we have a user
  const { data: employeeData } = useQuery<Employee>({
    queryKey: ["/api/employees", userData?.employeeId],
    enabled: !!userData?.employeeId,
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
  
  // Use server user if available, fall back to localStorage user
  const user = userData || localUser;
  const isLoading = isServerLoading && !localUser;
  
  // Simplified admin status check (removed impersonation)
  const isAdmin = user?.isAdmin === true;
  
  return {
    user,
    isLoading,
    isAuthenticated: !!user,
    isAdmin,
    employee: employeeData || null
  };
}