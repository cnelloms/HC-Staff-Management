import React, { createContext, useContext, useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Employee } from "@/types";
import { useAuth } from "@/hooks/useAuth";

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
  // All useState declarations must come before other hooks
  const [currentUser, setCurrentUser] = useState<Employee | null>(null);
  
  // Get auth data
  const { user, employee } = useAuth();
  
  // Fetch all employees for look-up
  const { data: employees, isLoading, error } = useQuery({
    queryKey: ['/api/employees'],
  });
  
  // Always maintain the same hook order
  useEffect(() => {
    // Use the authenticated user information to find the correct employee
    if (employees && Array.isArray(employees) && employees.length > 0) {
      // Use the employee from useAuth if available
      if (employee) {
        setCurrentUser(employee as Employee);
      }
      // If we have a user but no employee match, try to find by ID
      else if (user?.employeeId) {
        const matchedEmployee = employees.find((e: Employee) => e.id === user.employeeId);
        if (matchedEmployee) {
          setCurrentUser(matchedEmployee);
        }
      }
      // Fallback for admin users - Chris Nelloms is employee #118
      else if (user?.username === "cnelloms") {
        const adminEmployee = employees.find((e: Employee) => e.id === 118);
        if (adminEmployee) {
          setCurrentUser(adminEmployee);
        }
      }
    }
  }, [employees, user, employee]);

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