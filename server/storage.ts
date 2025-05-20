import { 
  Department, InsertDepartment, 
  Employee, InsertEmployee, 
  System, InsertSystem, 
  SystemAccess, InsertSystemAccess, 
  Ticket, InsertTicket, 
  Activity, InsertActivity,
  Permission, InsertPermission,
  Role, InsertRole,
  RolePermission, InsertRolePermission,
  EmployeeRole, InsertEmployeeRole,
  employees, departments, systems, systemAccess, tickets, activities,
  permissions, roles, rolePermissions, employeeRoles
} from "@shared/schema";

export interface IStorage {
  // Department operations
  getDepartments(): Promise<Department[]>;
  getDepartmentById(id: number): Promise<Department | undefined>;
  createDepartment(department: InsertDepartment): Promise<Department>;
  
  // Employee operations
  getEmployees(): Promise<Employee[]>;
  getEmployeeById(id: number): Promise<Employee | undefined>;
  createEmployee(employee: InsertEmployee): Promise<Employee>;
  updateEmployee(id: number, employee: Partial<InsertEmployee>): Promise<Employee | undefined>;
  
  // System operations
  getSystems(): Promise<System[]>;
  getSystemById(id: number): Promise<System | undefined>;
  createSystem(system: InsertSystem): Promise<System>;
  
  // System Access operations
  getSystemAccessEntries(): Promise<SystemAccess[]>;
  getSystemAccessById(id: number): Promise<SystemAccess | undefined>;
  getSystemAccessByEmployeeId(employeeId: number): Promise<SystemAccess[]>;
  createSystemAccess(access: InsertSystemAccess): Promise<SystemAccess>;
  updateSystemAccess(id: number, access: Partial<InsertSystemAccess>): Promise<SystemAccess | undefined>;
  
  // Ticket operations
  getTickets(): Promise<Ticket[]>;
  getTicketById(id: number): Promise<Ticket | undefined>;
  getTicketsByRequestorId(requestorId: number): Promise<Ticket[]>;
  getTicketsByAssigneeId(assigneeId: number): Promise<Ticket[]>;
  createTicket(ticket: InsertTicket): Promise<Ticket>;
  updateTicket(id: number, ticket: Partial<InsertTicket>): Promise<Ticket | undefined>;
  
  // Activity operations
  getActivities(): Promise<Activity[]>;
  getRecentActivities(limit: number): Promise<Activity[]>;
  getActivitiesByEmployeeId(employeeId: number): Promise<Activity[]>;
  createActivity(activity: InsertActivity): Promise<Activity>;
  
  // Dashboard data operations
  getDashboardStats(): Promise<DashboardStats>;
  getSystemAccessStats(): Promise<SystemAccessStat[]>;
  
  // Permission operations
  getPermissions(): Promise<Permission[]>;
  getPermissionById(id: number): Promise<Permission | undefined>;
  getPermissionsByResource(resource: string): Promise<Permission[]>;
  createPermission(permission: InsertPermission): Promise<Permission>;
  updatePermission(id: number, permission: Partial<InsertPermission>): Promise<Permission | undefined>;
  deletePermission(id: number): Promise<boolean>;
  
  // Role operations
  getRoles(): Promise<Role[]>;
  getRoleById(id: number): Promise<Role | undefined>;
  createRole(role: InsertRole): Promise<Role>;
  updateRole(id: number, role: Partial<InsertRole>): Promise<Role | undefined>;
  deleteRole(id: number): Promise<boolean>;
  
  // Role Permission operations
  getRolePermissions(roleId: number): Promise<Permission[]>;
  addPermissionToRole(rolePermission: InsertRolePermission): Promise<RolePermission>;
  removePermissionFromRole(roleId: number, permissionId: number): Promise<boolean>;
  
  // Employee Role operations
  getEmployeeRoles(employeeId: number): Promise<Role[]>;
  addRoleToEmployee(employeeRole: InsertEmployeeRole): Promise<EmployeeRole>;
  removeRoleFromEmployee(employeeId: number, roleId: number): Promise<boolean>;
  
  // Permission check operations
  hasPermission(employeeId: number, resource: string, action: string): Promise<boolean>;
  getFieldLevelPermissions(employeeId: number, resource: string): Promise<Record<string, boolean>>;
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

export class MemStorage implements IStorage {
  private departments: Map<number, Department>;
  private employees: Map<number, Employee>;
  private systems: Map<number, System>;
  private systemAccess: Map<number, SystemAccess>;
  private tickets: Map<number, Ticket>;
  private activities: Map<number, Activity>;
  private permissions: Map<number, Permission>;
  private roles: Map<number, Role>;
  private rolePermissions: Map<number, RolePermission>;
  private employeeRoles: Map<number, EmployeeRole>;
  
