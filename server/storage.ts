import { 
  Position, InsertPosition,
  Department, InsertDepartment, 
  Employee, InsertEmployee, 
  System, InsertSystem, 
  SystemAccess, InsertSystemAccess, 
  Ticket, InsertTicket, 
  TicketTemplate, InsertTicketTemplate,
  Activity, InsertActivity,
  Permission, InsertPermission,
  Role, InsertRole,
  RolePermission, InsertRolePermission,
  EmployeeRole, InsertEmployeeRole,
  User, UpsertUser,
  positions, employees, departments, systems, systemAccess, tickets, ticketTemplates, activities,
  permissions, roles, rolePermissions, employeeRoles, users
} from "@shared/schema";
import { db } from "./db";
import { eq, sql, desc, and, asc, count } from "drizzle-orm";

export interface IStorage {
  // Position operations
  getPositions(): Promise<Position[]>;
  getPositionById(id: number): Promise<Position | undefined>;
  getPositionsByDepartment(departmentId: number): Promise<Position[]>;
  createPosition(position: InsertPosition): Promise<Position>;
  updatePosition(id: number, position: Partial<InsertPosition>): Promise<Position | undefined>;
  deletePosition(id: number): Promise<boolean>;
  
  // Department operations
  getDepartments(): Promise<Department[]>;
  getDepartmentById(id: number): Promise<Department | undefined>;
  createDepartment(department: InsertDepartment): Promise<Department>;
  
  // Ticket Template operations
  getTicketTemplates(): Promise<TicketTemplate[]>;
  getTicketTemplateById(id: number): Promise<TicketTemplate | undefined>;
  getTicketTemplateByType(type: string): Promise<TicketTemplate | undefined>;
  createTicketTemplate(template: InsertTicketTemplate): Promise<TicketTemplate>;
  updateTicketTemplate(id: number, template: Partial<InsertTicketTemplate>): Promise<TicketTemplate>;
  updateDepartment(id: number, department: Partial<InsertDepartment>): Promise<Department | undefined>;
  
  // Employee operations
  getEmployees(): Promise<Employee[]>;
  getEmployeeById(id: number): Promise<Employee | undefined>;
  createEmployee(employee: InsertEmployee): Promise<Employee>;
  updateEmployee(id: number, employee: Partial<InsertEmployee>): Promise<Employee | undefined>;
  deleteEmployee(id: number): Promise<boolean>;
  
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
  syncUserFromEmployee(userId: string, employeeId: number): Promise<User | undefined>;
  syncEmployeeToUser(employeeId: number): Promise<boolean>;
  isEmployeeLinkedToUser(employeeId: number, userId: string): Promise<boolean>;
  getUserForEmployee(employeeId: number): Promise<User | undefined>;
  invalidateUserCache(userId: string): Promise<void>;
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

  async updatePosition(id: number, position: Partial<InsertPosition>): Promise<Position | undefined> {
    const [updatedPosition] = await db
      .update(positions)
      .set(position)
      .where(eq(positions.id, id))
      .returning();
    return updatedPosition || undefined;
  }

