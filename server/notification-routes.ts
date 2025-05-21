import { Router } from "express";
import { notificationService } from "./notification-service";
import { isAuthenticated } from "./replitAuth";
import { z } from "zod";

const router = Router();

// Get user notifications
router.get('/notifications', isAuthenticated, async (req, res) => {
  try {
    const userId = req.user?.claims?.sub || req.session?.directUser?.id;
    
    if (!userId) {
      return res.status(401).json({ message: 'User not authenticated' });
    }
    
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 50;
    const notifications = await notificationService.getUserNotifications(userId, limit);
    
    return res.json(notifications);
  } catch (error) {
    console.error('Error fetching notifications:', error);
    return res.status(500).json({ message: 'Failed to fetch notifications' });
  }
});

// Get unread notification count
router.get('/notifications/unread-count', isAuthenticated, async (req, res) => {
  try {
    const userId = req.user?.claims?.sub || req.session?.directUser?.id;
    
    if (!userId) {
      return res.status(401).json({ message: 'User not authenticated' });
    }
    
    const count = await notificationService.getUnreadCount(userId);
    
    return res.json({ count });
  } catch (error) {
    console.error('Error fetching unread count:', error);
    return res.status(500).json({ message: 'Failed to fetch unread count' });
  }
});

// Mark notification as read
router.patch('/notifications/:id/read', isAuthenticated, async (req, res) => {
  try {
    const userId = req.user?.claims?.sub || req.session?.directUser?.id;
    
    if (!userId) {
      return res.status(401).json({ message: 'User not authenticated' });
    }
    
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ message: 'Invalid notification ID' });
    }
    
    const notification = await notificationService.markAsRead(id, userId);
    
    if (!notification) {
      return res.status(404).json({ message: 'Notification not found' });
    }
    
    return res.json(notification);
  } catch (error) {
    console.error('Error marking notification as read:', error);
    return res.status(500).json({ message: 'Failed to mark notification as read' });
  }
});

// Mark all notifications as read
router.post('/notifications/mark-all-read', isAuthenticated, async (req, res) => {
  try {
    const userId = req.user?.claims?.sub || req.session?.directUser?.id;
    
    if (!userId) {
      return res.status(401).json({ message: 'User not authenticated' });
    }
    
    await notificationService.markAllAsRead(userId);
    
    return res.json({ success: true });
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    return res.status(500).json({ message: 'Failed to mark all notifications as read' });
  }
});

// Delete notification
router.delete('/notifications/:id', isAuthenticated, async (req, res) => {
  try {
    const userId = req.user?.claims?.sub || req.session?.directUser?.id;
    
    if (!userId) {
      return res.status(401).json({ message: 'User not authenticated' });
    }
    
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ message: 'Invalid notification ID' });
    }
    
    const success = await notificationService.deleteNotification(id, userId);
    
    if (!success) {
      return res.status(404).json({ message: 'Notification not found' });
    }
    
    return res.json({ success: true });
  } catch (error) {
    console.error('Error deleting notification:', error);
    return res.status(500).json({ message: 'Failed to delete notification' });
  }
});

// Create system notification (admin only)
router.post('/notifications/system', isAuthenticated, async (req, res) => {
  try {
    const isAdmin = req.session?.directUser?.isAdmin === true || (req.user as any)?.isAdmin === true;
    
    if (!isAdmin) {
      return res.status(403).json({ message: 'Only admins can send system notifications' });
    }
    
    const schema = z.object({
      title: z.string().min(1),
      message: z.string().min(1),
      link: z.string().optional(),
      userIds: z.array(z.string()).optional(),
      metadata: z.record(z.any()).optional(),
    });
    
    const result = schema.safeParse(req.body);
    
    if (!result.success) {
      return res.status(400).json({ message: 'Invalid request data', errors: result.error.errors });
    }
    
    await notificationService.createSystemNotification(result.data);
    
    return res.json({ success: true });
  } catch (error) {
    console.error('Error creating system notification:', error);
    return res.status(500).json({ message: 'Failed to create system notification' });
  }
});

export default router;