  private departmentId: number;
  private employeeId: number;
  private systemId: number;
  private systemAccessId: number;
  private ticketId: number;
  private activityId: number;
  private permissionId: number;
  private roleId: number;
  private rolePermissionId: number;
  private employeeRoleId: number;
  
  constructor() {
    this.departments = new Map();
    this.employees = new Map();
    this.systems = new Map();
    this.systemAccess = new Map();
    this.tickets = new Map();
    this.activities = new Map();
    this.permissions = new Map();
    this.roles = new Map();
    this.rolePermissions = new Map();
    this.employeeRoles = new Map();
    
    this.departmentId = 1;
    this.employeeId = 1;
    this.systemId = 1;
    this.systemAccessId = 1;
    this.ticketId = 1;
    this.activityId = 1;
    this.permissionId = 1;
    this.roleId = 1;
    this.rolePermissionId = 1;
    this.employeeRoleId = 1;
    
    // Initialize with sample data
    this.initSampleData();
  }
  
  private initSampleData() {
    // Create departments
    const departments = [
      { name: "Human Resources", description: "HR department responsible for personnel management" },
      { name: "Information Technology", description: "IT department handling technical systems" },
      { name: "Finance", description: "Finance department managing company finances" },
      { name: "Operations", description: "Operations department overseeing daily activities" },
      { name: "Clinical Staff", description: "Medical professionals providing patient care" }
    ];
    
    departments.forEach(dept => this.createDepartment(dept));
    
    // Create systems
    const systems = [
      { name: "Electronic Health Records (EHR)", description: "Clinical documentation system", category: "clinical" },
      { name: "Financial Management", description: "Accounting and billing", category: "finance" },
      { name: "Scheduling System", description: "Appointment management", category: "operations" },
      { name: "Learning Management System", description: "Staff training platform", category: "hr" }
    ];
    
    systems.forEach(sys => this.createSystem(sys));
    
    // Create sample permissions
    const basePermissions = [
      { 
        name: "View Employees", 
        description: "Allows viewing employee directory",
        resource: "employee",
        action: "view",
        scope: "all", 
        fieldLevel: { 
          salary: false, 
          ssn: false, 
          personalNotes: false 
        }
      },
      { 
        name: "Edit Employees", 
        description: "Allows editing employee information",
        resource: "employee",
        action: "edit",
        scope: "all", 
        fieldLevel: null
      },
      { 
        name: "Create Employees", 
        description: "Allows creating new employees",
        resource: "employee",
        action: "create",
        scope: "all", 
        fieldLevel: null
      },
      { 
        name: "View Tickets", 
        description: "Allows viewing all tickets",
        resource: "ticket",
        action: "view",
        scope: "all", 
        fieldLevel: null
      },
      { 
        name: "Edit Tickets", 
        description: "Allows editing tickets",
        resource: "ticket",
        action: "edit",
        scope: "all", 
        fieldLevel: null
      },
      { 
        name: "Manage System Access", 
        description: "Allows managing system access permissions",
        resource: "system_access",
        action: "manage",
        scope: "all", 
        fieldLevel: null
      },
      { 
        name: "View Reports", 
        description: "Allows viewing reports",
        resource: "report",
        action: "view",
        scope: "all", 
        fieldLevel: null
      }
    ];
    
    const permissions = basePermissions.map(p => this.createPermission(p));
    
    // Create roles
    const roles = [
      {
        name: "Administrator",
        description: "Full system access",
        isDefault: false
      },
      {
        name: "HR Manager",
        description: "Manages employee information and permissions",
        isDefault: false
      },
      {
        name: "Department Manager",
        description: "Manages department employees and tickets",
        isDefault: false
      },
      {
        name: "Staff",
        description: "Basic access to tickets and employee directory",
        isDefault: true
      }
    ];
    
    roles.forEach(role => this.createRole(role));
    
    // Create sample employees
    const date = new Date();
    const employees = [
      { 
        firstName: "Sarah", lastName: "Johnson", email: "sarah.johnson@example.com", 
        phone: "555-123-4567", position: "HR Administrator", departmentId: 1,
        hireDate: date, status: "active", avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80"
      },
      { 
        firstName: "Michael", lastName: "Foster", email: "michael.foster@example.com", 
        phone: "555-987-6543", position: "IT Specialist", departmentId: 2,
        hireDate: date, status: "active", avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80"
      },
      { 
        firstName: "Robert", lastName: "Johnson", email: "robert.johnson@example.com", 
        phone: "555-234-5678", position: "Financial Analyst", departmentId: 3,
        hireDate: date, status: "active", avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80"
      },
      { 
        firstName: "Sarah", lastName: "Taylor", email: "sarah.taylor@example.com", 
        phone: "555-345-6789", position: "Nurse Practitioner", departmentId: 5,
        hireDate: date, status: "onboarding", avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80"
      },
      { 
        firstName: "Tom", lastName: "Wilson", email: "tom.wilson@example.com", 
        phone: "555-456-7890", position: "Operations Manager", departmentId: 4,
        hireDate: date, status: "active", avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80"
      }
    ];
    
    employees.forEach(emp => this.createEmployee(emp));
    
    // Create system access entries
    this.createSystemAccess({ 
      employeeId: 1, systemId: 1, accessLevel: "admin", 
      granted: true, grantedById: 1, grantedAt: date, status: "active" 
    });
    this.createSystemAccess({ 
      employeeId: 2, systemId: 1, accessLevel: "write", 
      granted: true, grantedById: 1, grantedAt: date, status: "active" 
    });
    this.createSystemAccess({ 
      employeeId: 3, systemId: 2, accessLevel: "admin", 
      granted: true, grantedById: 1, grantedAt: date, status: "active" 
    });
    this.createSystemAccess({ 
      employeeId: 4, systemId: 3, accessLevel: "read", 
      granted: false, status: "pending" 
    });
    this.createSystemAccess({ 
      employeeId: 5, systemId: 4, accessLevel: "write", 
      granted: true, grantedById: 1, grantedAt: date, status: "active" 
    });
    
    // Create tickets
    this.createTicket({
      title: "System Access Request - EHR", 
      description: "Need access to Electronic Health Records system",
      requestorId: 3, 
      status: "open", 
      priority: "medium", 
      type: "system_access",
      systemId: 1
    });
    
    this.createTicket({
      title: "Password Reset - Finance System", 
      description: "I forgot my password for the Finance System",
      requestorId: 5, 
      assigneeId: 2,
      status: "in_progress", 
      priority: "high", 
      type: "issue",
      systemId: 2
    });
    
    this.createTicket({
      title: "Printer Configuration", 
      description: "Need help setting up printer for new workstation",
      requestorId: 4, 
      assigneeId: 2,
      status: "closed", 
      priority: "low", 
      type: "request",
      closedAt: date
    });
    
    // Create activities
    this.createActivity({
      employeeId: 2,
      activityType: "profile_update",
      description: "Updated department and reporting structure",
      metadata: { oldDepartment: 3, newDepartment: 2 }
    });
    
    this.createActivity({
      employeeId: 3,
      activityType: "system_access",
      description: "Requested system access",
      metadata: { system: "EHR and Scheduling systems" }
    });
    
    this.createActivity({
      employeeId: 4,
      activityType: "onboarding",
      description: "Completed onboarding process",
      metadata: { completedTraining: true }
    });
    
    this.createActivity({
      employeeId: 5,
      activityType: "ticket",
      description: "Submitted new IT ticket",
      metadata: { ticketId: 2, ticketTitle: "Password reset for finance system" }
    });
  }
  
