// Basic type definitions for frontend components

export interface User {
  id: number;
  name: string;
  avatar?: string;
  position?: string;
}

export interface Department {
  id: number;
  name: string;
  description?: string;
}

export interface System {
  id: number;
  name: string;
  description?: string;
  category?: string;
}

export interface Activity {
  id: number;
  employeeId: number;
  activityType: "profile_update" | "system_access" | "ticket" | "onboarding";
  description: string;
  timestamp: string;
  metadata?: any;
  employee?: {
    id: number;
    name: string;
    avatar?: string;
    position?: string;
  };
}

export interface SystemAccess {
  id: number;
  employeeId: number;
  systemId: number;
  accessLevel: "read" | "write" | "admin";
  granted: boolean;
  grantedById?: number;
  grantedAt?: string;
  expiresAt?: string;
  status: "pending" | "active" | "revoked";
  system?: {
    id: number;
    name: string;
    description?: string;
  };
  employee?: {
    id: number;
    name: string;
    position?: string;
    department?: number;
  };
  grantedBy?: {
    id: number;
    name: string;
  };
}

export interface Ticket {
  id: number;
  title: string;
  description: string;
  requestorId: number;
  assigneeId?: number;
  status: "open" | "in_progress" | "closed";
  priority: "low" | "medium" | "high";
  type: "system_access" | "onboarding" | "issue" | "request" | "new_staff_request" | "it_support";
  createdAt: string;
  updatedAt: string;
  closedAt?: string;
  systemId?: number;
  metadata?: any;
  requestor?: {
    id: number;
    firstName: string;
    lastName: string;
    position?: string;
    avatar?: string;
  };
  assignee?: {
    id: number;
    firstName: string;
    lastName: string;
    position?: string;
    avatar?: string;
  };
  system?: {
    id: number;
    name: string;
    description?: string;
  };
}

export interface Employee {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  position: string;
  departmentId: number;
  managerId?: number;
  hireDate: string;
  status: "active" | "inactive" | "onboarding";
  avatar?: string;
  department?: {
    id: number;
    name: string;
  };
  manager?: {
    id: number;
    name: string;
    position: string;
  };
  systemAccess?: SystemAccess[];
  tickets?: Ticket[];
  activities?: Activity[];
}

export interface DashboardStats {
  totalEmployees: number;
  employeeGrowth: number;
  pendingTickets: number;
  ticketGrowth: number;
  systemAccessRate: number;
  systemAccessGrowth: number;
  onboardingCount: number;
}

export interface SystemAccessStat {
  systemId: number;
  systemName: string;
  systemDescription: string;
  totalUsers: number;
  activeUsers: number;
  pendingRequests: number;
  accessRate: number;
}
