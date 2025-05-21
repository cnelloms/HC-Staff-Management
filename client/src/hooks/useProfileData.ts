import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Employee } from "@/types";

// Define extended User type based on API response
export interface AuthUser {
  id: string;
  username: string;
  firstName: string;
  lastName: string;
  email: string;
  isAdmin: boolean;
  employeeId?: number;
  authProvider: string;
  position?: string;
  department?: string;
}

// Combined profile data type
export interface ProfileData {
  id: string;
  username: string;
  firstName: string;
  lastName: string;
  email: string;
  isAdmin: boolean;
  employeeId?: number;
  authProvider: string;
  position?: string | object;
  department?: string | object;
  phone?: string;
  avatar?: string;
  status?: string;
  hireDate?: string;
  departmentId?: number;
  reportingManagerId?: number;
  employeeData?: Employee;
}

/**
 * A central hook for accessing unified profile data throughout the application
 * Handles fetching and merging user and employee data with proper priority
 */
export function useProfileData(userId?: string | number, employeeId?: number) {
  // State for combined profile
  const [profileData, setProfileData] = useState<ProfileData | null>(null);
  
  // Fetch logged in user from auth API
  const { 
    data: userData, 
    isLoading: isUserLoading, 
    error: userError 
  } = useQuery<AuthUser>({
    queryKey: ["/api/auth/user"],
    retry: false,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Determine which employee ID to use in priority order:
  // 1. Explicitly provided employeeId parameter
  // 2. User's associated employeeId from auth
  const targetEmployeeId = employeeId || (userData?.employeeId);
  
  // Fetch complete employee data if we have an ID
  const { 
    data: employeeData, 
    isLoading: isEmployeeLoading, 
    error: employeeError 
  } = useQuery<Employee>({
    queryKey: [`/api/employees/${targetEmployeeId}`],
    enabled: !!targetEmployeeId,
    retry: false,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Merge profile data, with employee data taking precedence
  useEffect(() => {
    if (!userData && !employeeData) {
      setProfileData(null);
      return;
    }
    
    // Start with user data as the base
    const baseProfile: ProfileData = {
      id: userData?.id || '',
      username: userData?.username || '',
      firstName: userData?.firstName || '',
      lastName: userData?.lastName || '',
      email: userData?.email || '',
      isAdmin: userData?.isAdmin || false,
      employeeId: userData?.employeeId,
      authProvider: userData?.authProvider || 'direct',
      position: userData?.position || '',
      department: userData?.department || '',
      phone: '',
      avatar: '',
      status: 'Active',
      hireDate: '',
    };
    
    // If we have employee data, it overrides the base profile
    if (employeeData) {
      // Employee data has priority for these fields
      baseProfile.firstName = employeeData.firstName || baseProfile.firstName;
      baseProfile.lastName = employeeData.lastName || baseProfile.lastName;
      baseProfile.email = employeeData.email || baseProfile.email;
      baseProfile.position = typeof employeeData.position === 'string' ? employeeData.position : baseProfile.position;
      baseProfile.department = employeeData.department?.name || baseProfile.department;
      
      // Employee-specific fields
      baseProfile.employeeId = employeeData.id;
      baseProfile.phone = employeeData.phone || '';
      baseProfile.avatar = employeeData.avatar || '';
      baseProfile.status = employeeData.status || 'Active';
      baseProfile.hireDate = employeeData.hireDate || '';
      baseProfile.departmentId = employeeData.departmentId;
      baseProfile.reportingManagerId = employeeData.managerId;
      
      // Keep employee reference for access to complete data
      baseProfile.employeeData = employeeData;
    }
    
    // Set the combined profile
    setProfileData(baseProfile);
  }, [userData, employeeData]);

  return {
    profileData,
    isLoading: isUserLoading || isEmployeeLoading,
    error: userError || employeeError,
    userData,
    employeeData,
  };
}

/**
 * Helper function to get initials from name
 */
export function getInitials(firstName?: string, lastName?: string): string {
  if (!firstName && !lastName) return 'U';
  
  let initials = '';
  if (firstName) initials += firstName.charAt(0);
  if (lastName) initials += lastName.charAt(0);
  
  return initials.toUpperCase();
}

/**
 * Helper function to get full name
 */
export function getFullName(firstName?: string, lastName?: string): string {
  if (!firstName && !lastName) return 'User';
  return `${firstName || ''} ${lastName || ''}`.trim();
}