  // Department methods
  async getDepartments(): Promise<Department[]> {
    return Array.from(this.departments.values());
  }
  
  async getDepartmentById(id: number): Promise<Department | undefined> {
    return this.departments.get(id);
  }
  
  async createDepartment(department: InsertDepartment): Promise<Department> {
    const id = this.departmentId++;
    const newDepartment: Department = { 
      id, 
      name: department.name,
      description: department.description || null
    };
    this.departments.set(id, newDepartment);
    return newDepartment;
  }
  
  // Employee methods
  async getEmployees(): Promise<Employee[]> {
    return Array.from(this.employees.values());
  }
  
  async getEmployeeById(id: number): Promise<Employee | undefined> {
    return this.employees.get(id);
  }
  
  async createEmployee(employee: InsertEmployee): Promise<Employee> {
    const id = this.employeeId++;
    const newEmployee: Employee = { 
      id,
      firstName: employee.firstName,
      lastName: employee.lastName,
      email: employee.email,
      position: employee.position,
      departmentId: employee.departmentId,
      hireDate: employee.hireDate,
      status: employee.status || "active",
      phone: employee.phone || null,
      managerId: employee.managerId || null,
      avatar: employee.avatar || null
    };
    this.employees.set(id, newEmployee);
    return newEmployee;
  }
  
  async updateEmployee(id: number, employee: Partial<InsertEmployee>): Promise<Employee | undefined> {
    const existingEmployee = this.employees.get(id);
    if (!existingEmployee) return undefined;
    
    const updatedEmployee: Employee = { ...existingEmployee, ...employee };
    this.employees.set(id, updatedEmployee);
    return updatedEmployee;
  }
  
  // System methods
  async getSystems(): Promise<System[]> {
    return Array.from(this.systems.values());
  }
  
