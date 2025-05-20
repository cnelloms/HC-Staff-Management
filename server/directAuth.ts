import bcrypt from 'bcryptjs';
import { Express, Request, Response, NextFunction } from 'express';
import { storage } from './storage';
import { db } from './db';
import { eq } from 'drizzle-orm';
import { credentials, authSettings } from '@shared/schema';
import 'express-session';

// Extend the express-session typing to include direct login fields
declare module 'express-session' {
  interface SessionData {
    directUser?: {
      id: string;
      username: string;
      isAdmin: boolean;
    };
  }
}

// Setup direct authentication routes and middleware
export function setupDirectAuth(app: Express) {
  console.info('Setting up direct authentication...');

  // Login route
  app.post('/api/login/direct', async (req, res) => {
    try {
      const { username, password } = req.body;
      
      if (!username || !password) {
        return res.status(400).json({ message: 'Username and password are required' });
      }
      
      // Check if direct login is enabled
      const [authSettings] = await db.query.authSettings.findMany({
        limit: 1,
        orderBy: (settings, { desc }) => [desc(settings.id)]
      });
      
      if (authSettings && !authSettings.directLoginEnabled) {
        return res.status(403).json({ message: 'Direct login is currently disabled' });
      }
      
      // Get credentials by username
      const [userCredentials] = await db.select()
        .from(credentials)
        .where(eq(credentials.username, username))
        .limit(1);
      
      if (!userCredentials) {
        return res.status(401).json({ message: 'Invalid username or password' });
      }
      
      if (userCredentials.isEnabled === false) {
        return res.status(403).json({ message: 'This account is disabled' });
      }
      
      // Verify password
      const isPasswordValid = await bcrypt.compare(password, userCredentials.password);
      
      if (!isPasswordValid) {
        return res.status(401).json({ message: 'Invalid username or password' });
      }
      
      // Get user from database
      const user = await storage.getUser(userCredentials.userId);
      
      if (!user) {
        return res.status(401).json({ message: 'User not found' });
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
        isAdmin: user.isAdmin,
      };
      
      // Save session and return success
      req.session.save((err) => {
        if (err) {
          console.error('Error saving session:', err);
          return res.status(500).json({ message: 'Error during authentication' });
        }
        
        return res.status(200).json({ 
          message: 'Logged in successfully', 
          user: {
            id: user.id,
            firstName: user.firstName,
            lastName: user.lastName,
            email: user.email,
            isAdmin: user.isAdmin
          }
        });
      });
    } catch (error) {
      console.error('Direct login error:', error);
      return res.status(500).json({ message: 'An error occurred during login' });
    }
  });
  
  // Create a new user with credentials (admin only)
  app.post('/api/users/create', async (req, res) => {
    try {
      const { firstName, lastName, email, username, password, isAdmin } = req.body;
      
      if (!firstName || !lastName || !email || !username || !password) {
        return res.status(400).json({ message: 'Missing required fields' });
      }
      
      // Check if username already exists
      const [existingCredentials] = await db.select()
        .from(credentials)
        .where(eq(credentials.username, username))
        .limit(1);
      
      if (existingCredentials) {
        return res.status(400).json({ message: 'Username already exists' });
      }
      
      // Create a new user
      const user = await storage.upsertUser({
        id: `direct_${Date.now()}`, // Generate a unique ID for direct users
        email,
        firstName,
        lastName,
        profileImageUrl: '',
        authProvider: 'direct',
        isAdmin: isAdmin || false
      });
      
      // Hash the password
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);
      
      // Create credentials
      const [userCredentials] = await db.insert(credentials)
        .values({
          userId: user.id,
          username,
          password: hashedPassword,
          isEnabled: true
        })
        .returning();
      
      return res.status(201).json({ 
        message: 'User created successfully',
        user: {
          id: user.id,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          username: userCredentials.username,
          isAdmin: user.isAdmin,
          isEnabled: userCredentials.isEnabled
        }
      });
    } catch (error) {
      console.error('Error creating user:', error);
      return res.status(500).json({ message: 'An error occurred while creating user' });
    }
  });
  
  // Change a user's password (admin or self)
  app.post('/api/users/:userId/change-password', isAuthenticatedWithDirect, async (req, res) => {
    try {
      const { userId } = req.params;
      const { currentPassword, newPassword } = req.body;
      const sessionUser = (req as any).directUser;
      
      // Check if the logged-in user is admin or the same user
      if (userId !== sessionUser.id && !sessionUser.isAdmin) {
        return res.status(403).json({ message: 'Not authorized to change password for this user' });
      }
      
      // Get the user's credentials
      const [userCredentials] = await db.select()
        .from(credentials)
        .where(eq(credentials.userId, userId))
        .limit(1);
      
      if (!userCredentials) {
        return res.status(404).json({ message: 'User credentials not found' });
      }
      
      // For non-admin users, verify current password
      if (!sessionUser.isAdmin && userId === sessionUser.id) {
        const isCurrentPasswordValid = await bcrypt.compare(currentPassword, userCredentials.password);
        
        if (!isCurrentPasswordValid) {
          return res.status(401).json({ message: 'Current password is incorrect' });
        }
      }
      
      // Hash the new password
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(newPassword, salt);
      
      // Update password
      await db.update(credentials)
        .set({ 
          password: hashedPassword,
          updatedAt: new Date()
        })
        .where(eq(credentials.id, userCredentials.id));
      
      return res.status(200).json({ message: 'Password updated successfully' });
    } catch (error) {
      console.error('Error changing password:', error);
      return res.status(500).json({ message: 'An error occurred while changing password' });
    }
  });
  
  // Enable/disable a user (admin only)
  app.post('/api/users/:userId/toggle-status', isAdmin, async (req, res) => {
    try {
      const { userId } = req.params;
      const { isEnabled } = req.body;
      
      if (isEnabled === undefined) {
        return res.status(400).json({ message: 'isEnabled field is required' });
      }
      
      // Get the user's credentials
      const [userCredentials] = await db.select()
        .from(credentials)
        .where(eq(credentials.userId, userId))
        .limit(1);
      
      if (!userCredentials) {
        return res.status(404).json({ message: 'User credentials not found' });
      }
      
      // Update status
      await db.update(credentials)
        .set({ 
          isEnabled: isEnabled,
          updatedAt: new Date()
        })
        .where(eq(credentials.id, userCredentials.id));
      
      return res.status(200).json({ 
        message: `User ${isEnabled ? 'enabled' : 'disabled'} successfully` 
      });
    } catch (error) {
      console.error('Error toggling user status:', error);
      return res.status(500).json({ message: 'An error occurred while updating user status' });
    }
  });
  
  // Get auth settings
  app.get('/api/auth/settings', isAdmin, async (req, res) => {
    try {
      const [authSettings] = await db.query.authSettings.findMany({
        limit: 1,
        orderBy: (settings, { desc }) => [desc(settings.id)]
      });
      
      if (!authSettings) {
        // Create default settings if none exist
        const [newSettings] = await db.insert(authSettings)
          .values({
            directLoginEnabled: true,
            microsoftLoginEnabled: false,
            replitLoginEnabled: true,
            updatedById: (req as any).directUser?.id || null
          })
          .returning();
          
        return res.status(200).json(newSettings);
      }
      
      return res.status(200).json(authSettings);
    } catch (error) {
      console.error('Error fetching auth settings:', error);
      return res.status(500).json({ message: 'An error occurred while fetching auth settings' });
    }
  });
  
  // Update auth settings
  app.post('/api/auth/settings', isAdmin, async (req, res) => {
    try {
      const { directLoginEnabled, microsoftLoginEnabled, replitLoginEnabled } = req.body;
      
      // Insert new settings
      const [updatedSettings] = await db.insert(authSettings)
        .values({
          directLoginEnabled: directLoginEnabled ?? true,
          microsoftLoginEnabled: microsoftLoginEnabled ?? false,
          replitLoginEnabled: replitLoginEnabled ?? true,
          updatedById: (req as any).directUser?.id || null
        })
        .returning();
        
      return res.status(200).json({
        message: 'Authentication settings updated successfully',
        settings: updatedSettings
      });
    } catch (error) {
      console.error('Error updating auth settings:', error);
      return res.status(500).json({ message: 'An error occurred while updating auth settings' });
    }
  });
}

// Middleware to check if user is authenticated with direct login
export const isAuthenticatedWithDirect = (req: Request, res: Response, next: NextFunction) => {
  if (!req.session.directUser) {
    return res.status(401).json({ message: 'Unauthorized' });
  }
  
  next();
};

// Middleware to check if user is admin
export const isAdmin = (req: Request, res: Response, next: NextFunction) => {
  if (!req.session.directUser || !req.session.directUser.isAdmin) {
    return res.status(403).json({ message: 'Forbidden: Admin access required' });
  }
  
  next();
};