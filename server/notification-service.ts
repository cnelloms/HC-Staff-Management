import { db } from "./db";
import { notifications, type InsertNotification, type Notification } from "@shared/schema";
import { eq, and, desc } from "drizzle-orm";

/**
 * Service for managing user notifications
 */
export class NotificationService {
  /**
   * Create a new notification for a user
   */
  async createNotification(notificationData: InsertNotification): Promise<Notification> {
    const [notification] = await db.insert(notifications)
      .values(notificationData)
      .returning();
    
    return notification;
  }

  /**
   * Get all notifications for a user
   */
  async getUserNotifications(userId: string, limit: number = 50): Promise<Notification[]> {
    return db.select()
      .from(notifications)
      .where(eq(notifications.userId, userId))
      .orderBy(desc(notifications.createdAt))
      .limit(limit);
  }

  /**
   * Get unread notifications count for a user
   */
  async getUnreadCount(userId: string): Promise<number> {
    const result = await db.select({ count: db.fn.count() })
      .from(notifications)
      .where(and(
        eq(notifications.userId, userId),
        eq(notifications.isRead, false)
      ));
    
    return parseInt(result[0].count.toString());
  }

  /**
   * Mark a notification as read
   */
  async markAsRead(id: number, userId: string): Promise<Notification | null> {
    const [updatedNotification] = await db.update(notifications)
      .set({ isRead: true })
      .where(and(
        eq(notifications.id, id),
        eq(notifications.userId, userId)
      ))
      .returning();
    
    return updatedNotification || null;
  }

  /**
   * Mark all notifications as read for a user
   */
  async markAllAsRead(userId: string): Promise<void> {
    await db.update(notifications)
      .set({ isRead: true })
      .where(eq(notifications.userId, userId));
  }

  /**
   * Delete a notification
   */
  async deleteNotification(id: number, userId: string): Promise<boolean> {
    const result = await db.delete(notifications)
      .where(and(
        eq(notifications.id, id),
        eq(notifications.userId, userId)
      ));
    
    return result.count > 0;
  }

  /**
   * Create system notifications for all users or specific ones
   */
  async createSystemNotification(data: {
    title: string;
    message: string;
    link?: string;
    userIds?: string[];
    metadata?: Record<string, any>;
  }): Promise<void> {
    // If specific userIds are provided, only notify them
    if (data.userIds && data.userIds.length > 0) {
      const notificationValues = data.userIds.map(userId => ({
        userId,
        type: 'system',
        title: data.title,
        message: data.message,
        link: data.link,
        metadata: data.metadata
      }));
      
      await db.insert(notifications).values(notificationValues);
      return;
    }
    
    // Otherwise, get all users and notify them
    const allUsers = await db.query.users.findMany({
      columns: { id: true }
    });
    
    if (allUsers.length === 0) return;
    
    const notificationValues = allUsers.map(user => ({
      userId: user.id,
      type: 'system',
      title: data.title,
      message: data.message,
      link: data.link,
      metadata: data.metadata
    }));
    
    await db.insert(notifications).values(notificationValues);
  }
  
  /**
   * Create ticket-related notifications
   */
  async createTicketNotification(data: {
    userId: string;
    ticketId: number;
    title: string;
    message: string;
    action: 'created' | 'updated' | 'assigned' | 'closed';
  }): Promise<Notification> {
    return this.createNotification({
      userId: data.userId,
      type: 'ticket',
      title: data.title,
      message: data.message,
      link: `/tickets/${data.ticketId}`,
      metadata: {
        ticketId: data.ticketId,
        action: data.action
      }
    });
  }
}

export const notificationService = new NotificationService();