  async getSystemById(id: number): Promise<System | undefined> {
    return this.systems.get(id);
  }
  
  async createSystem(system: InsertSystem): Promise<System> {
    const id = this.systemId++;
    const newSystem: System = { 
      id, 
      name: system.name,
      description: system.description || null,
      category: system.category || null
    };
    this.systems.set(id, newSystem);
    return newSystem;
  }
  
  // SystemAccess methods
  async getSystemAccessEntries(): Promise<SystemAccess[]> {
    return Array.from(this.systemAccess.values());
  }
  
  async getSystemAccessById(id: number): Promise<SystemAccess | undefined> {
    return this.systemAccess.get(id);
  }
  
  async getSystemAccessByEmployeeId(employeeId: number): Promise<SystemAccess[]> {
    return Array.from(this.systemAccess.values()).filter(
      access => access.employeeId === employeeId
    );
  }
  
  async createSystemAccess(access: InsertSystemAccess): Promise<SystemAccess> {
    const id = this.systemAccessId++;
    const newAccess: SystemAccess = { id, ...access };
    this.systemAccess.set(id, newAccess);
    return newAccess;
  }
  
  async updateSystemAccess(id: number, access: Partial<InsertSystemAccess>): Promise<SystemAccess | undefined> {
    const existingAccess = this.systemAccess.get(id);
    if (!existingAccess) return undefined;
    
    const updatedAccess: SystemAccess = { ...existingAccess, ...access };
    this.systemAccess.set(id, updatedAccess);
    return updatedAccess;
  }
  
  // Ticket methods
  async getTickets(): Promise<Ticket[]> {
    return Array.from(this.tickets.values());
  }
  
  async getTicketById(id: number): Promise<Ticket | undefined> {
    return this.tickets.get(id);
  }
  
  async getTicketsByRequestorId(requestorId: number): Promise<Ticket[]> {
    return Array.from(this.tickets.values()).filter(
      ticket => ticket.requestorId === requestorId
    );
  }
  
  async getTicketsByAssigneeId(assigneeId: number): Promise<Ticket[]> {
    return Array.from(this.tickets.values()).filter(
      ticket => ticket.assigneeId === assigneeId
    );
  }
  
  async createTicket(ticket: InsertTicket): Promise<Ticket> {
    const id = this.ticketId++;
    const now = new Date();
    const newTicket: Ticket = { 
      id, 
      ...ticket, 
      createdAt: now, 
      updatedAt: now
    };
    this.tickets.set(id, newTicket);
    return newTicket;
  }
  
  async updateTicket(id: number, ticket: Partial<InsertTicket>): Promise<Ticket | undefined> {
    const existingTicket = this.tickets.get(id);
    if (!existingTicket) return undefined;
    
    const updatedTicket: Ticket = { 
      ...existingTicket, 
      ...ticket, 
      updatedAt: new Date() 
    };
    this.tickets.set(id, updatedTicket);
    return updatedTicket;
  }
  
  // Activity methods
  async getActivities(): Promise<Activity[]> {
    return Array.from(this.activities.values());
  }
  
  async getRecentActivities(limit: number): Promise<Activity[]> {
    return Array.from(this.activities.values())
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, limit);
  }
  
  async getActivitiesByEmployeeId(employeeId: number): Promise<Activity[]> {
    return Array.from(this.activities.values()).filter(
      activity => activity.employeeId === employeeId
    );
  }
  
  async createActivity(activity: InsertActivity): Promise<Activity> {
    const id = this.activityId++;
    const now = new Date();
    const newActivity: Activity = { id, ...activity, timestamp: now };
    this.activities.set(id, newActivity);
    return newActivity;
  }
  
  // Dashboard data operations
  async getDashboardStats(): Promise<DashboardStats> {
    const employees = await this.getEmployees();
    const tickets = await this.getTickets();
    const access = await this.getSystemAccessEntries();
    
    return {
      totalEmployees: employees.length,
      employeeGrowth: 4.3, // Mock growth percentage
      pendingTickets: tickets.filter(t => t.status !== 'closed').length,
      ticketGrowth: 12,
      systemAccessRate: 87,
      systemAccessGrowth: 3.2,
      onboardingCount: employees.filter(e => e.status === 'onboarding').length
    };
  }
  
