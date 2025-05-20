import React, { createContext, useContext, useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Employee } from "@/types";

// Set a default user ID (in a real app, this would come from authentication)
const DEFAULT_USER_ID = 1;

type UserContextType = {
  currentUser: Employee | null;
  isLoading: boolean;
  error: Error | null;
};

const UserContext = createContext<UserContextType>({
  currentUser: null,
  isLoading: false,
  error: null,
});

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUser] = useState<Employee | null>(null);
  
  // Fetch all employees to find the default user
  const { data: employees, isLoading, error } = useQuery({
    queryKey: ['/api/employees'],
  });
  
  useEffect(() => {
    if (employees && Array.isArray(employees) && employees.length > 0) {
      // Find the default user from the employees list
      const defaultUser = employees.find((e: Employee) => e.id === DEFAULT_USER_ID);
      if (defaultUser) {
        setCurrentUser(defaultUser);
      } else if (employees.length > 0) {
        // Fallback to the first employee if default not found
        setCurrentUser(employees[0] as Employee);
      }
    }
  }, [employees]);

  return (
    <UserContext.Provider value={{ 
      currentUser, 
      isLoading, 
      error: error as Error | null 
    }}>
      {children}
    </UserContext.Provider>
  );
}

export function useCurrentUser() {
  return useContext(UserContext);
}