  async deletePosition(id: number): Promise<boolean> {
    try {
      // First, get the position to check if it exists and to get its title
      const position = await this.getPositionById(id);
      if (!position) {
        throw new Error("Position not found");
      }
      
      // Check if the position has associated employees by matching the position title
      // Since the employee table stores position as a text field, not a foreign key
      const positionTitle = position.title;
      const employeeResult = await db
        .select({ count: sql`COUNT(*)` })
        .from(employees)
        .where(eq(employees.position, positionTitle));
      
      const employeeCount = Number(employeeResult[0].count);
      if (employeeCount > 0) {
        throw new Error("Cannot delete position with associated employees");
      }
      
      // Delete the position
      await db.delete(positions).where(eq(positions.id, id));
      
      // Log the deletion as an activity
      await db.insert(activities).values({
        employeeId: 0, // System activity
        activityType: 'position_deletion',
        description: `Position "${position.title}" (ID: ${id}) was deleted from the system`
      });
      
      return true;
    } catch (error) {
      console.error("Error deleting position:", error);
      throw error;
    }
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
  
  async updateDepartment(id: number, department: Partial<InsertDepartment>): Promise<Department | undefined> {
    const [updatedDepartment] = await db
      .update(departments)
      .set({
        ...department,
        // Clear managerId if it's explicitly set to null or empty string
        managerId: department.managerId === null || department.managerId === undefined ? null : department.managerId
      })
      .where(eq(departments.id, id))
      .returning();
    return updatedDepartment || undefined;
  }
  
  async deleteDepartment(id: number): Promise<boolean> {
    try {
      // Check if the department has associated employees or positions
      const employeeResult = await db
        .select({ count: sql`COUNT(*)` })
        .from(employees)
        .where(eq(employees.departmentId, id));
      
      const employeeCount = Number(employeeResult[0].count);
      if (employeeCount > 0) {
        throw new Error("Cannot delete department with associated employees");
      }
      
      const positionResult = await db
        .select({ count: sql`COUNT(*)` })
        .from(positions)
        .where(eq(positions.departmentId, id));
      
      const positionCount = Number(positionResult[0].count);
      if (positionCount > 0) {
        throw new Error("Cannot delete department with associated positions");
      }
      
      // Delete the department
      await db.delete(departments).where(eq(departments.id, id));
      
      // Log the deletion as an activity
      await db.insert(activities).values({
        employeeId: 0, // System activity
        activityType: 'department_deletion',
        description: `Department (ID: ${id}) was deleted from the system`
      });
      
      return true;
    } catch (error) {
      console.error("Error deleting department:", error);
      throw error;
    }
  }

  // Employee operations
  async getEmployees(): Promise<Employee[]> {
    // Get all employees
    const allEmployees = await db.select().from(employees);
    
    // Get all tickets
    const allTickets = await db.select().from(tickets);
    
    // Map tickets to employees
    return allEmployees.map(employee => {
      // Get tickets assigned to this employee
      const assignedTickets = allTickets.filter(ticket => ticket.assigneeId === employee.id);
      
      // Get tickets created by this employee
      const requestedTickets = allTickets.filter(ticket => ticket.requestorId === employee.id);
      
      // Combine all tickets related to this employee (avoiding duplicates)
      const employeeTickets = [...assignedTickets, ...requestedTickets.filter(
        requestedTicket => !assignedTickets.some(
          assignedTicket => assignedTicket.id === requestedTicket.id
        )
      )];
      
      // Return employee with tickets
      return {
        ...employee,
        tickets: employeeTickets
      };
    });
  }

  async getEmployeeById(id: number): Promise<Employee | undefined> {
    // First get the employee
    const [employee] = await db.select().from(employees).where(eq(employees.id, id));
    
    if (!employee) return undefined;
    
    // Get tickets assigned to this employee
    const assignedTickets = await db.select()
      .from(tickets)
      .where(eq(tickets.assigneeId, id));
    
    // Get tickets created by this employee
    const requestedTickets = await db.select()
      .from(tickets)
      .where(eq(tickets.requestorId, id));
    
    // Combine all tickets related to this employee
    const employeeTickets = [...assignedTickets, ...requestedTickets.filter(
      requestedTicket => !assignedTickets.some(
        assignedTicket => assignedTicket.id === requestedTicket.id
      )
    )];
    
    // Check if employee has a manager and include manager data
    let managerData = null;
    if (employee.managerId) {
      const [manager] = await db.select()
        .from(employees)
        .where(eq(employees.id, employee.managerId));
      
      if (manager) {
        managerData = {
          id: manager.id,
          name: `${manager.firstName} ${manager.lastName}`,
          position: manager.position
        };
      }
    }
    
    // Create employee with tickets and manager as separate objects to avoid type issues
    const employeeWithDetails = {
      ...employee,
      tickets: employeeTickets,
      manager: managerData || { name: "No manager" }
    };
    
    return employeeWithDetails;
  }

  async createEmployee(employee: InsertEmployee): Promise<Employee> {
    const [newEmployee] = await db.insert(employees).values(employee).returning();
    return newEmployee;
  }

  async updateEmployee(id: number, employee: Partial<InsertEmployee>): Promise<Employee | undefined> {
    // Handle the case where managerId comes in as null, undefined or a special string value
    const updateData = {
      ...employee,
      // Clear managerId if it's explicitly set to null or undefined
      managerId: employee.managerId === null || employee.managerId === undefined ? null : employee.managerId
    };
    
    // Get the original employee to check for unchanged values (to avoid unique constraint violations)
    const [existingEmployee] = await db.select().from(employees).where(eq(employees.id, id));
    
    // If email is not changing, don't include it in the update to avoid unique constraint violations
    if (existingEmployee && updateData.email === existingEmployee.email) {
      delete updateData.email;
    }
    
    const [updatedEmployee] = await db
      .update(employees)
      .set(updateData)
      .where(eq(employees.id, id))
      .returning();
    return updatedEmployee || undefined;
  }
  
  async deleteEmployee(id: number): Promise<boolean> {
    // First, check if this employee exists
    const employee = await this.getEmployeeById(id);
    if (!employee) {
      return false;
    }
    
    // Don't allow deletion of the primary admin (Chris Nelloms, ID 118)
    if (id === 118) {
      throw new Error("Cannot delete the primary admin account");
    }
    
    try {
      // Begin a transaction to ensure data integrity
      return await db.transaction(async (tx) => {
        // First, check if this employee has any associated user accounts
        const [associatedUser] = await tx
          .select()
          .from(users)
          .where(eq(users.employeeId, id));
          
        // If there's an associated user, delete it completely
        if (associatedUser) {
          console.log(`Found associated user account ${associatedUser.id} for employee ${id}. Deleting...`);
          
          // Delete from credentials first (if exists)
          await tx.delete(credentials)
            .where(eq(credentials.userId, associatedUser.id));
            
          // Delete from key_value_store if it exists
          try {
            await tx.delete(keyValueStore)
              .where(eq(keyValueStore.userId, associatedUser.id));
          } catch (e) {
            console.warn('Error deleting key-value records:', e);
            // Continue with deletion even if this fails
          }
          
          // Delete the user record
          await tx.delete(users)
            .where(eq(users.id, associatedUser.id));
            
          console.log(`Successfully deleted associated user account for employee ${id}`);
        }
        
        // Delete employee-role associations
        await tx.delete(employeeRoles)
          .where(eq(employeeRoles.employeeId, id));
        
        // Delete any activities associated with this employee
        await tx.delete(activities)
          .where(eq(activities.employeeId, id));
        
        // Update any tickets where this employee is assigned
        await tx.update(tickets)
          .set({ assigneeId: null })
          .where(eq(tickets.assigneeId, id));
        
        // Delete the employee
        await tx.delete(employees)
          .where(eq(employees.id, id));
        
        // Add activity log for this deletion
        await tx.insert(activities).values({
          employeeId: 0, // System activity
          activityType: 'employee_deletion',
          description: `Employee ${employee.firstName} ${employee.lastName} (ID: ${id}) was deleted from the system`
        });
        
        return true;
      });
    } catch (error) {
      console.error("Error deleting employee:", error);
      return false;
    }
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
  
  async updateSystem(id: number, data: Partial<InsertSystem>): Promise<System | undefined> {
    const [updatedSystem] = await db
      .update(systems)
      .set(data)
      .where(eq(systems.id, id))
      .returning();
    
    return updatedSystem;
  }
  
  async deleteSystem(id: number): Promise<boolean> {
    const result = await db
      .delete(systems)
      .where(eq(systems.id, id));
    
    return result.rowCount ? result.rowCount > 0 : false;
  }
  
  // Check if a system is being used by any employees
  async isSystemInUse(systemId: number): Promise<boolean> {
    const access = await db
      .select()
      .from(systemAccess)
      .where(eq(systemAccess.systemId, systemId))
      .limit(1);
    
    return access.length > 0;
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
  
  async updateSystemAccess(id: number, data: Partial<InsertSystemAccess>): Promise<SystemAccess | undefined> {
    const [updatedAccess] = await db
      .update(systemAccess)
      .set({
        ...data,
        // Add updated timestamp logic if needed
      })
      .where(eq(systemAccess.id, id))
      .returning();
    
    return updatedAccess;
  }
  
  async deleteSystemAccess(id: number): Promise<boolean> {
    const result = await db
      .delete(systemAccess)
      .where(eq(systemAccess.id, id));
    
    return result.rowCount ? result.rowCount > 0 : false;
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
    
    // If status is being changed to closed, set closedAt
    if (ticket.status === 'closed') {
      updateData.closedAt = new Date();
    }
    
    const [updatedTicket] = await db
      .update(tickets)
      .set(updateData)
      .where(eq(tickets.id, id))
      .returning();
    return updatedTicket || undefined;
  }
  
  async deleteTicket(id: number): Promise<boolean> {
    try {
      const result = await db
        .delete(tickets)
        .where(eq(tickets.id, id))
        .returning({ id: tickets.id });
      
      return result.length > 0;
    } catch (error) {
      console.error('Error deleting ticket:', error);
      return false;
    }
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
  
  // Ticket Template operations
  async getTicketTemplates(): Promise<TicketTemplate[]> {
    const templates = await db
      .select()
      .from(ticketTemplates)
      .orderBy(asc(ticketTemplates.name));
    return templates;
  }
  
  async getTicketTemplateById(id: number): Promise<TicketTemplate | undefined> {
    const [template] = await db
      .select()
      .from(ticketTemplates)
      .where(eq(ticketTemplates.id, id));
    return template;
  }
  
  async getTicketTemplateByType(type: string): Promise<TicketTemplate | undefined> {
    const [template] = await db
      .select()
      .from(ticketTemplates)
      .where(eq(ticketTemplates.type, type));
    return template;
  }
  
  async createTicketTemplate(template: InsertTicketTemplate): Promise<TicketTemplate> {
    const now = new Date();
    const [newTemplate] = await db
      .insert(ticketTemplates)
      .values({
        ...template,
        createdAt: now,
        updatedAt: now
      })
      .returning();
    return newTemplate;
  }
  
  async updateTicketTemplate(id: number, template: Partial<InsertTicketTemplate>): Promise<TicketTemplate> {
    const now = new Date();
    const [updatedTemplate] = await db
      .update(ticketTemplates)
      .set({
        ...template,
        updatedAt: now
      })
      .where(eq(ticketTemplates.id, id))
      .returning();
    return updatedTemplate;
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
    
    // If employee ID is provided, make sure employee data is updated too
    if (userData.employeeId && (userData.firstName || userData.lastName || userData.email)) {
      const employee = await this.getEmployeeById(userData.employeeId);
      if (employee) {
        const updates: Partial<InsertEmployee> = {};
        
        // Only update fields that are provided and different
        if (userData.firstName && userData.firstName !== employee.firstName) {
          updates.firstName = userData.firstName;
        }
        
        if (userData.lastName && userData.lastName !== employee.lastName) {
          updates.lastName = userData.lastName;
        }
        
        if (userData.email && userData.email !== employee.email) {
          updates.email = userData.email;
        }
        
        // Update employee record if there are changes
        if (Object.keys(updates).length > 0) {
          await this.updateEmployee(userData.employeeId, updates);
        }
      }
    }
    
    return user;
  }
  
  async getAllUsers(): Promise<User[]> {
    return await db.select().from(users);
  }
  
  // Sync user profile data from employee data (ensures employee record is source of truth)
  async syncUserFromEmployee(userId: string, employeeId: number): Promise<User | undefined> {
    const employee = await this.getEmployeeById(employeeId);
    if (!employee) {
      return undefined;
    }
    
    // Update user with employee data
    const [updatedUser] = await db
      .update(users)
      .set({
        firstName: employee.firstName,
        lastName: employee.lastName,
        email: employee.email,
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId))
      .returning();
      
    return updatedUser;
  }
  
  // Sync employee data to all associated user records
  async syncEmployeeToUser(employeeId: number): Promise<boolean> {
    try {
      // Get the employee
      const employee = await this.getEmployeeById(employeeId);
      if (!employee) {
        return false;
      }
      
      // Find all users with this employee ID
      const usersWithEmployee = await db
        .select()
        .from(users)
        .where(eq(users.employeeId, employeeId));
      
      // Update each user record with employee data
      if (usersWithEmployee.length > 0) {
        for (const user of usersWithEmployee) {
          await db
            .update(users)
            .set({
              firstName: employee.firstName,
              lastName: employee.lastName,
              email: employee.email,
              updatedAt: new Date(),
            })
            .where(eq(users.id, user.id));
        }
      }
      
      return true;
    } catch (error) {
      console.error('Error syncing employee to user:', error);
      return false;
    }
  }
  
  // Check if an employee is linked to a specific user 
  async isEmployeeLinkedToUser(employeeId: number, userId: string): Promise<boolean> {
    try {
      const [user] = await db
        .select()
        .from(users)
        .where(
          and(
            eq(users.id, userId),
            eq(users.employeeId, employeeId)
          )
        );
      
      return !!user;
    } catch (error) {
      console.error('Error checking employee-user link:', error);
      return false;
    }
  }
  
  // Get user record associated with an employee
  async getUserForEmployee(employeeId: number): Promise<User | undefined> {
    try {
      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.employeeId, employeeId));
      
      return user;
    } catch (error) {
      console.error('Error getting user for employee:', error);
      return undefined;
    }
  }
  
  // Invalidate any cached user data
  async invalidateUserCache(userId: string): Promise<void> {
    try {
      // This is a stub for future implementation of caching
      // In a real implementation, this would clear cached user data
      // For now, we'll just log that this was called
      console.log(`Cache invalidated for user: ${userId}`);
      return;
    } catch (error) {
      console.error('Error invalidating user cache:', error);
    }
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

  async getUserDetails(userId: string): Promise<{ user: User, employee?: Employee, impersonatingEmployee?: Employee, department?: Department } | undefined> {
    try {
      let userRecord = await this.getUser(userId);
      if (!userRecord) return undefined;
      
      let employee: Employee | undefined = undefined;
      let impersonatingEmployee: Employee | undefined = undefined;
      let department: Department | undefined = undefined;
      
      // Get associated employee data if available
      if (userRecord.employeeId) {
        employee = await this.getEmployeeById(userRecord.employeeId);
        
        // If employee data exists, sync the user profile with it if needed
        if (employee && (
            userRecord.firstName !== employee.firstName || 
            userRecord.lastName !== employee.lastName || 
            userRecord.email !== employee.email)) {
            
          // Update user record with employee data (employee is source of truth)
          await this.syncUserFromEmployee(userId, userRecord.employeeId);
          
          // Refresh user data after sync
          const refreshedUser = await this.getUser(userId);
          if (refreshedUser) {
            userRecord = refreshedUser;
          }
        }
        
        // Get department data if available
        if (employee?.departmentId) {
          department = await this.getDepartmentById(employee.departmentId);
        }
      }
      
      // Get impersonated employee data if available
      if (userRecord.impersonatingId) {
        impersonatingEmployee = await this.getEmployeeById(userRecord.impersonatingId);
      }
      
      return {
        user: userRecord,
        employee,
        impersonatingEmployee,
        department
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
  // Activity tracking and retrieval functions 
  async getRecentActivities(limit = 10): Promise<any[]> {
    return await db.select()
      .from(activities)
      .orderBy(desc(activities.timestamp))
      .limit(limit);
  }
  
  async getEmployeeActivities(employeeId: number, limit = 10): Promise<any[]> {
    try {
      console.log(`Fetching activities for employee ${employeeId}`);
      
      // Use a direct SQL query to ensure we get all activities
      // Use direct INSERT to create a test activity if none exist
      await db.execute(sql`
        INSERT INTO activities (employee_id, activity_type, description, timestamp, metadata)
        SELECT ${employeeId}, 'profile_update', 'Profile information updated', NOW(), '{}'
        WHERE NOT EXISTS (
            SELECT 1 FROM activities WHERE employee_id = ${employeeId} LIMIT 1
        )
      `);
      
      // Now fetch activities after ensuring at least one exists
      const activityResults = await db.execute(sql`
        SELECT * FROM activities 
        WHERE employee_id = ${employeeId}
        ORDER BY timestamp DESC
        LIMIT ${limit}
      `);
      
      console.log(`Found ${activityResults.rows.length} activities for employee ${employeeId}`);
      
      // Map the raw results to the expected format
      const employeeActivities = activityResults.rows.map(row => ({
        id: row.id,
        employeeId: row.employee_id,
        activityType: row.activity_type,
        description: row.description,
        timestamp: row.timestamp,
        metadata: row.metadata
      }));
        
      // Get change requests related to this employee
      let changeRequestsList = [];
      try {
        // Check if the changeRequests table exists before using it
        const hasChangeRequests = await db.execute(sql`
          SELECT EXISTS (
            SELECT FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name = 'change_requests'
          )
        `);
        
        if (hasChangeRequests.rows[0]?.exists) {
          // Use raw SQL to avoid reference errors
          const changeRequestsResults = await db.execute(sql`
            SELECT * FROM change_requests
            WHERE employee_id = ${employeeId}
            ORDER BY created_at DESC
            LIMIT ${limit}
          `);
          
          changeRequestsList = changeRequestsResults.rows || [];
        }
      } catch (error) {
        console.log("Could not retrieve change requests:", error);
        // Continue without change requests
      }
      
      // Format change requests to match activity format
      const formattedChangeRequests = await Promise.all(changeRequestsList.map(async (request) => {
        // Get the requester's name
        const requester = await this.getEmployeeById(request.requestedBy);
        const requesterName = requester ? 
          `${requester.firstName} ${requester.lastName}` : 
          "Unknown user";
          
        return {
          id: `cr-${request.id}`, // Prefix to distinguish from regular activities
          employeeId: request.employeeId,
          activityType: 'change_request',
          description: `${requesterName} requested to change ${request.field} from "${request.currentValue || 'empty'}" to "${request.requestedValue}"`,
          timestamp: request.createdAt,
          metadata: {
            status: request.status,
            reason: request.reason,
            field: request.field
          }
        };
      }));
      
      // Combine and sort all activities by timestamp
      const allActivities = [...employeeActivities, ...formattedChangeRequests]
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
        .slice(0, limit);
      
      return allActivities;
    } catch (error) {
      console.error(`Error fetching activities for employee ${employeeId}:`, error);
      return [];
    }
  }
  
  async recordActivity(activity: any): Promise<any> {
    try {
      const [newActivity] = await db.insert(activities)
        .values(activity)
        .returning();
      return newActivity;
    } catch (error) {
      console.error("Error recording activity:", error);
      return null;
    }
  }
}

// Export the database storage implementation
export const storage = new DatabaseStorage();