  async getSystemAccessStats(): Promise<SystemAccessStat[]> {
    const systems = await this.getSystems();
    const accessEntries = await this.getSystemAccessEntries();
    
    return systems.map(system => {
      const systemAccessEntries = accessEntries.filter(
        access => access.systemId === system.id
      );
      
      const totalUsers = systemAccessEntries.length;
      const activeUsers = systemAccessEntries.filter(
        access => access.status === 'active'
      ).length;
      
      const pendingRequests = systemAccessEntries.filter(
        access => access.status === 'pending'
      ).length;
      
      const accessRate = totalUsers > 0 
        ? (activeUsers / totalUsers) * 100 
        : 0;
      
      return {
        systemId: system.id,
        systemName: system.name,
        systemDescription: system.description || '',
        totalUsers,
        activeUsers,
        pendingRequests,
        accessRate: Math.round(accessRate * 10) / 10 // Round to 1 decimal place
      };
    });
  }

  // Permission operations
  async getPermissions(): Promise<Permission[]> {
    return Array.from(this.permissions.values());
  }

  async getPermissionById(id: number): Promise<Permission | undefined> {
    return this.permissions.get(id);
  }

  async getPermissionsByResource(resource: string): Promise<Permission[]> {
    return Array.from(this.permissions.values())
      .filter(permission => permission.resource === resource);
  }

  async createPermission(permission: InsertPermission): Promise<Permission> {
    const id = this.permissionId++;
    const newPermission: Permission = { id, ...permission };
    this.permissions.set(id, newPermission);
    return newPermission;
  }

  async updatePermission(id: number, permission: Partial<InsertPermission>): Promise<Permission | undefined> {
    const existingPermission = this.permissions.get(id);
    if (!existingPermission) {
      return undefined;
    }
    
    const updatedPermission: Permission = { ...existingPermission, ...permission };
    this.permissions.set(id, updatedPermission);
    return updatedPermission;
  }

  async deletePermission(id: number): Promise<boolean> {
    return this.permissions.delete(id);
  }

  // Role operations
  async getRoles(): Promise<Role[]> {
    return Array.from(this.roles.values());
  }

  async getRoleById(id: number): Promise<Role | undefined> {
    return this.roles.get(id);
  }

  async createRole(role: InsertRole): Promise<Role> {
    const id = this.roleId++;
    const newRole: Role = { id, ...role };
    this.roles.set(id, newRole);
    return newRole;
  }

  async updateRole(id: number, role: Partial<InsertRole>): Promise<Role | undefined> {
    const existingRole = this.roles.get(id);
    if (!existingRole) {
      return undefined;
    }
    
    const updatedRole: Role = { ...existingRole, ...role };
    this.roles.set(id, updatedRole);
    return updatedRole;
  }

  async deleteRole(id: number): Promise<boolean> {
    return this.roles.delete(id);
  }

  // Role Permission operations
  async getRolePermissions(roleId: number): Promise<Permission[]> {
    const rolePerm = Array.from(this.rolePermissions.values())
      .filter(rp => rp.roleId === roleId);
    
    const permissions: Permission[] = [];
    for (const rp of rolePerm) {
      const permission = this.permissions.get(rp.permissionId);
      if (permission) {
        permissions.push(permission);
      }
    }
    
    return permissions;
  }

  async addPermissionToRole(rolePermission: InsertRolePermission): Promise<RolePermission> {
    const id = this.rolePermissionId++;
    const newRolePermission: RolePermission = { id, ...rolePermission };
    this.rolePermissions.set(id, newRolePermission);
    return newRolePermission;
  }

  async removePermissionFromRole(roleId: number, permissionId: number): Promise<boolean> {
    const entries = Array.from(this.rolePermissions.entries());
    for (const [key, rolePermission] of entries) {
      if (rolePermission.roleId === roleId && rolePermission.permissionId === permissionId) {
        return this.rolePermissions.delete(key);
      }
    }
    return false;
  }

  // Employee Role operations
  async getEmployeeRoles(employeeId: number): Promise<Role[]> {
    const employeeRolesEntries = Array.from(this.employeeRoles.values())
      .filter(er => er.employeeId === employeeId);
    
    const roles: Role[] = [];
    for (const er of employeeRolesEntries) {
      const role = this.roles.get(er.roleId);
      if (role) {
        roles.push(role);
      }
    }
    
    return roles;
  }

  async addRoleToEmployee(employeeRole: InsertEmployeeRole): Promise<EmployeeRole> {
    const id = this.employeeRoleId++;
    const newEmployeeRole: EmployeeRole = { id, ...employeeRole };
    this.employeeRoles.set(id, newEmployeeRole);
    return newEmployeeRole;
  }

  async removeRoleFromEmployee(employeeId: number, roleId: number): Promise<boolean> {
    const entries = Array.from(this.employeeRoles.entries());
    for (const [key, employeeRole] of entries) {
      if (employeeRole.employeeId === employeeId && employeeRole.roleId === roleId) {
        return this.employeeRoles.delete(key);
      }
    }
    return false;
  }

