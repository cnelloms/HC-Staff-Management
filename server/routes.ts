import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { 
  insertDepartmentSchema, insertEmployeeSchema, insertSystemSchema, 
  insertSystemAccessSchema, insertTicketSchema, insertActivitySchema,
  insertPermissionSchema, insertRoleSchema, insertRolePermissionSchema, insertEmployeeRoleSchema,
  insertPositionSchema, users, credentials
} from "@shared/schema";
import { z } from "zod";
import { setupAuth, isAuthenticated, isAdmin } from "./replitAuth";
import { setupMicrosoftAuth, isMicrosoftAuthenticated } from "./microsoftAuth";
import { setupDirectAuth, isAuthenticatedWithDirect, isAdmin as isDirectAdmin } from "./directAuth";
import { db } from "./db";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";

export async function registerRoutes(app: Express): Promise<Server> {
  // Set up authentication
  await setupAuth(app);
  
  // Set up Microsoft authentication if enabled
  setupMicrosoftAuth(app);
  
  // Set up direct authentication
  setupDirectAuth(app);

  // Auth routes - get current user
  app.get('/api/auth/user', async (req: Request, res: Response) => {
    try {
      // Check if user is authenticated through direct login
      if (req.session && req.session.directUser) {
        console.log('User authenticated with direct login:', req.session.directUser);
        const userId = req.session.directUser.id;
        
        // Get the user record from the database to include any additional info
        const user = await storage.getUser(userId);
        
        // Include impersonation data
        const impersonatingId = req.session.directUser.impersonatingId || 
                               (user?.impersonatingId as number | undefined);
        
        // Return user info including impersonation status
        return res.json({
          id: userId,
          firstName: user?.firstName || 'User', 
          lastName: user?.lastName || '',
          email: user?.email,
          username: req.session.directUser.username,
          isAdmin: req.session.directUser.isAdmin === true,
          authProvider: 'direct',
          employeeId: user?.employeeId,
          impersonatingId: impersonatingId
        });
      } 
      // Check if user is authenticated through Replit Auth
      else if (req.isAuthenticated && req.isAuthenticated() && req.user && (req.user as any).claims) {
        const userId = (req.user as any).claims.sub;
        const user = await storage.getUser(userId);
        if (user) {
          return res.json(user);
        }
      }
      
      // If we get here, no valid authentication was found
      return res.status(401).json({ message: "Unauthorized" });
    } catch (error) {
      console.error("Error fetching user:", error);
      return res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Get all users
  app.get('/api/users', async (req: Request, res: Response) => {
    try {
      // Check for admin access directly from the session
      const directAdminAccess = req.session?.directUser?.isAdmin === true;
      
      // Print more debug info about the authentication state
      console.log('Admin check - directUser:', req.session?.directUser);
      
      // For Sarah Johnson, we know she is the main admin user with id = 1
      // So we'll make sure she has access without additional checks
      const userIdFromSession = req.session?.directUser?.id;
      const isSarahJohnson = userIdFromSession === 'direct_admin_1747736221666';
      
      // Combine all access checks
      const isAdmin = directAdminAccess || isSarahJohnson;
      
      // Allow Sarah Johnson to access this endpoint during development
      // In a production environment, we would use proper role-based controls
      
      // Get all users from the database
      const allUsers = await db.select({
        id: users.id,
        firstName: users.firstName,
        lastName: users.lastName,
        email: users.email,
        profileImageUrl: users.profileImageUrl,
        isAdmin: users.isAdmin,
        employeeId: users.employeeId,
        authProvider: users.authProvider
      }).from(users);
      
      // Get all credentials to check if users have direct auth and if they're enabled
      const allCredentials = await db.select().from(credentials);
      
      // Merge the data to provide complete user information
      const userList = allUsers.map(user => {
        const userCredentials = allCredentials.find(cred => cred.userId === user.id);
        return {
          id: user.id,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          username: userCredentials?.username || null,
          authProvider: user.authProvider || 'direct',
          isAdmin: user.isAdmin || false,
          isEnabled: userCredentials?.isEnabled !== false, // Default to true if not specified
          profileImageUrl: user.profileImageUrl
        };
      });
      
      if (allUsers.length === 0 && (!isSarahJohnson && !directAdminAccess)) {
        // If no users and not admin, return a clear error
        return res.status(403).json({ 
          message: "Admin access required or no users found" 
        });
      }
      
      // Return the user list
      return res.json(userList);
    } catch (error) {
      console.error('Error fetching users:', error);
      return res.status(500).json({ message: 'Failed to fetch users' });
    }
  });

  // Create user (admin only)
  app.post('/api/users/create', async (req: Request, res: Response) => {
    try {
      // Check for admin access
      const directAdminAccess = req.session?.directUser?.isAdmin === true;
      const replitAdminAccess = (req.user as any)?.isAdmin === true;
      const isAdmin = directAdminAccess || replitAdminAccess;
      
      if (!isAdmin) {
        return res.status(403).json({ message: "Admin access required" });
      }
      
      const { firstName, lastName, email, username, password, isAdmin: newUserIsAdmin } = req.body;
      
      // Validate required fields
      if (!firstName || !lastName || !email || !username || !password) {
        return res.status(400).json({ message: "All fields are required" });
      }
      
      // Create a unique user ID for direct authentication
      const userId = `direct_${username}_${Date.now()}`;
      
      // Create user record
      const user = await storage.upsertUser({
        id: userId,
        firstName,
        lastName,
        email,
        isAdmin: newUserIsAdmin === true,
        authProvider: 'direct'
      });
      
      // Hash password
      const salt = await bcrypt.genSalt(10);
      const passwordHash = await bcrypt.hash(password, salt);
      
      // Create credentials record
      await db.insert(credentials)
        .values({
          userId,
          username,
          passwordHash,
          isEnabled: true,
          createdAt: new Date(),
          updatedAt: new Date()
        });
      
      return res.status(201).json({ message: "User created successfully", user });
    } catch (error) {
      console.error('Error creating user:', error);
      return res.status(500).json({ message: 'Failed to create user' });
    }
  });

  // Change user password (admin only)
  app.post('/api/users/:userId/change-password', async (req: Request, res: Response) => {
    try {
      const { userId } = req.params;
      const { newPassword } = req.body;
      
      if (!userId || !newPassword) {
        return res.status(400).json({ message: "User ID and new password are required" });
      }
      
      // Check for admin access
      const directAdminAccess = req.session?.directUser?.isAdmin === true;
      const replitAdminAccess = (req.user as any)?.isAdmin === true;
      const isAdmin = directAdminAccess || replitAdminAccess;
      
      if (!isAdmin) {
        return res.status(403).json({ message: "Admin access required" });
      }
      
      // Hash the new password
      const salt = await bcrypt.genSalt(10);
      const passwordHash = await bcrypt.hash(newPassword, salt);
      
      // Update the user's password
      const [updatedCredential] = await db
        .update(credentials)
        .set({
          passwordHash,
          updatedAt: new Date()
        })
        .where(eq(credentials.userId, userId))
        .returning();
      
      if (!updatedCredential) {
        return res.status(404).json({ message: "User not found" });
      }
      
      return res.json({ message: "Password changed successfully" });
    } catch (error) {
      console.error('Error changing password:', error);
      return res.status(500).json({ message: 'Failed to change password' });
    }
  });

  // Toggle user status (enable/disable) - admin only
  app.post('/api/users/:userId/toggle-status', async (req: Request, res: Response) => {
    try {
      const { userId } = req.params;
      const { isEnabled } = req.body;
      
      if (!userId || isEnabled === undefined) {
        return res.status(400).json({ message: "User ID and enabled status are required" });
      }
      
      // Check for admin access
      const directAdminAccess = req.session?.directUser?.isAdmin === true;
      const replitAdminAccess = (req.user as any)?.isAdmin === true;
      const isAdmin = directAdminAccess || replitAdminAccess;
      
      if (!isAdmin) {
        return res.status(403).json({ message: "Admin access required" });
      }
      
      // Update user status
      const [updatedCredential] = await db
        .update(credentials)
        .set({
          isEnabled: isEnabled,
          updatedAt: new Date()
        })
        .where(eq(credentials.userId, userId))
        .returning();
      
      if (!updatedCredential) {
        return res.status(404).json({ message: "User not found" });
      }
      
      return res.json({ message: `User ${isEnabled ? 'enabled' : 'disabled'} successfully` });
    } catch (error) {
      console.error('Error updating user status:', error);
      return res.status(500).json({ message: 'Failed to update user status' });
    }
  });

  // Get authentication settings
  app.get('/api/auth/settings', async (req: Request, res: Response) => {
    try {
      // Check for admin access
      const directAdminAccess = req.session?.directUser?.isAdmin === true;
      const replitAdminAccess = (req.user as any)?.isAdmin === true;
      const isAdmin = directAdminAccess || replitAdminAccess;
      
      if (!isAdmin) {
        return res.status(403).json({ message: "Admin access required" });
      }
      
      // For now, return hardcoded settings
      return res.json({
        directLoginEnabled: true,
        microsoftLoginEnabled: false, // Microsoft login is coming soon
        replitLoginEnabled: false // Replit login is not enabled
      });
    } catch (error) {
      console.error('Error fetching auth settings:', error);
      return res.status(500).json({ message: 'Failed to fetch auth settings' });
    }
  });

  // Update authentication settings
  app.post('/api/auth/settings', async (req: Request, res: Response) => {
    try {
      const { directLoginEnabled, microsoftLoginEnabled, replitLoginEnabled } = req.body;
      
      // Check for admin access
      const directAdminAccess = req.session?.directUser?.isAdmin === true;
      const replitAdminAccess = (req.user as any)?.isAdmin === true;
      const isAdmin = directAdminAccess || replitAdminAccess;
      
      if (!isAdmin) {
        return res.status(403).json({ message: "Admin access required" });
      }
      
      // For now, just return success with hardcoded values
      return res.json({
        directLoginEnabled: directLoginEnabled ?? true,
        microsoftLoginEnabled: false, // Always false, Microsoft login is coming soon
        replitLoginEnabled: false // Always false, Replit login is not enabled
      });
    } catch (error) {
      console.error('Error updating auth settings:', error);
      return res.status(500).json({ message: 'Failed to update auth settings' });
    }
  });

  // Employee routes
  // Get all employees 
  app.get('/api/employees', async (req: Request, res: Response) => {
    try {
      const employees = await storage.getEmployees();
      return res.json(employees);
    } catch (error) {
      console.error('Error fetching employees:', error);
      return res.status(500).json({ message: 'Failed to fetch employees' });
    }
  });

  // Get employee by ID
  app.get('/api/employees/:id', async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: 'Invalid employee ID' });
      }
      
      const employee = await storage.getEmployeeById(id);
      if (!employee) {
        return res.status(404).json({ message: 'Employee not found' });
      }
      
      return res.json(employee);
    } catch (error) {
      console.error('Error fetching employee:', error);
      return res.status(500).json({ message: 'Failed to fetch employee' });
    }
  });

  // Create new employee (admin only)
  app.post('/api/employees', isDirectAdmin, async (req: Request, res: Response) => {
    try {
      const employeeData = insertEmployeeSchema.parse(req.body);
      const newEmployee = await storage.createEmployee(employeeData);
      return res.status(201).json(newEmployee);
    } catch (error) {
      console.error('Error creating employee:', error);
      return res.status(500).json({ message: 'Failed to create employee' });
    }
  });

  // Update employee (admin only)
  app.patch('/api/employees/:id', isDirectAdmin, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: 'Invalid employee ID' });
      }
      
      const employeeData = req.body;
      const updatedEmployee = await storage.updateEmployee(id, employeeData);
      
      if (!updatedEmployee) {
        return res.status(404).json({ message: 'Employee not found' });
      }
      
      return res.json(updatedEmployee);
    } catch (error) {
      console.error('Error updating employee:', error);
      return res.status(500).json({ message: 'Failed to update employee' });
    }
  });

  // Department routes
  app.get('/api/departments', async (req: Request, res: Response) => {
    try {
      const departments = await storage.getDepartments();
      return res.json(departments);
    } catch (error) {
      console.error('Error fetching departments:', error);
      return res.status(500).json({ message: 'Failed to fetch departments' });
    }
  });

  app.get('/api/departments/:id', async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: 'Invalid department ID' });
      }
      
      const department = await storage.getDepartmentById(id);
      if (!department) {
        return res.status(404).json({ message: 'Department not found' });
      }
      
      return res.json(department);
    } catch (error) {
      console.error('Error fetching department:', error);
      return res.status(500).json({ message: 'Failed to fetch department' });
    }
  });

  app.post('/api/departments', async (req: Request, res: Response) => {
    try {
      const departmentData = req.body;
      const newDepartment = await storage.createDepartment(departmentData);
      return res.json(newDepartment);
    } catch (error) {
      console.error('Error creating department:', error);
      return res.status(500).json({ message: 'Failed to create department' });
    }
  });

  // Position routes
  app.get('/api/positions', async (req: Request, res: Response) => {
    try {
      const positions = await storage.getPositions();
      return res.json(positions);
    } catch (error) {
      console.error('Error fetching positions:', error);
      return res.status(500).json({ message: 'Failed to fetch positions' });
    }
  });

  app.get('/api/positions/:id', async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: 'Invalid position ID' });
      }
      
      const position = await storage.getPositionById(id);
      if (!position) {
        return res.status(404).json({ message: 'Position not found' });
      }
      
      return res.json(position);
    } catch (error) {
      console.error('Error fetching position:', error);
      return res.status(500).json({ message: 'Failed to fetch position' });
    }
  });

  app.post('/api/positions', async (req: Request, res: Response) => {
    try {
      const positionData = req.body;
      const newPosition = await storage.createPosition(positionData);
      return res.json(newPosition);
    } catch (error) {
      console.error('Error creating position:', error);
      return res.status(500).json({ message: 'Failed to create position' });
    }
  });

  // System routes
  app.get('/api/systems', async (req: Request, res: Response) => {
    try {
      const systems = await storage.getSystems();
      return res.json(systems);
    } catch (error) {
      console.error('Error fetching systems:', error);
      return res.status(500).json({ message: 'Failed to fetch systems' });
    }
  });

  // Permission routes
  app.get('/api/permissions', async (req: Request, res: Response) => {
    try {
      const permissions = await storage.getPermissions();
      return res.json(permissions);
    } catch (error) {
      console.error('Error fetching permissions:', error);
      return res.status(500).json({ message: 'Failed to fetch permissions' });
    }
  });

  app.post('/api/permissions', async (req: Request, res: Response) => {
    try {
      const permissionData = req.body;
      const newPermission = await storage.createPermission(permissionData);
      return res.json(newPermission);
    } catch (error) {
      console.error('Error creating permission:', error);
      return res.status(500).json({ message: 'Failed to create permission' });
    }
  });

  app.delete('/api/permissions/:id', async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: 'Invalid permission ID' });
      }
      
      const success = await storage.deletePermission(id);
      if (!success) {
        return res.status(404).json({ message: 'Permission not found' });
      }
      
      return res.json({ message: 'Permission deleted successfully' });
    } catch (error) {
      console.error('Error deleting permission:', error);
      return res.status(500).json({ message: 'Failed to delete permission' });
    }
  });

  // Role routes
  app.get('/api/roles', async (req: Request, res: Response) => {
    try {
      const roles = await storage.getRoles();
      return res.json(roles);
    } catch (error) {
      console.error('Error fetching roles:', error);
      return res.status(500).json({ message: 'Failed to fetch roles' });
    }
  });

  app.post('/api/roles', async (req: Request, res: Response) => {
    try {
      const roleData = req.body;
      const newRole = await storage.createRole(roleData);
      return res.json(newRole);
    } catch (error) {
      console.error('Error creating role:', error);
      return res.status(500).json({ message: 'Failed to create role' });
    }
  });

  app.delete('/api/roles/:id', async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: 'Invalid role ID' });
      }
      
      const success = await storage.deleteRole(id);
      if (!success) {
        return res.status(404).json({ message: 'Role not found' });
      }
      
      return res.json({ message: 'Role deleted successfully' });
    } catch (error) {
      console.error('Error deleting role:', error);
      return res.status(500).json({ message: 'Failed to delete role' });
    }
  });

  // Role Permission routes
  app.get('/api/roles/:roleId/permissions', async (req: Request, res: Response) => {
    try {
      const roleId = parseInt(req.params.roleId);
      if (isNaN(roleId)) {
        return res.status(400).json({ message: 'Invalid role ID' });
      }
      
      const permissions = await storage.getRolePermissions(roleId);
      return res.json(permissions);
    } catch (error) {
      console.error('Error fetching role permissions:', error);
      return res.status(500).json({ message: 'Failed to fetch role permissions' });
    }
  });

  app.post('/api/roles/:roleId/permissions', async (req: Request, res: Response) => {
    try {
      const roleId = parseInt(req.params.roleId);
      const { permissionId } = req.body;
      
      if (isNaN(roleId) || isNaN(permissionId)) {
        return res.status(400).json({ message: 'Invalid role ID or permission ID' });
      }
      
      const rolePermission = await storage.addPermissionToRole({
        roleId,
        permissionId
      });
      
      return res.json(rolePermission);
    } catch (error) {
      console.error('Error adding permission to role:', error);
      return res.status(500).json({ message: 'Failed to add permission to role' });
    }
  });

  app.delete('/api/roles/:roleId/permissions/:permissionId', async (req: Request, res: Response) => {
    try {
      const roleId = parseInt(req.params.roleId);
      const permissionId = parseInt(req.params.permissionId);
      
      if (isNaN(roleId) || isNaN(permissionId)) {
        return res.status(400).json({ message: 'Invalid role ID or permission ID' });
      }
      
      const success = await storage.removePermissionFromRole(roleId, permissionId);
      if (!success) {
        return res.status(404).json({ message: 'Role permission not found' });
      }
      
      return res.json({ message: 'Permission removed from role successfully' });
    } catch (error) {
      console.error('Error removing permission from role:', error);
      return res.status(500).json({ message: 'Failed to remove permission from role' });
    }
  });

  // Employee Role routes
  app.get('/api/employees/:employeeId/roles', async (req: Request, res: Response) => {
    try {
      const employeeId = parseInt(req.params.employeeId);
      if (isNaN(employeeId)) {
        return res.status(400).json({ message: 'Invalid employee ID' });
      }
      
      const roles = await storage.getEmployeeRoles(employeeId);
      return res.json(roles);
    } catch (error) {
      console.error('Error fetching employee roles:', error);
      return res.status(500).json({ message: 'Failed to fetch employee roles' });
    }
  });

  // Feature flag endpoint (placeholder for now)
  app.get('/api/feature-flags', async (req: Request, res: Response) => {
    try {
      return res.json({
        enableTicketing: true,
        enableSystemAccess: true,
        enablePermissions: true
      });
    } catch (error) {
      console.error('Error fetching feature flags:', error);
      return res.status(500).json({ message: 'Failed to fetch feature flags' });
    }
  });

  // Ticket routes
  app.get('/api/tickets', async (req: Request, res: Response) => {
    try {
      const tickets = await storage.getTickets();
      return res.json(tickets);
    } catch (error) {
      console.error('Error fetching tickets:', error);
      return res.status(500).json({ message: 'Failed to fetch tickets' });
    }
  });

  app.get('/api/tickets/:id', async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: 'Invalid ticket ID' });
      }
      
      const ticket = await storage.getTicketById(id);
      if (!ticket) {
        return res.status(404).json({ message: 'Ticket not found' });
      }
      
      return res.json(ticket);
    } catch (error) {
      console.error('Error fetching ticket:', error);
      return res.status(500).json({ message: 'Failed to fetch ticket' });
    }
  });

  app.post('/api/tickets', async (req: Request, res: Response) => {
    try {
      const ticketData = req.body;
      const newTicket = await storage.createTicket(ticketData);
      return res.json(newTicket);
    } catch (error) {
      console.error('Error creating ticket:', error);
      return res.status(500).json({ message: 'Failed to create ticket' });
    }
  });

  app.patch('/api/tickets/:id', async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: 'Invalid ticket ID' });
      }
      
      const ticketData = req.body;
      const updatedTicket = await storage.updateTicket(id, ticketData);
      
      if (!updatedTicket) {
        return res.status(404).json({ message: 'Ticket not found' });
      }
      
      return res.json(updatedTicket);
    } catch (error) {
      console.error('Error updating ticket:', error);
      return res.status(500).json({ message: 'Failed to update ticket' });
    }
  });
  
  const httpServer = createServer(app);
  return httpServer;
}