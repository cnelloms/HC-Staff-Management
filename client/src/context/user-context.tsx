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

export const UserProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<Employee | null>(null);
  
  const { data: employee, isLoading, error } = useQuery({
    queryKey: [`/api/employees/${DEFAULT_USER_ID}`],
  });
  
  useEffect(() => {
    if (employee) {
      setCurrentUser(employee as Employee);
    }
  }, [employee]);

  return (
    <UserContext.Provider value={{ currentUser, isLoading, error: error as Error | null }}>
      {children}
    </UserContext.Provider>
  );
};

export const useCurrentUser = () => useContext(UserContext);