  // Permission check operations
  async hasPermission(employeeId: number, resource: string, action: string): Promise<boolean> {
    // Get all roles assigned to the employee
    const employeeRoles = await this.getEmployeeRoles(employeeId);
    
    // Check if any of the roles have the requested permission
    for (const role of employeeRoles) {
      const rolePermissions = await this.getRolePermissions(role.id);
      for (const permission of rolePermissions) {
        if (permission.resource === resource && permission.action === action) {
          return true;
        }
      }
    }
    
    return false;
  }

  async getFieldLevelPermissions(employeeId: number, resource: string): Promise<Record<string, boolean>> {
    const result: Record<string, boolean> = {};
    const employeeRoles = await this.getEmployeeRoles(employeeId);
    
    // Get all permissions from all roles
    const allPermissions: Permission[] = [];
    for (const role of employeeRoles) {
      const permissions = await this.getRolePermissions(role.id);
      allPermissions.push(...permissions);
    }
    
    // Filter permissions for the specific resource and extract field-level permissions
    const resourcePermissions = allPermissions.filter(p => p.resource === resource);
    for (const permission of resourcePermissions) {
      if (permission.fieldLevel) {
        const fieldLevel = permission.fieldLevel as Record<string, boolean>;
        for (const [field, access] of Object.entries(fieldLevel)) {
          result[field] = access;
        }
      }
    }
    
    return result;
  }
}

import { db } from "./db";
import { eq, sql, desc, and, asc } from "drizzle-orm";

export class DatabaseStorage implements IStorage {
  // Department operations
  async getDepartments(): Promise<Department[]> {
    return await db.select().from(departments);
  }

  async getDepartmentById(id: number): Promise<Department | undefined> {
    const [department] = await db.select().from(departments).where(eq(departments.id, id));
    return department || undefined;
  }

  async createDepartment(department: InsertDepartment): Promise<Department> {
    const [newDepartment] = await db.insert(departments).values(department).returning();
    return newDepartment;
  }

  // Employee operations
  async getEmployees(): Promise<Employee[]> {
    return await db.select().from(employees);
  }

  async getEmployeeById(id: number): Promise<Employee | undefined> {
    const [employee] = await db.select().from(employees).where(eq(employees.id, id));
    return employee || undefined;
  }

  async createEmployee(employee: InsertEmployee): Promise<Employee> {
    const [newEmployee] = await db.insert(employees).values(employee).returning();
    return newEmployee;
  }

  async updateEmployee(id: number, employee: Partial<InsertEmployee>): Promise<Employee | undefined> {
    const [updatedEmployee] = await db
      .update(employees)
      .set(employee)
      .where(eq(employees.id, id))
      .returning();
    return updatedEmployee || undefined;
  }

  // System operations
  async getSystems(): Promise<System[]> {
    return await db.select().from(systems);
  }

  async getSystemById(id: number): Promise<System | undefined> {
    const [system] = await db.select().from(systems).where(eq(systems.id, id));
    return system || undefined;
  }

  async createSystem(system: InsertSystem): Promise<System> {
    const [newSystem] = await db.insert(systems).values(system).returning();
    return newSystem;
  }

  // System Access operations
  async getSystemAccessEntries(): Promise<SystemAccess[]> {
    return await db.select().from(systemAccess);
  }

  async getSystemAccessById(id: number): Promise<SystemAccess | undefined> {
    const [access] = await db.select().from(systemAccess).where(eq(systemAccess.id, id));
    return access || undefined;
  }

  async getSystemAccessByEmployeeId(employeeId: number): Promise<SystemAccess[]> {
    return await db.select().from(systemAccess).where(eq(systemAccess.employeeId, employeeId));
  }

  async createSystemAccess(access: InsertSystemAccess): Promise<SystemAccess> {
    const [newAccess] = await db.insert(systemAccess).values(access).returning();
    return newAccess;
  }

  async updateSystemAccess(id: number, access: Partial<InsertSystemAccess>): Promise<SystemAccess | undefined> {
    const [updatedAccess] = await db
      .update(systemAccess)
      .set(access)
      .where(eq(systemAccess.id, id))
      .returning();
    return updatedAccess || undefined;
  }

  // Ticket operations
  async getTickets(): Promise<Ticket[]> {
    return await db.select().from(tickets);
  }

  async getTicketById(id: number): Promise<Ticket | undefined> {
    const [ticket] = await db.select().from(tickets).where(eq(tickets.id, id));
    return ticket || undefined;
  }

  async getTicketsByRequestorId(requestorId: number): Promise<Ticket[]> {
    return await db.select().from(tickets).where(eq(tickets.requestorId, requestorId));
  }

  async getTicketsByAssigneeId(assigneeId: number): Promise<Ticket[]> {
    return await db.select().from(tickets).where(eq(tickets.assigneeId, assigneeId));
  }

