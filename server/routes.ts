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

  // Get all users (admin only)
  app.get('/api/users', async (req: Request, res: Response) => {
    try {
      // Check for admin access directly from the session
      const directAdminAccess = req.session?.directUser?.isAdmin === true;
      const replitAdminAccess = (req.user as any)?.isAdmin === true;
      const isAdmin = directAdminAccess || replitAdminAccess;
      
      if (!isAdmin) {
        return res.status(403).json({ message: "Admin access required" });
      }
      
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
  
  const httpServer = createServer(app);
  return httpServer;
}