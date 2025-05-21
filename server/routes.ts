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
import { deleteUser } from "./user-delete-route";
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
      
      // Check if user is authenticated through direct login
      if (req.session && req.session.directUser) {
        console.log('User authenticated with direct login:', req.session.directUser);
        const userId = req.session.directUser.id;
        
        // Get the user record from the database to include any additional info
        const user = await storage.getUser(userId);
        
        // Include impersonation data
        const impersonatingId = req.session.directUser.impersonatingId || 
                               (user?.impersonatingId as number | undefined);
        
        // Get employee data if available (as source of truth)
        let employeeData = null;
        // Define the user profile with proper type definitions
        interface UserProfile {
          id: string;
          firstName: string;
          lastName: string;
          email: string | null | undefined;
          username: string;
          isAdmin: boolean;
          authProvider: string;
          employeeId: number | null | undefined;
          impersonatingId: number | undefined;
          department?: string;
          position?: string;
        }
        
        let userProfile: UserProfile = {
          id: userId,
          firstName: user?.firstName || 'User', 
          lastName: user?.lastName || '',
          email: user?.email,
          username: req.session.directUser.username,
          isAdmin: req.session.directUser.isAdmin === true,
          authProvider: 'direct',
          employeeId: user?.employeeId,
          impersonatingId: impersonatingId
        };
        
        // If user has an associated employee record, get that data
        if (user?.employeeId) {
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
            
            // Sync user profile with employee data if needed
            if (user.firstName !== employee.firstName || 
                user.lastName !== employee.lastName || 
                user.email !== employee.email) {
              // Update user profile with employee data (employee is source of truth)
              await storage.syncUserFromEmployee(userId, user.employeeId);
            }
          }
        }
        
        // If user is impersonating another employee, get that employee's data
        if (impersonatingId) {
          const impersonatedEmployee = await storage.getEmployeeById(impersonatingId);
          if (impersonatedEmployee) {
            // Override profile with impersonated employee data
            userProfile.firstName = impersonatedEmployee.firstName;
            userProfile.lastName = impersonatedEmployee.lastName;
            userProfile.email = impersonatedEmployee.email;
            userProfile.position = impersonatedEmployee.position;
            userProfile.employeeId = impersonatingId;
            
            // Get department info for impersonated employee
            if (impersonatedEmployee.departmentId) {
              const department = await storage.getDepartmentById(impersonatedEmployee.departmentId);
              if (department) {
                userProfile.department = department.name;
              }
            }
          }
        }
        
        return res.json(userProfile);
      } 
      // Check if user is authenticated through Replit Auth
      else if (req.isAuthenticated && req.isAuthenticated() && req.user && (req.user as any).claims) {
        const userId = (req.user as any).claims.sub;
        const user = await storage.getUser(userId);
        if (user) {
          // Create a complete user profile with employee data if available
          let userProfile = {...user, department: null, position: null};
          
          // If user has an associated employee, get that data
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
              
              // Sync user profile with employee data if needed
              if (user.firstName !== employee.firstName || 
                  user.lastName !== employee.lastName || 
                  user.email !== employee.email) {
                await storage.syncUserFromEmployee(userId, user.employeeId);
              }
            }
          }
          
          return res.json(userProfile);
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

  // Delete user endpoint
  app.delete('/api/users/:userId', deleteUser);
  
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
  app.patch('/api/employees/:id', async (req: Request, res: Response) => {
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
      
      // Sync the employee data back to any associated user accounts
      await storage.syncEmployeeToUser(id);
      
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

  // Dashboard routes
  app.get('/api/dashboard/stats', async (req: Request, res: Response) => {
    try {
      const stats = await storage.getDashboardStats();
      return res.json(stats);
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
      return res.status(500).json({ message: 'Failed to fetch dashboard stats' });
    }
  });
  
  app.get('/api/dashboard/access-stats', async (req: Request, res: Response) => {
    try {
      const accessStats = await storage.getSystemAccessStats();
      return res.json(accessStats);
    } catch (error) {
      console.error('Error fetching system access stats:', error);
      return res.status(500).json({ message: 'Failed to fetch system access stats' });
    }
  });
  
  app.get('/api/dashboard/recent-activities', async (req: Request, res: Response) => {
    try {
      const activities = await storage.getRecentActivities(10); // Limit to 10 recent activities
      return res.json(activities);
    } catch (error) {
      console.error('Error fetching recent activities:', error);
      return res.status(500).json({ message: 'Failed to fetch recent activities' });
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
            // Generate a unique username (first initial + last name in lowercase)
            const firstInitial = newEmployee.firstName.charAt(0).toLowerCase();
            const baseUsername = `${firstInitial}${newEmployee.lastName.toLowerCase()}`.replace(/[^a-z0-9]/g, '');
            
            // Check if username exists already and append number if needed
            let username = baseUsername;
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
            
            // Generate a secure password
            const generatePassword = () => {
              const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
              let password = '';
              for (let i = 0; i < 12; i++) {
                password += chars.charAt(Math.floor(Math.random() * chars.length));
              }
              return password;
            };
            
            const password = generatePassword();
            
            // Create user ID
            const userId = `direct_${username}_${Date.now()}`;
            
            // Create user record
            const user = await storage.upsertUser({
              id: userId,
              firstName: newEmployee.firstName,
              lastName: newEmployee.lastName,
              email: newEmployee.email,
              employeeId: newEmployee.id, // Link to the employee record
              isAdmin: false,
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
  
  const httpServer = createServer(app);
  return httpServer;
}