  async createTicket(ticket: InsertTicket): Promise<Ticket> {
    const [newTicket] = await db.insert(tickets).values(ticket).returning();
    return newTicket;
  }

  async updateTicket(id: number, ticket: Partial<InsertTicket>): Promise<Ticket | undefined> {
    const [updatedTicket] = await db
      .update(tickets)
      .set(ticket)
      .where(eq(tickets.id, id))
      .returning();
    return updatedTicket || undefined;
  }

  // Activity operations
  async getActivities(): Promise<Activity[]> {
    return await db.select().from(activities);
  }

  async getRecentActivities(limit: number): Promise<Activity[]> {
    return await db
      .select()
      .from(activities)
      .orderBy(desc(activities.timestamp))
      .limit(limit);
  }

  async getActivitiesByEmployeeId(employeeId: number): Promise<Activity[]> {
    return await db
      .select()
      .from(activities)
      .where(eq(activities.employeeId, employeeId))
      .orderBy(desc(activities.timestamp));
  }

  async createActivity(activity: InsertActivity): Promise<Activity> {
    const [newActivity] = await db.insert(activities).values(activity).returning();
    return newActivity;
  }

  // Dashboard data operations
  async getDashboardStats(): Promise<DashboardStats> {
    // Total employees count
    const [employeeCount] = await db
      .select({ count: sql`count(*)` })
      .from(employees);

    // Employee growth (mock value for now)
    const employeeGrowth = 4.3;

    // Pending tickets count
    const [pendingTicketsCount] = await db
      .select({ count: sql`count(*)` })
      .from(tickets)
      .where(eq(tickets.status, "open"));

    // Ticket growth (mock value for now)
    const ticketGrowth = 2.5;

    // System access rate (mock value for now)
    const systemAccessRate = 87.5;

    // System access growth (mock value for now)
    const systemAccessGrowth = 3.2;

    // Onboarding count
    const [onboardingCount] = await db
      .select({ count: sql`count(*)` })
      .from(employees)
      .where(eq(employees.status, "onboarding"));

    return {
      totalEmployees: Number(employeeCount.count),
      employeeGrowth,
      pendingTickets: Number(pendingTicketsCount.count),
      ticketGrowth,
      systemAccessRate,
      systemAccessGrowth,
      onboardingCount: Number(onboardingCount.count)
    };
  }

  async getSystemAccessStats(): Promise<SystemAccessStat[]> {
    const sysAccessStats: SystemAccessStat[] = [];
    
    // Get all systems
    const allSystems = await this.getSystems();
    
    for (const system of allSystems) {
      // Total users with access to this system
      const [totalUsersResult] = await db
        .select({ count: sql`count(*)` })
        .from(systemAccess)
        .where(eq(systemAccess.systemId, system.id));

      // Active users with access to this system
      const [activeUsersResult] = await db
        .select({ count: sql`count(*)` })
        .from(systemAccess)
        .where(and(
          eq(systemAccess.systemId, system.id),
          eq(systemAccess.status, "active")
        ));

      // Pending requests for this system
      const [pendingRequestsResult] = await db
        .select({ count: sql`count(*)` })
        .from(systemAccess)
        .where(and(
          eq(systemAccess.systemId, system.id),
          eq(systemAccess.status, "pending")
        ));

      // Calculate access rate (active users / total users * 100)
      const totalUsers = Number(totalUsersResult.count);
      const accessRate = totalUsers > 0 
        ? (Number(activeUsersResult.count) / totalUsers) * 100 
        : 0;

      sysAccessStats.push({
        systemId: system.id,
        systemName: system.name,
        systemDescription: system.description || "",
        totalUsers,
        activeUsers: Number(activeUsersResult.count),
        pendingRequests: Number(pendingRequestsResult.count),
        accessRate: Math.round(accessRate * 10) / 10 // Round to 1 decimal place
      });
    }
    
    return sysAccessStats;
  }

  // Permission operations
  async getPermissions(): Promise<Permission[]> {
    return await db.select().from(permissions);
  }

  async getPermissionById(id: number): Promise<Permission | undefined> {
    const [permission] = await db.select().from(permissions).where(eq(permissions.id, id));
    return permission || undefined;
  }

  async getPermissionsByResource(resource: string): Promise<Permission[]> {
    return await db.select().from(permissions).where(eq(permissions.resource, resource));
  }

  async createPermission(permission: InsertPermission): Promise<Permission> {
    const [newPermission] = await db.insert(permissions).values(permission).returning();
    return newPermission;
  }

  async updatePermission(id: number, permission: Partial<InsertPermission>): Promise<Permission | undefined> {
    const [updatedPermission] = await db
      .update(permissions)
      .set(permission)
      .where(eq(permissions.id, id))
      .returning();
    return updatedPermission || undefined;
  }

