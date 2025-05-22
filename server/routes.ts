import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { 
  insertDepartmentSchema, insertEmployeeSchema, insertSystemSchema, 
  insertSystemAccessSchema, insertTicketSchema, insertActivitySchema,
  insertPermissionSchema, insertRoleSchema, insertRolePermissionSchema, insertEmployeeRoleSchema,
  insertPositionSchema, users, credentials, authSettings
} from "@shared/schema";
import { z } from "zod";
import { setupReplitAuth } from "./replitAuth";
import { setupMicrosoftAuth } from "./microsoftAuth";
import { setupDirectAuth } from "./directAuth";
import { isAuthenticated, isAdmin } from "./middleware/auth-middleware";
import { deleteUser } from "./user-delete-route";
import { db } from "./db";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { enrichRoles, requireRole } from "./middleware/role-middleware";
import { requireAdmin, requireEmployeeRole } from "./authMiddleware";

import notificationRoutes from "./notification-routes";
import changeRequestRoutes from "./change-request-routes";
import adminRoutes from "./admin-routes";

export async function registerRoutes(app: Express): Promise<Server> {
  // Set up Replit authentication
  await setupReplitAuth(app);
  
  // Set up Microsoft authentication if enabled
  setupMicrosoftAuth(app);
  
  // Set up direct authentication
  setupDirectAuth(app);
  
  // Apply role enrichment middleware after authentication
  app.use(enrichRoles);
  
  // Mount API routes
  app.use('/api', changeRequestRoutes);
  
  // Mount admin routes with proper middleware
  app.use('/api/admin/users', isAuthenticated, requireAdmin, adminRoutes);
  
  // Emergency standalone login page
  app.get('/emergency-login', (req, res) => {
    res.send(`
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=yes">
        <title>Staff Management System - Emergency Login</title>
        <style>
          body {
            font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background-color: #f8f9fa;
            margin: 0;
            padding: 0;
            display: flex;
            align-items: center;
            justify-content: center;
            min-height: 100vh;
          }
          .container { width: 100%; max-width: 400px; padding: 20px; }
          .card {
            background-color: white;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.1);
            overflow: hidden;
          }
          .card-header { padding: 20px; border-bottom: 1px solid #e5e7eb; }
          .card-header h1 { margin: 0; font-size: 1.5rem; font-weight: 600; color: #1f2937; }
          .card-header p { margin: 5px 0 0; color: #6b7280; font-size: 0.875rem; }
          .card-body { padding: 20px; }
          .form-group { margin-bottom: 16px; }
          label {
            display: block;
            margin-bottom: 6px;
            font-size: 0.875rem;
            font-weight: 500;
            color: #374151;
          }
          input {
            width: 100%;
            padding: 8px 12px;
            border: 1px solid #d1d5db;
            border-radius: 4px;
            font-size: 0.875rem;
            box-sizing: border-box;
          }
          button {
            width: 100%;
            padding: 10px;
            background-color: #2563eb;
            color: white;
            border: none;
            border-radius: 4px;
            font-weight: 500;
            cursor: pointer;
            transition: background-color 0.2s;
          }
          button:hover { background-color: #1d4ed8; }
          button:disabled { background-color: #93c5fd; cursor: not-allowed; }
          .error {
            background-color: #fee2e2;
            border: 1px solid #fca5a5;
            border-radius: 4px;
            padding: 12px;
            margin-bottom: 16px;
            color: #b91c1c;
            font-size: 0.875rem;
            display: flex;
            align-items: center;
          }
          .error svg { margin-right: 8px; flex-shrink: 0; }
          .loading {
            display: inline-block;
            width: 16px;
            height: 16px;
            border: 2px solid rgba(255,255,255,0.3);
            border-radius: 50%;
            border-top-color: white;
            animation: spin 1s ease-in-out infinite;
            margin-right: 8px;
          }
          @keyframes spin { to { transform: rotate(360deg); } }
          .title { text-align: center; margin-bottom: 24px; }
          .title h1 { margin: 0; font-size: 1.875rem; font-weight: bold; color: #2563eb; }
          .title p { margin: 5px 0 0; color: #6b7280; font-size: 0.875rem; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="title">
            <h1>HC Staff</h1>
            <p>Management System</p>
          </div>
          
          <div class="card">
            <div class="card-header">
              <h1>Sign in</h1>
              <p>Enter your username and password to access the system</p>
            </div>
            <div class="card-body">
              <div id="error-message" class="error" style="display: none;">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <circle cx="12" cy="12" r="10"></circle>
                  <line x1="12" y1="8" x2="12" y2="12"></line>
                  <line x1="12" y1="16" x2="12.01" y2="16"></line>
                </svg>
                <span id="error-text"></span>
              </div>
              
              <form id="login-form">
                <div class="form-group">
                  <label for="username">Username</label>
                  <input 
                    id="username" 
                    type="text" 
                    placeholder="Enter your username"
                    required
                  />
                </div>
                
                <div class="form-group">
                  <label for="password">Password</label>
                  <input 
                    id="password" 
                    type="password" 
                    placeholder="Enter your password"
                    required
                  />
                </div>
                
                <button type="submit" id="submit-button">
                  Sign in
                </button>
              </form>
            </div>
          </div>
        </div>

        <script>
          document.addEventListener('DOMContentLoaded', function() {
            const form = document.getElementById('login-form');
            const submitButton = document.getElementById('submit-button');
            const errorMessage = document.getElementById('error-message');
            const errorText = document.getElementById('error-text');
            
            form.addEventListener('submit', async function(e) {
              e.preventDefault();
              
              const username = document.getElementById('username').value;
              const password = document.getElementById('password').value;
              
              if (!username || !password) {
                showError('Username and password are required');
                return;
              }
              
              // Show loading state
              submitButton.disabled = true;
              submitButton.innerHTML = '<span class="loading"></span> Signing in...';
              errorMessage.style.display = 'none';
              
              try {
                const response = await fetch('/api/login/direct', {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                  },
                  body: JSON.stringify({ username, password }),
                  credentials: 'include'
                });
                
                const data = await response.json();
                
                if (!response.ok) {
                  throw new Error(data.message || 'Invalid username or password');
                }
                
                // Successful login - redirect to dashboard
                window.location.href = '/';
                
              } catch (err) {
                showError(err.message || 'Login failed');
                
                // Reset button state
                submitButton.disabled = false;
                submitButton.textContent = 'Sign in';
              }
            });
            
            function showError(message) {
              errorText.textContent = message;
              errorMessage.style.display = 'flex';
            }
          });
        </script>
      </body>
      </html>
    `);
  });

  // Auth routes - get current user
  // Server-side login utility for emergency use
  app.get('/server-login', (req: Request, res: Response) => {
    const errorMessage = req.query.error || '';
    
    res.send(`
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Server Login</title>
        <style>
          body { font-family: system-ui, sans-serif; margin: 0; padding: 20px; display: flex; justify-content: center; align-items: center; min-height: 100vh; background: #f5f5f5; }
          .container { width: 100%; max-width: 400px; background: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
          h1 { margin-top: 0; color: #333; }
          input { display: block; width: 100%; padding: 10px; margin-bottom: 15px; border: 1px solid #ddd; border-radius: 4px; box-sizing: border-box; }
          button { width: 100%; padding: 10px; background: #0070f3; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 16px; }
          .error { color: red; margin-bottom: 15px; }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>Emergency Server Login</h1>
          <div id="errorMessage" class="error" ${!errorMessage ? 'style="display:none"' : ''}>
            ${errorMessage}
          </div>
          <form action="/server-login-submit" method="POST">
            <input type="text" name="username" placeholder="Username" required>
            <input type="password" name="password" placeholder="Password" required>
            <button type="submit">Login</button>
          </form>
        </div>
      </body>
      </html>
    `);
  });
  
  // Process the server login form
  app.post('/server-login-submit', async (req: Request, res: Response) => {
    try {
      const { username, password } = req.body;
      
      if (!username || !password) {
        return res.redirect('/server-login?error=Username and password are required');
      }
      
      // Get credentials by username
      const userCredentialsList = await db.select()
        .from(credentials)
        .where(eq(credentials.username, username))
        .limit(1);
      
      const [userCredentials] = userCredentialsList;
      
      if (!userCredentials) {
        return res.redirect('/server-login?error=Invalid username or password');
      }
      
      if (userCredentials.isEnabled === false) {
        return res.redirect('/server-login?error=This account is disabled');
      }
      
      // Verify password
      const isPasswordValid = await bcrypt.compare(password, userCredentials.passwordHash);
      
      if (!isPasswordValid) {
        return res.redirect('/server-login?error=Invalid username or password');
      }
      
      // Get user from database
      const user = await storage.getUser(userCredentials.userId);
      
      if (!user) {
        return res.redirect('/server-login?error=User not found');
      }
      
      // Update last login time
      await db.update(credentials)
        .set({ 
          lastLoginAt: new Date(),
          updatedAt: new Date()
        })
        .where(eq(credentials.id, userCredentials.id));
      
      // Store user in session
      req.session.directUser = {
        id: user.id,
        username: userCredentials.username,
        isAdmin: user.isAdmin === true,
      };
      
      // Save session and redirect to home
      req.session.save((err) => {
        if (err) {
          console.error('Error saving session:', err);
          return res.redirect('/server-login?error=Error during authentication');
        }
        
        // Successful login - redirect to home
        console.log('Server login successful, redirecting to home');
        return res.redirect('/');
      });
    } catch (error) {
      console.error('Server login error:', error);
      return res.redirect('/server-login?error=Server error during login');
    }
  });
  
  // Auth user endpoint
  app.get('/api/auth/user', async (req: Request, res: Response) => {
    try {
      // Debug session information to help troubleshoot
      console.log('Session in auth/user endpoint:', {
        hasSession: !!req.session,
        hasDirectUser: !!(req.session && req.session.directUser),
        sessionID: req.sessionID,
        cookies: req.headers.cookie
      });
      
      // If session is having problems but a cookie exists, let's handle it properly
      if (req.headers.cookie && req.headers.cookie.includes('staff_mgmt_sid=') && !req.session.directUser) {
        console.log('Cookie exists but no user in session yet');
        
        // Instead of regenerating the session which can cause issues, we'll
        // simply return unauthorized and let the client handle re-login
        return res.status(401).json({ message: 'Session expired, please login again' });
      }
      
      // Define the user profile type definition
      interface UserProfile {
        id: string;
        firstName: string;
        lastName: string;
        email: string | null | undefined;
        username?: string;
        isAdmin: boolean;
        authProvider: string;
        employeeId: number | null | undefined;
        department?: string;
        position?: string;
      }
      
      let userProfile: UserProfile | null = null;
      
      // Check if user is authenticated through direct login
      if (req.session && req.session.directUser) {
        console.log('User authenticated with direct login:', req.session.directUser);
        const userId = req.session.directUser.id;
        
        // Special case for admin user
        if (req.session.directUser.username === 'admin') {
          console.log('Admin user detected in auth/user endpoint');
          
          // Find admin user by isAdmin flag
          const adminUsers = await db.select().from(users).where(eq(users.isAdmin, true)).limit(1);
          
          if (adminUsers.length > 0) {
            const adminUser = adminUsers[0];
            userProfile = {
              id: adminUser.id,
              firstName: adminUser.firstName || 'Admin',
              lastName: adminUser.lastName || 'User',
              email: adminUser.email,
              username: 'admin',
              isAdmin: true,
              authProvider: 'direct',
              employeeId: adminUser.employeeId
            };
            
            // Return early with admin profile
            return res.json(userProfile);
          }
        }
        
        // Get the user record from the database to include any additional info
        const user = await storage.getUser(userId);
        
        if (user) {
          userProfile = {
            id: userId,
            firstName: user.firstName || 'User', 
            lastName: user.lastName || '',
            email: user.email,
            username: req.session.directUser.username,
            isAdmin: req.session.directUser.isAdmin === true,
            authProvider: 'direct',
            employeeId: user.employeeId
          };
          
          // If user has an associated employee record, get that data
          if (user.employeeId) {
            const employee = await storage.getEmployeeById(user.employeeId);
            if (employee) {
              // Override with employee data (source of truth)
              userProfile.firstName = employee.firstName;
              userProfile.lastName = employee.lastName;
              userProfile.email = employee.email;
              userProfile.position = employee.position;
              
              // Get department info
              if (employee.departmentId) {
                const department = await storage.getDepartmentById(employee.departmentId);
                if (department) {
                  userProfile.department = department.name;
                }
              }
            }
          }
        }
      } 
      // Check if user is authenticated through Replit Auth
      else if (req.isAuthenticated && req.isAuthenticated() && req.user) {
        console.log('User authenticated with Replit:', req.user);
        
        // Get user ID from Replit auth
        const userId = (req.user as any).id || ((req.user as any).claims && (req.user as any).claims.sub);
        
        if (!userId) {
          console.error('Failed to get user ID from Replit auth');
          return res.status(401).json({ message: "Invalid authentication data" });
        }
        
        // Get the user record from the database
        const user = await storage.getUser(userId);
        
        if (user) {
          userProfile = {
            id: userId,
            firstName: user.firstName || (req.user as any).firstName || 'User',
            lastName: user.lastName || (req.user as any).lastName || '',
            email: user.email || (req.user as any).email,
            isAdmin: user.isAdmin === true || (req.user as any).isAdmin === true,
            authProvider: 'replit',
            employeeId: user.employeeId || (req.user as any).employeeId
          };
          
          // If user has an associated employee, get that data
          if (userProfile.employeeId) {
            const employee = await storage.getEmployeeById(userProfile.employeeId);
            if (employee) {
              // Override with employee data (source of truth)
              userProfile.firstName = employee.firstName;
              userProfile.lastName = employee.lastName;
              userProfile.email = employee.email;
              userProfile.position = employee.position;
              
              // Get department info
              if (employee.departmentId) {
                const department = await storage.getDepartmentById(employee.departmentId);
                if (department) {
                  userProfile.department = department.name;
                }
              }
            }
          }
        } else {
          // No database user found, create a profile from session data
          userProfile = {
            id: userId,
            firstName: (req.user as any).firstName || 'Replit',
            lastName: (req.user as any).lastName || 'User',
            email: (req.user as any).email,
            isAdmin: (req.user as any).isAdmin === true,
            authProvider: 'replit',
            employeeId: (req.user as any).employeeId
          };
        }
      }
      
      if (userProfile) {
        return res.json(userProfile);
      }
      
      // If we get here, no valid authentication was found
      return res.status(401).json({ message: "Unauthorized" });
    } catch (error) {
      console.error("Error fetching user:", error);
      return res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Current authenticated user endpoint
  app.get('/api/auth/user', async (req: Request, res: Response) => {
    const sessionExists = !!req.session;
    const directUser = req.session?.directUser;
    
    console.log('Session in auth/user endpoint:', {
      hasSession: sessionExists,
      hasDirectUser: !!directUser,
      sessionID: req.sessionID,
      cookies: req.headers.cookie
    });
    
    // Check for direct login
    if (sessionExists && directUser) {
      // Get the full user record
      const user = await db.select().from(users).where(eq(users.id, directUser.id)).limit(1);
      
      if (user.length > 0) {
        return res.json({
          id: user[0].id,
          firstName: user[0].firstName,
          lastName: user[0].lastName,
          email: user[0].email,
          username: directUser.username,
          isAdmin: directUser.isAdmin,
          authProvider: 'direct',
          employeeId: user[0].employeeId,
          position: user[0].position
        });
      }
    }
    
    // If we get here, no valid authentication was found
    return res.status(401).json({ message: "Unauthorized" });
  });
  
  // Get all users
  app.get('/api/users', isAuthenticated, async (req: Request, res: Response, next: NextFunction) => {
    // Allow access for admin users or users with user_manager role
    if (req.user?.isAdmin === true || req.session?.directUser?.isAdmin === true || req.user?.roles?.includes('user_manager')) {
      try {
        // Admin or user_manager role is required for this endpoint
        
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
        
        if (allUsers.length === 0) {
          // If no users found, return an appropriate error
          return res.status(404).json({ 
            message: "No users found in the system" 
          });
        }
        
        // Return the user list
        return res.json(userList);
      } catch (error) {
        console.error('Error fetching users:', error);
        return res.status(500).json({ message: 'Failed to fetch users' });
      }
    } else {
      // User doesn't have the required permissions
      return res.status(403).json({ message: 'Forbidden: You do not have permission to access this resource' });
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
      
      const { firstName, lastName, email, username, password, isAdmin: newUserIsAdmin, departmentId } = req.body;
      
      // Validate required fields
      if (!firstName || !lastName || !email || !username || !password) {
        return res.status(400).json({ message: "All fields are required" });
      }
      
      // Create a unique user ID for direct authentication
      const userId = `direct_${username}_${Date.now()}`;
      
      // First, create an employee record
      let employee;
      try {
        employee = await storage.createEmployee({
          firstName,
          lastName,
          email,
          phone: null,
          position: "Staff",  // Default position
          departmentId: departmentId ? parseInt(departmentId) : 1, // Default to first department if none selected
          managerId: null,
          status: "active",
          avatar: null,
          hireDate: new Date() // Adding required hireDate field
        });
        
        console.log('Created employee record:', employee);
      } catch (employeeError) {
        console.error('Error creating employee record:', employeeError);
        return res.status(500).json({ message: 'Failed to create employee record' });
      }
      
      // Create user record with link to the employee
      const user = await storage.upsertUser({
        id: userId,
        firstName,
        lastName,
        email,
        isAdmin: newUserIsAdmin === true,
        employeeId: employee.id, // Link to the employee record
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
      
      // Log the account creation
      await storage.createActivity({
        activityType: "user_account_creation",
        description: `User account created for ${firstName} ${lastName} (${username})`,
        employeeId: employee.id,
        metadata: {
          source: "user_management",
          username: username
        }
      });
      
      return res.status(201).json({ 
        message: "User created successfully with linked employee record", 
        user,
        employee 
      });
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
      
      // Debug admin access
      console.log('Password change attempt by:', {
        directUser: req.session?.directUser,
        replitUser: req.user,
        directAdminAccess,
        replitAdminAccess,
        isAdmin
      });
      
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
          passwordHash: passwordHash,
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
      
      // Get actual settings from database
      const [settings] = await db.query.authSettings.findMany({
        limit: 1,
        orderBy: (settings, { desc }) => [desc(settings.id)]
      });
      
      return res.json({
        directLoginEnabled: settings?.directLoginEnabled ?? true,
        microsoftLoginEnabled: settings?.microsoftLoginEnabled ?? false,
        replitLoginEnabled: settings?.replitLoginEnabled ?? true
      });
    } catch (error) {
      console.error('Error fetching auth settings:', error);
      return res.status(500).json({ message: 'Failed to fetch auth settings' });
    }
  });
  
  // Admin Password Reset Endpoint
  app.post('/api/admin/reset-password', async (req: Request, res: Response) => {
    try {
      // This reset endpoint doesn't require authentication but uses a secret key
      // It's specifically designed for emergency admin access recovery
      
      const { resetKey, newPassword } = req.body;
      
      if (!resetKey || !newPassword) {
        return res.status(400).json({ message: "Reset key and new password are required" });
      }
      
      // In production, use a strong environment variable for this key
      // For this development example, we'll use a hardcoded key
      const validResetKey = "admin-reset-2025"; // would normally be in environment variable
      
      if (resetKey !== validResetKey) {
        // Return 200 with error message to prevent brute force attacks
        return res.status(200).json({ success: false, message: "Invalid reset key" });
      }
      
      // Find admin credentials
      const adminCredentials = await db.query.credentials.findMany({
        where: (credentials, { eq }) => eq(credentials.username, 'admin'),
      });
      
      if (adminCredentials.length === 0) {
        return res.status(404).json({ message: "Admin account not found" });
      }
      
      const adminCredential = adminCredentials[0];
      
      // Hash the new password
      const passwordHash = await bcrypt.hash(newPassword, 10);
      
      // Update admin password
      const [updatedCredential] = await db
        .update(credentials)
        .set({
          passwordHash,
          updatedAt: new Date()
        })
        .where(eq(credentials.id, adminCredential.id))
        .returning();
        
      console.log("Admin password reset successfully");
      
      // Return success message
      return res.json({ 
        success: true, 
        message: "Admin password has been reset successfully",
        username: adminCredential.username 
      });
    } catch (error) {
      console.error('Error resetting admin password:', error);
      return res.status(500).json({ message: 'Failed to reset admin password' });
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
      
      // Update settings in the database
      const [updatedSettings] = await db.insert(authSettings)
        .values({
          directLoginEnabled: directLoginEnabled ?? true,
          microsoftLoginEnabled: microsoftLoginEnabled ?? false,
          replitLoginEnabled: replitLoginEnabled ?? true,
          updatedById: req.session?.directUser?.id || (req.user as any)?.id || null
        })
        .returning();
        
      return res.json(updatedSettings);
    } catch (error) {
      console.error('Error updating auth settings:', error);
      return res.status(500).json({ message: 'Failed to update auth settings' });
    }
  });

  // Delete user endpoint
  app.delete('/api/users/:userId', deleteUser);
  
  // Employee routes
  // Get all employees - manager access required
  app.get('/api/employees', isAuthenticated, async (req: Request, res: Response) => {
    // Check for admin privileges in multiple locations
    const isUserAdmin = req.user?.isAdmin === true || req.session?.directUser?.isAdmin === true;
    const hasManagerRole = req.user?.roles?.includes("manager");
    
    // Allow access if user is admin or has manager role
    if (!isUserAdmin && !hasManagerRole) {
      console.log("User lacks admin/manager permission:", {
        user: req.user,
        session: req.session?.directUser,
        isAdmin: isUserAdmin,
        hasManagerRole
      });
      return res.status(403).json({ message: 'Forbidden: Admin or manager role required' });
    }
    try {
      const employees = await storage.getEmployees();
      return res.json(employees);
    } catch (error) {
      console.error('Error fetching employees:', error);
      return res.status(500).json({ message: 'Failed to fetch employees' });
    }
  });

  // Get employee by ID
  app.get('/api/employees/:id', isAuthenticated, async (req: Request, res: Response) => {
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
  app.post('/api/employees', isAdmin, async (req: Request, res: Response) => {
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
  app.patch('/api/employees/:id', isAuthenticated, requireRole("admin"), async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: 'Invalid employee ID' });
      }
      
      // Check if user has permission to update this employee
      // The logged-in user can update their own profile, or an admin can update any profile
      const isAdmin = req.session?.directUser?.isAdmin === true || (req.user as any)?.isAdmin === true;
      const isSelfUpdate = req.session?.directUser?.id && await storage.isEmployeeLinkedToUser(id, req.session.directUser.id);
      
      if (!isAdmin && !isSelfUpdate) {
        return res.status(403).json({ message: 'You do not have permission to update this employee' });
      }
      
      const employeeData = req.body;
      const updatedEmployee = await storage.updateEmployee(id, employeeData);
      
      if (!updatedEmployee) {
        return res.status(404).json({ message: 'Employee not found' });
      }
      
      // Sync the employee data back to any associated user accounts in the database
      const syncResult = await storage.syncEmployeeToUser(id);
      
      // If this is a self-update, also update the session data immediately
      if (isSelfUpdate && req.session?.directUser?.id) {
        // Get the linked user record for this employee to ensure it has the latest data
        const linkedUser = await storage.getUserForEmployee(id);
        
        if (linkedUser) {
          // Update the auth endpoint cache to ensure the next call returns updated data
          await storage.invalidateUserCache(linkedUser.id);
          
          // Return the updated data including employee details
          return res.json({
            ...updatedEmployee,
            employeeId: id, // Ensure this is present for frontend
            sessionUpdated: true
          });
        }
      }
      
      return res.json(updatedEmployee);
    } catch (error) {
      console.error('Error updating employee:', error);
      return res.status(500).json({ message: 'Failed to update employee' });
    }
  });
  
  // Delete employee (admin only)
  app.delete('/api/employees/:id', isAuthenticated, requireRole("admin"), async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: 'Invalid employee ID' });
      }
      
      // Only global admins can delete employees
      const isAdmin = req.session?.directUser?.isAdmin === true || (req.user as any)?.isAdmin === true;
      if (!isAdmin) {
        return res.status(403).json({ message: 'You do not have permission to delete employees' });
      }
      
      // Prevent deletion of the primary admin (Chris Nelloms)
      if (id === 118) {
        return res.status(403).json({ message: 'Cannot delete the primary administrator account' });
      }
      
      const result = await storage.deleteEmployee(id);
      
      if (!result) {
        return res.status(404).json({ message: 'Employee not found or could not be deleted' });
      }
      
      // Add activity for this deletion
      await storage.createActivity({
        employeeId: 0, // System activity
        activityType: 'employee_deletion',
        description: `Employee with ID ${id} was deleted from the system`
      });
      
      return res.status(200).json({ success: true, message: 'Employee successfully deleted' });
    } catch (error) {
      console.error('Error deleting employee:', error);
      return res.status(500).json({ 
        message: error instanceof Error ? error.message : 'Failed to delete employee'
      });
    }
  });

  // Department routes - managers can view, admins can modify
  app.get('/api/departments', async (req: Request, res: Response) => {
    try {
      const departments = await storage.getDepartments();
      return res.json(departments);
    } catch (error) {
      console.error('Error fetching departments:', error);
      return res.status(500).json({ message: 'Failed to fetch departments' });
    }
  });

  app.get('/api/departments/:id', isAuthenticated, async (req: Request, res: Response, next: NextFunction) => {
    // Allow admins or users with manager role to view department details
    if (req.user?.isAdmin) {
      next();
    } else {
      requireRole("manager")(req, res, next);
    }
  }, async (req: Request, res: Response) => {
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

  app.post('/api/departments', isAuthenticated, isAdmin, async (req: Request, res: Response) => {
    try {
      const departmentData = req.body;
      const newDepartment = await storage.createDepartment(departmentData);
      return res.json(newDepartment);
    } catch (error) {
      console.error('Error creating department:', error);
      return res.status(500).json({ message: 'Failed to create department' });
    }
  });
  
  app.patch('/api/departments/:id', isAuthenticated, isAdmin, async (req: Request, res: Response) => {
    try {
      const departmentId = parseInt(req.params.id);
      if (isNaN(departmentId)) {
        return res.status(400).json({ message: 'Invalid department ID' });
      }
      
      const departmentData = req.body;
      const updatedDepartment = await storage.updateDepartment(departmentId, departmentData);
      
      if (!updatedDepartment) {
        return res.status(404).json({ message: 'Department not found' });
      }
      
      return res.json(updatedDepartment);
    } catch (error) {
      console.error('Error updating department:', error);
      return res.status(500).json({ message: 'Failed to update department' });
    }
  });
  
  app.delete('/api/departments/:id', isAuthenticated, isAdmin, async (req: Request, res: Response) => {
    try {
      const departmentId = parseInt(req.params.id);
      if (isNaN(departmentId)) {
        return res.status(400).json({ message: 'Invalid department ID' });
      }
      
      // Get the department first to check if it exists
      const department = await storage.getDepartmentById(departmentId);
      if (!department) {
        return res.status(404).json({ message: 'Department not found' });
      }
      
      // Attempt to delete the department
      await storage.deleteDepartment(departmentId);
      
      return res.json({ success: true, message: 'Department deleted successfully' });
    } catch (error: any) {
      console.error('Error deleting department:', error);
      // Return specific error message if it's a constraint error
      if (error.message && (
        error.message.includes('associated employees') || 
        error.message.includes('associated positions')
      )) {
        return res.status(400).json({ message: error.message });
      }
      return res.status(500).json({ message: 'Failed to delete department' });
    }
  });

  // Position routes - admins and managers can view, admins can modify
  app.get('/api/positions', isAuthenticated, async (req: Request, res: Response) => {
    try {
      // Direct access for everyone authenticated
      // This simplifies access since positions are reference data
      const positions = await storage.getPositions();
      console.log(`Returning ${positions.length} positions to user ${req.user?.id}`);
      return res.json(positions);
    } catch (error) {
      console.error('Error fetching positions:', error);
      return res.status(500).json({ message: 'Failed to fetch positions' });
    }
  });

  app.get('/api/positions/:id', isAuthenticated, async (req: Request, res: Response) => {
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

  app.post('/api/positions', isAuthenticated, requireAdmin, async (req: Request, res: Response) => {
    try {
      const positionData = req.body;
      const newPosition = await storage.createPosition(positionData);
      return res.json(newPosition);
    } catch (error) {
      console.error('Error creating position:', error);
      return res.status(500).json({ message: 'Failed to create position' });
    }
  });
  
  // Update position
  app.patch('/api/positions/:id', isAuthenticated, requireAdmin, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: 'Invalid position ID' });
      }
      
      const positionData = req.body;
      const updatedPosition = await storage.updatePosition(id, positionData);
      
      if (!updatedPosition) {
        return res.status(404).json({ message: 'Position not found' });
      }
      
      return res.json(updatedPosition);
    } catch (error) {
      console.error('Error updating position:', error);
      return res.status(500).json({ message: 'Failed to update position' });
    }
  });
  
  // Delete position
  app.delete('/api/positions/:id', isAuthenticated, requireAdmin, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: 'Invalid position ID' });
      }
      
      const result = await storage.deletePosition(id);
      return res.json({ success: result });
    } catch (error: any) {
      console.error('Error deleting position:', error);
      return res.status(500).json({ 
        message: error.message || 'Failed to delete position',
        success: false 
      });
    }
  });

  // System routes - managers can view, admins can manage
  app.get('/api/systems', isAuthenticated, async (req: Request, res: Response, next: NextFunction) => {
    // Allow admins or users with manager role to view systems
    // Check for admin status from multiple authentication methods
    const isDirectAdmin = req.session?.directUser?.isAdmin === true;
    const isReplitAdmin = req.user?.isAdmin === true;
    
    // If admin through any method, proceed
    if (isDirectAdmin || isReplitAdmin) {
      next();
    } else {
      requireRole("manager")(req, res, next);
    }
  }, async (req: Request, res: Response) => {
    try {
      const systems = await storage.getSystems();
      return res.json(systems);
    } catch (error) {
      console.error('Error fetching systems:', error);
      return res.status(500).json({ message: 'Failed to fetch systems' });
    }
  });
  
  // Get a specific system by ID - managers can view
  app.get('/api/systems/:id', isAuthenticated, async (req: Request, res: Response, next: NextFunction) => {
    // Allow admins or users with manager role to view system details
    // Check for admin status from multiple authentication methods
    const isDirectAdmin = req.session?.directUser?.isAdmin === true;
    const isReplitAdmin = req.user?.isAdmin === true;
    
    // If admin through any method, proceed
    if (isDirectAdmin || isReplitAdmin) {
      next();
    } else {
      requireRole("manager")(req, res, next);
    }
  }, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: 'Invalid system ID' });
      }
      
      const system = await storage.getSystemById(id);
      if (!system) {
        return res.status(404).json({ message: 'System not found' });
      }
      
      return res.json(system);
    } catch (error) {
      console.error(`Error fetching system ${req.params.id}:`, error);
      return res.status(500).json({ message: 'Error retrieving system' });
    }
  });
  
  // Create a new system (admin only)
  app.post('/api/systems', isAuthenticated, requireAdmin, async (req: Request, res: Response) => {
    try {
      // Check if the user is a global admin
      console.log('POST /api/systems - Session check:', {
        hasSession: !!req.session,
        directUser: req.session?.directUser,
        isAdmin: req.session?.directUser?.isAdmin
      });
      
      // Check admin status from multiple authentication methods
      const isDirectAdmin = req.session?.directUser?.isAdmin === true;
      const isReplitAdmin = req.user?.isAdmin === true;
      
      // Allow access if admin through any method
      if (!isDirectAdmin && !isReplitAdmin) {
        console.log('Unauthorized access attempt to create system');
        return res.status(403).json({ message: 'Admin access required' });
      }

      console.log('Admin access granted - creating new system');
      const validatedData = insertSystemSchema.parse(req.body);
      const newSystem = await storage.createSystem(validatedData);
      
      return res.status(201).json(newSystem);
    } catch (error) {
      console.error('Error creating system:', error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: 'Invalid data', errors: error.errors });
      }
      return res.status(500).json({ message: 'Error creating system' });
    }
  });
  
  // Update a system (admin only)
  app.patch('/api/systems/:id', isAuthenticated, requireAdmin, async (req: Request, res: Response) => {
    try {
      // Check if the user is a global admin
      console.log('PATCH /api/systems/:id - Session check:', {
        hasSession: !!req.session,
        directUser: req.session?.directUser,
        isAdmin: req.session?.directUser?.isAdmin
      });
      
      // Check admin status from multiple authentication methods
      const isDirectAdmin = req.session?.directUser?.isAdmin === true;
      const isReplitAdmin = req.user?.isAdmin === true;
      
      // Allow access if admin through any method
      if (!isDirectAdmin && !isReplitAdmin) {
        console.log('Unauthorized access attempt to update system');
        return res.status(403).json({ message: 'Admin access required' });
      }
      
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: 'Invalid system ID' });
      }
      
      // Get the existing system
      const existingSystem = await storage.getSystemById(id);
      if (!existingSystem) {
        return res.status(404).json({ message: 'System not found' });
      }
      
      console.log('Admin access granted - updating system');
      // Validate and update the system
      const updateData = req.body;
      const updatedSystem = await storage.updateSystem(id, updateData);
      
      return res.json(updatedSystem);
    } catch (error) {
      console.error(`Error updating system ${req.params.id}:`, error);
      return res.status(500).json({ message: 'Error updating system' });
    }
  });
  
  // Delete a system (admin only)
  app.delete('/api/systems/:id', isAuthenticated, requireAdmin, async (req: Request, res: Response) => {
    try {
      // Check if the user is a global admin
      console.log('DELETE /api/systems/:id - Session check:', {
        hasSession: !!req.session,
        directUser: req.session?.directUser,
        isAdmin: req.session?.directUser?.isAdmin
      });
      
      // Check admin status from multiple authentication methods
      const isDirectAdmin = req.session?.directUser?.isAdmin === true;
      const isReplitAdmin = req.user?.isAdmin === true;
      
      // Allow access if admin through any method
      if (!isDirectAdmin && !isReplitAdmin) {
        console.log('Unauthorized access attempt to delete system');
        return res.status(403).json({ message: 'Admin access required' });
      }
      
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: 'Invalid system ID' });
      }
      
      // Check if system exists
      const existingSystem = await storage.getSystemById(id);
      if (!existingSystem) {
        return res.status(404).json({ message: 'System not found' });
      }
      
      // Check if system is in use by any employees
      const inUse = await storage.isSystemInUse(id);
      if (inUse) {
        return res.status(400).json({ 
          message: 'Cannot delete system that is in use. Remove all system access assignments first.' 
        });
      }
      
      console.log('Admin access granted - deleting system:', id);
      // Delete the system
      const result = await storage.deleteSystem(id);
      
      return res.json({ success: true });
    } catch (error) {
      console.error(`Error deleting system ${req.params.id}:`, error);
      return res.status(500).json({ message: 'Error deleting system' });
    }
  });
  
  // Get system access entries for an employee - managers can view
  app.get('/api/employees/:employeeId/systems', isAuthenticated, async (req: Request, res: Response) => {
    // Check for admin privileges in multiple locations
    const isUserAdmin = req.user?.isAdmin === true || req.session?.directUser?.isAdmin === true;
    const hasManagerRole = req.user?.roles?.includes("manager");
    
    // Allow access if user is admin or has manager role
    if (!isUserAdmin && !hasManagerRole) {
      return res.status(403).json({ message: 'Forbidden: Admin or manager role required' });
    }
    try {
      const employeeId = parseInt(req.params.employeeId);
      if (isNaN(employeeId)) {
        return res.status(400).json({ message: 'Invalid employee ID' });
      }
      
      // Get employee's system access entries
      const systemAccess = await storage.getSystemAccessByEmployeeId(employeeId);
      
      // If no access entries exist, return an empty array
      if (!systemAccess || systemAccess.length === 0) {
        return res.json([]);
      }
      
      // Get the full system details for each access entry
      const systemsWithDetails = await Promise.all(
        systemAccess.map(async (access) => {
          const system = await storage.getSystemById(access.systemId);
          return {
            ...access,
            system: system || { name: 'Unknown System', description: '', category: '' }
          };
        })
      );
      
      return res.json(systemsWithDetails);
    } catch (error) {
      console.error(`Error fetching system access for employee ${req.params.employeeId}:`, error);
      return res.status(500).json({ message: 'Error retrieving system access' });
    }
  });
  
  // Get all system access entries (authenticated users)
  app.get('/api/system-access', isAuthenticated, requireAdmin, async (req: Request, res: Response) => {
    try {
      console.log('GET /api/system-access endpoint accessed');
      console.log('Session info:', JSON.stringify(req.session));
      
      // Check if user is authenticated
      if (!req.session || !req.session.directUser) {
        console.log('User not authenticated, returning 401');
        return res.status(401).json({ message: 'Unauthorized' });
      }
      
      // Get all system access entries
      let systemAccess = await storage.getSystemAccessEntries();
      
      // Filter the results if user is not an admin
      const isUserAdmin = req.session.directUser?.isAdmin === true;
      console.log('Is user admin?', isUserAdmin);
      
      // Check if user has an associated employee record
      let userEmployeeId: number | null = null;
      
      if (req.session.directUser?.id) {
        const user = await storage.getUser(req.session.directUser.id);
        console.log('Found user:', user?.id);
        if (user && user.employeeId) {
          userEmployeeId = user.employeeId;
          console.log('User has employee ID:', userEmployeeId);
        }
      }
      
      if (!isUserAdmin && userEmployeeId) {
        console.log('Filtering system access for regular employee');
        // Regular employees can only see their own access
        systemAccess = systemAccess.filter(access => access.employeeId === userEmployeeId);
      }
      
      // Get the full system and employee details for each access entry
      const accessWithDetails = await Promise.all(
        systemAccess.map(async (access) => {
          const system = await storage.getSystemById(access.systemId);
          const employee = await storage.getEmployeeById(access.employeeId);
          
          return {
            ...access,
            system: system || { name: 'Unknown System', description: '', category: '' },
            employee: employee || null,
            systemName: system?.name || 'Unknown System'
          };
        })
      );
      
      return res.json(accessWithDetails);
    } catch (error) {
      console.error('Error fetching all system access entries:', error);
      return res.status(500).json({ message: 'Error retrieving system access entries' });
    }
  });
  
  // Create a new system access entry - admin only
  app.post('/api/system-access', isAuthenticated, requireAdmin, async (req: Request, res: Response) => {
    try {
      // Check session status
      if (!req.session) {
        console.log('POST /api/system-access - No valid session found');
        return res.status(401).json({ message: 'Unauthorized - Please log in' });
      }
      
      console.log('POST /api/system-access - Full session:', JSON.stringify(req.session));
      
      const validatedData = insertSystemAccessSchema.parse(req.body);
      
      // Check admin status from multiple authentication methods
      const isDirectAdmin = req.session?.directUser?.isAdmin === true;
      const isReplitAdmin = req.user?.isAdmin === true;
      const isAdmin = isDirectAdmin || isReplitAdmin;
      console.log('System access create - Admin check:', isAdmin);
      console.log('Session state:', JSON.stringify(req.session.directUser));
      
      let userEmployeeId = null;
      
      // Get employee ID from user record
      if (req.session.directUser.id) {
        const user = await storage.getUser(req.session.directUser.id);
        console.log('User record found:', user ? 'yes' : 'no', user);
        if (user && user.employeeId) {
          userEmployeeId = user.employeeId;
          console.log('User has employee ID:', userEmployeeId);
        }
      }
      
      // If not admin and not the employee's own record, deny access
      if (!isAdmin && userEmployeeId !== validatedData.employeeId) {
        console.log('Permission denied - not admin and not own record');
        return res.status(403).json({ message: 'You do not have permission to grant system access to this employee' });
      }
      
      // If granted is true, set grantedAt to current time and grantedById to current user
      if (validatedData.granted) {
        validatedData.grantedAt = new Date();
        
        // Use the current user's employee ID if available
        if (req.session.directUser && req.session.directUser.id) {
          const currentUser = await storage.getUser(req.session.directUser.id);
          if (currentUser && currentUser.employeeId) {
            validatedData.grantedById = currentUser.employeeId;
          }
        }
      }
      
      // Create the system access entry
      const newAccess = await storage.createSystemAccess(validatedData);
      
      // Create activity log
      const employeeData = await storage.getEmployeeById(validatedData.employeeId);
      const systemData = await storage.getSystemById(validatedData.systemId);
      
      if (employeeData) {
        await storage.createActivity({
          employeeId: employeeData.id,
          description: `System access ${validatedData.status} for ${systemData?.name || 'Unknown System'} (${validatedData.accessLevel})`,
          activityType: 'system_access',
          metadata: {
            systemId: validatedData.systemId,
            accessLevel: validatedData.accessLevel,
            status: validatedData.status
          }
        });
      }
      
      return res.status(201).json(newAccess);
    } catch (error) {
      console.error('Error creating system access:', error);
      if (error.name === 'ZodError') {
        return res.status(400).json({ message: 'Invalid data', errors: error.errors });
      }
      return res.status(500).json({ message: 'Error creating system access' });
    }
  });
  
  // Update a system access entry - admin only
  app.patch('/api/system-access/:id', isAuthenticated, requireAdmin, async (req: Request, res: Response) => {
    try {
      // Check session status
      if (!req.session || !req.session.directUser) {
        console.log('PATCH /api/system-access/:id - No valid session found');
        return res.status(401).json({ message: 'Unauthorized - Please log in' });
      }
      
      console.log('PATCH /api/system-access/:id - Full endpoint request:', {
        params: req.params,
        body: req.body,
        session: JSON.stringify(req.session),
        headers: req.headers,
        cookies: req.cookies
      });

      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: 'Invalid system access ID' });
      }
      
      // Get the existing access entry
      const existingAccess = await storage.getSystemAccessById(id);
      if (!existingAccess) {
        return res.status(404).json({ message: 'System access not found' });
      }
      
      // Always allow Global Admin to update system access
      const isAdmin = req.session.directUser.isAdmin === true;
      console.log('System access update - Admin check:', isAdmin);
      
      // Admin bypass - if the user is a global admin, allow the operation
      if (isAdmin) {
        console.log('Admin user detected, allowing system access update');
      } else {
        // For non-admin users, check if they're modifying their own record
        let userEmployeeId = null;
        
        if (req.session.directUser.id) {
          const user = await storage.getUser(req.session.directUser.id);
          console.log('User record found:', user ? 'yes' : 'no');
          if (user && user.employeeId) {
            userEmployeeId = user.employeeId;
            console.log('User has employee ID:', userEmployeeId);
          }
        }
        
        // If not admin and not the employee's own record, deny access
        if (userEmployeeId !== existingAccess.employeeId) {
          console.log('Permission denied - not admin and not own record');
          return res.status(403).json({ message: 'You do not have permission to update this system access' });
        }
      }
      
      // Validate the update data
      const updateData = req.body;
      
      // If granted status changes from false to true, set grantedAt and grantedById
      if (!existingAccess.granted && updateData.granted) {
        updateData.grantedAt = new Date();
        
        // Use the user's employee ID if available
        if (req.session?.directUser?.id) {
          const currentUser = await storage.getUser(req.session.directUser.id);
          if (currentUser && currentUser.employeeId) {
            updateData.grantedById = currentUser.employeeId;
          }
        }
      }
      
      // Update the system access entry
      const updatedAccess = await storage.updateSystemAccess(id, updateData);
      
      // Create activity log
      const employeeData = await storage.getEmployeeById(existingAccess.employeeId);
      const systemData = await storage.getSystemById(existingAccess.systemId);
      
      if (employeeData) {
        await storage.createActivity({
          employeeId: employeeData.id,
          description: `System access updated for ${systemData?.name || 'Unknown System'} (${updateData.status || existingAccess.status})`,
          activityType: 'system_access_update',
          metadata: {
            systemId: existingAccess.systemId,
            accessLevel: updateData.accessLevel || existingAccess.accessLevel,
            status: updateData.status || existingAccess.status
          }
        });
      }
      
      return res.json(updatedAccess);
    } catch (error) {
      console.error(`Error updating system access ${req.params.id}:`, error);
      return res.status(500).json({ message: 'Error updating system access' });
    }
  });
  
  // Delete a system access entry - admin only
  app.delete('/api/system-access/:id', isAuthenticated, requireAdmin, async (req: Request, res: Response) => {
    try {
      console.log('Attempting to delete system access with ID:', req.params.id);
      
      // Check session status
      if (!req.session || !req.session.directUser) {
        console.log('DELETE /api/system-access/:id - No valid session found');
        return res.status(401).json({ message: 'Unauthorized - Please log in' });
      }
      
      console.log('DELETE /api/system-access/:id - Full request:', {
        params: req.params,
        session: JSON.stringify(req.session),
        headers: req.headers
      });
      
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: 'Invalid system access ID' });
      }
      
      // Get the existing access entry before deletion for activity logging
      const existingAccess = await storage.getSystemAccessById(id);
      if (!existingAccess) {
        return res.status(404).json({ message: 'System access not found' });
      }
      
      // Always allow Global Admin to delete system access
      const isAdmin = req.session.directUser.isAdmin === true;
      console.log('System access delete - Admin check:', isAdmin);
      
      // Admin bypass - if the user is a global admin, allow the operation
      if (isAdmin) {
        console.log('Admin user detected, allowing system access deletion');
      } else {
        // For non-admin users, check if they're modifying their own record
        let userEmployeeId = null;
        
        if (req.session.directUser.id) {
          const user = await storage.getUser(req.session.directUser.id);
          console.log('User record found:', user ? 'yes' : 'no');
          if (user && user.employeeId) {
            userEmployeeId = user.employeeId;
            console.log('User has employee ID:', userEmployeeId);
          }
        }
        
        // If not admin and not the employee's own record, deny access
        if (userEmployeeId !== existingAccess.employeeId) {
          console.log('Permission denied - not admin and not own record');
          return res.status(403).json({ message: 'You do not have permission to delete this system access' });
        }
      }
      
      // Delete the system access entry
      const result = await storage.deleteSystemAccess(id);
      
      // Create activity log
      const employeeData = await storage.getEmployeeById(existingAccess.employeeId);
      const systemData = await storage.getSystemById(existingAccess.systemId);
      
      if (employeeData) {
        await storage.createActivity({
          employeeId: employeeData.id,
          description: `System access removed for ${systemData?.name || 'Unknown System'}`,
          activityType: 'system_access_delete',
          metadata: {
            systemId: existingAccess.systemId
          }
        });
      }
      
      return res.json({ success: true });
    } catch (error) {
      console.error(`Error deleting system access ${req.params.id}:`, error);
      return res.status(500).json({ message: 'Error deleting system access' });
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
  app.get('/api/roles', isAuthenticated, async (req: Request, res: Response) => {
    try {
      const roles = await storage.getRoles();
      return res.json(roles);
    } catch (error) {
      console.error('Error fetching roles:', error);
      return res.status(500).json({ message: 'Failed to fetch roles' });
    }
  });

  app.post('/api/roles', isAuthenticated, requireRole('role_manager'), async (req: Request, res: Response) => {
    try {
      const roleData = req.body;
      const newRole = await storage.createRole(roleData);
      return res.json(newRole);
    } catch (error) {
      console.error('Error creating role:', error);
      return res.status(500).json({ message: 'Failed to create role' });
    }
  });

  app.delete('/api/roles/:id', isAuthenticated, requireRole('role_manager'), async (req: Request, res: Response) => {
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
  app.get('/api/roles/:roleId/permissions', isAuthenticated, async (req: Request, res: Response) => {
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

  app.post('/api/roles/:roleId/permissions', isAuthenticated, requireRole('role_manager'), async (req: Request, res: Response) => {
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

  app.delete('/api/roles/:roleId/permissions/:permissionId', isAuthenticated, requireRole('role_manager'), async (req: Request, res: Response) => {
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

  // Employee Role routes - manager can view
  app.get('/api/employees/:employeeId/roles', isAuthenticated, async (req: Request, res: Response) => {
    // Check for admin privileges in multiple locations
    const isUserAdmin = req.user?.isAdmin === true || req.session?.directUser?.isAdmin === true;
    const hasManagerRole = req.user?.roles?.includes("manager");
    
    // Allow access if user is admin or has manager role
    if (!isUserAdmin && !hasManagerRole) {
      return res.status(403).json({ message: 'Forbidden: Admin or manager role required' });
    }
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
  
  // Add role to employee - admin only
  app.post('/api/employees/:employeeId/roles', isAuthenticated, async (req: Request, res: Response) => {
    try {
      // Check if user is admin from both session and user object
      const isDirectAdmin = req.session?.directUser?.isAdmin === true;
      const isReplitAdmin = req.user?.isAdmin === true;
      
      if (!isDirectAdmin && !isReplitAdmin) {
        return res.status(403).json({ message: 'Forbidden: Admin access required' });
      }
      
      const employeeId = parseInt(req.params.employeeId);
      const { roleId } = req.body;
      
      if (isNaN(employeeId) || isNaN(roleId)) {
        return res.status(400).json({ message: 'Invalid employee ID or role ID' });
      }
      
      // Get the user's employee ID or use admin ID if not available
      const assignedBy = req.user?.employeeId || 
                        (req.session?.directUser?.id === 'admin123' ? 123 : employeeId); // Fallback to a default admin ID
      
      const employeeRole = await storage.addRoleToEmployee({
        employeeId,
        roleId,
        assignedBy
      });
      
      return res.json(employeeRole);
    } catch (error) {
      console.error('Error adding role to employee:', error);
      return res.status(500).json({ message: 'Failed to add role to employee' });
    }
  });
  
  // Remove role from employee - admin only
  app.delete('/api/employees/:employeeId/roles/:roleId', isAuthenticated, async (req: Request, res: Response) => {
    try {
      // Check if user is admin from both session and user object
      const isDirectAdmin = req.session?.directUser?.isAdmin === true;
      const isReplitAdmin = req.user?.isAdmin === true;
      
      if (!isDirectAdmin && !isReplitAdmin) {
        return res.status(403).json({ message: 'Forbidden: Admin access required' });
      }
      
      const employeeId = parseInt(req.params.employeeId);
      const roleId = parseInt(req.params.roleId);
      
      if (isNaN(employeeId) || isNaN(roleId)) {
        return res.status(400).json({ message: 'Invalid employee ID or role ID' });
      }
      
      const success = await storage.removeRoleFromEmployee(employeeId, roleId);
      if (!success) {
        return res.status(404).json({ message: 'Employee role not found' });
      }
      
      return res.json({ message: 'Role removed from employee successfully' });
    } catch (error) {
      console.error('Error removing role from employee:', error);
      return res.status(500).json({ message: 'Failed to remove role from employee' });
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

  // Dashboard routes - manager access required
  app.get('/api/dashboard/stats', isAuthenticated, async (req: Request, res: Response) => {
    try {
      // Check for admin privileges in multiple locations
      const isUserAdmin = req.user?.isAdmin === true || req.session?.directUser?.isAdmin === true;
      const hasManagerRole = req.user?.roles?.includes("manager");
      
      // Allow access if user is admin or has manager role
      if (!isUserAdmin && !hasManagerRole) {
        return res.status(403).json({ message: 'Forbidden: Admin or manager role required' });
      }
      
      const stats = await storage.getDashboardStats();
      return res.json(stats);
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
      return res.status(500).json({ message: 'Failed to fetch dashboard stats' });
    }
  });
  
  // Endpoint to get system access statistics - manager or admin access required
  app.get('/api/dashboard/access-stats', isAuthenticated, async (req: Request, res: Response) => {
    try {
      // Allow access if user is admin or has manager role
      if (!req.user?.isAdmin && (!req.user?.roles || !req.user?.roles.includes("manager"))) {
        return res.status(403).json({ message: 'Forbidden: Admin or manager role required' });
      }
      
      const stats = await storage.getSystemAccessStats();
      return res.json(stats);
    } catch (error) {
      console.error('Error fetching system access stats:', error);
      return res.status(500).json({ message: 'Failed to fetch system access statistics' });
    }
  });
  
  // Endpoint to get all system access entries (used by admin dashboard)
  app.get('/api/system-access-admin', async (req: Request, res: Response) => {
    try {
      console.log('Session cookies:', req.headers.cookie);
      
      // Directly check for admin.global user by username
      if (req.session?.directUser?.username === 'admin.global') {
        console.log('Admin.global user detected - granting access');
        // This is a known admin user
      } else {
        // Standard admin check
        const isDirectAdmin = req.session?.directUser?.isAdmin === true;
        const isReplitAdmin = req.user?.isAdmin === true;
        
        console.log('Auth check for system-access-admin:', {
          session: req.session,
          directUser: req.session?.directUser,
          isDirectAdmin,
          user: req.user,
          isReplitAdmin
        });
        
        // Allow access if admin through any method
        if (!isDirectAdmin && !isReplitAdmin) {
          console.log('Unauthorized access attempt to system-access-admin endpoint');
          return res.status(403).json({ message: 'Admin access required' });
        }
      }
      
      console.log('Admin access granted - fetching all system access entries');
      
      // First try to fetch all entries directly
      let entries = [];
      try {
        entries = await storage.getSystemAccessEntries();
        console.log(`Found ${entries.length} system access entries`);
      } catch (err) {
        console.error('Failed to fetch system access entries:', err);
        // Create a sample entry if none found (this helps debugging)
        entries = [];
      }
      
      if (entries.length === 0) {
        console.log('No system access entries found, returning empty array');
        return res.json([]);
      }
      
      // Enhance access entries with employee and system data
      const enhancedEntries = await Promise.all(entries.map(async (entry) => {
        try {
          const employee = await storage.getEmployeeById(entry.employeeId);
          const system = await storage.getSystemById(entry.systemId);
          
          return {
            ...entry,
            employee: employee ? {
              id: employee.id,
              firstName: employee.firstName,
              lastName: employee.lastName,
              position: employee.position || null,
              department: employee.departmentId ? await storage.getDepartmentById(employee.departmentId) : null,
            } : null,
            system: system || null
          };
        } catch (err) {
          console.error(`Error enhancing entry ${entry.id}:`, err);
          // Return a simplified entry if enhancement fails
          return {
            ...entry,
            employee: { firstName: "Unknown", lastName: "Employee" },
            system: { name: "Unknown System" }
          };
        }
      }));
      
      return res.json(enhancedEntries);
    } catch (error) {
      console.error('Error fetching system access entries:', error);
      return res.status(500).json({ message: 'Failed to fetch system access entries' });
    }
  });
  
  app.get('/api/dashboard/recent-activities', isAuthenticated, async (req: Request, res: Response) => {
    // Check for admin privileges in multiple locations
    const isUserAdmin = req.user?.isAdmin === true || req.session?.directUser?.isAdmin === true;
    const hasManagerRole = req.user?.roles?.includes("manager");
    
    // Allow access if user is admin or has manager role
    if (!isUserAdmin && !hasManagerRole) {
      return res.status(403).json({ message: 'Forbidden: Admin or manager role required' });
    }
    try {
      // Get the limit from query params or default to 10
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;
      
      // Fetch recent activities
      const activities = await storage.getRecentActivities(limit);
      
      // Enhance activities with employee and system names
      const enhancedActivities = await Promise.all(activities.map(async (activity) => {
        const employee = await storage.getEmployeeById(activity.employeeId);
        
        // Extract system info from metadata if available
        let systemName = null;
        let systemId = null;
        
        if (activity.metadata && typeof activity.metadata === 'object') {
          const metadata = activity.metadata as Record<string, any>;
          if (metadata.systemId) {
            systemId = metadata.systemId;
            const system = await storage.getSystemById(systemId);
            if (system) {
              systemName = system.name;
            }
          }
        }
        
        return {
          ...activity,
          employeeName: employee ? `${employee.firstName} ${employee.lastName}` : 'Unknown User',
          systemId,
          systemName,
          type: activity.activityType // Include the activity type for filtering
        };
      }));
      
      return res.json(enhancedActivities);
    } catch (error) {
      console.error('Error fetching recent activities:', error);
      return res.status(500).json({ message: 'Failed to fetch recent activities' });
    }
  });
  
  // Ticket Template routes
  app.get('/api/ticket-templates', async (req: Request, res: Response) => {
    try {
      const templates = await storage.getTicketTemplates();
      return res.json(templates);
    } catch (error) {
      console.error('Error fetching ticket templates:', error);
      return res.status(500).json({ message: 'Failed to fetch ticket templates' });
    }
  });
  
  app.get('/api/ticket-templates/:id', async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: 'Invalid template ID' });
      }
      
      const template = await storage.getTicketTemplateById(id);
      if (!template) {
        return res.status(404).json({ message: 'Template not found' });
      }
      
      return res.json(template);
    } catch (error) {
      console.error('Error fetching ticket template:', error);
      return res.status(500).json({ message: 'Failed to fetch ticket template' });
    }
  });
  
  app.get('/api/ticket-templates/type/:type', async (req: Request, res: Response) => {
    try {
      const type = req.params.type;
      
      const template = await storage.getTicketTemplateByType(type);
      if (!template) {
        return res.status(404).json({ message: 'Template not found' });
      }
      
      return res.json(template);
    } catch (error) {
      console.error('Error fetching ticket template by type:', error);
      return res.status(500).json({ message: 'Failed to fetch ticket template' });
    }
  });
  
  app.patch('/api/ticket-templates/:id', isAuthenticated, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: 'Invalid template ID' });
      }
      
      const templateData = req.body;
      
      // Add the current user as the updater
      if (req.user && 'id' in req.user) {
        templateData.updatedById = req.user.id;
      }
      
      const updatedTemplate = await storage.updateTicketTemplate(id, templateData);
      
      return res.json(updatedTemplate);
    } catch (error) {
      console.error('Error updating ticket template:', error);
      return res.status(500).json({ message: 'Failed to update ticket template' });
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
      const currentTicket = await storage.getTicketById(id);
      
      if (!currentTicket) {
        return res.status(404).json({ message: 'Ticket not found' });
      }
      
      // Update the ticket
      const updatedTicket = await storage.updateTicket(id, ticketData);
      
      if (!updatedTicket) {
        return res.status(404).json({ message: 'Failed to update the ticket' });
      }
      
      // Check if the ticket is a new staff request and is being closed
      if (updatedTicket.type === 'new_staff_request' && 
          updatedTicket.status === 'closed' && 
          currentTicket.status !== 'closed' &&
          updatedTicket.metadata) {
        
        try {
          // Extract relevant data from ticket metadata to create employee
          const metadata = updatedTicket.metadata;
          const positions = await storage.getPositions();
          
          // Find position title based on positionId
          let positionTitle = "Staff Member";
          if (metadata.positionId) {
            const position = positions.find(p => p.id === metadata.positionId);
            if (position) {
              positionTitle = position.title;
            }
          }
          
          // Create a new employee from the ticket data
          const newEmployeeData = {
            firstName: metadata.firstName,
            lastName: metadata.lastName,
            email: metadata.workEmail || metadata.email || `${metadata.firstName.toLowerCase()}.${metadata.lastName.toLowerCase()}@example.com`,
            phone: metadata.phone || null,
            position: positionTitle,
            departmentId: metadata.departmentId,
            managerId: metadata.reportingManagerId,
            hireDate: metadata.startDate ? new Date(metadata.startDate) : new Date(),
            status: "active", // Start as active since onboarding is complete
            avatar: null
          };
          
          // Create the employee
          const newEmployee = await storage.createEmployee(newEmployeeData);
          
          // Create a user account for the new employee
          try {
            // Check if a specific username was requested in the ticket metadata
            let username;
            if (metadata.requestedUsername) {
              username = metadata.requestedUsername;
              
              // Verify the requested username is available
              const existingUser = await db
                .select()
                .from(credentials)
                .where(eq(credentials.username, username))
                .limit(1);
              
              // If username is taken, fall back to auto-generation
              if (existingUser.length > 0) {
                console.log(`Requested username ${username} is already taken, generating alternative...`);
                username = null;
              }
            }
            
            // If no username specified or requested username is taken, generate one
            if (!username) {
              // Generate a unique username (first initial + last name in lowercase)
              const firstInitial = newEmployee.firstName.charAt(0).toLowerCase();
              const baseUsername = `${firstInitial}${newEmployee.lastName.toLowerCase()}`.replace(/[^a-z0-9]/g, '');
              
              // Check if username exists already and append number if needed
              username = baseUsername;
              let counter = 1;
              let usernameExists = true;
              
              while (usernameExists) {
                const existingUser = await db
                  .select()
                  .from(credentials)
                  .where(eq(credentials.username, username))
                  .limit(1);
                
                if (existingUser.length === 0) {
                  usernameExists = false;
                } else {
                  username = `${baseUsername}${counter}`;
                  counter++;
                }
              }
            }
            
            // Check if a specific password was requested
            let password;
            if (metadata.requestedPassword) {
              password = metadata.requestedPassword;
            } else {
              // Generate a secure password
              const generatePassword = () => {
                const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
                let password = '';
                for (let i = 0; i < 12; i++) {
                  password += chars.charAt(Math.floor(Math.random() * chars.length));
                }
                return password;
              };
              
              password = generatePassword();
            }
            
            // Create user ID
            const userId = `direct_${username}_${Date.now()}`;
            
            // Create user record
            const user = await storage.upsertUser({
              id: userId,
              firstName: newEmployee.firstName,
              lastName: newEmployee.lastName,
              email: newEmployee.email,
              employeeId: newEmployee.id, // Link to the employee record
              isAdmin: metadata.isAdmin === true,
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
            
            // Update ticket metadata with the login credentials
            updatedTicket.metadata = {
              ...updatedTicket.metadata,
              employeeCreated: true,
              employeeId: newEmployee.id,
              userAccountCreated: true,
              username: username,
              password: password, // Store plain password in metadata for admin to share with employee
              userId: userId
            };
            
            // Log the account creation in activity
            await storage.createActivity({
              type: "user_account_creation",
              description: `User account created for ${newEmployee.firstName} ${newEmployee.lastName} (${username})`,
              employeeId: newEmployee.id,
              metadata: {
                source: "ticket",
                ticketId: updatedTicket.id,
                username: username
              }
            });
          } catch (userCreationError) {
            console.error('Error creating user account:', userCreationError);
            // Continue with the process even if user creation fails
            // Just update ticket with employee info
            updatedTicket.metadata = {
              ...updatedTicket.metadata,
              employeeCreated: true,
              employeeId: newEmployee.id,
              userAccountCreated: false,
              userCreationError: "Failed to create user account"
            };
          }
          
          // Create an activity for the employee creation
          await storage.createActivity({
            type: "employee_creation",
            description: `New employee ${newEmployee.firstName} ${newEmployee.lastName} created from ticket #${updatedTicket.id}`,
            employeeId: newEmployee.id,
            metadata: {
              source: "ticket",
              ticketId: updatedTicket.id
            }
          });
        } catch (employeeError) {
          console.error('Error creating employee from ticket:', employeeError);
          // Continue with the process, just log the error - we don't want to fail the ticket update
        }
      }
      
      return res.json(updatedTicket);
    } catch (error) {
      console.error('Error updating ticket:', error);
      return res.status(500).json({ message: 'Failed to update ticket' });
    }
  });
  
  app.delete('/api/tickets/:id', async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: 'Invalid ticket ID' });
      }
      
      const success = await storage.deleteTicket(id);
      
      if (!success) {
        return res.status(404).json({ message: 'Ticket not found or could not be deleted' });
      }
      
      return res.status(200).json({ message: 'Ticket deleted successfully' });
    } catch (error) {
      console.error('Error deleting ticket:', error);
      return res.status(500).json({ message: 'Failed to delete ticket' });
    }
  });
  
  // Register notification routes
  app.use('/api', notificationRoutes);
  
  const httpServer = createServer(app);
  return httpServer;
}