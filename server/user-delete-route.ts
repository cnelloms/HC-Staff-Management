import { Request, Response } from 'express';
import { db } from './db';
import { eq } from 'drizzle-orm';
import { users, credentials, keyValueStore } from '@shared/schema';
import { storage } from './storage';

// Delete a user completely from the system (Global Admin only)
export async function deleteUser(req: Request, res: Response) {
  try {
    const { userId } = req.params;
    
    // Check for admin access
    const directAdminAccess = req.session?.directUser?.isAdmin === true;
    const replitAdminAccess = (req.user as any)?.isAdmin === true;
    const isAdmin = directAdminAccess || replitAdminAccess;
    
    if (!isAdmin) {
      return res.status(403).json({ message: "Admin access required" });
    }
    
    // Get the current session user for logging and to prevent self-deletion
    const sessionUserId = req.session?.directUser?.id || (req.user as any)?.claims?.sub;
    
    // Don't allow deleting your own account
    if (sessionUserId === userId) {
      return res.status(400).json({ 
        message: 'You cannot delete your own account. Please contact another administrator.' 
      });
    }
    
    // Get user to verify it exists and check if it has an associated employee
    const user = await storage.getUser(userId);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Begin transaction for data integrity during deletion
    await db.transaction(async (tx) => {
      // If the user has an associated employee, we need to handle that relationship
      if (user.employeeId) {
        // Just remove the reference in the user record
        // This approach leaves the employee record intact but disconnects it from the user account
        await tx.update(users)
          .set({ employeeId: null })
          .where(eq(users.id, userId));
      }
      
      // Delete from credentials first (if exists)
      await tx.delete(credentials)
        .where(eq(credentials.userId, userId));
      
      // Remove from key_value_store entries if the table exists
      try {
        await tx.delete(keyValueStore)
          .where(eq(keyValueStore.userId, userId));
      } catch (e) {
        console.warn('Error deleting key-value records:', e);
        // Continue with deletion even if this fails
      }
      
      // Delete user record
      await tx.delete(users)
        .where(eq(users.id, userId));
    });
    
    // Log activity
    try {
      await storage.createActivity({
        employeeId: parseInt(sessionUserId) || 0,
        activityType: 'user_deletion',
        description: `User ${user.firstName} ${user.lastName} (${userId}) was deleted from the system`,
        metadata: { 
          deletedUserId: userId, 
          deletedByUserId: sessionUserId,
          hadEmployeeRecord: !!user.employeeId
        }
      });
    } catch (logError) {
      console.error('Failed to log deletion activity:', logError);
      // Continue despite logging error
    }
    
    return res.status(200).json({ 
      message: 'User successfully deleted from the system' 
    });
  } catch (error) {
    console.error('Error deleting user:', error);
    return res.status(500).json({ message: 'Failed to delete user' });
  }
}