import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";

export function useAuth() {
  // Local state for user info from localStorage
  const [localUser, setLocalUser] = useState(null);
  
  // Try to get user from server first
  const { data: userData, isLoading: isServerLoading, error } = useQuery({
    queryKey: ["/api/auth/user"],
    retry: false,
    refetchOnWindowFocus: false,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
  
  // Get the employee details if we have a user
  const { data: employeeData } = useQuery({
    queryKey: ["/api/employees", userData?.employeeId],
    enabled: !!userData?.employeeId,
    refetchOnWindowFocus: false,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
  
  // Get impersonated employee details if the user is impersonating
  const { data: impersonatedEmployee } = useQuery({
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
  
  // Use server user if available, fall back to localStorage user
  const user = userData || localUser;
  const isLoading = isServerLoading && !localUser;
  const isImpersonating = !!user?.impersonatingId;
  
  // Store the original admin status before impersonation
  const rawIsAdmin = user?.isAdmin === true;
  
  // For impersonated users, we respect their permission level, not the admin's
  const effectiveIsAdmin = isImpersonating ? false : rawIsAdmin;
  
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