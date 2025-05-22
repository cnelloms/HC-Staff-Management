import { Router, Request, Response } from 'express';
import { db } from './db';
import { users, credentials } from '@shared/schema';
import { eq } from 'drizzle-orm';
import bcrypt from 'bcryptjs';
import { isAuthenticated } from './middleware/auth-middleware';
import { requireAdmin } from './authMiddleware';

const router = Router();

// Get all users
router.get('/admin/users', isAuthenticated, requireAdmin, async (req: Request, res: Response) => {
  try {
    const allUsers = await db.select().from(users);
    return res.json(allUsers);
  } catch (error) {
    console.error('Error fetching users:', error);
    return res.status(500).json({ message: 'Failed to fetch users' });
  }
});

// Update user properties (isEnabled, isAdmin)
router.put('/admin/users/:id', isAuthenticated, requireAdmin, async (req: Request, res: Response) => {
  try {
    const userId = req.params.id;
    const { isEnabled, isAdmin } = req.body;
    
    // Validate input
    if (isEnabled === undefined && isAdmin === undefined) {
      return res.status(400).json({ message: 'No update parameters provided' });
    }
    
    // Check if user exists
    const existingUser = await db.select().from(users).where(eq(users.id, userId)).limit(1);
    if (existingUser.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Prepare update data - only include fields that were provided
    const updateData: Partial<typeof users.$inferInsert> = {};
    
    if (isAdmin !== undefined) {
      updateData.isAdmin = isAdmin;
    }
    
    // Update the user
    await db.update(users)
      .set({
        ...updateData,
        updatedAt: new Date()
      })
      .where(eq(users.id, userId));
    
    // If isEnabled was provided, update the user's credentials
    if (isEnabled !== undefined) {
      // Find the user's credentials
      const userCredentials = await db.select()
        .from(credentials)
        .where(eq(credentials.userId, userId));
      
      if (userCredentials.length > 0) {
        // Update the credentials
        await db.update(credentials)
          .set({
            isEnabled: isEnabled,
            updatedAt: new Date()
          })
          .where(eq(credentials.userId, userId));
      }
    }
    
    // Get the updated user
    const [updatedUser] = await db.select().from(users).where(eq(users.id, userId));
    
    return res.json({
      message: 'User updated successfully',
      user: updatedUser
    });
  } catch (error) {
    console.error('Error updating user:', error);
    return res.status(500).json({ message: 'Failed to update user' });
  }
});

// Update user password
router.post('/admin/users/:id/pass', isAuthenticated, requireAdmin, async (req: Request, res: Response) => {
  try {
    const userId = req.params.id;
    const { newPassword } = req.body;
    
    // Validate password
    if (!newPassword || newPassword.length < 8) {
      return res.status(400).json({ message: 'Password must be at least 8 characters long' });
    }
    
    // Check if user exists and get credentials
    const userCredentials = await db.select()
      .from(credentials)
      .where(eq(credentials.userId, userId));
    
    if (userCredentials.length === 0) {
      return res.status(404).json({ message: 'User credentials not found' });
    }
    
    // Hash the new password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);
    
    // Update the credentials
    await db.update(credentials)
      .set({
        passwordHash: hashedPassword,
        updatedAt: new Date()
      })
      .where(eq(credentials.userId, userId));
    
    return res.json({ message: 'Password updated successfully' });
  } catch (error) {
    console.error('Error updating password:', error);
    return res.status(500).json({ message: 'Failed to update password' });
  }
});

export default router;