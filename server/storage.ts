import { 
  Position, InsertPosition,
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
  User, UpsertUser,
  positions, employees, departments, systems, systemAccess, tickets, activities,
  permissions, roles, rolePermissions, employeeRoles, users
} from "@shared/schema";
import { db } from "./db";
import { eq, sql, desc, and, asc } from "drizzle-orm";

export interface IStorage {
  // Position operations
  getPositions(): Promise<Position[]>;
  getPositionById(id: number): Promise<Position | undefined>;
  getPositionsByDepartment(departmentId: number): Promise<Position[]>;
  createPosition(position: InsertPosition): Promise<Position>;
  
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
  
  // User operations for authentication
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  setUserImpersonation(userId: string, employeeId: number): Promise<boolean>;
  clearUserImpersonation(userId: string): Promise<boolean>;
  getUserDetails(userId: string): Promise<{ user: User, employee?: Employee, impersonatingEmployee?: Employee } | undefined>;
  makeUserAdmin(userId: string): Promise<boolean>;
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

export class DatabaseStorage implements IStorage {
  // Position operations
  async getPositions(): Promise<Position[]> {
    return await db.select().from(positions);
  }

  async getPositionById(id: number): Promise<Position | undefined> {
    const [position] = await db.select().from(positions).where(eq(positions.id, id));
    return position || undefined;
  }

  async getPositionsByDepartment(departmentId: number): Promise<Position[]> {
    return await db.select().from(positions).where(eq(positions.departmentId, departmentId));
  }

  async createPosition(position: InsertPosition): Promise<Position> {
    const [newPosition] = await db.insert(positions).values(position).returning();
    return newPosition;
  }

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
    const [newAccess] = await db.insert(systemAccess).values({
      ...access,
      // Ensure required fields are provided with defaults if not specified
      status: access.status ?? "pending"
    }).returning();
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
    const now = new Date();
    const [newTicket] = await db.insert(tickets).values({
      ...ticket,
      // Ensure required fields are provided with defaults if not specified
      status: ticket.status ?? "open",
      priority: ticket.priority ?? "medium",
      createdAt: now,
      updatedAt: now
    }).returning();
    return newTicket;
  }

  async updateTicket(id: number, ticket: Partial<InsertTicket>): Promise<Ticket | undefined> {
    const updateData = {
      ...ticket,
      updatedAt: new Date()
    };
    
    const [updatedTicket] = await db
      .update(tickets)
      .set(updateData)
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
    const now = new Date();
    const [newActivity] = await db.insert(activities).values({
      ...activity,
      timestamp: now,
      metadata: activity.metadata ?? null
    }).returning();
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
    const now = new Date();
    const [newPermission] = await db.insert(permissions).values({
      ...permission,
      createdAt: now,
      fieldLevel: permission.fieldLevel ?? null
    }).returning();
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
    const now = new Date();
    const [newRole] = await db.insert(roles).values({
      ...role,
      createdAt: now,
      isDefault: role.isDefault ?? false
    }).returning();
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
    const now = new Date();
    const [newEmployeeRole] = await db.insert(employeeRoles).values({
      ...employeeRole,
      assignedAt: now
    }).returning();
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
  
  // User authentication methods
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values({
        ...userData,
        updatedAt: new Date()
      })
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  async setUserImpersonation(userId: string, employeeId: number): Promise<boolean> {
    try {
      await db
        .update(users)
        .set({ 
          impersonatingId: employeeId,
          updatedAt: new Date()
        })
        .where(eq(users.id, userId));
      return true;
    } catch (error) {
      console.error("Error setting user impersonation:", error);
      return false;
    }
  }

  async clearUserImpersonation(userId: string): Promise<boolean> {
    try {
      await db
        .update(users)
        .set({ 
          impersonatingId: null,
          updatedAt: new Date()
        })
        .where(eq(users.id, userId));
      return true;
    } catch (error) {
      console.error("Error clearing user impersonation:", error);
      return false;
    }
  }

  async getUserDetails(userId: string): Promise<{ user: User, employee?: Employee, impersonatingEmployee?: Employee } | undefined> {
    try {
      const user = await this.getUser(userId);
      if (!user) return undefined;
      
      let employee: Employee | undefined = undefined;
      let impersonatingEmployee: Employee | undefined = undefined;
      
      if (user.employeeId) {
        employee = await this.getEmployeeById(user.employeeId);
      }
      
      if (user.impersonatingId) {
        impersonatingEmployee = await this.getEmployeeById(user.impersonatingId);
      }
      
      return {
        user,
        employee,
        impersonatingEmployee
      };
    } catch (error) {
      console.error("Error getting user details:", error);
      return undefined;
    }
  }

  async makeUserAdmin(userId: string): Promise<boolean> {
    try {
      await db
        .update(users)
        .set({ 
          isAdmin: true,
          updatedAt: new Date()
        })
        .where(eq(users.id, userId));
      return true;
    } catch (error) {
      console.error("Error making user admin:", error);
      return false;
    }
  }
}

// Export the database storage implementation
export const storage = new DatabaseStorage();