import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";

export function useAuth() {
  // Local state for user info from localStorage
  const [localUser, setLocalUser] = useState<any>(null);
  
  // Try to get user from server first
  const { data: serverUser, isLoading: isServerLoading } = useQuery({
    queryKey: ["/api/auth/user"],
    retry: false,
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
  const user = serverUser || localUser;
  const isLoading = isServerLoading && !localUser;
  
  return {
    user,
    isLoading,
    isAuthenticated: !!user,
    isAdmin: user?.isAdmin === true
  };
}