  async deletePermission(id: number): Promise<boolean> {
    await db.delete(permissions).where(eq(permissions.id, id));
    return true;
  }

  // Role operations
  async getRoles(): Promise<Role[]> {
    return await db.select().from(roles);
  }

  async getRoleById(id: number): Promise<Role | undefined> {
    const [role] = await db.select().from(roles).where(eq(roles.id, id));
    return role || undefined;
  }

  async createRole(role: InsertRole): Promise<Role> {
    const [newRole] = await db.insert(roles).values(role).returning();
    return newRole;
  }

  async updateRole(id: number, role: Partial<InsertRole>): Promise<Role | undefined> {
    const [updatedRole] = await db
      .update(roles)
      .set(role)
      .where(eq(roles.id, id))
      .returning();
    return updatedRole || undefined;
  }

  async deleteRole(id: number): Promise<boolean> {
    await db.delete(roles).where(eq(roles.id, id));
    return true;
  }

  // Role Permission operations
  async getRolePermissions(roleId: number): Promise<Permission[]> {
    const rolePermissionJoins = await db
      .select()
      .from(rolePermissions)
      .where(eq(rolePermissions.roleId, roleId));

    if (rolePermissionJoins.length === 0) {
      return [];
    }

    const permissionIds = rolePermissionJoins.map(rp => rp.permissionId);
    
    // Using in operator with array would be better, but for simplicity:
    const result: Permission[] = [];
    for (const id of permissionIds) {
      const perm = await this.getPermissionById(id);
      if (perm) {
        result.push(perm);
      }
    }
    
    return result;
  }

  async addPermissionToRole(rolePermission: InsertRolePermission): Promise<RolePermission> {
    const [newRolePermission] = await db.insert(rolePermissions).values(rolePermission).returning();
    return newRolePermission;
  }

  async removePermissionFromRole(roleId: number, permissionId: number): Promise<boolean> {
    await db
      .delete(rolePermissions)
      .where(
        and(
          eq(rolePermissions.roleId, roleId),
          eq(rolePermissions.permissionId, permissionId)
        )
      );
    return true;
  }

  // Employee Role operations
  async getEmployeeRoles(employeeId: number): Promise<Role[]> {
    const employeeRoleJoins = await db
      .select()
      .from(employeeRoles)
      .where(eq(employeeRoles.employeeId, employeeId));

    if (employeeRoleJoins.length === 0) {
      return [];
    }

    const roleIds = employeeRoleJoins.map(er => er.roleId);
    
    // Using in operator with array would be better, but for simplicity:
    const result: Role[] = [];
    for (const id of roleIds) {
      const role = await this.getRoleById(id);
      if (role) {
        result.push(role);
      }
    }
    
    return result;
  }

  async addRoleToEmployee(employeeRole: InsertEmployeeRole): Promise<EmployeeRole> {
    const [newEmployeeRole] = await db.insert(employeeRoles).values(employeeRole).returning();
    return newEmployeeRole;
  }

  async removeRoleFromEmployee(employeeId: number, roleId: number): Promise<boolean> {
    await db
      .delete(employeeRoles)
      .where(
        and(
          eq(employeeRoles.employeeId, employeeId),
          eq(employeeRoles.roleId, roleId)
        )
      );
    return true;
  }

  // Permission check operations
  async hasPermission(employeeId: number, resource: string, action: string): Promise<boolean> {
    // Get the employee's roles
    const roles = await this.getEmployeeRoles(employeeId);
    
    if (roles.length === 0) {
      return false;
    }
    
    // For each role, check if they have the permission
    for (const role of roles) {
      const permissions = await this.getRolePermissions(role.id);
      
      // Check if any of the permissions match the requested resource and action
      for (const permission of permissions) {
        if (permission.resource === resource && permission.action === action) {
          return true;
        }
      }
    }
    
    return false;
  }

  async getFieldLevelPermissions(employeeId: number, resource: string): Promise<Record<string, boolean>> {
    // Get the employee's roles
    const roles = await this.getEmployeeRoles(employeeId);
    
    if (roles.length === 0) {
      return {};
    }
    
    // Combine field level permissions from all roles
    const result: Record<string, boolean> = {};
    
    for (const role of roles) {
      const permissions = await this.getRolePermissions(role.id);
      
      // Check permissions for the requested resource
      for (const permission of permissions) {
        if (permission.resource === resource && permission.fieldLevel) {
          // Merge field level permissions
          Object.assign(result, permission.fieldLevel);
        }
      }
    }
    
    return result;
  }
}

// Replace MemStorage with DatabaseStorage
export const storage = new DatabaseStorage();
